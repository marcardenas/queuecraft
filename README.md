# QueueCraft

Una app **realmente básica** para armar una arquitectura de sistema arrastrando bloques y simular tráfico real sobre ella, usando teoría de colas (M/M/c), no una animación inventada.

La idea: en vez de dibujar cajas en un whiteboard (como en la mayoría de herramientas de entrevistas de system design) o usar un simulador industrial genérico (como AnyLogic), acá armas un pipeline simple de bloques y ves al instante dónde se forma un cuello de botella real, con matemática de colas real detrás.

## Bloques disponibles

- **Source** — define una tasa de llegada (`rate`, en req/s). El punto de partida del pipeline.
- **Cache** — reduce el tráfico que sigue río abajo según un `hitRate` (0 a 1).
- **Service** — representa un servidor/API/base de datos. Se resuelve como una cola **M/M/c**: `serviceRate` (μ, capacidad por instancia) y `replicas` (c, cantidad de instancias). Calcula utilización (ρ), latencia promedio y tamaño de cola con la fórmula de Erlang C.
- **Sink** — el final del pipeline, muestra el throughput resultante.

Si en un `Service` la carga ofrecida supera la capacidad (ρ ≥ 1), se marca como **saturado**: la cola crece sin límite, igual que en un sistema real sobrecargado.

## GUI

```bash
npm run gui
# abre http://localhost:4321
```

Arrastra bloques desde la paleta al pipeline, configura sus parámetros, y apreta **Simular**.

## CLI

```bash
npm run cli -- examples/example.json
# o, si lo instalas global: queuecraft examples/example.json
```

El archivo de entrada es un JSON con un arreglo de bloques en orden, por ejemplo:

```json
[
  { "type": "source", "name": "Usuarios", "rate": 1000 },
  { "type": "cache", "name": "Redis Cache", "hitRate": 0.7 },
  { "type": "service", "name": "API Servers", "serviceRate": 150, "replicas": 3 },
  { "type": "service", "name": "Base de Datos", "serviceRate": 80, "replicas": 2 },
  { "type": "sink", "name": "Respuesta" }
]
```

## Qué tan "real" es la simulación

Es un modelo analítico de teoría de colas (M/M/c / Erlang C), no una simulación de eventos discretos con aleatoriedad. Eso significa:

- Los resultados son instantáneos y deterministas (no hay que correr miles de iteraciones).
- Asume llegadas Poisson y tiempos de servicio exponenciales — una aproximación estándar y razonable para tráfico de requests, pero una aproximación.
- Es una red de colas **abierta** y lineal: no modela ramificaciones, balanceo entre múltiples rutas, ni pérdida de requests cuando un bloque está saturado.

Es intencionalmente básico: el objetivo es que arrastrando 4 bloques puedas *ver* por qué agregar una réplica o un cache cambia el comportamiento del sistema, no reemplazar una herramienta de capacity planning seria.

## Estructura

```
src/engine.js   -> motor de simulación (M/M/c), compartido por GUI y CLI
cli.js          -> interfaz de línea de comandos
serve.js        -> servidor estático sin dependencias para la GUI
web/            -> GUI (HTML/CSS/JS plano, sin build step)
examples/       -> pipelines de ejemplo
```

## Licencia

MIT
