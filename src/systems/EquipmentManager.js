import { loadEquipmentAssets } from '../pipelines/loadEquipmentAssets';

/**
 * EquipmentManager — single source of truth for all equipment state transitions.
 *
 * All equip / unequip / buy operations go through here. On success the manager
 * updates Inventory state and emits 'equipmentChanged' so downstream listeners
 * (Player overlays, InventoryPanel) can react atomically — eliminating the class
 * of desync bugs caused by UI code calling inventory and player separately.
 *
 * Extends Phaser.Events.EventEmitter so it can be used as a first-class event
 * source without adding an extra dependency (Phaser bundles EventEmitter internally).
 */
export default class EquipmentManager extends Phaser.Events.EventEmitter {
  /**
   * @param {Inventory} inventory
   * @param {Player} player
   * @param {Phaser.Scene} scene
   */
  constructor(inventory, player, scene) {
    super();
    this.inventory = inventory;
    this.player    = player;
    this.scene     = scene;
  }

  /**
   * Equips an item from the inventory bag.
   * Calls inventory.equipItemFromInventory(); on success loads assets and emits
   * 'equipmentChanged' with the current equipped Map.
   * @param {object} item - Armory item definition.
   * @returns {boolean} false if the inventory call failed, true otherwise.
   */
  equip(item) {
    if (this.inventory.equipItemFromInventory(item) === false) return false;
    loadEquipmentAssets(this.scene, item);
    this.emit('equipmentChanged', this.inventory.equipped);
    return true;
  }

  /**
   * Unequips the item currently in the given slot.
   * @param {string} slotName - Equipment slot key (e.g. 'weapon', 'head').
   * @returns {boolean} false if the slot is empty or the inventory call failed, true otherwise.
   */
  unequip(slotName) {
    const item = this.inventory.equipped.get(slotName);
    if (!item) return false;
    if (this.inventory.removeItemFromEquipped(item) === false) return false;
    this.emit('equipmentChanged', this.inventory.equipped);
    return true;
  }

  /**
   * Purchases an item via the shop and loads its assets into the scene.
   * Buying adds the item to the inventory bag; it does not change equipped state,
   * so no 'equipmentChanged' event is emitted.
   * @param {object} item - Armory item definition.
   * @returns {boolean} false if the purchase failed, true otherwise.
   */
  buy(item) {
    if (this.scene.shop.buy(item, this.scene.player, this.inventory) === false) return false;
    loadEquipmentAssets(this.scene, item);
    this.emit('equipmentChanged', this.inventory.equipped);
    return true;
  }
}
