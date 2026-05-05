import Phaser from "phaser";

const ENEMY_STOMP_TOLERANCE = 18;
const ENEMY_STOMP_BOUNCE_Y = -455;

export const tryStompEnemy = (
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  enemy: Phaser.Physics.Arcade.Sprite,
  onStomp: () => void,
) => {
  const playerBody = player.body;
  const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | undefined;
  if (!playerBody || !enemyBody || playerBody.velocity.y < 90 || enemy.getData("defeated")) {
    return false;
  }

  const playerPreviousBottom = playerBody.prev.y + playerBody.height;
  const enemyTop = enemyBody.y;
  if (playerPreviousBottom > enemyTop + ENEMY_STOMP_TOLERANCE) {
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
