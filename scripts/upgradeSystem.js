// Sistema de mejoras: 5 mejoras compradas con monedas, máximo 3 niveles cada
// una, guardadas con localStorage (ver saveSystem.js) y aplicadas a Player.

const UPGRADE_DEFS = {
  throwSpeed: { label: "Velocidad de lanzamiento", maxLevel: 3, costs: [15, 25, 40] },
  poopRange: { label: "Alcance del excremento", maxLevel: 3, costs: [15, 25, 40] },
  extraBottle: { label: "Botella adicional al iniciar", maxLevel: 3, costs: [20, 30, 45] },
  jumpHeight: { label: "Altura de salto", maxLevel: 3, costs: [15, 25, 40] },
  coinMagnet: { label: "Imán de monedas", maxLevel: 3, costs: [20, 30, 45] },
};

function getUpgradeCost(key, currentLevel) {
  const def = UPGRADE_DEFS[key];
  if (!def || currentLevel >= def.maxLevel) return null;
  return def.costs[currentLevel];
}

function applyUpgradesToPlayer(player, upgrades) {
  const u = upgrades || {};
  player.throwSpeedMultiplier = 1 + (u.throwSpeed || 0) * 0.18;
  player.poopRangeMultiplier = 1 + (u.poopRange || 0) * 0.25;
  player.jumpHeightMultiplier = 1 + (u.jumpHeight || 0) * 0.1;
  player.coinMagnetLevel = u.coinMagnet || 0;
  player.addBottles(u.extraBottle || 0);
}

// Imán de monedas: acerca las monedas cercanas al jugador si tiene el nivel activo.
function applyCoinMagnet(scene) {
  const player = scene.player;
  if (!player || !player.coinMagnetLevel || !scene.coins) return;

  const radius = 40 + player.coinMagnetLevel * 30;
  scene.coins.children.each((coin) => {
    if (!coin.active) return;
    const dist = Phaser.Math.Distance.Between(player.x, player.y, coin.x, coin.y);
    if (dist < radius && dist > 4) {
      const dx = (player.x - coin.x) / dist;
      const dy = (player.y - coin.y) / dist;
      coin.x += dx * 6;
      coin.y += dy * 6;
      coin.body.updateFromGameObject();
    }
  });
}
