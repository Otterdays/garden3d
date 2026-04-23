<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SUMMARY

## NPC interaction pass (2026-04-23)
- Villagers now support a real **talk** loop: **`F`** prompt near the closest NPC, speech bubble above their head, focus ring, and short context-aware dialogue.
- Supporting modules: `src/entities/npcVisuals.ts` and `src/entities/npcDialogue.ts`.

## Area travel + world art pass (2026-04-22)
- Farmstead perimeter/land art upgraded: raised farm beds, stronger outer walls, cleaner land shaping, orchard/scarecrow dressing.
- Added second area **Ironwood Reach** plus a top-corner **Travel** button; current area now persists in save data.

## Pause + backpack (2026-04-22)
- **`E`** — Backpack panel; **`Esc`** — pause menu (Resume, Settings, Quit) and world time frozen while paused. See `DOCS/CHANGELOG` Unreleased and `DOCS/SMOKE_TEST.md`.

## Roadmap sprint note (2026-04-22)
- Delivered: tomato crop + five tool slots, `gameState` / `saveFormat` modules, `BeehiveManager` fix, `DOCS/SMOKE_TEST.md`, roadmap baseline amended.

## NPC update (2026-04-23)
- Town NPCs: POI-biased paths, given names, proximity flavor toasts; see `NPCManager.ts` and `DOCS/CHANGELOG.md` Unreleased.

## Save data UI (2026-04-23)
- In-game **Farm data** (top bar 💾): JSON export/import and reset; see `DOCS/CHANGELOG` Unreleased and `DOCS/ROADMAP` execution.

## Docker MCP note (2026-04-23)
- Sequential Thinking over **MCP_DOCKER** requires a **healthy** `user-MCP_DOCKER` server in Cursor; see new troubleshooting bullets in `DOCS/ROADMAP.md` if the agent cannot call tools.

## Engine modularization + persistence (2026-04-22)
- Walk + follow camera refactored out of `main.ts` into `src/systems/`. `localStorage` save/load for session resume; `ROADMAP.md` has sequential-ideation note (no Sequential-Thinking MCP in-repo).
- See `DOCS/ROADMAP.md` and `DOCS/CHANGELOG.md` for detail.

## Project Status
**Current Version:** 0.0.1 ALPHA
**Status:** Active Development
**Tech Stack:** Vite, Three.js, WebGPU, TypeScript

## Quick Links
- [SCRATCHPAD](file:///c:/Users/motor/Desktop/garden3d/DOCS/SCRATCHPAD.md)
- [ARCHITECTURE](file:///c:/Users/motor/Desktop/garden3d/DOCS/ARCHITECTURE.md)
- [CHANGELOG](file:///c:/Users/motor/Desktop/garden3d/DOCS/CHANGELOG.md)

## Docs Cleanup (2026-04-22)
- Converted doc references to repository-relative paths for GitHub compatibility.
- Clarified beginner-friendly entry points for reading project docs.

## Quick Links (GitHub Friendly)
- [README](../README.md)
- [FEATURES](./FEATURES.md)
- [ROADMAP](./ROADMAP.md)
- [SMOKE_TEST](./SMOKE_TEST.md)
- [SCRATCHPAD](./SCRATCHPAD.md)
- [ARCHITECTURE](./ARCHITECTURE.md)
- [CHANGELOG](./CHANGELOG.md)
- [STYLE GUIDE](./STYLE_GUIDE.md)
- [SBOM](./SBOM.md)

## README + HUD documentation (2026-04-22)
- **README** now lists current HUD/UX (hints, version badge, shop affordance, `style.css`) and a **controls** table for quick onboarding.
- **CHANGELOG** and **FEATURES** record the CSS shake fix and HUD/a11y tweaks.

[AMENDED 2026-04-22]: The line below still documents the `0.1.0` pin; the older `0.0.1 ALPHA` label at the top of this file is stale — treat **`0.1.0`** (see `package.json` and `src/config/gameConstants.ts`) as authoritative.

## Version Sync Update (2026-04-22)
- **Pinned App Version:** `0.1.0` (matches `package.json`).
- In-game update modal content is now aligned with the current version label and recent movement/camera/world-boundary changes.

## Update Modal Workflow (Beginner Steps)
1. Confirm current version in `package.json`.
2. Update in-game modal messaging in `src/main.ts` (`showChangelogModal`).
3. Append matching notes in `DOCS/CHANGELOG.md`.
4. Append a short sync note in `DOCS/SUMMARY.md` or `DOCS/FEATURES.md`.
5. Preserve update-log history: do not delete or overwrite old entries; only edit in place or append.

## Gameplay + UX Sync Update (2026-04-22)
- Added contextual interaction hint UI above the hotbar so players can preview actions before clicking/pressing Space.
- Interaction input timing was updated to resolve on current-frame grid targeting, fixing "behind-time" feedback.
- `DOCS/ROADMAP.md` now includes a new expansion block for mid-game systems and beginner accessibility upgrades.

## Project Status Update (2026-04-22)
- **Current Version:** `0.1.0` (supersedes older `0.0.1 ALPHA` note above).
- **Runtime Package:** `three@0.184.0`.
- **Toolchain:** `vite@8.0.8`, `typescript@6.0.3`, `@types/three@0.184.0`.
- **Security Audit:** `npm audit --omit=dev` returned 0 vulnerabilities.
