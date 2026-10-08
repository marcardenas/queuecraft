// Motor de simulación basado en teoría de colas M/M/c (Erlang C).
// Cada bloque recibe una tasa de llegada (lambda, req/s) y, si es un
// "service", calcula utilización, latencia y tamaño de cola reales
// a partir de su capacidad (mu x replicas).

function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function erlangC(lambda, mu, c) {
  const a = lambda / mu; // carga ofrecida en Erlangs
  const rho = a / c; // utilización del sistema

  if (rho >= 1) {
    return { rho, stable: false };
  }

  let sum = 0;
  for (let k = 0; k < c; k++) sum += a ** k / factorial(k);
  const lastTerm = a ** c / (factorial(c) * (1 - rho));

  const p0 = 1 / (sum + lastTerm);
  const pWait = lastTerm * p0; // prob. de que una llegada tenga que esperar
  const wq = pWait / (c * mu - lambda); // espera promedio en cola
  const w = wq + 1 / mu; // tiempo promedio total en el sistema
  const lq = lambda * wq; // Little's law: tamaño promedio de la cola
  const l = lambda * w; // Little's law: cantidad promedio en el sistema

  return { rho, stable: true, pWait, wq, w, lq, l };
}

export function simulatePipeline(blocks) {
  let lambda = 0;
  const results = [];

  for (const block of blocks) {
    if (block.type === "source") {
      lambda = block.rate ?? 0;
      results.push({ name: block.name || "Source", type: "source", lambdaOut: lambda });
    } else if (block.type === "cache") {
      const hitRate = block.hitRate ?? 0;
      const lambdaIn = lambda;
      lambda = lambdaIn * (1 - hitRate);
      results.push({ name: block.name || "Cache", type: "cache", lambdaIn, hitRate, lambdaOut: lambda });
    } else if (block.type === "service") {
      const lambdaIn = lambda;
      const mu = block.serviceRate ?? 1;
      const c = block.replicas ?? 1;
      const stats = erlangC(lambdaIn, mu, c);
      results.push({ name: block.name || "Service", type: "service", lambdaIn, mu, replicas: c, ...stats });
      // Red de colas abierta: en este modelo básico no se descartan requests,
      // así que el throughput de salida es igual al de entrada aunque esté saturado.
      lambda = lambdaIn;
    } else if (block.type === "sink") {
      results.push({ name: block.name || "Sink", type: "sink", lambdaIn: lambda });
    }
  }

  return results;
}
