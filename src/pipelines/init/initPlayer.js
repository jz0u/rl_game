import Knight from '../../entities/Knight';
import { registerPlayerAnims } from '../../scene/loadPlayerAssets';
import { CAMERA_ZOOM } from '../../config/constants';
import Bank from '../../systems/Bank';

export function initPlayer(scene) {
    const tilemap = scene.tilemap;
    const playerX = tilemap.widthInPixels / 2;
    const playerY = tilemap.heightInPixels / 2;

    scene.knight = new Knight(scene, playerX, playerY);
    scene.knight.sprite.setDepth(10);
    scene.bank = new Bank(0);
    scene.coinDrops = [];
    registerPlayerAnims(scene);

    scene.cameras.main.setZoom(CAMERA_ZOOM);
    scene.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    scene.cameras.main.startFollow(scene.knight.sprite, true, 0.1, 0.1);

    scene.physics.add.collider(scene.knight.sprite, scene.collisionGroup);
    scene.knight.sprite.setCollideWorldBounds(true);
}
