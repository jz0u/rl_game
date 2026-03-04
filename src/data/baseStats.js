export const knightBaseStats = {
  // ── Primary stats ──
  strength: 0,     // increases melee damage, carry weight, and heavy armor effectiveness
  dexterity: 0,    // increases attack speed, ranged damage, dodge chance, and move speed
  intelligence: 0, // increases magic damage, magicka pool, and magic resist
  vitality: 0,     // increases max HP, HP regen, and physical resistance
  endurance: 0,    // increases max stamina, stamina regen, and heavy armor penalty reduction

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

  // ── Base gear bonus fields (all zero until gear is equipped) ──
  hpBonus: 0,
  staminaBonus: 0,
  magickaBonus: 0,
  attackSpeedBonus: 0,
  critChanceBonus: 0,
  accuracyBonus: 0,
  moveSpeedBonus: 0,
  staminaCost: 10,    // unarmed attack stamina cost baseline
  rangeType: 'melee', // default to melee for unarmed
  visionRadius: 100,
  coinValue: 0,
}

export const goblinBaseStats = {
  // ── Primary stats ──
  strength: 0,
  dexterity: 0,
  intelligence: 0,
  vitality: 0,
  endurance: 0,

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
  guardDamage: 25,    // goblin jab stagger baseline

  // ── Base gear bonus fields ──
  hpBonus: 0,
  staminaBonus: 0,
  magickaBonus: 0,
  attackSpeedBonus: 0,
  critChanceBonus: 0,
  accuracyBonus: 0,
  moveSpeedBonus: 0,
  staminaCost: 1,
  rangeType: 'melee',
  visionRadius: 200,
  coinValue: 1,
}