<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SBOM (Software Bill of Materials)

## Production Dependencies
| Package | Version | Purpose | Audit Date |
|---------|---------|---------|------------|
| three | ^0.184.0 | Core 3D engine | 2026-04-19 |

## Dev Dependencies
| Package | Version | Purpose | Audit Date |
|---------|---------|---------|------------|
| Vite | ^8.0.8 | Build tool | 2026-04-19 |
| TypeScript | ^6.0.3 | Language | 2026-04-19 |
| @types/three | ^0.184.0 | TypeScript definitions | 2026-04-19 |

## Audit Snapshot (2026-04-22)

### Effective Installed Versions
| Package | Installed Version | Scope | Notes |
|---------|-------------------|-------|-------|
| three | 0.184.0 | Production | Matches manifest range `^0.184.0` |
| vite | 8.0.8 | Development | Matches manifest range `^8.0.8` |
| typescript | 6.0.3 | Development | Matches manifest range `^6.0.3` |
| @types/three | 0.184.0 | Development | Matches manifest range `^0.184.0` |

### Audit Result
- Command: `npm audit --omit=dev`
- Result: `found 0 vulnerabilities`

### Notes
- `npm ls` reports several unmet **optional** dependencies under Vite/Rolldown for non-Windows targets and optional features. This is expected and not an active runtime failure for this project.
