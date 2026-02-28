import { defaultGearStats } from '../data/gearStats.js';

// ── Scaling constants (tuning knobs — adjust during playtesting) ──
const HP_PER_VITALITY = 15;
const STAMINA_PER_ENDURANCE = 8;
const MAGICKA_PER_INTELLIGENCE = 10;
const REGEN_BASE = 0.1;
const REGEN_PER_STAT = 0.1;
const PHYSICAL_DAMAGE_PER_STR = 0.1;
const MAGICAL_DAMAGE_PER_INT = 0.1;
const RANGED_DAMAGE_PER_DEX = 0.1;
const ATTACK_SPEED_PER_DEX = 0.5;   // ms reduction per DEX point
const CRIT_CHANCE_PER_DEX = 0.5;    // % per DEX point
const CRIT_DAMAGE_PER_STR = 0.02;   // multiplier per STR point
const ACCURACY_PER_DEX = 0.3;
const MOVE_SPEED_PER_DEX = 0.05;
const DODGE_CAP = 75;
const BASE_ATTACK_SPEED = 1000;     // ms between attacks at 0 DEX
const BASE_CRIT_DAMAGE = 1.5;       // 1.5x crit multiplier before STR scaling
const ATTACK_SPEED_FLOOR = 300;     // ms — fastest possible attack

export function computeDerivedStats(baseStats, gearStats) {

  // ── Pre-compute weapon bonus based on weapon type ──
  const weaponBonus = gearStats.rangeType === 'ranged'
    ? baseStats.dexterity * RANGED_DAMAGE_PER_DEX
    : baseStats.strength * PHYSICAL_DAMAGE_PER_STR;

  let stats = {

    // ── Resource pools ──
    maxHP:      baseStats.hp      + (baseStats.vitality     * HP_PER_VITALITY)        + gearStats.hp,
    maxStamina: baseStats.stamina + (baseStats.endurance    * STAMINA_PER_ENDURANCE)  + gearStats.stamina,
    maxMagicka: baseStats.magicka + (baseStats.intelligence * MAGICKA_PER_INTELLIGENCE) + gearStats.magicka,

    // ── Regeneration (per second) ──
    healthRegen:  REGEN_BASE + (baseStats.vitality     * REGEN_PER_STAT),
    staminaRegen: REGEN_BASE + (baseStats.endurance    * REGEN_PER_STAT),
    magickaRegen: REGEN_BASE + (baseStats.intelligence * REGEN_PER_STAT),

    // ── Defense ──
    physicalResist: baseStats.physicalResist + gearStats.physicalResist,
    magicalResist:  baseStats.magicalResist  + gearStats.magicalResist,
    dodgeChance:    Math.min(baseStats.dexterity, DODGE_CAP),

    // ── Offense ──
    physicalDamage: baseStats.physicalDamage + gearStats.physicalDamage + weaponBonus,
    magicalDamage:  baseStats.magicalDamage  + gearStats.magicalDamage  + (baseStats.intelligence * MAGICAL_DAMAGE_PER_INT),
    minDamage:      gearStats.minDamage  ?? 0,
    maxDamage:      gearStats.maxDamage  ?? 0,
    attackSpeed:    Math.max(BASE_ATTACK_SPEED - (baseStats.dexterity * ATTACK_SPEED_PER_DEX) - (gearStats.attackSpeedBonus ?? 0), ATTACK_SPEED_FLOOR),
    critChance:     Math.min((baseStats.dexterity * CRIT_CHANCE_PER_DEX) + (gearStats.critChanceBonus ?? 0), 100),
    critDamage:     BASE_CRIT_DAMAGE + (baseStats.strength * CRIT_DAMAGE_PER_STR),
    accuracy:       (baseStats.dexterity * ACCURACY_PER_DEX) + (gearStats.accuracyBonus ?? 0),

    // ── Mobility ──
    moveSpeed: 3.0 + (baseStats.dexterity * MOVE_SPEED_PER_DEX) + (gearStats.moveSpeedBonus ?? 0),

    // ── Combat geometry ──
    attackRange: baseStats.attackRange,

  };

  return stats;
}

export function computeGearStats(equippedMap) {
  let gearStats = { ...defaultGearStats };

  for (const [slot, item] of equippedMap) {
    if (!item) continue;
    for (const [key, value] of Object.entries(item.stats)) {
      if (key in gearStats && key !== 'rangeType') {
        gearStats[key] += value;
      }
    }
  }

  // rangeType comes from weapon only
  const weapon = equippedMap.get('primary');
  gearStats.rangeType = weapon?.rangeType ?? 'melee';

  return gearStats;
}