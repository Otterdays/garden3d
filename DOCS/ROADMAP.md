<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# ROADMAP

## Goal
Build Garden3D from a playable prototype into a polished, cozy gardening game with clear progression, stable systems, and clean architecture.

## Current Baseline
- A playable prototype exists with movement, farming interactions, HUD, NPC wandering, and shop/economy foundations.
- Dev server is healthy.
- Production build needs TypeScript cleanup in `src/main.ts` before release readiness.

## Phase 1 - Stabilize Core (Now)
Focus: reliability and maintainability.

- Fix TypeScript build errors so `npm run build` passes consistently
- Split large logic blocks from `src/main.ts` into focused modules
- Add a minimal smoke-test checklist for core loops (move, plant, harvest, shop)
- Ensure documentation stays in sync for every system-level change

## Phase 2 - Deepen Gameplay
Focus: make the loop engaging over longer play sessions.

- Add multiple crop categories with varied growth and value curves
- Expand economy rules (seed costs, sell prices, balancing pass)
- Add inventory depth (stacking, limits, clearer item feedback)
- Add simple progression goals (daily targets, unlocks, milestones)

## Phase 3 - World and NPC Expansion
Focus: make the world feel alive.

- Introduce NPC schedules (morning/day/evening routines)
- Add interaction prompts for NPC dialogue and simple requests
- Expand map points of interest and biome variation
- Improve environmental storytelling with props and ambient events

## Phase 4 - Player Experience Polish
Focus: smooth, friendly, and beginner-accessible experience.

- Add first-time tutorial flow and contextual hints
- Improve UX consistency across HUD, modals, and feedback messages
- Improve animation, sound layering, and camera feel
- Add accessibility pass (readability, contrast, key rebinding planning)

## Phase 5 - Release Preparation
Focus: quality and shareability.

- Finalize performance passes (frame pacing, draw call control)
- Complete balancing pass for economy and progression
- Add release notes and update changelog discipline
- Prepare public repo essentials (license, contribution guide, issue templates)

## Success Criteria
- Build passes with zero TypeScript errors
- New player can understand and complete the basic loop without external help
- Core systems are split into maintainable modules
- Gameplay loop is fun for at least a short repeat session (10-20 minutes)

## Immediate Next 3 Tasks
1. Resolve current TypeScript build issues in `src/main.ts`.
2. Extract one subsystem from `src/main.ts` (recommended: input or inventory handling).
3. Add one new crop type with tuned economy values and document it.
