<!-- PRESERVATION RULE: Never delete, overwrite, or replace changelog history. Use edit-in-place or append-only updates. -->
# CHANGELOG

## [0.0.1 ALPHA]
### Added
- In-game changelog modal that displays on game start (auto-shows after 1.5s).
- Version tracking via modal UI.
- Update notification system.
- Roadmap depth systems: farming quality tiers, NPC relationships, community building.
- Weather system notes in roadmap.
- Seasonal events and festival placeholders.
- Narrative hooks (Joja, mine area, artifacts).

## Unreleased
### Added
- **Area travel:** top-corner **Travel** button swaps between the rebuilt **Farmstead** and new **Ironwood Reach** area; current area now persists in save data and older saves default safely to `farmstead`.
- **Ironwood Reach:** second district with ruined gate, shrine, overlook bridge, darker palette, and exploration-only role.
- **Backpack + pause:** **`E`** toggles a **Backpack** aside (gold and inventory counts; closes when opening shop/data or pause). **`Esc`** stack: settings sub-view back → close backpack → close Farm data → close shop → if pause open, **Resume**, else open **Pause** (Resume, Settings stub with version + 💾 note, Quit with confirm). World updates skip while pause is open; `clearHeldInputKeys` on resume so movement keys do not stick.
- **Save / data UI:** “Farm data” (💾) in the top bar opens a modal: **export** `garden3d_save.json`, **import** JSON (validates, writes `localStorage`, reloads), **reset farm** (clears key, `confirm`, reload). `anyModalOpen()` (shop or data) blocks canvas / wheel / movement like the market. **`persistence`:** `mergeImportedJson`, `clearSaveStorageOnly`.
- **Balance:** `STATE.timeScale` default `0.1` → `0.12` (slightly faster in-game days).
- **NPCs:** `NPCManager` now assigns random names, biases wander targets toward map POIs, and runs optional **proximity barks** (toasts) when the player is near a villager; global 12s cooldown. Dev-only console log on spawn. `update(dt, timeMs, { playerPos, onBark })` from `main.ts`.
- **Player / camera systems:** `src/systems/playerMovement.ts` (WASD, sprint, blockers, limbs) and `src/systems/followCamera.ts` (arrow pan + follow zoom). World bounds helper `src/config/worldConfig.ts`; camera tuning `src/config/cameraConfig.ts`.
- **Persistence:** `src/save/persistence.ts` — `localStorage` key `garden3d_save_v1`, `GameSaveV1` now includes player position/rotation, camera pan, zoom, crops. Autosave every ~20s and on `beforeunload`; boot-time load + `rehydrateCropsFromSave` in `src/main.ts`.
- **Dev counters:** `src/dev/devCounters.ts` — `window.__garden3dStats` in dev (Vite) for basic action counts. `tsconfig` includes Vite client types for `import.meta.env`.
- **Tomato** as third seed type (balanced between carrot and flower: grow time, sell price, shop cost); five-slot hotbar (keys 1–5, wheel wrap).
- Modular files: `src/state/gameState.ts`, `src/config/gameConstants.ts`, `src/save/saveFormat.ts` (versioned save shape for future load/save).
- `DOCS/SMOKE_TEST.md` manual regression checklist (canvas vs UI clicks, tools, shop).
- Project documentation structure.
- Initial thoughts and architecture plan.
- Git configuration and project overview (README, .gitignore, STYLE_GUIDE).

### Changed
- **World art / land:** Farm perimeter walls and surrounding land composition were rebuilt so the edge reads like a real boundary instead of a flat box; raised crop beds now define the playable planting area, with orchard/scarecrow dressing around the farm.
- **Update modal:** startup changelog copy now mentions the new area-travel/world pass.
- `BeehiveManager`: pass animation time into bee particle jitter (fixes bad `now` reference).
- In-game update modal copy updated for tomato + module split; README links smoke-test doc.
- `DOCS/ROADMAP.md` baseline and Phase 1 checkboxes amended to match current build state.

### Changed
- Improved `README.md` layout for cleaner GitHub presentation.
- Added clearer quick-start instructions for new contributors.
- Appended GitHub-friendly links in `DOCS/SUMMARY.md` to replace local machine path reliance.

### Noted
- Production build check currently fails due TypeScript errors in `src/main.ts`; dev server still starts successfully.

### Changed
- Fixed movement/input-related scope issues in `src/main.ts` that affected gameplay reliability.
- Added camera panning with arrow keys while preserving player-follow behavior.
- Added player world-position clamping to keep navigation inside the playable area.
- Expanded perimeter presentation with low border walls and lantern details.
- Added hedge/rock edge blockers with soft collision pushback for more natural outer bounds.

### Noted
- Production build now passes (`npm run build`) after TypeScript fixes.

### Changed
- Updated in-game update modal content in `src/main.ts` to reflect current build improvements.
- Synced modal version label to `0.1.0` to match `package.json`.
- Added beginner-friendly controls note to modal content for quicker onboarding.

### Documentation
- Synced `DOCS/SUMMARY.md` with version/update-modal workflow notes.

### Added
- Added contextual interaction hint UI near the hotbar that previews what Space/click will do on the currently targeted tile.

### Changed
- Mouse interaction timing now resolves against current-frame grid targeting, fixing delayed/behind action feedback.
- Expanded `DOCS/ROADMAP.md` with prioritized systems (durability/repair, soil fertility, quests, cooking buffs, reputation) and beginner UX upgrades.

### Documentation
- Synced docs for the new interaction hint UX and roadmap expansion in `DOCS/FEATURES.md` and `DOCS/SUMMARY.md`.

### Documentation
- Updated `DOCS/SBOM.md` with a fresh installed-version audit snapshot (2026-04-22).
- Updated `DOCS/SUMMARY.md` to explicitly mark `0.1.0` as the current version and record security audit status.

### Changed
- **HUD / UI:** In-game **keyboard hint** strip (`kbd` style), **version badge** (`v` + `APP_VERSION`), **day/night icon** next to the clock, **shop** overlay uses `visibility` + `aria-hidden` when closed; **buy** buttons disable when gold is below price (styled `:disabled`).

### Fixed
- `src/style.css`: **`@keyframes shake`** is properly closed (previously the harvest-tip pulse rules were nested inside the keyframes block, which broke animation/CSS parsing).

### Documentation
- `README.md`: expanded feature list, added **Controls** table, slightly richer project structure blurb.
- `DOCS/SUMMARY.md`, `DOCS/SCRATCHPAD.md`, `DOCS/FEATURES.md`: appended notes for the HUD polish + README pass (2026-04-22).

### Added
- **NPC talk loop:** nearest villager now exposes a **`F` talk** prompt, enters a short talk state, faces the player, shows a world-space speech bubble, and emits a dialogue toast.
- **NPC 3D UI:** new `src/entities/npcVisuals.ts` helpers for name labels, speech bubbles, and focus rings; villagers also gained stronger silhouette props (hair, trim, ground shadow).
- **Dialogue context:** new `src/entities/npcDialogue.ts` picks simple lines from time-of-day and nearby town POIs; repeat conversations build lightweight affinity.

### Changed
- HUD interaction hint now prioritizes nearby villager prompts over tile-action copy when an NPC is in talk range.
- In-game controls/help text now documents **`F`** for neighbor interaction.

### Documentation
- Synced `DOCS/SCRATCHPAD.md`, `DOCS/SUMMARY.md`, and `DOCS/SMOKE_TEST.md` for the new NPC interaction flow.
