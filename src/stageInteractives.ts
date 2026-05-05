import Phaser from "phaser";
import type { StageDefinition } from "./assets";
import type { StageId } from "./stages";

const DECORATION_PLATFORM_LAND_TOLERANCE = 6;
const SPRING_PLATFORM_DEFAULT_VELOCITY = -820;
const SPRING_PLATFORM_BIG_JUMP_MULTIPLIER = 1.28;
const SPRING_BIG_JUMP_EFFECT_DEPTH = 125;
const FRAGILE_PLATFORM_DELAY_MS = 360;
const FRAGILE_PLATFORM_RESPAWN_MS = 2800;
const reachedCheckpoints = new Map<StageId, { x: number; y: number }>();

type PlayerSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export const movePlayerToCheckpointStart = (stageId: StageId, stage: StageDefinition, player: PlayerSprite) => {
  const checkpoint = reachedCheckpoints.get(stageId);
  const start = checkpoint ?? stage.playerStart;
  player.setPosition(start.x, start.y);
};

export class CheckpointController {
  private group?: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: PlayerSprite,
    private readonly getStageId: () => StageId,
    private readonly getStage: () => StageDefinition,
    private readonly canActivate: () => boolean,
    private readonly showFloatingText: (x: number, y: number, text: string) => void,
  ) {}

  create() {
    this.group = this.scene.physics.add.staticGroup();
    this.populate();
    this.scene.physics.add.overlap(this.player, this.group, (_, checkpointObject) => {
      this.activate(checkpointObject as Phaser.Physics.Arcade.Image);
    });
    return this.group;
  }

  populate(group = this.group) {
    if (!group) {
      return;
    }

    (this.getStage().checkpoints ?? []).forEach((checkpoint) => {
      const flag = group.create(checkpoint.x, checkpoint.y, "stage-checkpoint-flag") as Phaser.Physics.Arcade.Image;
      flag.setDisplaySize(48, 96);
      flag.setDepth(0.12);
      flag.setData("checkpointX", checkpoint.x);
      flag.setData("checkpointY", checkpoint.y - 52);
      flag.refreshBody();
    });
  }

  rebuild() {
    this.group?.clear(true, true);
    this.populate();
  }

  private activate(flag: Phaser.Physics.Arcade.Image) {
    if (!this.canActivate() || flag.getData("activated")) {
      return;
    }

    flag.setData("activated", true);
    flag.setTint(0x86efac);
    reachedCheckpoints.set(this.getStageId(), {
      x: flag.getData("checkpointX") as number,
      y: flag.getData("checkpointY") as number,
    });
    this.showFloatingText(flag.x, flag.y - 72, "CHECK");
  }
}

export class OneWayGateController {
  private wallGroup?: Phaser.Physics.Arcade.StaticGroup;
  private sprites: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: PlayerSprite,
    private readonly getStage: () => StageDefinition,
    private readonly canUpdate: () => boolean,
    private readonly showFloatingText: (x: number, y: number, text: string) => void,
  ) {}

  create() {
    this.wallGroup = this.scene.physics.add.staticGroup();
    this.scene.physics.add.collider(this.player, this.wallGroup);
    this.populate();
    return this.wallGroup;
  }

  rebuild() {
    this.wallGroup?.clear(true, true);
    this.sprites.forEach((gate) => gate.destroy());
    this.sprites = [];
    this.populate();
  }

  destroy() {
    this.wallGroup?.clear(true, true);
    this.sprites.forEach((gate) => gate.destroy());
    this.sprites = [];
  }

  update() {
    if (!this.canUpdate() || !this.wallGroup) {
      return;
    }

    this.sprites.forEach((gate) => {
      if (gate.getData("activated") || this.player.x <= (gate.getData("gateX") as number) + 24) {
        return;
      }

      gate.setData("activated", true);
      gate.setTint(0xf0abfc);
      const height = gate.getData("height") as number;
      const wall = this.wallGroup!.create(gate.x - 44, gate.y, "platform-hitbox") as Phaser.Physics.Arcade.Image;
      wall.setDisplaySize(24, height);
      wall.setVisible(false);
      wall.refreshBody();
      this.showFloatingText(gate.x, gate.y - height / 2, "ONE WAY");
    });
  }

  private populate() {
    (this.getStage().oneWayGates ?? []).forEach((gate) => {
      const height = gate.height ?? 160;
      const sprite = this.scene.add.image(gate.x, gate.y, "stage-one-way-gate").setDisplaySize(64, height).setDepth(0.08);
      sprite.setData("gateX", gate.x);
      sprite.setData("height", height);
      sprite.setData("activated", false);
      this.sprites.push(sprite);
    });
  }
}

export const handleSpecialPlatformCollision = (options: {
  scene: Phaser.Scene;
  player: PlayerSprite;
  platformObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile;
  canInteract: () => boolean;
  shouldSpringBigJump?: () => boolean;
  onLaunch: () => void;
}) => {
  if (!options.canInteract()) {
    return;
  }

  const platform = options.platformObject as Phaser.Physics.Arcade.Image;
  const behavior = platform.getData("platformBehavior") as string | undefined;
  if (!behavior || !didPlayerLandOnStaticPlatform(options.player, platform)) {
    return;
  }

  if (behavior === "spring") {
    const baseVelocity = platform.getData("springVelocity") as number | undefined;
    const velocity = baseVelocity ?? SPRING_PLATFORM_DEFAULT_VELOCITY;
    const isBigJump = options.shouldSpringBigJump?.() ?? false;
    options.player.setVelocityY(isBigJump ? velocity * SPRING_PLATFORM_BIG_JUMP_MULTIPLIER : velocity);
    options.player.anims.play("player-air", true);
    options.scene.cameras.main.shake(isBigJump ? 120 : 80, isBigJump ? 0.003 : 0.002);
    if (isBigJump) {
      showBigSpringJumpEffect(options.scene, platform);
    }
    options.onLaunch();
  } else if (behavior === "fragile") {
    queueFragilePlatformCollapse(options.scene, platform);
  }
};

const didPlayerLandOnStaticPlatform = (player: PlayerSprite, platform: Phaser.Physics.Arcade.Image) => {
  const platformBody = platform.body as Phaser.Physics.Arcade.StaticBody | undefined;
  if (!platformBody || !player.body) {
    return false;
  }

  const playerBody = player.body;
  const previousBottom = playerBody.prev.y + playerBody.height;
  const overlapsHorizontally = playerBody.right > platformBody.x + 3 && playerBody.x < platformBody.x + platformBody.width - 3;
  return overlapsHorizontally && playerBody.velocity.y >= 0 && previousBottom <= platformBody.y + DECORATION_PLATFORM_LAND_TOLERANCE;
};

const showBigSpringJumpEffect = (scene: Phaser.Scene, platform: Phaser.Physics.Arcade.Image) => {
  const x = platform.x;
  const y = platform.y - 18;
  const ring = scene.add.circle(x, y, 18, 0x7cffb7, 0.18).setDepth(SPRING_BIG_JUMP_EFFECT_DEPTH);
  ring.setStrokeStyle(4, 0xeaff8f, 0.95);
  const core = scene.add.circle(x, y, 8, 0xeaff8f, 0.85).setDepth(SPRING_BIG_JUMP_EFFECT_DEPTH + 1);
  const label = scene.add
    .text(x, y - 38, "BIG JUMP", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ecfccb",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setDepth(SPRING_BIG_JUMP_EFFECT_DEPTH + 2)
    .setShadow(0, 0, "#22c55e", 8, true, true);

  const sparks = Array.from({ length: 8 }, (_, index) => {
    const angle = -Math.PI + (Math.PI * index) / 7;
    const spark = scene.add.rectangle(x, y, 5, 18, 0xeaff8f, 0.95).setDepth(SPRING_BIG_JUMP_EFFECT_DEPTH + 1);
    spark.setRotation(angle + Math.PI / 2);
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * 52,
      y: y + Math.sin(angle) * 32 - 18,
      alpha: 0,
      scaleY: 0.3,
      duration: 360,
      ease: "Sine.easeOut",
      onComplete: () => spark.destroy(),
    });
    return spark;
  });

  scene.tweens.add({
    targets: ring,
    radius: 56,
    alpha: 0,
    duration: 420,
    ease: "Sine.easeOut",
    onComplete: () => ring.destroy(),
  });
  scene.tweens.add({
    targets: core,
    y: y - 26,
    scale: 0.2,
    alpha: 0,
    duration: 300,
    ease: "Sine.easeOut",
    onComplete: () => core.destroy(),
  });
  scene.tweens.add({
    targets: label,
    y: y - 74,
    alpha: 0,
    duration: 620,
    ease: "Sine.easeOut",
    onComplete: () => label.destroy(),
  });

  scene.time.delayedCall(700, () => sparks.forEach((spark) => spark.destroy()));
};

const queueFragilePlatformCollapse = (scene: Phaser.Scene, platform: Phaser.Physics.Arcade.Image) => {
  if (platform.getData("collapseQueued")) {
    return;
  }

  platform.setData("collapseQueued", true);
  const visual = platform.getData("fragileVisual") as Phaser.GameObjects.Image | undefined;
  const delayMs = (platform.getData("fragileDelayMs") as number | undefined) ?? FRAGILE_PLATFORM_DELAY_MS;
  const respawnMs = (platform.getData("fragileRespawnMs") as number | undefined) ?? FRAGILE_PLATFORM_RESPAWN_MS;
  if (visual) {
    scene.tweens.add({
      targets: visual,
      alpha: 0.45,
      x: visual.x + 2,
      duration: 70,
      yoyo: true,
      repeat: Math.max(1, Math.floor(delayMs / 140)),
    });
  }
  scene.time.delayedCall(delayMs, () => {
    platform.disableBody(true, true);
    visual?.setVisible(false);
    scene.time.delayedCall(respawnMs, () => {
      platform.enableBody(false, platform.x, platform.y, true, false);
      platform.refreshBody();
      platform.setData("collapseQueued", false);
      visual?.setAlpha(1).setVisible(true);
    });
  });
};
