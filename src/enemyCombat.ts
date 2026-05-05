import Phaser from "phaser";

const ENEMY_STOMP_TOLERANCE = 18;
const ENEMY_STOMP_BOUNCE_Y = -455;

export const canStompEnemy = (
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  enemy: Phaser.Physics.Arcade.Sprite,
) => {
  const playerBody = player.body;
  const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | undefined;
  if (!playerBody || !enemyBody || playerBody.velocity.y < 90 || enemy.getData("defeated")) {
    return false;
  }

  const playerPreviousBottom = playerBody.prev.y + playerBody.height;
  const enemyTop = enemyBody.y;
  return playerPreviousBottom <= enemyTop + ENEMY_STOMP_TOLERANCE;
};

export const findOverlappingStompEnemy = (
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  enemies: Phaser.Physics.Arcade.Group | undefined,
) => {
  if (!enemies) {
    return undefined;
  }

  const playerBody = player.body;
  if (!playerBody) {
    return undefined;
  }

  return enemies
    .getChildren()
    .filter((child): child is Phaser.Physics.Arcade.Sprite => child instanceof Phaser.Physics.Arcade.Sprite)
    .filter((enemy) => enemy.active && isOverlapping(playerBody, enemy.body as Phaser.Physics.Arcade.Body | undefined))
    .filter((enemy) => canStompEnemy(player, enemy))
    .sort((a, b) => {
      const aBody = a.body as Phaser.Physics.Arcade.Body;
      const bBody = b.body as Phaser.Physics.Arcade.Body;
      return aBody.y - bBody.y;
    })[0];
};

export const tryStompEnemy = (
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  enemy: Phaser.Physics.Arcade.Sprite,
  onStomp: () => void,
) => {
  if (!canStompEnemy(player, enemy)) {
    return false;
  }

  enemy.setData("defeated", true);
  player.setVelocityY(ENEMY_STOMP_BOUNCE_Y);
  player.anims.play("player-air", true);
  onStomp();
  defeatEnemy(enemy, true);
  return true;
};

export const defeatEnemy = (enemy: Phaser.Physics.Arcade.Sprite, squash: boolean) => {
  const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | undefined;
  enemy.setData("defeated", true);
  if (enemyBody) {
    enemyBody.enable = false;
  }
  enemy.setVelocity(0, 0);
  enemy.setActive(false);
  enemy.scene.tweens.add({
    targets: enemy,
    alpha: 0,
    scaleX: enemy.scaleX * (squash ? 1.18 : 0.6),
    scaleY: enemy.scaleY * (squash ? 0.45 : 0.6),
    y: enemy.y + (squash ? 16 : -18),
    duration: 140,
    ease: "Back.easeIn",
    onComplete: () => enemy.destroy(),
  });
};

const isOverlapping = (a: Phaser.Physics.Arcade.Body, b: Phaser.Physics.Arcade.Body | undefined) => {
  if (!b || !b.enable) {
    return false;
  }

  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};
