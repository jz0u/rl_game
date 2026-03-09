# [Untitled ARPG]

A top-down action RPG built with Phaser 3. You play as a recruit at an adventurers' guild. Dungeons are the dwellings of specific monster types — you invade their home, clear every creature, collect trophies, and return to the guild to trade them in.

> *Each room belongs to something. You take it from them.*

**Status:** Early prototype. Core combat, stat, and equipment systems are functional. Dungeon progression is next.

---

## Gameplay

- **Weighty melee combat** — directional arc hit detection, hit pause, camera shake, and knockback on every landed hit
- **Deep stat engine** — primary stats drive all derived values (damage, crit, dodge, speed, resistances) through a single pure-function pipeline
- **Equipment with visual overlays** — gear appears on the player sprite as layered animations, synced frame-by-frame
- **Inventory & shop** — 24-slot bag, 10 equipment slots, paginated shop with triple-click confirmation on all committing actions
- **Enemy AI** — chase, attack, and death states with separation steering to prevent enemy stacking
- **HUD** — HP, Stamina, and Mana orbs with guard overlay and gold counter

---

## Tech Stack

| | |
|---|---|
| Language | JavaScript (ES Modules) |
| Framework | [Phaser 3](https://phaser.io/) |
| Build | [Vite](https://vitejs.dev/) |
| Maps | [Tiled](https://www.mapeditor.org/) `.tmj` |

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Controls

| Input | Action |
|-------|--------|
| Right-click | Move to position |
| Left-click | Attack toward cursor |
| `I` | Open inventory |
| `P` | Open shop |
| `ESC` | Close all windows |

---

## Project Structure

```
src/
├── entities/       # Character hierarchy (Knight, Goblin, EnemyAI, Character, Entity)
├── systems/        # Inventory, Shop, StatEngine, Bank, GameActions
├── effects/        # CombatEffects (particles, flash, shake)
├── ui/             # Panels, HUD, WindowManager, SelectionBorder
├── pipelines/      # Scene lifecycle (loadAssets, createGameObjects, input, keybinds)
├── data/           # Armory item catalog
├── maps/           # Map definitions + MapManager
└── config/         # Constants, utilities
```

See [`overview.md`](./overview.md) for a full breakdown of architecture and key design decisions.
See [`gdd.md`](./gdd.md) for game design, mechanics, and roadmap.

---

## Roadmap

- [x] Combat foundation — attack arcs, hit detection, hit pause, knockback, guard/stamina
- [x] Stat engine — baseStats → StatEngine → derivedStats pipeline
- [x] Equipment system — visual overlays with animation sync
- [x] Inventory & shop — 24 slots, equip/drop/buy with confirmation flows
- [x] Enemy AI — Goblin with chase/attack/death and personality traits
- [x] HUD — orbs, guard, gold
- [ ] **LevelManager** — replace SpawnManager with Tiled-driven progression
- [ ] Loot & trophy drops
- [ ] More enemy types
- [ ] Guild hub & NPCs
- [ ] Boss fights
- [ ] Character builds & skill trees

---


