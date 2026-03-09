import Inventory from '../../systems/Inventory';
import EquipmentManager from '../../systems/EquipmentManager';

export function initSystems(scene) {
    scene.inventory        = new Inventory();
    scene.equipmentManager = new EquipmentManager(scene.inventory, scene);
    scene.goblins          = [];
}
