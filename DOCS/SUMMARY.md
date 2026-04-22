<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SUMMARY

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
- [SCRATCHPAD](./SCRATCHPAD.md)
- [ARCHITECTURE](./ARCHITECTURE.md)
- [CHANGELOG](./CHANGELOG.md)
- [STYLE GUIDE](./STYLE_GUIDE.md)
- [SBOM](./SBOM.md)

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
