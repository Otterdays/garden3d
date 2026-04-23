<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SCRATCHPAD

## 2026-04-23 — NPC interaction + visual pass
- **Interaction:** nearby villagers now show a HUD prompt and support **`F` talk**. Talking pauses the NPC briefly, turns them toward the player, shows a world-space speech bubble, and emits a toast line.
- **Visuals:** villagers now have stronger silhouette/readability (hair + trim + ground shadow), persistent name labels, and a pulsing focus ring when they are the nearest talk target.
- **Behavior:** simple affinity buildup and context-aware chatter (`npcDialogue.ts`) tied to time-of-day / nearby POIs; new 3D UI helpers live in `src/entities/npcVisuals.ts`.
- **UX text:** help strip, backpack hint, and in-game update modal controls now mention **`F` talk**.

## 2026-04-22 — Area travel + world redesign pass
- **World art:** Rebuilt the farm perimeter so the outer wall feels intentional instead of a flat box; added raised farm beds, orchard/scarecrow detail, and cleaner land/path composition.
- **New area:** Added **Ironwood Reach** as a second travelable district with a ruined gate, overlook, shrine, darker palette, and exploration-only behavior.
- **Travel/save:** Added top-corner **Travel** HUD control, persisted `currentArea` in save data, and kept existing saves compatible by defaulting missing area data to `farmstead`.
- **Validation:** `npm run build` passes after the area-travel/state updates.

## 2026-04-22 — Backpack (`E`) + pause menu (`Esc`)
- **Code:** `pauseMenuOpen`, `pauseSettingsView`, `inventoryOpen`; `isWorldPaused()` short-circuits the main loop; `inputBlockedForMoveAndWheel` / `inputBlockedForCanvas`; `E` keyup toggles backpack; `Esc` keyup walks modal stack; `#pause-modal` (Resume, Settings, Quit) and `#inventory-panel` in `index.html`; pause overlay styles + z-index 102 in `src/style.css`.
- **Docs:** `ROADMAP` execution line, `CHANGELOG` Unreleased, `FEATURES`, `SUMMARY`, `SMOKE_TEST`, `README` controls table, changelog modal bullet in `showChangelogModal`, this entry, **Last 5 actions** below.
- `npm run build` / `npx tsc --noEmit` green after CSS overlay fix for `#pause-modal`.

## 2026-04-22 — Docs + README (HUD polish recap)
- **HUD:** In-game control hints (full desktop strip + short mobile line), version badge from `APP_VERSION`, sun/moon next to clock, buy buttons respect affordability + `:disabled` styles, shop hidden state uses `visibility` + `aria-hidden`.
- **CSS:** Repaired `@keyframes shake` block closure in `src/style.css` (harvest tip / pulse no longer mis-nested).
- **Docs:** `README.md` expanded; `DOCS/CHANGELOG.md`, `DOCS/SUMMARY.md`, `DOCS/FEATURES.md` appended; this scratchpad entry.

## 2026-04-23 — NPC system continuation (POI + names + barks)
- `NPCManager`: `TOWN_POIS`, `pickWanderTarget()`, `NEIGHBOR_NAMES`, `maybeProximityBark` + `NPCUpdateContext`; `main` passes `playerMesh.position` and `showToast` as `onBark`. **Docs:** FEATURES, CHANGELOG, SMOKE_TEST, ROADMAP, update modal bullet.

## 2026-04-23 — Roadmap: save UX + timeScale
- Shipped: `#data-modal` (export / import / reset), `anyModalOpen`, `mergeImportedJson` + `clearSaveStorageOnly`, wallet 💾 button; `timeScale` 0.12. **Docs:** ROADMAP, CHANGELOG, FEATURES, SMOKE_TEST, update modal, SUMMARY, SBOM snapshot line.

## 2026-04-23 — Docker MCP + Sequential Thinking (user action required)
- **User asked:** use Docker MCP for sequential think. **Finding:** `user-MCP_DOCKER` is **errored** in workspace `STATUS.md`; no `tools/*.json` in `mcps/`; `call_mcp_tool` not available. **Action:** user must fix MCP in Cursor (Docker up + reload). **Doc:** appended `ROADMAP.md` troubleshooting block.

## 2026-04-22 — Roadmap: camera/move extract + localStorage + ideation block
- **Code:** `playerMovement.ts`, `followCamera.ts`, `worldConfig.ts`, `cameraConfig.ts`. **Save:** `persistence.ts`, extended V1 save, rehydrate on load, autosave 20s + `beforeunload`. **Dev:** `__garden3dStats`. **Docs:** `ROADMAP` sequential-idea section (MCP not in `mcps/`), SMOKE_TEST save line, changelog modal bullets.
- `tsconfig` `types: ["vite/client"]` for `import.meta.env`.

## 2026-04-22 — Roadmap sprint (crops + modules + docs)
- Implemented **tomato** crop (HUD slot, market buy, grow visuals), expanded hotbar to **5** tools; keys `1`–`5` and wheel wrap use `HOTBAR_SLOT_COUNT`.
- Split **`STATE` / `cropGrid`** to `src/state/gameState.ts`; **`APP_VERSION` / slot indices** in `src/config/gameConstants.ts`; **save v1 stub** in `src/save/saveFormat.ts`.
- Fixed **`BeehiveManager`** bee jitter (`timeMs` into `updateBees`); removed unused `BeehiveManager` import from `main.ts` (class unused in scene).
- Added **`DOCS/SMOKE_TEST.md`**; updated **ROADMAP**, **CHANGELOG**, **SUMMARY**, **FEATURES**, **README**; `npm run build` passes.

## 2026-04-22 — Input / UI connection fixes
- **Bug:** `window` `mousedown` queued `handleInteraction` for *every* press, including hotbar/HUD, so the next frame used the *previous* `activeSlot` on the tile under the cursor, then the slot `click` fired — felt like wrong seed/water selection and double actions.
- **Fix:** Only set `mouseInteractionRequested` when `e.target` is `#canvas`. Removed a duplicate `wheel` listener pair so scroll no longer advanced the hotbar by **two** slots per tick. Shop buy buttons use `currentTarget` so `dataset` works when the label is clicked. Cleaned duplicate `import` and `STATE_HONEY` lines in `src/main.ts`.

## Active Tasks
- [x] Prep project for Git (README, .gitignore, STYLE_GUIDE) <!-- id: 27 -->
- [x] Basic Scene Setup (WebGPU Renderer) <!-- id: 2 -->
- [x] Implement TSL Wind Shader for grass <!-- id: 3 -->
- [x] Upgrade Growth System (multi-stage models) <!-- id: 4 -->
- [x] Add ambient particle system (pollen) <!-- id: 6 -->
- [x] Pivot architecture to Isometric Grid System <!-- id: 7 -->
- [x] Implement WASD Character Controller <!-- id: 8 -->
- [x] Integrate Global State & Calendar logic <!-- id: 9 -->
- [x] Create deterministic Tile Grid for farming <!-- id: 10 -->
- [x] Build HUD (Wallet, Time, Inventory Hotbar) <!-- id: 11 -->
- [x] Advanced Action Feed UX (Toasts & Errors) <!-- id: 12 -->
- [x] Economic Shop UI Modal <!-- id: 13 -->
- [x] Procedural Player Modeling <!-- id: 14 -->
- [x] Modular NPC Entities (Separate Class) <!-- id: 15 -->
- [x] Massive World Environment Overhaul <!-- id: 16 -->
- [x] QOL: Escape key closes Shop/Modals <!-- id: 17 -->
- [x] QOL: E = Backpack; Esc = Pause (Resume / Settings / Quit) <!-- id: 28 -->
- [x] QOL: Scroll wheel to cycle Hotbar <!-- id: 18 -->
- [x] QOL: Shift to Sprint <!-- id: 19 -->
- [x] QOL: Camera Zoom Support (Shift + Scroll) <!-- id: 23 -->
- [x] QOL: Interactive "Pop" animation for planting <!-- id: 22 -->
- [x] QOL: Mouse-raycast Grid Selection <!-- id: 20 -->
- [x] QOL: Item Tooltips/Labels on Hotbar hover <!-- id: 21 -->
- [x] QOL: Auto-switch to Harvest tool on grown crops <!-- id: 24 -->
- [x] QOL: Time Fast-Forward button (Night skip) <!-- id: 25 -->
- [x] QOL: Sound FX (UI & Footsteps) <!-- id: 26 -->

## Blockers
- None.

## Last 5 Actions
1. (2026-04-22) Backpack + pause: `E` / `Esc`, `DOCS` sync (ROADMAP, CHANGELOG, FEATURES, SUMMARY, SMOKE_TEST), pause modal CSS (full-screen overlay, z-index 102), build verify.
2. (2026-04-22) README + DOCS sync: controls table, HUD feature list, CHANGELOG / SUMMARY / FEATURES entries for UI polish and CSS `shake` fix.
3. MASSIVE environment overhaul: well, market stall, pond, paths, fencing, forest boundary, props.
4. Fire flicker animation (rotating mesh + pulsing light) and related atmosphere polish.
5. Abstracted `NPCManager` + NPC wandering (town arrivals, idling, leaving map). *(Earlier log: Git prep — README, `.gitignore`, `DOCS/STYLE_GUIDE.md`.)*

## Out-of-Scope Observations
- None
