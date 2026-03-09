# Game Design Document
*Early Prototype — Subject to Change*

---

## 1. Concept

A top-down action RPG where you play as a recruit at an adventurers' guild. Dungeons are not random — each is the dwelling of a specific monster type. You invade their home, clear every creature, collect trophies, and return to the guild to cash in.

**Feel reference:** Slow, weighty melee combat in the spirit of Diablo II — every hit lands with impact. Enemy density and threat escalation inspired by Vampire Survivors.

> *Each room belongs to something. You take it from them.*

---

## 2. Core Loop

```
GUILD HUB → ENTER DUNGEON → CLEAR ROOMS → COLLECT TROPHIES → RETURN TO GUILD
```

| Step | Description |
|------|-------------|
| Guild Hub | Buy gear, sell trophies, check reputation standing |
| Enter Dungeon | Choose a dungeon tier that matches your reputation rank |
| Clear Rooms | Fight through themed rooms, each belonging to one monster type |
| Collect Trophies | Enemies drop mob-specific items on death |
| Survive or Retreat | Die = drop trophies. Retreat = keep everything |
| Return to Guild | Trade trophies for gold + reputation, restock, upgrade |

### Death & Risk

- Dying drops all trophies at the death location
- Player respawns at the guild with gear intact, trophies lost
- Retreating preserves everything — it is always a valid choice
- Core tension: **push deeper, or bank what you have**

---

## 3. World Structure

### Guild Hub *(to build)*

The hub is a safe medieval adventurers' hall — no enemies, always accessible.

| Location | Function |
|----------|----------|
| Quest Board | Lists available dungeons by tier |
| Trophy Trader | Buys mob drops for gold + reputation |
| Armory Shop | Sells weapons and armor; stock gated by reputation tier |
| Storage Chest | Expanded inventory for items you don't want to risk |
| Guild Ledger | Lifetime stats: kills, dungeons cleared, trophies traded |

### Dungeon Structure

A dungeon is a linear sequence of levels. Each level is the dwelling of one monster type. The boss of that dwelling guards the exit to the next level.

```
HUB → [Level 1: Goblin Den] → [Level 2: Ratman Warren] → [Level 3: ...] → HUB
```

| Room Type | Description |
|-----------|-------------|
| Dwelling Rooms | Standard + elite enemies of that level's monster type |
| Boss Room | Locked until all standard/elite enemies are dead |
| Exit | Unlocks on boss death. Leads to next level or back to hub |

---

## 4. Combat

### Controls

| Input | Action |
|-------|--------|
| Left-click | Attack toward cursor |
| Right-click | Move to position |

### Hit Detection

- Attacks use **directional arc geometry** — not radius circles
- Three arc types: stab (45°), medium (135°), wide (225°)
- Arc type is determined by equipped weapon
- Hit detection fires on animation complete, not on input

### Combat Feel

- **Weighty and slow** — animations play fully before the next action
- **Hit pause** — physics and animations freeze briefly on a landed hit
- **Camera shake** on impact
- **White flash** on struck entity (`setTintFill`)
- **Knockback** on hit
- **Invincibility frames** after taking damage (prevents one-shot swarming)

### Guard & Stamina

- Guard absorbs incoming hits
- Guard breaking triggers a stagger animation (`ko_diag`)
- Stamina governs attack and guard capacity

---

## 5. Player Systems

### Stats

Stats flow through a single pipeline:

```
baseStats → StatEngine (pure function) → gearStats → derivedStats
```

Primary stats drive derived combat values including damage, crit chance, dodge, attack speed, and resistances — all with caps and floors.

### Equipment

- **10 slots:** head, shoulder, hands, body_inner, body_outer, legs, feet, amulet, primary, secondary
- Each piece of gear **visually appears on the player sprite** as a layered overlay with synchronized animations
- Equipment spritesheets are lazy-loaded at equip/buy time

### Inventory

- 24 bag slots
- Trophies and gear share bag space — managing space is part of the loop
- Triple-click confirmation on equip and drop actions

### Progression *(to build)*

- Stat points allocated on level up
- Character builds differentiated by loadout and stat allocation
- Skill trees planned for later phases

---

## 6. Enemies

### Current

| Enemy | Status |
|-------|--------|
| Goblin | Implemented — full AI with personality traits |

### Planned Roster

24 monster types available as sprite assets, organized by dungeon tier:

| Tier | Dungeons |
|------|----------|
| 1 — Rookie | Goblin Den, Ratman Warren, Kobold Burrow |
| 2 — Adventurer | Gnoll Camp, Gremlin Nest, Slime Grotto |
| 3 — Veteran | Bugbear Hold, Ogre Pit, Minotaur Maze |
| 4 — Champion | Golem Chamber, Flayer Shrine, Howler Den |
| 5 — Legend | Dragon Lair, Balron Sanctum, Phoenix Crater |

### AI Behaviors

| Behavior | Description |
|----------|-------------|
| Melee | Chases player until in attack range |
| Ranged | Maintains distance, fires projectiles |
| Patrol | Fixed path until aggroed |
| Swarm | Calls nearby same-type enemies on aggro |
| Special | Unique per enemy type (howl, charge, split, etc.) |

### Goblin Personality (implemented)

- Speed variance per individual
- Attack hesitation
- Lunge behavior
- Flanking with coil
- Separation steering — no physics colliders between enemies, preventing unnatural stacking

---

## 7. Economy & Progression

### Currency

**Gold** — earned by selling trophies. Spent at the Armory Shop.

### Reputation

Earned by trading trophies and clearing dungeons. Gates access to higher-tier dungeons and better shop inventory.

| Tier | Reputation Required |
|------|-------------------|
| 1 — Rookie | 0 |
| 2 — Adventurer | 500 |
| 3 — Veteran | 2,000 |
| 4 — Champion | 6,000 |
| 5 — Legend | 15,000 |

### Trophy System *(to build)*

Every enemy type drops a unique trophy with a gold value and a reputation value when traded in.

- **Standard drop** — common, low value
- **Elite drop** — uncommon, moderate value
- **Boss drop** — rare, high value, may unlock shop items

---

## 8. Level System *(to build)*

The current `SpawnManager` (prototype interval spawner) will be replaced by a `LevelManager`:

- Loads enemy placements from Tiled object layer (`enemy_spawns`)
- Activates enemies on level entry
- Tracks kill count
- Locks boss room until all standard/elite enemies are dead
- Unlocks exit on boss death
- Handles level transition

### Tiled Map Structure

Each dungeon is one `.tmj` file.

**Tile layers:** `bot`, `fix`, `top` (visual depth layering)
**Object layers:** `collusion` (collision), `enemy_spawns`, `room_triggers`, `exits`

---

## 9. Roadmap

### ✅ Phase 1 — Combat Foundation
- Player attack with directional arc hit detection
- Enemy entity (Goblin) with idle / chase / attack / dead state machine
- Hit pause, camera shake, knockback, white flash, invincibility frames
- Guard / stamina system
- Stat engine (baseStats → StatEngine → derivedStats)
- Equipment system with visual overlays
- Inventory (24 slots) + shop with triple-click confirmation
- HUD (HP / Stamina / Mana orbs, guard overlay, gold display)
- Image-based map with Tiled collision

### Phase 2 — Level System
- Replace SpawnManager with LevelManager
- Tiled object layer: enemy spawn points with type + variant properties
- Kill counter HUD
- Boss room lock / unlock flow
- Level transition (load next map or return to hub)

### Phase 3 — Loot & Drops
- Trophy item definitions
- Enemy death spawns trophy on ground
- Pickup radius / auto-collect
- Bag space management

### Phase 4 — Guild Hub
- Hub map with NPCs
- Trophy Trader — sell for gold + reputation
- Reputation system with tier gating
- Persistent gold and reputation across runs

### Phase 5 — More Enemies
- Second enemy type (Kobold — ranged, tests projectile system)
- Projectile system
- Patrol AI
- Roll out roster by tier

### Phase 6 — Boss Fights
- Boss variant per enemy type
- Multi-phase health bar HUD
- Special abilities
- Unique trophy drop

### Phase 7 — Character Builds
- Stat point allocation on level up
- Skill trees

---

## 10. Open Questions

- Is death permanent (permadeath) or just trophy loss?
- Does the player have a class, or is loadout the only differentiation?
- Are dungeons procedurally connected or hand-authored per tier?
- Final deployment target (browser, desktop, mobile)?
- Game title — pending story/lore development

---

*Living document. Update as decisions are made.*
