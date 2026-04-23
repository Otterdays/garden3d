# Garden3D

Garden3D is a cozy 3D gardening prototype built with Vite, Three.js (WebGPU), and TypeScript.

## Contributor Rules (Required)

Before making changes, read `AGENTS.md`.

- Version control policy is strict: stay on the pinned/specific version unless the user explicitly requests a version change.
- Any version/update-flow change must include update modal updates.
- Update modal changes must be reflected in docs in the same task.
- Update log history must not be deleted or overwritten; preserve history and only edit entries in place or append new notes.

## Overview

This project explores a relaxing, game-like sandbox where the player can plant, manage, and grow a small digital garden in a stylized 3D world.

## Current Features

- Grid-based gardening interactions (multiple seed types: carrot, flower, tomato)
- Dynamic world rendering with **Three.js** and **WebGPU**
- Day/night-style lighting, camera follow, and a small open town-style play space
- Planting, watering, harvest, and economy loop (market stall shop)
- **HUD:** wallet, day/time with a day/night indicator, tool hotbar with quantities, toasts, interaction hint, **in-game keyboard hints** (desktop + a compact line on small screens), and a **version badge** tied to `APP_VERSION` in `src/config/gameConstants.ts`
- **Shop:** seed purchases with buttons **disabled** when you cannot afford the price; open with `B` near the stall (see in-game **Update log** on first run for the full control list)
- Styling lives mainly in `src/style.css` (glass panels, hotbar, modals, responsive tweaks)

## Tech Stack

- `TypeScript`
- `Vite`
- `Three.js` with `WebGPU` support
- Browser-based runtime

## Quick Start

### Requirements

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

By default, Vite serves the app at `http://localhost:5173/`.

### Build for Production

```bash
npm run build
```

If this command fails, run `npx tsc --noEmit` and fix reported sources (often `src/main.ts` or `src/entities/`).

## Controls (in-game)

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| `Shift` | Sprint |
| `Arrow keys` | Pan camera |
| `Shift` + mouse wheel | Zoom |
| `1`–`5` | Select hotbar tool |
| Mouse wheel | Cycle hotbar |
| `Space` | Use tool on targeted tile |
| `B` | Toggle shop (when near the market stall) |
| `E` | Toggle Backpack (gold + supply counts) |
| `Escape` | Pause (Resume / Settings / Quit), or close modals in stack order (shop, data, inventory) |

## Project Structure

```text
garden3d/
|- src/            # Game and rendering logic (`main.ts`, `state/`, `config/`, …)
|- DOCS/           # Project documentation
|- index.html      # App entry HTML
|- package.json    # Scripts and dependencies
|- README.md       # Repository overview
```

## Documentation

- [Project Summary](DOCS/SUMMARY.md)
- [Features](DOCS/FEATURES.md)
- [Roadmap](DOCS/ROADMAP.md)
- [Architecture Notes](DOCS/ARCHITECTURE.md)
- [Style Guide](DOCS/STYLE_GUIDE.md)
- [Scratchpad](DOCS/SCRATCHPAD.md)
- [Changelog](DOCS/CHANGELOG.md)
- [Smoke test checklist](DOCS/SMOKE_TEST.md)
- [Software Bill of Materials](DOCS/SBOM.md)

## Development Notes

- Keep gameplay logic modular as systems grow.
- Prefer small, testable utility functions over large monolithic blocks.
- Update docs whenever new mechanics or tooling are introduced.

## License

No license has been declared yet. Add a `LICENSE` file before public distribution.
