#!/usr/bin/env node
import fs from "node:fs";
import { simulatePipeline } from "./src/engine.js";

const file = process.argv[2];
if (!file) {
  console.error("Uso: queuecraft <archivo.json>");
  console.error("Ejemplo: queuecraft examples/example.json");
  process.exit(1);
}

const blocks = JSON.parse(fs.readFileSync(file, "utf8"));
const results = simulatePipeline(blocks);

console.log("\nQueueCraft — simulación por teoría de colas (M/M/c)\n");

for (const r of results) {
  console.log(`[${r.type}] ${r.name}`);

  if (r.type === "source") {
    console.log(`  lambda salida: ${r.lambdaOut} req/s`);
  }

  if (r.type === "cache") {
    console.log(`  lambda entrada: ${r.lambdaIn} req/s`);
    console.log(`  hit rate: ${(r.hitRate * 100).toFixed(0)}%`);
    console.log(`  lambda salida: ${r.lambdaOut.toFixed(2)} req/s`);
  }

  if (r.type === "service") {
    console.log(`  lambda entrada: ${r.lambdaIn.toFixed(2)} req/s | mu: ${r.mu} req/s | réplicas: ${r.replicas}`);
    if (!r.stable) {
      console.log(`  SATURADO (rho=${r.rho.toFixed(2)} >= 1) — la cola crece sin límite`);
    } else {
      console.log(`  utilización (rho): ${(r.rho * 100).toFixed(1)}%`);
      console.log(`  latencia promedio: ${(r.w * 1000).toFixed(2)} ms`);
      console.log(`  tamaño promedio de cola: ${r.lq.toFixed(2)} requests`);
    }
  }

  if (r.type === "sink") {
    console.log(`  throughput final: ${r.lambdaIn.toFixed(2)} req/s`);
  }

  console.log("");
}
