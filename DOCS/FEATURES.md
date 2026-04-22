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
- Shop modal for economy interactions
- Escape key modal closing
- Hotbar tooltips/labels
- Time fast-forward action (night skip)

### Entities and Systems
- Procedural player model foundation
- Modular NPC manager architecture
- NPC wandering behavior
- Global state and calendar logic

## Technical Features
- Vite-powered local development workflow
- TypeScript codebase
- Three.js rendering stack with WebGPU focus
- TSL-based shader logic for environmental effects

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
