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
- Project documentation structure.
- Initial thoughts and architecture plan.
- Git configuration and project overview (README, .gitignore, STYLE_GUIDE).

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
