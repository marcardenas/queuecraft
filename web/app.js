import { simulatePipeline } from "../src/engine.js";

const dropzone = document.getElementById("dropzone");
const simulateBtn = document.getElementById("simulate-btn");

let blocks = [];
let nextId = 1;

const defaults = {
  source: { name: "Usuarios", rate: 1000 },
  cache: { name: "Cache", hitRate: 0.7 },
  service: { name: "Service", serviceRate: 150, replicas: 3 },
  sink: { name: "Respuesta" },
};

document.querySelectorAll(".block-card").forEach((card) => {
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.dataset.type);
  });
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("drag-over");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("drag-over");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag-over");
  const type = e.dataTransfer.getData("text/plain");
  if (!type || !defaults[type]) return;

  blocks.push({ id: nextId++, type, params: { ...defaults[type] } });
  render();
});

function removeBlock(id) {
  blocks = blocks.filter((b) => b.id !== id);
  render();
}

function updateParam(id, key, value, isNumber) {
  const block = blocks.find((b) => b.id === id);
  if (!block) return;
  block.params[key] = isNumber ? Number(value) : value;
}

function fieldsFor(type) {
  if (type === "source") return [["name", "Nombre", "text"], ["rate", "Tasa (req/s)", "number"]];
  if (type === "cache") return [["name", "Nombre", "text"], ["hitRate", "Hit rate (0-1)", "number"]];
  if (type === "service")
    return [
      ["name", "Nombre", "text"],
      ["serviceRate", "mu (req/s c/u)", "number"],
      ["replicas", "Réplicas", "number"],
    ];
  if (type === "sink") return [["name", "Nombre", "text"]];
  return [];
}

function render(results) {
  dropzone.innerHTML = "";

  if (blocks.length === 0) {
    dropzone.innerHTML = '<p class="hint">Arrastra bloques aquí, en orden, de izquierda a derecha.</p>';
    return;
  }

  blocks.forEach((block, index) => {
    const el = document.createElement("div");
    el.className = "pipeline-block";

    const title = document.createElement("h3");
    title.textContent = `${index + 1}. ${block.type}`;
    el.appendChild(title);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.onclick = () => removeBlock(block.id);
    el.appendChild(removeBtn);

    for (const [key, label, inputType] of fieldsFor(block.type)) {
      const labelEl = document.createElement("label");
      labelEl.textContent = label;
      const input = document.createElement("input");
      input.type = inputType;
      if (inputType === "number") input.step = "any";
      input.value = block.params[key] ?? "";
      input.oninput = () => updateParam(block.id, key, input.value, inputType === "number");
      labelEl.appendChild(input);
      el.appendChild(labelEl);
    }

    const result = results?.find((r, i) => i === index);
    if (result) el.appendChild(renderResult(result));

    dropzone.appendChild(el);
  });
}

function renderResult(r) {
  const div = document.createElement("div");
  div.className = "result";

  if (r.type === "source") {
    div.innerHTML = `λ salida: <strong>${r.lambdaOut}</strong> req/s`;
  } else if (r.type === "cache") {
    div.innerHTML = `λ entrada: ${r.lambdaIn.toFixed(1)} req/s<br>λ salida: <strong>${r.lambdaOut.toFixed(1)}</strong> req/s`;
  } else if (r.type === "service") {
    if (!r.stable) {
      div.innerHTML = `<span class="bad">SATURADO (ρ=${r.rho.toFixed(2)})</span><br>la cola crece sin límite`;
    } else {
      const cls = r.rho >= 0.8 ? "warn" : "ok";
      div.innerHTML = `
        <span class="${cls}">ρ (utilización): ${(r.rho * 100).toFixed(1)}%</span><br>
        latencia: ${(r.w * 1000).toFixed(2)} ms<br>
        cola promedio: ${r.lq.toFixed(2)} req
      `;
    }
  } else if (r.type === "sink") {
    div.innerHTML = `throughput final: <strong>${r.lambdaIn.toFixed(1)}</strong> req/s`;
  }

  return div;
}

simulateBtn.addEventListener("click", () => {
  const engineInput = blocks.map((b) => ({ type: b.type, ...b.params }));
  const results = simulatePipeline(engineInput);
  render(results);
});
