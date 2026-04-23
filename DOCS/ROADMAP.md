<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# ROADMAP

## Goal
Build Garden3D from a playable prototype into a polished, cozy gardening game with clear progression, stable systems, and clean architecture.

## Roadmap execution (2026-04-22)
- **Stabilize / Phase 1:** `BeehiveManager` animation bug fixed (`timeMs` passed into bee buzz motion). `npm run build` and `npx tsc --noEmit` are clean.
- **Modularity:** `STATE` and `cropGrid` moved to `src/state/gameState.ts`; shared version/slot indices in `src/config/gameConstants.ts`.
- **Save format stub:** `src/save/saveFormat.ts` defines `SAVE_FORMAT_VERSION` and a V1 snapshot shape (persistence UI still future work).
- **Gameplay:** New **tomato** crop (shop + hotbar), five-slot tool row (1–5 keys, wheel wrap). In-game update modal and `DOCS/SMOKE_TEST.md` updated.
- **Input / UX (2026-04-22):** **`E`** opens a **Backpack** panel (read-only view of gold + seed/water counts). **`Esc`** opens a **pause** overlay: **Resume**, **Settings** (version + data pointers, **Back** to main pause), **Quit** (confirm). While paused, simulation and movement stop; `Esc` on the pause screen resumes. Styling shared with shop/data modals; `#pause-modal` uses a higher `z-index` so it layers above the stall/data UIs.
- **Next from here:** extract movement/camera from `src/main.ts` into a small module; optional key rebinds; biomes/edge dressing.

## Current Baseline
- A playable prototype exists with movement, farming interactions, HUD, NPC wandering, and shop/economy foundations.
- Dev server is healthy.
- [AMENDED 2026-04-22]: Production build is green; remaining release work is modularization and content depth, not TS blockers in `main.ts` alone.

## Phase 1 - Stabilize Core (Now)
Focus: reliability and maintainability.

- [AMENDED 2026-04-22]: TypeScript build passes; `BeehiveManager` and core game compile cleanly.
- [AMENDED 2026-04-22]: Began `src/main.ts` split (`gameState`, `gameConstants`, `saveFormat`); more extraction still planned.
- [AMENDED 2026-04-22]: `DOCS/SMOKE_TEST.md` added for move/plant/harvest/shop/canvas-vs-UI checks.
- Ensure documentation stays in sync for every system-level change

## Phase 2 - Deepen Gameplay
Focus: make the loop engaging over longer play sessions.

- Add multiple crop categories with varied growth and value curves
- Expand economy rules (seed costs, sell prices, balancing pass)
- Add inventory depth (stacking, limits, clearer item feedback)
- Add simple progression goals (daily targets, unlocks, milestones)

### Farming Depth System
- **Seasonal Crops**: Different crops available by season (summer corn/winter kale)
- **Quality Tiers**: Normal → Silver → Gold → Iridium quality levels
- **Cross-breeding**: Hybrid seed crafting experimental system
- **Seed Saving**: Replant select crops to maintain variety
- **Composting**: Convert harvest waste to fertilizer

## Phase 3 - World and NPC Expansion
Focus: make the world feel alive.

- Introduce NPC schedules (morning/day/evening routines)
- Add interaction prompts for NPC dialogue and simple requests
- Expand map points of interest and biome variation
- Improve environmental storytelling with props and ambient events

### NPC Relationship System
- **Gift-Giving**: Each NPC has favorite items (favorite flower/vegetable)
- **Heart Events**: Unlock story moments at relationship milestones (2/4/6/8 hearts)
- **Daily Schedules**: Villagers visit the well, sit at campfire, browse the market
- **Requests**: Random tasks ("Can you bring me 5 carrots?")
- **Move-in Events**: New neighbors can join the town

### Community Building
- **Community Center**: Bundle completion for upgrades (better tools, barn, coop)
- **Festivals**: Seasonal celebrations (Spring Egg Hunt, Summer Luau, Winter Feast)
- **Shipping Bin**: Auto-sell crops, track daily earnings
- **Customer Shoppers**: Visiting NPCs buy from the market

## Phase 4 - Player Experience Polish
Focus: smooth, friendly, and beginner-accessible experience.

- Add first-time tutorial flow and contextual hints
- Improve UX consistency across HUD, modals, and feedback messages
- Improve animation, sound layering, and camera feel
- Add accessibility pass (readability, contrast, key rebinding planning)

### Environmental Depth
- **Weather System**: Rain feeds crops (2x growth), storms may damage unprotected plants
- **Seasonal Visuals**: Foliage color shifts, snow in winter, flower blooms
- **Wildlife**: Birds at feeders, butterflies near flowers, fishing minigame
- **Bees & Pollination**: Place beehives near crops to increase yield
- **Day/Night Zones**: Different NPCs appear at different times

## Phase 5 - Release Preparation
Focus: quality and shareability.

- Finalize performance passes (frame pacing, draw call control)
- Complete balancing pass for economy and progression
- Add release notes and update changelog discipline
- Prepare public repo essentials (license, contribution guide, issue templates)

### Narrative & Exploration
- **Joja Corporation**: Competing corporate store vs local town shop
- **Secret Areas**: Unlock the forest mine, ruins exploration
- **Artifact Hunting**: Dig for ancient tools and fossils
- **Collections**: Museum donation rewards

## Success Criteria
- Build passes with zero TypeScript errors
- New player can understand and complete the basic loop without external help
- Core systems are split into maintainable modules
- Gameplay loop is fun for at least a short repeat session (10-20 minutes)

## Immediate Next 3 Tasks
1. [DONE 2026-04-22] TypeScript / build: `npm run build` clean; `BeehiveManager` time fix.
2. [PARTIAL 2026-04-22] Extract subsystems: `gameState`, `gameConstants`, `saveFormat` live; still recommend movement/camera extraction next.
3. [DONE 2026-04-22] New crop: **tomato** + economy tuning + docs (`FEATURES`, `CHANGELOG`).

## Immediate Next 3 Tasks (revised 2026-04-22)
1. [DONE 2026-04-22] Extract movement + camera + bounds from `src/main.ts` into `src/systems/` and `src/config/`.
2. [OPEN] Key rebind table for pan / interact / shop.
3. [DONE 2026-04-22] Plumb `saveFormat` to `localStorage` (load on boot, autosave, `beforeunload`).

## Immediate Next 3 Tasks (revised again 2026-04-22)
1. [DONE 2026-04-23] **Save UX:** in-game **Data** (💾): export / import <code>garden3d_save.json</code>, **Reset farm** (clears <code>localStorage</code>, confirm); <code>mergeImportedJson</code> in <code>persistence.ts</code>.
2. [OPEN] **More `main.ts` splits:** input listeners → <code>src/systems/inputBindings.ts</code> or thin facade.
3. [PARTIAL 2026-04-23] **Balance:** <code>STATE.timeScale</code> nudged <code>0.1 → 0.12</code> (slightly snappier days); more crop tuning still open.

## Immediate Next 3 Tasks (revised 2026-04-23)
1. **Input module:** extract <code>keydown</code> / <code>wheel</code> / <code>mousedown</code> from <code>main.ts</code> to reduce file size.
2. **Data UX:** after import failure, show which field failed (optional); “copy save to clipboard” for quick backup.
3. **NPCs:** one scripted <strong>greeting</strong> or stall idle near market (Phase 3).

## Roadmap Update (2026-04-22)

### Completed Since Last Revision
- TypeScript build blockers in `src/main.ts` were resolved and production build passes.
- Movement reliability improved with explicit world bounds clamping.
- Camera control upgraded with arrow-key panning layered on top of player-follow behavior.
- Outer map boundary was upgraded with perimeter detail and soft collision blockers.

### Next Recommended Sprint
1. Extract movement/camera/bounds logic into dedicated modules.
2. Add configurable control mapping (rebind camera pan and interaction keys).
3. Add edge-zone biome set dressing variation (forest, stones, flowers by quadrant).

## Roadmap Expansion (2026-04-22 - Added)

### New Systems to Add (Prioritized)
1. **Tool Durability + Repair Loop**  
   - Watering can, hoe, and harvest tool gain wear from use.  
   - Repair at town workshop for gold/material sinks.  
   - Adds mid-game decisions without overcomplicating the core loop.
2. **Soil Fertility and Crop Rotation**  
   - Repeated same-crop planting lowers yield over time on that tile.  
   - Compost/fertilizer restores fertility and boosts growth speed.  
   - Encourages planning and varied farm layouts.
3. **Simple Quest Board (Daily/Weekly)**  
   - Rotating requests: crop bundles, watering goals, harvest targets.  
   - Rewards include gold, seeds, and small progression unlocks.  
   - Keeps sessions goal-driven for new players.
4. **Cooking + Buff Foods**  
   - Convert harvest into meals that grant short boosts (speed, sell bonus, stamina-style utility).  
   - Introduces value choices: sell raw crops or craft higher-value outcomes.
5. **Farm Rating / Town Reputation**  
   - Score based on crop variety, deliveries, and consistency.  
   - Unlocks cosmetic upgrades and advanced shop inventory.

### UX and Accessibility Upgrades (Beginner-Focused)
- Contextual interaction hint near HUD (what Space/Click will do on hovered tile).
- Optional "slow mode" for time progression and calmer onboarding sessions.
- First-week guided checklist (plant, water, harvest, visit market, refill well).
- Color-safe icon pass for crop/water/harvest states.
- Optional larger UI scale preset for readability.

### Technical Quality Targets
- Introduce save/load snapshot format with backward-compatible version field.
- Add lightweight telemetry counters in dev mode (actions/min, crop success rate).
- Add `src/main.ts` decomposition milestones with "one system per file" target.

## Sequential ideation & MCP note (2026-04-22)

### How to run structured thinking here
- This repository does not ship a **Sequential Thinking** MCP in `mcps/` (empty / not present). In Cursor, enable that MCP in **Settings → MCP** if you want step-by-step reasoning from an external tool.
- **Lightweight process without MCP:** (1) list **constraints** (WebGPU, single bundle, no new deps) → (2) list **risks** (save migration, `main.ts` size) → (3) pick **smallest shippable** slice → (4) add **one** smoke-test line → (5) append docs.

### [2026-04-23] Docker MCP (`user-MCP_DOCKER`) + Sequential Thinking
- **Reality check:** The Cursor project mirror may show `mcps/user-MCP_DOCKER/STATUS.md` = *“The MCP server errored”* and **no** `tools/*.json` descriptors until the server is healthy. The coding agent then **cannot** invoke Docker MCP tools (including any Sequential Thinking bridge) until Cursor reports the server as connected.
- **Fix on your machine:** Cursor **Settings → MCP** → open **MCP_DOCKER** / `user-MCP_DOCKER`, read the error, ensure the **Docker** daemon is running and the **container or command** that MCP config expects is up, then **reload** MCP. When fixed, `mcps/user-MCP_DOCKER/tools/` should populate; use the **exact** tool name/schema from those JSON files (varies by image).
- **If you use a Sequential Thinking server via Docker:** keep its image, port, and env in sync with the MCP config so the bridge starts before Cursor connects.

### Extra ideas (backlog — not committed)
- **Photo / scenic mode:** pause time, hide HUD, orbit camera for screenshots / sharing.
- **Greenhouse / cellar:** out-of-season growing or crop storage to extend the economy loop.
- **Single-undo** or “confirm destroy” for misplaced plants (accessibility + mistake recovery).
- **Pest / pressure layer:** light bug pressure that lowers sell price until watered with “tonic” or companion flowers (tension, not tedium).
- **Async farm “ghost” visit:** copy farm layout to a read-only visit URL (later: multiplayer).
- **Data-driven crops:** load crop defs from `public/crops.json` to iterate balance without recompiles.
- **Journal / almanac UI:** in-game tab that mirrors `ROADMAP.md` “what’s next” (meta, but helps retention).

## Roadmap execution (2026-04-22 — follow-up)
- **Movement + camera** extracted to `src/systems/playerMovement.ts` and `src/systems/followCamera.ts`; bounds live in `src/config/worldConfig.ts`, follow tuning in `src/config/cameraConfig.ts`.
- **localStorage persistence:** `src/save/persistence.ts` + extended `GameSaveV1` (player pose, pan, zoom, crops). Autosave ~20s, save on `beforeunload`, load on boot with crop rehydration.
- **Dev:** `src/dev/devCounters.ts` (plants / harvests / waters / `saveWrites`) on `window.__garden3dStats` in dev; `tsconfig` references `vite/client` for `import.meta.env`.

## Roadmap execution (2026-04-23)
- [Phase 3 / NPC] **Practical slice:** `src/entities/NPCManager.ts` now uses **named** neighbors, **POI-biased** wander (market, well, campfire, farm), optional **bark toasts** via `update(..., { playerPos, onBark })` from `main.ts` with a **12s** global proximity cooldown. Next: dialogue, schedules, or relationship hooks — see Phase 3 list above.

## Roadmap execution (2026-04-23 — save + balance)
- **Farm data UI:** `index.html` + `#data-modal` — export `garden3d_save.json`, import (reload), reset with `confirm()`. `anyModalOpen()` blocks the same input paths as the shop. **`persistence`:** `mergeImportedJson`, `clearSaveStorageOnly`.
- **Balance:** default `timeScale` **0.12** in `src/state/gameState.ts` (was 0.1).
