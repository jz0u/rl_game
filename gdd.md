### Game Design Document
*Version 0.1 — 2026*

> **Core Fantasy:** You are an exterminator for hire. Each dungeon room belongs to something. You take it from them.

An adventurers' guild ARPG where you descend into monster dwellings, slay creatures in their own homes, and trade trophies for coins and reputation.

---

## Table of Contents
1. [Game Concept](#1-game-concept)
2. [Core Game Loop](#2-core-game-loop)
3. [World Structure](#3-world-structure)
4. [Enemies](#4-enemies)
5. [Player Systems](#5-player-systems)
6. [Economy & Progression](#6-economy--progression)
7. [Room & Dungeon System](#7-room--dungeon-system)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Open Questions](#9-open-questions)

---

## 1. Game Concept

RL is a top-down Diablo-style ARPG. The player is a fresh recruit at an adventurers' guild. Dungeons are not random — each room is the dwelling of a specific monster type. You invade their home, clear every creature, collect trophies, and return to the guild to cash in.

### 1.1 Pillars

- **Rooms feel alive** — each is the home of a specific creature, decorated accordingly
- **Clearing is rewarding** — kill count is visible, exit unlocks on completion
- **Economy is tight** — trophies have weight, bag space matters, return trips are decisions
- **Progression is earned** — reputation gates harder dungeons, not just player level

---

## 2. Core Game Loop

| Step | Description |
|------|-------------|
| **GUILD HUB** | Check quest board, buy gear, sell trophies, collect reputation |
| **ENTER DUNGEON** | Choose a dungeon tier matching your reputation rank |
| **CLEAR ROOMS** | Fight through themed rooms, each belonging to one monster type |
| **COLLECT TROPHIES** | Enemies drop mob-specific items (ears, cores, scales…) |
| **SURVIVE OR RETREAT** | Die = drop held trophies. Retreat = keep everything |
| **RETURN TO GUILD** | Trade trophies for gold + reputation, restock, upgrade |

### 2.1 Death & Risk

- Dying in a dungeon drops all trophies carried at death location
- Player respawns at the guild with no trophies (but keeps gear and gold)
- Retreating preserves everything — retreat is always a valid choice
- This creates the core tension: **push deeper or go bank what you have**

---

## 3. World Structure

### 3.1 The Guild Hub

The hub is a medieval adventurers' hall. It is the safe zone — no enemies, always accessible.

| NPC / Location | Function |
|----------------|----------|
| Quest Board | Lists available dungeons by tier. Completing dungeons awards reputation. |
| Trophy Trader | Buys mob drops for gold + reputation. Prices vary by rarity and demand. |
| Armory Shop | Sells weapons, armor, accessories. Stocked based on reputation tier. |
| Storage Chest | Expanded inventory for items you don't want to risk carrying. |
| Guild Ledger | Shows lifetime stats: kills, dungeons cleared, trophies traded. |

### 3.2 Dungeon Structure

A dungeon is a linear sequence of **levels**. Each level is the dwelling of one monster type. The player enters from the hub and descends level by level. Completing the final level returns the player to the hub.

```
HUB → [Level 1: Goblin Den] → [Level 2: Ratman Warren] → [Level 3: Kobold Burrow] → ... → HUB
```

Each level is a self-contained map (100×100 tiles or more). The boss of that dwelling guards the exit to the next level. Kill the boss → exit unlocks → proceed.

| Room Type | Description |
|-----------|-------------|
| Dwelling Rooms | One or more rooms filled with standard + elite enemies of that level's monster type. |
| Boss Room | Final room of the level. One boss enemy. Exit is locked until the boss dies. |
| Exit | Locked door or portal. Unlocks on boss death. Leads to next level or back to hub (if final level). |

### 3.3 Room Themes

Each monster type has a visual theme applied in Tiled. The room should feel like it belongs to them:

- **Goblin Den** — cramped, cluttered, low ceilings, scraps and stolen goods
- **Golem Chamber** — ancient stone, carved pillars, magical runes on the floor
- **Dragon Lair** — massive open cavern, scorched walls, gold and bone piles
- **Ratman Warren** — narrow tunnels, gnawed wood, sewage channels
- **Slime Grotto** — wet cave, glowing pools, organic growths on walls

---

## 4. Enemies

### 4.1 Enemy Roster

All 24 monster types are available as assets. Planned rollout by dungeon tier:

| Enemy | Dwelling | Type | Behavior | Trophy Drop |
|-------|----------|------|----------|-------------|
| Goblin | Goblin Den | Melee | Chase + swarm, low HP | Goblin Ear |
| Ratman | Ratman Warren | Melee | Fast, erratic movement | Ratman Tail |
| Kobold | Kobold Burrow | Ranged | Kite player, fire bolts | Kobold Scale |
| Gnoll | Gnoll Camp | Melee | Pack tactics, chase in groups | Gnoll Hide |
| Gremlin | Gremlin Nest | Ranged | Throws objects, very fast | Gremlin Wing |
| Slime | Slime Grotto | Melee | Slow, splits on death | Slime Core |
| Giant Bat | Bat Cave | Melee | Swoops, hard to hit | Bat Fang |
| Crawler | Crawler Tunnels | Melee | Ground hug, burst speed | Crawler Claw |
| Bugbear | Bugbear Hold | Melee | Heavy hitter, patrol | Bugbear Pelt |
| Ogre | Ogre Pit | Melee | Slow, massive AoE swing | Ogre Knuckle |
| Minotaur | Minotaur Maze | Melee | Charge attack, elite | Minotaur Horn |
| Golem | Golem Chamber | Melee | Slow, high armor, stomp | Golem Core |
| Flayer | Flayer Shrine | Magic | Ranged psychic bolts | Flayer Brain |
| Howler | Howler Den | Special | AOE howl stuns player | Howler Pelt |
| Manticore | Manticore Peak | Ranged | Spine volley, tail swipe | Manticore Spine |
| Gorgon | Gorgon Hollow | Special | Petrify gaze, melee | Gorgon Eye |
| Griffin | Griffin Roost | Melee | Aerial dive, fast | Griffin Feather |
| Chimera | Chimera Ruin | Special | Multi-attack, fire breath | Chimera Scale |
| Balron | Balron Sanctum | Magic | Teleport, fire ring | Balron Shard |
| Phoenix | Phoenix Crater | Special | Revives once, fire trail | Phoenix Ash |
| RockMan | Rockman Cavern | Melee | Boulder throw, high HP | Rockman Shard |
| Waheela | Waheela Tundra | Melee | Pack leader, buffs nearby | Waheela Pelt |
| Dragon | Dragon Lair | Boss | Fire breath, tail, flight | Dragon Scale |
| Balron | Final Sanctum | Boss | Endgame boss, multiple phases | Balron Crown |

### 4.2 Enemy Variants

Each monster type has three variants within its room:

- **Standard** — base stats, common trophy drop
- **Elite** — named enemy, 3× HP, higher damage, rare trophy drop
- **Boss** — one per dungeon, unique mechanics, unique drop

### 4.3 AI Behaviors

| Behavior | Description |
|----------|-------------|
| Chase | Aggros when player enters aggroRange. Moves directly at player until in attackRange. |
| Ranged | Maintains distance from player. Fires projectiles at regular intervals. |
| Patrol | Walks a fixed path until aggroed. Returns to patrol if player escapes aggroRange. |
| Swarm | Calls nearby same-type enemies when aggroed. Pack converges together. |
| Special | Unique per enemy (howl stun, gaze petrify, charge, split on death, etc). |

---

## 5. Player Systems

### 5.1 Stats

| Stat | Description |
|------|-------------|
| HP | Health pool. Shown as a bar. Regenerates slowly out of combat. |
| Attack | Base damage per hit. Scaled by weapon type. |
| Defense | Damage reduction on incoming hits (flat or percentage). |
| Move Speed | Walk speed. Affects kiting and dodge potential. |
| Crit Chance | % chance to trigger a critical hit animation for bonus damage. |

### 5.2 Combat

- Left-click to attack toward cursor
- Right-click to move (point-and-click navigation)
- **Melee:** hits enemies within 80px on attack animation complete
- **Ranged:** fires projectile toward cursor *(to be implemented)*
- **Magic:** AoE around player *(to be implemented)*
- 500ms invincibility window after being hit (prevents one-shot swarming)

### 5.3 Inventory

- 24 bag slots
- Equipment slots: head, body (inner/outer), legs, feet, hands, shoulder, amulet, primary, secondary
- Trophies and gear share bag space — managing weight is part of the loop
- Triple-click confirmation on equip/drop *(already implemented)*

---

## 6. Economy & Progression

### 6.1 Currency

**Gold** is the primary currency. Earned by selling trophies to the Trophy Trader at the guild. Spent at the Armory Shop.

### 6.2 Reputation

**Reputation** is a separate track. Earned by trading trophies and completing dungeons. Gates access to higher-tier dungeons and better shop inventory.

| Tier | Reputation | Unlocks |
|------|-----------|---------|
| 1 — Rookie | 0 | Goblin Den, Ratman Warren, Kobold Burrow. Basic gear in shop. |
| 2 — Adventurer | 500 | Gnoll Camp, Gremlin Nest, Slime Grotto. Mid-tier weapons. |
| 3 — Veteran | 2,000 | Bugbear Hold, Ogre Pit, Minotaur Maze. Rare item pool added. |
| 4 — Champion | 6,000 | Golem Chamber, Flayer Shrine, Howler Den. Elite gear available. |
| 5 — Legend | 15,000 | Dragon Lair, Balron Sanctum, Phoenix Crater. Endgame content. |

### 6.3 Trophy System

Every enemy type drops a unique trophy. Trophies have a gold value and a reputation value when traded in. Rarer drops are worth significantly more.

- **Standard drop** — common trophy, low gold, low rep
- **Elite drop** — uncommon, moderate gold, moderate rep
- **Boss drop** — rare, high gold, high rep, may unlock shop items

---

## 7. Room & Dungeon System

### 7.1 LevelManager *(to build)*

The SpawnManager built in the current prototype will be replaced by a LevelManager that:

- Manages the current level's enemy set (loaded from Tiled object layer)
- Activates enemies on level entry
- Tracks kill count across all rooms in the level
- Boss room stays locked until all standard/elite enemies in the level are dead
- Unlocks exit on boss death
- Handles level transition — loads next level map or returns to hub

### 7.2 Level Clear Flow

| Step | Description |
|------|-------------|
| Enter level | Player transitions from hub or previous level. RoomManager activates all enemies. |
| Clear dwelling rooms | Fight through standard and elite enemies. Kill counter tracks progress. |
| Reach boss room | Boss room is locked until dwelling rooms are cleared. |
| Kill boss | Boss dies. Exit unlocks. Rare trophy drops. |
| Exit | Player moves to next level, or returns to hub if this was the final level. |

### 7.3 Dungeon Map in Tiled

- Each dungeon is one `.tmj` file
- **Tile layers:** `background`, `floor`, `edges` (visual)
- **Object layers:** `collusion` (collision), `enemy_spawns` (enemy placement), `room_triggers` (room entry zones), `exits` (door locations)
- Room entry zones are rectangles — when player overlaps, that room activates

---

## 8. Implementation Roadmap

### ✅ Phase 1 — Combat Foundation (DONE)
- [x] Player attack animations with weapon type switching
- [x] Enemy entity (Goblin) with state machine: idle / chase / attack / dead
- [x] Player.takeDamage with invincibility frames
- [x] Hit detection on animation complete
- [x] SpawnManager (offscreen, interval-based — prototype only)

### Phase 2 — Level System
- [ ] Replace SpawnManager with LevelManager
- [ ] Tiled object layer: `enemy_spawns` with enemy type + variant properties per level map
- [ ] Boss room locked until all standard/elite enemies are dead
- [ ] Kill counter HUD
- [ ] Boss death unlocks exit
- [ ] Level transition — load next level map or return to hub

### Phase 3 — Guild Hub
- [ ] Hub map with NPCs
- [ ] Trophy Trader — sell trophies for gold + reputation
- [ ] Reputation system with tier gating
- [ ] Persistent gold and reputation across dungeon runs

### Phase 4 — Loot & Drops
- [ ] Trophy item definitions in Armory (or separate TrophyRegistry)
- [ ] Enemy death spawns trophy item on ground
- [ ] Player walks over to pick up (or auto-collect)
- [ ] Bag space management — full bag = cannot pick up

### Phase 5 — More Enemies
- [ ] Second enemy type: Kobold (ranged) — tests projectile system
- [ ] Projectile system: enemy fires toward player, player takes damage on contact
- [ ] Patrol AI for Bugbear / Gnoll
- [ ] Roll out remaining roster by tier

### Phase 6 — Boss Fights
- [ ] Boss variant of each enemy type
- [ ] Multi-phase health bar HUD
- [ ] Special abilities per boss
- [ ] Unique trophy drop + dungeon clear reward

---

## 9. Open Questions

- [ ] Is death permanent or just trophy loss? *(Current plan: trophy loss only)*
- [ ] Does the player have a class or is loadout the only differentiation?
- [ ] Are dungeons procedurally connected or hand-authored per tier?
- [ ] Multiplayer scope? *(Out of scope for v1)*
- [ ] Is there a day/night or time pressure mechanic in the guild?

---

*This document is a living spec. Update it as design decisions are made.*