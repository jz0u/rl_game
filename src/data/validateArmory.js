const REQUIRED_FIELDS = [
  'id', 'equipSlot', 'baseName', 'iconPath', 'overlayPath',
  'stats', 'value', 'displayName', 'description', 'itemType',
];

const VALID_EQUIP_SLOTS  = new Set(['head','shoulder','hands','body_inner','body_outer','legs','feet','primary','secondary','amulet']);
const VALID_ITEM_TYPES   = new Set(['armor', 'weapon']);
const VALID_WEIGHT_CLASS = new Set(['light', 'medium', 'heavy']);
const VALID_RANGE_TYPES  = new Set(['melee', 'ranged']);
const VALID_HAND_TYPES   = new Set(['one', 'two']);

const VALID_STAT_KEYS = new Set([
  'hp', 'stamina', 'magicka',
  'physicalDamage', 'magicalDamage',
  'physicalResist', 'magicalResist',
  'minDamage', 'maxDamage',
  'attackSpeedBonus', 'critChanceBonus', 'accuracyBonus', 'moveSpeedBonus',
  'blockChance',
]);

function warn(id, field, message) {
  console.warn(`[Armory] ${id} — ${field}: ${message}`);
}

/**
 * Validates every item in the Armory catalog.
 * Logs a console.warn for each violation and returns the total count.
 * @param {object} Armory - The Armory export (slot-keyed object of item arrays).
 * @returns {number} Total number of violations found (0 = all clear).
 */
export function validateArmory(Armory) {
  const allItems = Object.values(Armory).flat();
  let violations = 0;

  // ── Uniqueness check — build id set across entire catalog ──
  const seenIds = new Map(); // id → first-seen displayName
  for (const item of allItems) {
    const id = item.id ?? '(missing id)';
    if (seenIds.has(id)) {
      warn(id, 'id', `duplicate — also used by "${seenIds.get(id)}"`);
      violations++;
    } else {
      seenIds.set(id, item.displayName ?? '(missing displayName)');
    }
  }

  // ── Per-item checks ──
  for (const item of allItems) {
    const id = item.id ?? '(missing id)';

    // 1. Required fields present and not undefined
    for (const field of REQUIRED_FIELDS) {
      if (item[field] === undefined || item[field] === null) {
        warn(id, field, 'required field is missing or undefined');
        violations++;
      }
    }

    // 2. Enum: equipSlot
    if (item.equipSlot !== undefined && !VALID_EQUIP_SLOTS.has(item.equipSlot)) {
      warn(id, 'equipSlot', `"${item.equipSlot}" is not a valid slot`);
      violations++;
    }

    // 3. Enum: itemType
    if (item.itemType !== undefined && !VALID_ITEM_TYPES.has(item.itemType)) {
      warn(id, 'itemType', `"${item.itemType}" must be "armor" or "weapon"`);
      violations++;
    }

    // 4. Enum: weightClass (optional — only validated when present)
    if (item.weightClass !== undefined && !VALID_WEIGHT_CLASS.has(item.weightClass)) {
      warn(id, 'weightClass', `"${item.weightClass}" must be "light", "medium", or "heavy"`);
      violations++;
    }

    // 5. Enum: rangeType (optional — only validated when present)
    if (item.rangeType !== undefined && !VALID_RANGE_TYPES.has(item.rangeType)) {
      warn(id, 'rangeType', `"${item.rangeType}" must be "melee" or "ranged"`);
      violations++;
    }

    // 6. Enum: handType (optional — only validated when present)
    if (item.handType !== undefined && !VALID_HAND_TYPES.has(item.handType)) {
      warn(id, 'handType', `"${item.handType}" must be "one" or "two"`);
      violations++;
    }

    // 7. Stat keys
    if (item.stats !== null && typeof item.stats === 'object') {
      for (const key of Object.keys(item.stats)) {
        if (!VALID_STAT_KEYS.has(key)) {
          warn(id, `stats.${key}`, `"${key}" is not a recognised stat key`);
          violations++;
        }
      }
    }

    // 8. value is a non-negative number
    if (item.value !== undefined) {
      if (typeof item.value !== 'number' || item.value < 0) {
        warn(id, 'value', `must be a non-negative number (got ${JSON.stringify(item.value)})`);
        violations++;
      }
    }
  }

  return violations;
}
