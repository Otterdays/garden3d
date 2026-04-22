<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
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
