export const playerBaseStats = {
  // ── Primary stats ──
  strength: 5,     // increases melee damage, carry weight, and heavy armor effectiveness
  dexterity: 5,    // increases attack speed, ranged damage, dodge chance, and move speed
  intelligence: 5, // increases magic damage, magicka pool, and magic resist
  vitality: 5,     // increases max HP, HP regen, and physical resistance
  endurance: 5,    // increases max stamina, stamina regen, and heavy armor penalty reduction

  // ── Base resource pools (tuning values — override per entity type) ──
  hp: 100,     // flat HP before vitality scaling — reduce for weaker enemies, increase for bosses
  stamina: 50, // flat stamina before endurance scaling
  magicka: 20, // flat magicka before intelligence scaling — low default, magic builds invest INT

  // ── Base defenses ──
  physicalResist: 10,
  magicalResist: 10,

  // ── Base offense (unarmed) ──
  physicalDamage: 20,  // weak unarmed hits — equip a weapon for real damage
  magicalDamage: 0,   // magic requires a staff/wand equipped
  attackRange: 70,    // unarmed reach in pixels
  minDamage: 0,
  maxDamage: 0,

  // ── Base gear bonus fields (all zero until gear is equipped) ──
  hpBonus: 0,
  staminaBonus: 0,
  magickaBonus: 0,
  attackSpeedBonus: 0,
  critChanceBonus: 0,
  accuracyBonus: 0,
  moveSpeedBonus: 0,
  rangeType: 'melee', // default to melee for unarmed
}

export const defaultEnemyStats = {
  // ── Primary stats ──
  strength: 3,
  dexterity: 3,
  intelligence: 1,
  vitality: 3,
  endurance: 3,

  // ── Base resource pools ──
  hp: 30,
  stamina: 30,
  magicka: 0,

  // ── Base defenses ──
  physicalResist: 5,
  magicalResist: 5,

  // ── Base offense ──
  physicalDamage: 3,
  magicalDamage: 0,
  minDamage: 0,
  maxDamage: 0,
  attackRange: 40,    // short melee reach in pixels

  // ── Base gear bonus fields ──
  hpBonus: 0,
  staminaBonus: 0,
  magickaBonus: 0,
  attackSpeedBonus: 0,
  critChanceBonus: 0,
  accuracyBonus: 0,
  moveSpeedBonus: 0,
  rangeType: 'melee',
}