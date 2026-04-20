<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# My Thoughts

## 2026-04-19: Project Kickoff
- Decided to use **Vite** for fast iteration and local dev server.
- **Three.js** is the standard for web 3D; using the **WebGPURenderer** is essential as per user request to leverage modern GPU power.
- Gardening game mechanics should focus on visual satisfaction: lush greenery, smooth growth animations.
- WebGPU requires explicit initialization (`renderer.init()`). I found that standard `requestAnimationFrame` can sometimes fire before the backend is fully ready if not gated correctly. Switching to `renderer.setAnimationLoop()` is the Three.js standard for keeping the render loop in sync with the renderer's internal state.
- Observed CORS errors in user feedback. These occur when `index.html` is opened directly via the `file://` protocol. Since the project uses ES Modules (`type="module"`), it must be served over `http://` (e.g., via Vita) to satisfy browser security policies.

## 2026-04-19: MASSIVE PIVOT - The Life/Farming Sim Realization
- **The Problem:** The current "floating islands" model is a tech demo (a toy). It has no progression, no player embodiment, and no ecosystem. To make a true game, we must shift from a "sandbox viewer" to an **embodied player simulation**.
- **The New Vision:** A contiguous world grid (House -> Garden -> Town). The player controls a character (or first-person ghost for now) navigating this space.
- **Critical Structural Shifts Required:**
  1. **Camera/Controls:** `OrbitControls` must die. We need a First-Person or Third-Person Character Controller with WASD movement.
  2. **World Layout:** Switch from random procedural islands to a deterministic Ground Plane with distinct zones (Home, Garden, Shop).
  3. **Grid System:** Farming requires precision. We need coordinate-based plots (e.g., `Grid[x][y]`) for deterministic planting, harvesting, and state-saves, not random raycast points.
  4. **Economy State:** UI must evolve from a "Plant" button to an Inventory System (Hotbar, Coins, Seeds, Harvests).
  5. **Collision:** The player needs to bump into walls (House) and navigate paths. Simplest approach: Grid-based logical collision (tile is walkable vs blocked).
- **Next Steps:** Strip out the auto-orbit and floating islands. Lay down a massive flat voxel/tile grid. Implement a basic player capsule that can walk. Build a functional inventory/wallet UI.
