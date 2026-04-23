<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Smoke Test Checklist

Quick manual pass after gameplay or input changes. Run `npm run dev`, then tick through in order.

## NPCs
- [ ] With **no other input**, wait until villagers appear (~10s cycles); they should path toward market / well / campfire / farm and eventually idle or leave.
- [ ] Walk **close to a villager** — a short **toast** line with their name can appear (not every frame; long cooldown if you just saw one).
- [ ] Walk near the closest villager — the bottom-center hint should switch from tile text to **`Press F to talk to <name>.`**
- [ ] Press **`F`** near a villager — they should face the player, show a speech bubble above their head, and send the same line to a toast.
- [ ] While talking, the nearest villager should show a focus ring; with no villager nearby, the hint should return to farming/tool guidance.

## Save & data
- [ ] Open **💾 Farm data** — modal appears; **Escape** closes; game input pauses (no accidental plant) while open.
- [ ] **Export** downloads a JSON; **Import** a valid file reloads and restores state; **Reset** with confirm clears save and reloads (fresh or default new game).

## Pause and backpack
- [ ] Press **`E`** — Backpack panel opens; counts match HUD; **`E` again** or **✖** closes. With backpack open, **canvas** does not place plants; with pause open, movement/wheel are blocked.
- [ ] Press **`Esc`** with nothing else open — **Pause** appears; in-game time and NPCs stop. **Resume** or **`Esc`** returns to play; held keys do not strafe on resume.
- [ ] In pause, open **Settings** — stub text and version; **Back** returns to main pause. **Quit** shows confirm; cancel stays in game.

## Core loop
- [ ] WASD moves the character; release keys and character stops.
- [ ] Mouse over ground: tile highlight follows cursor; interaction hint updates.
- [ ] **Click canvas only** on an empty tile with a seed selected: plants one seed; quantity decreases.
- [ ] **Click hotbar** (carrot, flower, tomato, water, harvest): slot highlights; **no** accidental plant/harvest on that click.
- [ ] Select **Water**, click a planted tile (near crop): water applies; can empties; refill at well in range.
- [ ] **Harvest** a ready crop: gold increases; tile clears.
- [ ] `B` near market opens shop; away from market shows distance warning. `Escape` closes.

## Tools and economy
- [ ] Number keys `1`–`5` select the five hotbar tools in order.
- [ ] Mouse wheel (without Shift) cycles tools without skipping slots.
- [ ] Shift + wheel changes zoom; arrow keys still pan camera.
- [ ] Buy each seed type at the stall: gold and inventory counts update (including tomato).

## Time and UI
- [ ] Night **Skip** button appears in late night / early hours; using it advances day and resets “watered” state message makes sense.
- [ ] Changelog / update modal does not break pointer flow after close.

- [ ] **Save / load:** plant something, move away, **refresh the page** — crops, gold, position, and time should restore (localStorage `garden3d_save_v1`).

**Last reviewed:** 2026-04-23 — added NPC talk (`F`) prompt / bubble / focus ring checks.
