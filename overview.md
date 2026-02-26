# Codebase Overview

## Stack and runtime
- **Phaser 3 + Vite** browser game prototype (`phaser`, `vite`).
- Single-scene architecture (`GameScene`) with modular "pipelines" for preload/create/input wiring.

## High-level flow
1. `src/main.js` boots Phaser and registers `GameScene`.
2. `preload()` delegates to `loadAssets()` to load player, UI, map, and item icons.
3. `create()` delegates to `createGameObjects()` and input/keybind setup.
4. `update()` delegates to `player.update()` each frame.

## Main modules

### Scene + pipelines
- `src/main.js`: entrypoint and Phaser config.
- `src/pipelines/loadAssets.js`: loads core textures, armory paperdolls/icons, and tilemap assets.
- `src/pipelines/createGameObjects.js`: creates map, player, systems, panels, and window manager.
- `src/pipelines/input.js`: mouse routing (RMB move, LMB attack), blocked while UI is active.
- `src/pipelines/keybinds.js`: window shortcuts (`I`, `P`, `ESC`).
- `src/pipelines/loadEquipmentAssets.js`: lazy-loads equipment spritesheets/animations at equip or buy time.

### Gameplay entities and systems
- `src/entities/Player.js`
  - owns the base player sprite and layered equipment overlays.
  - handles move target navigation, attack state, and animation sync.
- `src/systems/Inventory.js`
  - fixed-size slot inventory (`INVENTORY_SIZE = 24`) with slot maps/sets.
  - supports add/remove/equip/unequip with swap semantics.
- `src/systems/Shop.js`
  - transactional purchase: checks balance, then adds to inventory.

### UI layer
- `src/ui/BasePanel.js`: reusable full-screen panel scaffolding.
- `src/ui/ShopPanel.js`: paginated item browser + 3-click confirm purchase flow.
- `src/ui/InventoryPanel.js`: equipped slots + paginated bag + equip/drop actions.
- `src/ui/SelectionBorder.js`: reusable 3-stage confirmation border (buy/equip/drop themes).
- `src/ui/WindowManager.js`: circular doubly-linked list window cycling and close-all behavior.

### Content/config
- `src/data/Armory.js`: static item catalog, grouped by equipment slot.
- `src/maps/map1.js` + `src/maps/MapManager.js`: map definition and tilemap load/create logic.
- `src/config/constants.js`: screen sizing, UI geometry, inventory capacity, depths.
- `src/config/utils.js`: shared icon scaling helper.

## Important design patterns
- **Data-driven items**: Armory item schema drives shop UI, inventory, and dynamic sprite path generation.
- **Lazy sprite loading**: equipment sheets are loaded only when needed, reducing startup load.
- **Overlay animation mirroring**: equipment sprite animation keys are derived from base player anim keys.
- **Triple-click confirmations**: destructive/committing actions (buy/equip/drop) require staged confirmation.

## Current behavior summary
- Player can move and attack on map.
- Shop and inventory windows can be opened, paged, and cycled.
- Buying adds items to inventory if balance/space allow.
- Equipping updates both inventory state and visual overlays (with async asset loading support).
