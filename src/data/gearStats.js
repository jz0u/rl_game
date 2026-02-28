export const defaultGearStats = {
  hp: 0,
  stamina: 0,
  magicka: 0,
  physicalDamage: 0,
  magicalDamage: 0,
  physicalResist: 0,
  magicalResist: 0,
  minDamage: 0,
  maxDamage: 0,
  attackSpeedBonus: 0,
  critChanceBonus: 0,
  accuracyBonus: 0,
  moveSpeedBonus: 0,
  rangeType: 'melee',
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