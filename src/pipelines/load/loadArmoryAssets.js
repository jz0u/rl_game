import { Armory } from '../../data/Armory';
import { validateArmory } from '../../data/validateArmory';

export function loadArmoryAssets(scene) {
    if (import.meta.env.DEV) {
        const violations = validateArmory(Armory);
        if (violations === 0) console.log("[Armory] All items valid.");
    }
    const allItems = Object.values(Armory).flat();
    allItems.forEach(item => {
        scene.load.image(item.id, item.iconPath);
        scene.load.image(item.id + '_overlay', item.overlayPath);
    });
}
