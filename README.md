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

- Grid-based gardening interactions
- Dynamic world rendering with Three.js
- Early game-loop foundations for planting and harvesting
- UI interactions for core player actions

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

If this command fails, check TypeScript errors in `src/main.ts` first.

## Project Structure

```text
garden3d/
|- src/            # Game and rendering logic
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
- [Software Bill of Materials](DOCS/SBOM.md)

## Development Notes

- Keep gameplay logic modular as systems grow.
- Prefer small, testable utility functions over large monolithic blocks.
- Update docs whenever new mechanics or tooling are introduced.

## License

No license has been declared yet. Add a `LICENSE` file before public distribution.
