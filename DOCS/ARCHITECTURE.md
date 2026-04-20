<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# ARCHITECTURE

## System Overview
The game is a client-side web application built with Vite and Three.js.

## Rendering Engine
- **Three.js WebGPURenderer**: Utilizing the new WebGPU backend for performance and modern shading capabilities.

## Interaction Layer
- Simple mouse/touch events for planting and gardening actions.

```mermaid
graph TD
    A[Vite Dev Server] --> B[Client Browser]
    B --> C[Three.js Scene]
    C --> D[WebGPURenderer]
    D --> E[WebGPU API]
    C --> F[TSL Node Materials]
    C --> G[PostProcessing Node]
    F --> H[Wind Shader]
    G --> I[Tone Mapping]
    C --> J[Input Handler]
    J --> K[Planting System]
```
