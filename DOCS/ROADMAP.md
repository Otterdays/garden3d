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
1. Resolve current TypeScript build issues in `src/main.ts`.
2. Extract one subsystem from `src/main.ts` (recommended: input or inventory handling).
3. Add one new crop type with tuned economy values and document it.

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
