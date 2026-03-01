# RL

A browser-based top-down action RPG built with Phaser 3. You play as a fresh recruit at an adventurers' guild — your job is to invade monster dwellings, slay every creature inside, collect their trophies, and trade them in for gold and reputation.

> *Each dungeon room belongs to something. You take it from them.*

---

## Features

- **Real-time combat** — left-click to attack toward your cursor with directional arc hit detection, right-click to move
- **Equipment system** — six equipment slots with layered character rendering; each piece of gear visually appears on the player sprite with synchronized animations
- **Inventory & shop** — 24-slot bag with equip/drop/buy flows and triple-click confirmation on destructive actions
- **Stat engine** — primary stats (Strength, Dexterity, Vitality) drive derived combat values including crit chance, dodge, attack speed, and damage — all with caps and floors
- **Enemy AI** — enemies chase and attack the player with separation steering to prevent stacking
- **Combat feedback** — hit particles, impact flash, camera shake, and pause frames on every landed hit

---

## Tech Stack

| | |
|---|---|
| Language | JavaScript (ES Modules) |
| Framework | [Phaser 3](https://phaser.io/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Maps | [Tiled](https://www.mapeditor.org/) `.tmj` format |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev
```

Then open `http://localhost:5173` in your browser.

**Controls:**
- `Right-click` — move to position
- `Left-click` — attack toward cursor
- `I` — open inventory
- `P` — open shop
- `ESC` — close all windows

---

## Project Structure

```
src/
├── entities/       # Player, Enemy
├── systems/        # Inventory, Shop, StatEngine, GameActions
├── ui/             # Panels, WindowManager, SelectionBorder
├── pipelines/      # Scene lifecycle (load, create, input, keybinds)
├── data/           # Armory item catalog
├── maps/           # Map definitions and MapManager
└── config/         # Constants and utilities
```

---

## Status

Active development — core combat, inventory, equipment, and shop systems are functional. Level management and dungeon progression are in progress.
