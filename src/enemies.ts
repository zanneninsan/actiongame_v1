import Phaser from "phaser";
import { ENEMY_DEFINITIONS, type EnemyPlacement } from "./assets";

const ENEMY_DEFAULT_SPEED = 92;

export const createEnemyAnimations = (scene: Phaser.Scene) => {
  Object.values(ENEMY_DEFINITIONS).forEach((definition) => {
    const animation = definition.animation;
    if (!animation || scene.anims.exists(animation.key)) {
      return;
    }

    scene.anims.create({
      key: animation.key,
      frames: scene.anims.generateFrameNumbers(animation.key, {
        start: 0,
        end: animation.frameCount - 1,
      }),
      frameRate: animation.frameRate,
      repeat: -1,
    });
  });
};

export const createEnemies = (
  scene: Phaser.Scene,
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  placements: readonly EnemyPlacement[],
  onPlayerDamage: (enemy: Phaser.Physics.Arcade.Sprite) => void,
) => {
  const enemies = scene.physics.add.group({
    allowGravity: true,
  });

  populateEnemies(enemies, placements);
  scene.physics.add.overlap(player, enemies, (_, enemyObject) => {
    onPlayerDamage(enemyObject as Phaser.Physics.Arcade.Sprite);
  });

  return enemies;
};

export const populateEnemies = (
  enemiesGroup: Phaser.Physics.Arcade.Group | undefined,
  placements: readonly EnemyPlacement[],
) => {
  if (!enemiesGroup) {
    return;
  }

  placements.forEach((placement) => {
    createEnemySprite(enemiesGroup, placement);
  });
};

export const updateEnemies = (enemiesGroup?: Phaser.Physics.Arcade.Group, destroyBelowY?: number) => {
  enemiesGroup?.getChildren().forEach((child) => {
    const enemy = child as Phaser.Physics.Arcade.Sprite;
    if (!enemy.active || !enemy.body) {
      return;
    }

    if (destroyBelowY !== undefined && enemy.y > destroyBelowY) {
      enemy.destroy();
      return;
    }

    const patrolLeft = enemy.getData("patrolLeft") as number;
    const patrolRight = enemy.getData("patrolRight") as number;
    const speed = enemy.getData("speed") as number;
    if (enemy.x <= patrolLeft && enemy.body.velocity.x < 0) {
      enemy.setVelocityX(speed);
      enemy.setFlipX(false);
    } else if (enemy.x >= patrolRight && enemy.body.velocity.x > 0) {
      enemy.setVelocityX(-speed);
      enemy.setFlipX(true);
    }
  });
};

export const freezeEnemies = (enemiesGroup?: Phaser.Physics.Arcade.Group) => {
  enemiesGroup?.getChildren().forEach((child) => {
    const enemy = child as Phaser.Physics.Arcade.Sprite;
    if (!enemy.active || !enemy.body) {
      return;
    }

    enemy.setVelocity(0, 0);
    enemy.setAcceleration(0, 0);
    (enemy.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  });
};

const createEnemySprite = (enemiesGroup: Phaser.Physics.Arcade.Group, placement: EnemyPlacement) => {
  const definition = ENEMY_DEFINITIONS[placement.type ?? "aquaMascot"];
  const animation = definition.animation;
  const enemy = enemiesGroup.create(placement.x, placement.y, animation?.key ?? definition.key) as Phaser.Physics.Arcade.Sprite;
  const speed = placement.speed ?? ENEMY_DEFAULT_SPEED;
  const direction = speed >= 0 ? 1 : -1;
  enemy.setDisplaySize(definition.displayWidth, definition.displayHeight);
  enemy.setDepth(0.18);
  enemy.setData("enemyType", placement.type ?? "aquaMascot");
  enemy.setData("patrolLeft", Math.min(placement.patrolLeft, placement.patrolRight));
  enemy.setData("patrolRight", Math.max(placement.patrolLeft, placement.patrolRight));
  enemy.setData("speed", Math.abs(speed));
  enemy.setSize(definition.bodyWidth / Math.abs(enemy.scaleX), definition.bodyHeight / Math.abs(enemy.scaleY));
  enemy.setOffset(definition.bodyOffsetX / Math.abs(enemy.scaleX), definition.bodyOffsetY / Math.abs(enemy.scaleY));
  enemy.setVelocityX(Math.abs(speed) * direction);
  enemy.setFlipX(direction < 0);
  if (animation) {
    enemy.play(animation.key);
  }
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(true);
  body.setImmovable(false);
};
