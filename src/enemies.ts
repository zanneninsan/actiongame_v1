import Phaser from "phaser";
import { ENEMY_DEFINITIONS, type EnemyPlacement } from "./assets";

const ENEMY_DEFAULT_SPEED = 92;
const CHASE_RADIUS = 520;
const CHASE_STOP_DISTANCE = 28;
const FLYING_BOB_HEIGHT = 34;
const FLYING_BOB_SPEED = 0.0032;
const HOP_INTERVAL_MS = 1050;
const HOP_VELOCITY_Y = -410;
const SHOOT_INTERVAL_MS = 1700;
const PROJECTILE_SPEED = 235;
const PROJECTILE_TEXTURE_KEY = "enemy-projectile-heart";
const TURRET_SHOOT_INTERVAL_MS = 2250;
const TURRET_PROJECTILE_SPEED = 310;
const TURRET_PROJECTILE_TEXTURE_KEY = "enemy-cannon-heart";

export const createEnemyAnimations = (scene: Phaser.Scene) => {
  Object.values(ENEMY_DEFINITIONS).forEach((definition) => {
    const animation = definition.animation;
    if (!animation || scene.anims.exists(animation.key)) {
      return;
    }

    if (!scene.textures.exists(animation.key)) {
      console.warn(`Skipping enemy animation "${animation.key}" because its texture was not loaded.`);
      return;
    }

    try {
      scene.anims.create({
        key: animation.key,
        frames: scene.anims.generateFrameNumbers(animation.key, {
          start: 0,
          end: animation.frameCount - 1,
        }),
        frameRate: animation.frameRate,
        repeat: -1,
      });
    } catch (error) {
      console.warn(`Skipping enemy animation "${animation.key}" because its frames could not be created.`, error);
    }
  });
  createProjectileTexture(scene);
  createTurretProjectileTexture(scene);
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
    if (aiType === "shooter") {
      updateShooterEnemy(enemiesGroup, enemy, player);
      return;
    }
    if (aiType === "turret") {
      updateTurretEnemy(enemiesGroup, enemy, player);
      return;
    }
    if (aiType === "projectile") {
      updateProjectileEnemy(enemy, destroyBelowY);
      return;
    }
    if (aiType === "cannonProjectile") {
      updateCannonProjectileEnemy(enemy, destroyBelowY);
      return;
    }

    updatePatrolEnemy(enemy);
  });
};

const createProjectileTexture = (scene: Phaser.Scene) => {
  if (scene.textures.exists(PROJECTILE_TEXTURE_KEY)) {
    return;
  }
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0xff4fb3, 1);
  graphics.fillCircle(10, 9, 7);
  graphics.fillCircle(20, 9, 7);
  graphics.fillTriangle(4, 12, 26, 12, 15, 28);
  graphics.lineStyle(3, 0x3b0a2a, 1);
  graphics.strokeCircle(10, 9, 7);
  graphics.strokeCircle(20, 9, 7);
  graphics.generateTexture(PROJECTILE_TEXTURE_KEY, 30, 30);
  graphics.destroy();
};

const createTurretProjectileTexture = (scene: Phaser.Scene) => {
  if (scene.textures.exists(TURRET_PROJECTILE_TEXTURE_KEY)) {
    return;
  }
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(0xff77c8, 1);
  graphics.fillCircle(14, 13, 10);
  graphics.fillCircle(30, 13, 10);
  graphics.fillTriangle(5, 18, 39, 18, 22, 40);
  graphics.lineStyle(4, 0x111827, 1);
  graphics.strokeCircle(14, 13, 10);
  graphics.strokeCircle(30, 13, 10);
  graphics.lineStyle(2, 0x67e8f9, 1);
  graphics.strokeCircle(22, 20, 18);
  graphics.generateTexture(TURRET_PROJECTILE_TEXTURE_KEY, 44, 44);
  graphics.destroy();
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

const updateShooterEnemy = (
  enemiesGroup: Phaser.Physics.Arcade.Group,
  enemy: Phaser.Physics.Arcade.Sprite,
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(true);
  enemy.setVelocityX(0);
  if (!player?.active) {
    return;
  }

  const direction = player.x < enemy.x ? -1 : 1;
  enemy.setFlipX(direction < 0);
  const nextShotAt = (enemy.getData("nextShotAt") as number | undefined) ?? 0;
  if (enemy.scene.time.now < nextShotAt || Math.abs(player.x - enemy.x) > 620) {
    return;
  }

  enemy.setData("nextShotAt", enemy.scene.time.now + SHOOT_INTERVAL_MS + Phaser.Math.Between(-180, 240));
  const projectile = enemiesGroup.create(enemy.x + direction * 34, enemy.y - 12, PROJECTILE_TEXTURE_KEY) as Phaser.Physics.Arcade.Sprite;
  projectile.setDisplaySize(28, 28);
  projectile.setDepth(0.22);
  projectile.setData("enemyType", "projectile");
  projectile.setData("aiType", "projectile");
  projectile.setData("defeated", false);
  projectile.setVelocity(direction * PROJECTILE_SPEED, -24);
  projectile.setSize(24, 24);
  const projectileBody = projectile.body as Phaser.Physics.Arcade.Body;
  projectileBody.setAllowGravity(false);
};

const updateTurretEnemy = (
  enemiesGroup: Phaser.Physics.Arcade.Group,
  enemy: Phaser.Physics.Arcade.Sprite,
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(true);
  enemy.setVelocityX(0);
  if (!player?.active) {
    return;
  }

  const distanceX = player.x - enemy.x;
  const distanceY = player.y - enemy.y;
  const direction = distanceX < 0 ? -1 : 1;
  enemy.setFlipX(direction < 0);
  const nextShotAt = (enemy.getData("nextShotAt") as number | undefined) ?? 0;
  if (enemy.scene.time.now < nextShotAt || Math.abs(distanceX) > 760 || Math.abs(distanceY) > 260) {
    return;
  }

  enemy.setData("nextShotAt", enemy.scene.time.now + TURRET_SHOOT_INTERVAL_MS + Phaser.Math.Between(-220, 320));
  const projectile = enemiesGroup.create(
    enemy.x + direction * 46,
    enemy.y - 8,
    TURRET_PROJECTILE_TEXTURE_KEY,
  ) as Phaser.Physics.Arcade.Sprite;
  projectile.setDisplaySize(36, 36);
  projectile.setDepth(0.24);
  projectile.setData("enemyType", "cannonProjectile");
  projectile.setData("aiType", "cannonProjectile");
  projectile.setData("defeated", false);
  projectile.setVelocity(direction * TURRET_PROJECTILE_SPEED, Phaser.Math.Clamp(distanceY * 0.18, -70, 70));
  projectile.setAngularVelocity(direction * 260);
  projectile.setSize(26, 26);
  const projectileBody = projectile.body as Phaser.Physics.Arcade.Body;
  projectileBody.setAllowGravity(false);
};

const updateProjectileEnemy = (enemy: Phaser.Physics.Arcade.Sprite, destroyBelowY?: number) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  if (destroyBelowY !== undefined && (enemy.y > destroyBelowY || enemy.x < -160 || enemy.x > body.world.bounds.width + 160)) {
    enemy.destroy();
  }
};

const updateCannonProjectileEnemy = (enemy: Phaser.Physics.Arcade.Sprite, destroyBelowY?: number) => {
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  if (destroyBelowY !== undefined && (enemy.y > destroyBelowY || enemy.x < -160 || enemy.x > body.world.bounds.width + 160)) {
    enemy.destroy();
  }
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
  const animationReady =
    animation !== undefined &&
    enemiesGroup.scene.textures.exists(animation.key) &&
    enemiesGroup.scene.anims.exists(animation.key);
  const textureKey =
    animationReady || definition.assetPath
      ? animationReady
        ? animation.key
        : definition.key
      : getFallbackEnemyTextureKey(enemiesGroup.scene);
  const enemy = enemiesGroup.create(placement.x, placement.y, textureKey) as Phaser.Physics.Arcade.Sprite;
  const speed = placement.speed ?? ENEMY_DEFAULT_SPEED;
  const direction = speed >= 0 ? 1 : -1;
  enemy.setDisplaySize(definition.displayWidth, definition.displayHeight);
  enemy.setDepth(0.18);
  enemy.setData("enemyType", placement.type ?? "aquaMascot");
  enemy.setData("aiType", definition.aiType);
  enemy.setData("homeY", placement.y);
  enemy.setData("phase", Phaser.Math.FloatBetween(0, Math.PI * 2));
  enemy.setData("nextHopAt", enemy.scene.time.now + Phaser.Math.Between(260, 900));
  enemy.setData("nextShotAt", enemy.scene.time.now + Phaser.Math.Between(500, 1400));
  enemy.setData("patrolLeft", Math.min(placement.patrolLeft, placement.patrolRight));
  enemy.setData("patrolRight", Math.max(placement.patrolLeft, placement.patrolRight));
  enemy.setData("speed", Math.abs(speed));
  enemy.setSize(definition.bodyWidth / Math.abs(enemy.scaleX), definition.bodyHeight / Math.abs(enemy.scaleY));
  enemy.setOffset(definition.bodyOffsetX / Math.abs(enemy.scaleX), definition.bodyOffsetY / Math.abs(enemy.scaleY));
  enemy.setVelocityX(definition.aiType === "turret" ? 0 : Math.abs(speed) * direction);
  enemy.setFlipX(direction < 0);
  if (animationReady) {
    enemy.play(animation.key);
  }
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(definition.aiType !== "flyingPatrol");
  body.setImmovable(definition.aiType === "turret");
};

const getFallbackEnemyTextureKey = (scene: Phaser.Scene) => {
  const fallbackAnimation = ENEMY_DEFINITIONS.aquaMascot.animation?.key;
  if (fallbackAnimation && scene.textures.exists(fallbackAnimation)) {
    return fallbackAnimation;
  }
  return "__DEFAULT";
};
