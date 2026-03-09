# Codebase Overview

*Early prototype. Architecture is intentionally modular to support rapid iteration.*

---

## Stack

| | |
|---|---|
| Language | JavaScript (ES Modules) |
| Framework | Phaser 3 |
| Build tool | Vite |
| Maps | Tiled (`.tmj` JSON export) |

---

## Entry Point & Scene Lifecycle

```
src/main.js
  └── GameScene
        ├── preload()  → loadAssets()
        ├── create()   → createGameObjects() + input/keybind wiring
        └── update()   → player.update()
```

Everything boots from a single scene (`GameScene`). Scene logic is broken into pipeline modules to keep `main.js` thin.

---

## Directory Structure

```
src/
├── entities/         # Living game objects (characters, enemies)
├── systems/          # Core game logic (inventory, shop, stats, actions)
├── effects/          # Visual feedback (particles, flash, shake)
├── ui/               # All panels, HUD, and window management
├── pipelines/        # Scene lifecycle hooks (load, create, input, keybinds)
├── data/             # Static content (item catalog)
├── maps/             # Map definitions and loader
├── config/           # Constants and shared utilities
└── main.js           # Phaser boot + GameScene
```

---

## Pipelines

Scene lifecycle logic lives in `src/pipelines/` to keep `GameScene` clean.

| File | Responsibility |
|------|---------------|
| `loadAssets.js` | Loads player sprites, UI textures, HUD images, map tilesets, and all item icons/overlays from the Armory |
| `loadPlayerAssets.js` | Loads player spritesheets specifically |
| `loadEquipmentAssets.js` | Lazy-loads equipment spritesheets and registers animations at equip or buy time — not at startup |
| `createGameObjects.js` | Instantiates map, player, systems, panels, and WindowManager |
| `input.js` | Routes mouse input: RMB → move, LMB → attack. Blocked while any UI panel is open |
| `keybinds.js` | Keyboard shortcuts: `I` inventory, `P` shop, `ESC` close all |

---

## Entity Hierarchy

All living game objects extend a shared base:

```
Entity
  └── Character
        ├── Knight   (playable)
        └── Goblin   (enemy, extends EnemyAI)
```

- **No Player/Enemy class split.** The `playable` flag on `Character` determines whether input drives movement.
- This keeps all combat logic — hit detection, damage, knockback, guard — unified in one place.

### Entity (`src/entities/Entity.js`)
Base class. Owns stats, `takeDamage()`, `heal()`, `isDead()`, `onDeath()`.

### Character (`src/entities/Character.js`)
Extends Entity. Adds:
- Phaser physics sprite + hitbox
- `moveTo(x, y)` / `update()` movement loop
- `attack(angle)` with arc visualisation
- `canHit(target)` — arc geometry hit detection (stab / medium / wide)
- `animationcomplete` handler that runs hit detection against `this.targets()`
- Health bar, damage number display

### Knight (`src/entities/Knight.js`)
The player character. Extends Character with `playable: true`. Owns the base sprite and all equipment overlay sprites.

### EnemyAI (`src/entities/EnemyAI.js`)
Extends Character. Provides the state machine (`idle → chase → attack → dead`) with `_onIdle`, `_onChase`, `_onAttack` hooks for subclasses.

### Goblin (`src/entities/Goblin.js`)
Extends EnemyAI. Implements personality traits: speed variance, attack hesitation, lunge, and flanking with coil behavior. Goblin-specific logic stays in this file only.

---

## Systems

| File | Responsibility |
|------|---------------|
| `StatEngine.js` | Pure function. Takes `baseStats` + gear stats, returns `derivedStats`. No side effects. |
| `Inventory.js` | Fixed 24-slot inventory. Handles add / remove / equip / unequip with swap semantics. |
| `Shop.js` | Transactional purchase flow: checks gold balance, then calls `Inventory.add()`. |
| `GameActions.js` | Centralized action dispatch layer. All UI-triggered state changes go through here. |
| `Bank.js` | Tracks the player's gold. |

### Stat Pipeline

```
baseStats.js  →  StatEngine.js (pure)  →  gearStats.js  →  derivedStats (on entity)
```

Hardcoded stat values in entity constructors are a known bug source. Everything should route through this pipeline.

---

## UI

All panels extend `BasePanel`. The `WindowManager` handles open/close/cycle behavior across all panels.

| File | Responsibility |
|------|---------------|
| `BasePanel.js` | Full-screen panel scaffolding, show/hide, container management |
| `InventoryPanel.js` | Paperdoll + equipment slots (10) + 24-slot bag grid. Equip/drop with triple-click confirm. |
| `ShopPanel.js` | Paginated item browser. Buy flow with 3-stage confirmation border. |
| `SelectionBorder.js` | Reusable 3-stage confirmation border. Themes: buy (gold), equip (blue), drop (red). |
| `WindowManager.js` | Circular doubly-linked list. Handles window cycling and close-all. |
| `HUD.js` | Three stacked orbs (HP / Stamina / Mana) with bottom-to-top mask fill. Guard orb layered over HP orb. Gold display. |

---

## Data & Content

### Armory (`src/data/Armory.js`)

Static catalog of all equippable items, grouped by slot. 56+ items across 10 slots.

Each item defines: `id`, `displayName`, `equipSlot`, `itemType`, `baseName`, `iconPath`, `overlayPath`, `stats`, `value`, `description`.

The `baseName` drives dynamic asset path construction for spritesheets and paperdoll overlays. This is the single source of truth for all item data.

### Map System

| File | Responsibility |
|------|---------------|
| `src/maps/goblin1.js` | Map definition: key, tilemap path, tilesets, spawn config |
| `src/maps/MapManager.js` | Loads and creates the Tiled map in the scene; sets up collision and depth layers |

Map layers: `bot` (depth 0), `fix` (depth 5), `top` (depth 20). Player renders at depth 10 — between `fix` and `top` — for depth illusion.

Maps use Midjourney-generated 2048×2048 art as the base image, not a traditional tileset.

---

## Key Patterns & Decisions

**Separation steering, no physics colliders between enemies.**
Enemies use steering forces to spread around the player. Physics colliders between enemies cause unnatural blocking and were removed intentionally.

**`setTintFill` not `setTint` for white flash.**
`setTint(0xffffff)` is a no-op — white × sprite color = sprite color. `setTintFill` replaces all color channels entirely.

**Lazy equipment loading.**
Equipment spritesheets are only loaded when a player equips or buys an item. This keeps startup time low as the item catalog grows.

**Triple-click confirmations.**
All destructive or committing actions (buy, equip, drop) require three staged clicks. `SelectionBorder` handles the visual state.

**`.tmj` not `.tmx`.**
Phaser requires the JSON export from Tiled. XML (`.tmx`) is not supported.

**Depth sorting is manual.**
Phaser renders in creation order by default. Overhead layers, player, and UI depths are all set explicitly.

---

## What's Working

- Player moves and attacks on the Goblin Den map
- Goblin AI: idle, chase, attack, death
- Full combat feedback: hit pause, camera shake, knockback, white flash, damage numbers
- Guard and stamina system
- Stat engine with gear-derived values
- Equipment system with visual overlays and synchronized animations
- 24-slot inventory with equip/drop flows
- Shop with paginated browsing and purchase confirmation
- HUD: HP/Stamina/Mana orbs, guard overlay, gold counter
- WindowManager: open, close, cycle panels

## What's Next

- `LevelManager` — replace prototype SpawnManager with Tiled-driven spawn system
- Loot and trophy drops
- More enemy types
- Guild hub map and NPCs
- Boss fights
- Character progression (stat points, skill trees)
