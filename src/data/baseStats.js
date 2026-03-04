export const knightBaseStats = {
  // ── Primary stats ──
  strength: 1,     // increases melee damage, carry weight, and heavy armor effectiveness
  dexterity: 1,    // increases attack speed, ranged damage, dodge chance, and move speed
  intelligence: 1, // increases magic damage, magicka pool, and magic resist
  vitality: 1,     // increases max HP, HP regen, and physical resistance
  endurance: 1,    // increases max stamina, stamina regen, and heavy armor penalty reduction

  // ── Base resource pools (tuning values — override per entity type) ──
  hp: 100,     // flat HP before vitality scaling — reduce for weaker enemies, increase for bosses
  stamina: 100, // flat stamina before endurance scaling
  magicka: 100, // flat magicka before intelligence scaling — low default, magic builds invest INT

  // ── Base defenses ──
  physicalResist: 0,
  magicalResist: 0,

  // ── Base offense (unarmed) ──
  physicalDamage: 1,  // weak unarmed hits — equip a weapon for real damage
  magicalDamage: 0,   // magic requires a staff/wand equipped
  attackRange: 70,    // unarmed reach in pixels
  guardDamage: 1,    // unarmed stagger baseline
  minDamage: 0,
  maxDamage: 0,

  // ── Combat behaviour ──
  staminaCost: 10,    // unarmed attack stamina cost baseline
  rangeType: 'melee', // default to melee for unarmed
  visionRadius: 100,
  coinValue: 0,

  // ── Regeneration (per second, before stat scaling) ──
  healthRegen:  0.1,    // HP restored per second; vitality adds on top
  staminaRegen: 0.1,    // stamina restored per second; endurance adds on top
  magickaRegen: 0.1,    // magicka restored per second; intelligence adds on top
  guardRegen:   0.1,    // guard restored per second; endurance adds on top
}

export const goblinBaseStats = {
  // ── Primary stats ──
  strength: 1,
  dexterity: 1,
  intelligence: 1,
  vitality: 1,
  endurance: 1,

  // ── Base resource pools ──
  hp: 100,
  stamina: 100,
  magicka: 0,

  // ── Base defenses ──
  physicalResist: 0,
  magicalResist: 0,

  // ── Base offense ──
  physicalDamage: 25,
  magicalDamage: 0,
  minDamage: 0,
  maxDamage: 0,
  attackRange: 70,    // short melee reach in pixels
  guardDamage: 1,    // goblin jab stagger baseline

  // ── Combat behaviour ──
  staminaCost: 1,
  rangeType: 'melee',
  visionRadius: 200,
  coinValue: 1,

  // ── Regeneration (per second, before stat scaling) ──
  healthRegen:  0.1,    // HP restored per second; vitality adds on top
  staminaRegen: 0.1,    // stamina restored per second; endurance adds on top
  magickaRegen: 0.1,    // magicka restored per second; intelligence adds on top
  guardRegen:   0.1,    // guard restored per second; endurance adds on top
}