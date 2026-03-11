const DEFAULT_RADIUS = 750;

export function getSpawnPoint(playerX, playerY, radius = DEFAULT_RADIUS) {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: playerX + Math.cos(angle) * radius,
    y: playerY + Math.sin(angle) * radius,
  };
}
