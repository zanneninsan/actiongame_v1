import Phaser from "phaser";
import { ENEMY_DEFINITIONS, type EnemyPlacement } from "./assets";

const ENEMY_DEFAULT_SPEED = 92;
const CHASE_RADIUS = 520;
const CHASE_STOP_DISTANCE = 28;
const FLYING_BOB_HEIGHT = 34;
const FLYING_BOB_SPEED = 0.0032;
const HOP_INTERVAL_MS = 1050;
const HOP_VELOCITY_Y = -410;

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

export const updateEnemies = (
  enemiesGroup?: Phaser.Physics.Arcade.Group,
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  destroyBelowY?: number,
) => {
  enemiesGroup?.getChildren().forEach((child) => {
    const enemy = child as Phaser.Physics.Arcade.Sprite;
    const body = enemy.body as Phaser.Physics.Arcade.Body | undefined;
    if (!enemy.active || !body) {
      return;
    }

    if (destroyBelowY !== undefined && enemy.y > destroyBelowY) {
      enemy.destroy();
      return;
    }

    const aiType = enemy.getData("aiType") as string;
    if (aiType === "flyingPatrol") {
      updateFlyingPatrolEnemy(enemy);
      return;
    }
    if (aiType === "hoppingPatrol") {
      updateHoppingPatrolEnemy(enemy);
      return;
    }
    if (aiType === "chase") {
      updateChaseEnemy(enemy, player);
      return;
    }

    updatePatrolEnemy(enemy);
  });
};

const updatePatrolEnemy = (enemy: Phaser.Physics.Arcade.Sprite) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(true);
  updatePatrolDirection(enemy);
};

const updateFlyingPatrolEnemy = (enemy: Phaser.Physics.Arcade.Sprite) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  updatePatrolDirection(enemy);
  const homeY = enemy.getData("homeY") as number;
  const phase = enemy.getData("phase") as number;
  const bobY = homeY + Math.sin(enemy.scene.time.now * FLYING_BOB_SPEED + phase) * FLYING_BOB_HEIGHT;
  enemy.setY(bobY);
  body.setVelocityY(0);
};

const updateHoppingPatrolEnemy = (enemy: Phaser.Physics.Arcade.Sprite) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(true);
  updatePatrolDirection(enemy);
  const nextHopAt = (enemy.getData("nextHopAt") as number | undefined) ?? 0;
  if ((body.blocked.down || body.touching.down) && enemy.scene.time.now >= nextHopAt) {
    enemy.setVelocityY(HOP_VELOCITY_Y);
    enemy.setData("nextHopAt", enemy.scene.time.now + HOP_INTERVAL_MS + Phaser.Math.Between(-160, 220));
  }
};

const updateChaseEnemy = (
  enemy: Phaser.Physics.Arcade.Sprite,
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(true);
  if (!player?.active) {
    updatePatrolDirection(enemy);
    return;
  }

  const patrolLeft = enemy.getData("patrolLeft") as number;
  const patrolRight = enemy.getData("patrolRight") as number;
  const speed = enemy.getData("speed") as number;
  const distanceX = player.x - enemy.x;
  const isPlayerInRange = Math.abs(distanceX) <= CHASE_RADIUS && player.x >= patrolLeft - 80 && player.x <= patrolRight + 80;
  if (!isPlayerInRange) {
    updatePatrolDirection(enemy);
    return;
  }

  if (Math.abs(distanceX) <= CHASE_STOP_DISTANCE) {
    enemy.setVelocityX(0);
    return;
  }

  const direction = distanceX > 0 ? 1 : -1;
  const nextX = enemy.x + direction * speed * (enemy.scene.game.loop.delta / 1000);
  if (nextX < patrolLeft || nextX > patrolRight) {
    enemy.setVelocityX(0);
    return;
  }

  enemy.setVelocityX(speed * direction);
  enemy.setFlipX(direction < 0);
};

const updatePatrolDirection = (enemy: Phaser.Physics.Arcade.Sprite) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  const patrolLeft = enemy.getData("patrolLeft") as number;
  const patrolRight = enemy.getData("patrolRight") as number;
  const speed = enemy.getData("speed") as number;
  if (enemy.x <= patrolLeft && body.velocity.x <= 0) {
    enemy.setVelocityX(speed);
    enemy.setFlipX(false);
  } else if (enemy.x >= patrolRight && body.velocity.x >= 0) {
    enemy.setVelocityX(-speed);
    enemy.setFlipX(true);
  } else if (Math.abs(body.velocity.x) < 1) {
    const direction = enemy.flipX ? -1 : 1;
    enemy.setVelocityX(speed * direction);
  }
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
  enemy.setData("aiType", definition.aiType);
  enemy.setData("homeY", placement.y);
  enemy.setData("phase", Phaser.Math.FloatBetween(0, Math.PI * 2));
  enemy.setData("nextHopAt", enemy.scene.time.now + Phaser.Math.Between(260, 900));
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
  body.setAllowGravity(definition.aiType !== "flyingPatrol");
  body.setImmovable(false);
};
