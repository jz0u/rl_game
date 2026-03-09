import { Armory } from '../../data/Armory';
import HUD from '../../ui/HUD';
import ShopPanel from '../../ui/ShopPanel';
import InventoryPanel from '../../ui/InventoryPanel';
import WindowManager from '../../ui/WindowManager';
import CursorUI from '../../ui/CursorUI';

export function initUI(scene) {
    const allItems = Object.values(Armory).flat();
    scene.hud          = new HUD(scene, scene.knight);
    scene.shopPanel    = new ShopPanel(scene, allItems);
    scene.inventoryPanel = new InventoryPanel(scene, scene.inventory, allItems);
    scene.windowManager  = new WindowManager(scene);
    scene.windowManager.addWindow(scene.shopPanel);
    scene.windowManager.addWindow(scene.inventoryPanel);
    scene.cursorUI = new CursorUI(scene);
}
