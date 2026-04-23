<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# FEATURES

## Purpose
This document lists the gameplay and technical features currently present in Garden3D, plus features that are planned next.

## Current Gameplay Features

### Core Farming Loop
- Grid-based tile farming interactions
- Planting and harvesting flow
- Multi-stage crop growth behavior
- Auto-switch quality-of-life behavior for harvesting
- Three seed types in play: **carrot**, **flower**, and **tomato** (mid-tier growth and sell value)

### Player Controls
- WASD movement
- Sprint support (`Shift`)
- Mouse raycast tile selection
- Scroll-wheel hotbar cycling
- Camera zoom support (`Shift + Scroll`)

### World and Atmosphere
- Isometric-style world layout
- Dynamic environment setup with dense world decoration
- Ambient particle effects (pollen)
- Wind shader behavior for vegetation
- Sound effects for UI and footsteps

### User Interface and UX
- HUD with wallet/time/hotbar visibility
- Action feed for toasts and errors
- Shop modal for economy interactions; **Farm data** (💾) for export / import of `garden3d_save.json` and reset (local save)
- [2026-04-22] **`E` — Backpack** panel showing gold and seed/water counts (toggles; blocked while the pause menu is open)
- [2026-04-22] **`Esc` — Pause** overlay: **Resume** (or `Esc` again), **Settings** (read-only stub: version, pointer to Farm data), **Quit** (confirm). Opening shop or Farm data closes backpack/pause as needed; `Esc` also closes other modals in stack order
- Escape key modal closing (shop, data, inventory; + pause resume when pause is top)
- Hotbar tooltips/labels
- Time fast-forward action (night skip)
- Contextual interaction hint text that previews current tile action before interaction
- [2026-04-22] **Keyboard hint** bar (styled keys) on desktop; **abbreviated** control line on narrow viewports; **safe-area** spacing for notched devices
- [2026-04-22] **Version badge** in the HUD (kept in sync with `APP_VERSION` / `package.json`)
- [2026-04-22] **Time-of-day** icon beside the clock (day vs night)
- [2026-04-22] **Shop** purchase buttons show **disabled** state when the player cannot afford the item; modal visibility/ARIA updated when closed

### Entities and Systems
- Procedural player model foundation
- Modular NPC manager architecture
- NPC wandering behavior (town **POI** targets: market, well, campfire, farm plot) with **named** neighbors and **proximity barks** (toasts, ~12s global cooldown) when you walk close
- Global state and calendar logic

## Technical Features
- Vite-powered local development workflow
- TypeScript codebase
- Three.js rendering stack with WebGPU focus
- TSL-based shader logic for environmental effects
- [2026-04-22] Core state in `src/state/gameState.ts`; version/slot constants in `src/config/gameConstants.ts`; save snapshot + **localStorage** in `src/save/saveFormat.ts` & `persistence.ts` (autosave, boot restore, crop rehydration)
- [2026-04-22] Player walk + camera follow in `src/systems/playerMovement.ts` and `src/systems/followCamera.ts` (keeps `main.ts` thinner)
- [2026-04-22] Development-only stats object on `window.__garden3dStats` (Vite dev)

## Planned Features (Next)
- Save/load game state
- More crop types with unique growth times
- Expanded shop inventory and pricing depth
- Structured quest/tutorial onboarding for new players
- More NPC behaviors (daily schedules and interactions)

## Notes for New Contributors
- Start in `src/main.ts` for current gameplay loop context.
- Read `DOCS/ARCHITECTURE.md` and `DOCS/STYLE_GUIDE.md` before larger edits.
- Keep feature work modular; avoid adding more global complexity to one file.

## Feature Update (2026-04-22)

### Movement and Camera
- Player movement now includes stable world-bound clamping.
- Camera now supports manual pan controls using arrow keys while still following player.
- Camera pan amount is clamped to keep framing readable and prevent disorienting drift.
- In-game update modal now includes current controls and recent movement/camera improvements.

### Outer World Boundary
- Added perimeter wall treatment for clearer map edges.
- Added decorative lantern rows at border lanes for visual depth.
- Added hedge/rock edge blocker ring with soft collision pushback to make boundaries feel natural.

## Feature Update (2026-04-22 - Interaction UX)

### Interaction Feedback
- Added a centered interaction hint panel above the hotbar (`#interaction-hint`) for beginner-friendly action previews.
- Hint text updates in real time from current tile + selected tool state (plant, water, harvest, occupied, empty, out-of-resource).
- Click interactions were aligned to current-frame targeting so feedback and outcomes no longer feel one step behind.

### Roadmap Expansion Synced
- Added new roadmap priorities for deeper progression loops:
  - Tool durability and repair economy
  - Soil fertility and crop rotation
  - Daily/weekly quest board objectives
  - Cooking with temporary buff effects
  - Farm reputation progression
