import Phaser from "phaser";
import type { EnemyPlacement } from "./assets";

export const ENEMY_TEXTURE_KEY = "enemy-neon-bouncer";
export const ENEMY_DISPLAY_WIDTH = 76;
export const ENEMY_DISPLAY_HEIGHT = 64;
const ENEMY_BODY_WIDTH = 56;
const ENEMY_BODY_HEIGHT = 42;
const ENEMY_BODY_OFFSET_X = 10;
const ENEMY_BODY_OFFSET_Y = 16;
const ENEMY_DEFAULT_SPEED = 92;

export const createEnemyTexture = (scene: Phaser.Scene) => {
  if (scene.textures.exists(ENEMY_TEXTURE_KEY)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0x111827, 0.92);
  graphics.fillRoundedRect(6, 18, 64, 38, 14);
  graphics.fillStyle(0x7c2d12, 0.98);
  graphics.fillRoundedRect(12, 12, 52, 40, 12);
  graphics.fillStyle(0xff4d6d, 0.94);
  graphics.fillCircle(24, 29, 7);
  graphics.fillCircle(52, 29, 7);
  graphics.fillStyle(0xfff1f2, 0.96);
  graphics.fillCircle(26, 28, 2);
  graphics.fillCircle(54, 28, 2);
  graphics.lineStyle(4, 0xfacc15, 0.95);
  graphics.beginPath();
  graphics.moveTo(28, 46);
  graphics.lineTo(35, 40);
  graphics.lineTo(42, 46);
  graphics.lineTo(49, 40);
  graphics.strokePath();
  graphics.lineStyle(3, 0x22d3ee, 0.8);
  graphics.strokeRoundedRect(10, 10, 56, 44, 14);
  graphics.fillStyle(0x22d3ee, 0.22);
  graphics.fillEllipse(38, 58, 54, 10);
  graphics.generateTexture(ENEMY_TEXTURE_KEY, ENEMY_DISPLAY_WIDTH, ENEMY_DISPLAY_HEIGHT);
  graphics.destroy();
};

export const createEnemies = (
  scene: Phaser.Scene,
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  placements: readonly EnemyPlacement[],
  onPlayerDamage: (enemy: Phaser.Physics.Arcade.Sprite) => void,
) => {
  const enemies = scene.physics.add.group({
    allowGravity: false,
    immovable: true,
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

export const updateEnemies = (scene: Phaser.Scene, enemiesGroup?: Phaser.Physics.Arcade.Group) => {
  enemiesGroup?.getChildren().forEach((child) => {
    const enemy = child as Phaser.Physics.Arcade.Sprite;
    if (!enemy.active || !enemy.body) {
      return;
    }

    const patrolLeft = enemy.getData("patrolLeft") as number;
    const patrolRight = enemy.getData("patrolRight") as number;
    const speed = enemy.getData("speed") as number;
    const spawnY = enemy.getData("spawnY") as number;
    if (enemy.x <= patrolLeft && enemy.body.velocity.x < 0) {
      enemy.setVelocityX(speed);
      enemy.setFlipX(false);
    } else if (enemy.x >= patrolRight && enemy.body.velocity.x > 0) {
      enemy.setVelocityX(-speed);
      enemy.setFlipX(true);
    }

    enemy.y = spawnY + Math.sin((scene.time.now + enemy.x * 8) / 260) * 4;
    enemy.body.updateFromGameObject();
  });
};

const createEnemySprite = (enemiesGroup: Phaser.Physics.Arcade.Group, placement: EnemyPlacement) => {
  const enemy = enemiesGroup.create(placement.x, placement.y, ENEMY_TEXTURE_KEY) as Phaser.Physics.Arcade.Sprite;
  const speed = placement.speed ?? ENEMY_DEFAULT_SPEED;
  const direction = speed >= 0 ? 1 : -1;
  enemy.setDisplaySize(ENEMY_DISPLAY_WIDTH, ENEMY_DISPLAY_HEIGHT);
  enemy.setDepth(0.18);
  enemy.setData("patrolLeft", Math.min(placement.patrolLeft, placement.patrolRight));
  enemy.setData("patrolRight", Math.max(placement.patrolLeft, placement.patrolRight));
  enemy.setData("speed", Math.abs(speed));
  enemy.setData("spawnY", placement.y);
  enemy.setSize(ENEMY_BODY_WIDTH, ENEMY_BODY_HEIGHT);
  enemy.setOffset(ENEMY_BODY_OFFSET_X, ENEMY_BODY_OFFSET_Y);
  enemy.setVelocityX(Math.abs(speed) * direction);
  enemy.setFlipX(direction < 0);
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setImmovable(true);
};
