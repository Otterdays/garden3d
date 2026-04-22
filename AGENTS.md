# AGENTS Guide

This project should be maintained with beginner-friendly, game-dev-oriented changes. Prefer simple, clear implementations over clever abstractions.

## Core Rules

- Explain changes in plain language a new developer can follow.
- Keep features practical for a small game project: readable code, predictable behavior, and easy debugging.
- Do not introduce unnecessary complexity or hidden magic.

## Version Control Policy (Critical)

- Stay on the current pinned/specific version by default.
- Do **not** bump, downgrade, or migrate versions unless the user explicitly asks for a version change.
- If a task could imply a version change, ask first and wait for explicit confirmation.
- When a version change is explicitly requested, document exactly what changed and why.

## Update Modal + Docs Sync (Critical)

- Any change that affects app versioning or update behavior must include an update to the update modal content/logic.
- Any change to the update modal must be reflected in project docs in the same task.
- Keep version labels/messages in the modal accurate and aligned with the actual pinned version.
- Never leave update modal messaging stale after version-related edits.

## Documentation Expectations

- Update docs whenever behavior, UX text, or version workflow changes.
- Keep docs concise and actionable for new contributors.
- Prefer step-by-step instructions when describing release/update behavior.
