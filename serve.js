#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 4321;

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

http
  .createServer((req, res) => {
    const cleanUrl = req.url.split("?")[0];
    // "web/" es la raíz servida (para que las rutas relativas del HTML
    // funcionen tal cual), y "/src/..." se expone aparte porque app.js
    // importa el motor compartido con el CLI desde ../src/engine.js.
    const urlPath = cleanUrl.startsWith("/src/")
      ? cleanUrl
      : path.join("/web", cleanUrl === "/" ? "/index.html" : cleanUrl);
    const filePath = path.join(__dirname, urlPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`QueueCraft GUI corriendo en http://localhost:${port}`);
  });
