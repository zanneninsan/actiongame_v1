import Phaser from "phaser";
import "./styles.css";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const TILE = 32;
const WORLD_WIDTH = 4200;
const WORLD_HEIGHT = 720;
const ASSET_BASE = import.meta.env.BASE_URL;
const DEBUG_VERSION = "v0.1.5";
const FOOTPATH_SOURCE_HEIGHT = 204;
const FOOTPATH_DISPLAY_HEIGHT = 204;
const FOOTPATH_SCALE = FOOTPATH_DISPLAY_HEIGHT / FOOTPATH_SOURCE_HEIGHT;
const PLAYER_DISPLAY_WIDTH = 320;
const PLAYER_DISPLAY_HEIGHT = 260;
const PLAYER_BODY_WIDTH = 52;
const PLAYER_BODY_HEIGHT = 164;
const PLAYER_BODY_OFFSET_X = 134;
const PLAYER_BODY_OFFSET_Y = 86;
const PLAYER_IDLE_FRAME_COUNT = 8;
const PLAYER_FRAME_COUNT = 13;
const GROUND_ACCELERATION = 2400;
const AIR_ACCELERATION = 720;
const GROUND_DRAG = 2400;
const AIR_DRAG = 120;
const MAX_RUN_SPEED = 380;
const MAX_FALL_SPEED = 680;
const JUMP_VELOCITY = -560;
const BOOSTED_JUMP_VELOCITY = -635;
const BOOST_JUMP_SPEED_THRESHOLD = 285;
const PLATFORM_ASSETS = {
  short: "platform-short",
  medium: "platform-medium",
  long: "platform-long",
  stairsTall: "platform-stairs-tall",
  stairsMid: "platform-stairs-mid",
  stairsLow: "platform-stairs-low",
  block: "platform-block",
} as const;

type PlatformAsset = (typeof PLATFORM_ASSETS)[keyof typeof PLATFORM_ASSETS];
type PlatformHitbox = { x: number; y: number; width: number; height: number };
type ItemType = "energyDrink" | "shoppingBag" | "bubbleTea";
type ScoreState = Record<ItemType, number>;

const ITEM_DEFINITIONS: Record<ItemType, { key: string; label: string; points: number; assetPath: string }> = {
  energyDrink: {
    key: "item-energy-drink",
    label: "ENERGY",
    points: 100,
    assetPath: "assets/items/energy_drink.png",
  },
  shoppingBag: {
    key: "item-shopping-bag",
    label: "BAG",
    points: 250,
    assetPath: "assets/items/shopping_bag.png",
  },
  bubbleTea: {
    key: "item-bubble-tea",
    label: "TEA",
    points: 150,
    assetPath: "assets/items/bubble_tea.png",
  },
};

const ITEM_PLACEMENTS: Array<{ type: ItemType; x: number; y: number }> = [
  { type: "energyDrink", x: 475, y: 492 },
  { type: "bubbleTea", x: 915, y: 432 },
  { type: "shoppingBag", x: 1285, y: 492 },
  { type: "energyDrink", x: 1750, y: 400 },
  { type: "bubbleTea", x: 2345, y: 288 },
  { type: "shoppingBag", x: 2720, y: 204 },
  { type: "energyDrink", x: 3185, y: 132 },
  { type: "bubbleTea", x: 3575, y: 236 },
  { type: "shoppingBag", x: 3925, y: 504 },
];

class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private cityLoopBackground?: Phaser.GameObjects.TileSprite;
  private footpathBackground?: Phaser.GameObjects.TileSprite;
  private statusText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private score: ScoreState = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0 };
  private hasWon = false;
  private wasOnFloor = false;
  private isLanding = false;

  constructor() {
    super("prototype");
  }

  preload() {
    this.load.image("background-stars", `${ASSET_BASE}assets/backgrounds/starry_sky.webp`);
    this.load.image("background-city-loop", `${ASSET_BASE}assets/backgrounds/city_loop_strip.webp`);
    this.load.image("background-footpath", `${ASSET_BASE}assets/backgrounds/footpath_loop.webp`);
    this.load.image(PLATFORM_ASSETS.short, `${ASSET_BASE}assets/platforms/platform_short.webp`);
    this.load.image(PLATFORM_ASSETS.medium, `${ASSET_BASE}assets/platforms/platform_medium.webp`);
    this.load.image(PLATFORM_ASSETS.long, `${ASSET_BASE}assets/platforms/platform_long.webp`);
    this.load.image(PLATFORM_ASSETS.stairsTall, `${ASSET_BASE}assets/platforms/platform_stairs_tall.webp`);
    this.load.image(PLATFORM_ASSETS.stairsMid, `${ASSET_BASE}assets/platforms/platform_stairs_mid.webp`);
    this.load.image(PLATFORM_ASSETS.stairsLow, `${ASSET_BASE}assets/platforms/platform_stairs_low.webp`);
    this.load.image(PLATFORM_ASSETS.block, `${ASSET_BASE}assets/platforms/platform_block.webp`);
    Object.values(ITEM_DEFINITIONS).forEach((item) => {
      this.load.image(item.key, `${ASSET_BASE}${item.assetPath}`);
    });
    this.load.spritesheet("player-idle", `${ASSET_BASE}assets/sprites/player_idle_8_320x260.png`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-walk", `${ASSET_BASE}assets/sprites/player_walk_13_320x260.png`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-jump", `${ASSET_BASE}assets/sprites/player_jump_15_320x260.png`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.createPixelTexture("ground", TILE, TILE, 0x263244, 0x8bd3ff);
    this.createPixelTexture("platform", TILE, TILE, 0x384257, 0xf6c453);
    this.createPixelTexture("platform-hitbox", 1, 1, 0xffffff, 0xffffff);
    this.createPixelTexture("goal", 12, 48, 0xfb7185, 0x881337);
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.createBackground();

    const platforms = this.physics.add.staticGroup();
    this.buildStage(platforms);

    const goal = this.physics.add.staticImage(4020, 568, "goal");
    goal.setDisplaySize(24, 96);
    goal.setSize(24, 96);

    this.createPlayerAnimations();

    this.player = this.physics.add.sprite(120, 552, "player-idle");
    this.player.setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
    this.player.setCollideWorldBounds(true);
    this.applyPlayerBody();
    this.player.setMaxVelocity(MAX_RUN_SPEED, MAX_FALL_SPEED);
    this.player.play("player-idle");
    this.wasOnFloor = true;
    this.player.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}player-land`, () => {
      this.isLanding = false;
    });

    this.physics.add.collider(this.player, platforms);
    this.physics.add.overlap(this.player, goal, () => this.win());
    this.createItems();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(260, 140);
    this.cameras.main.setBackgroundColor("#080b16");

    this.statusText = this.add
      .text(8, 8, "A/D: move  W/Space: jump  R: restart", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#e5e7eb",
      })
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(8, 24, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#f8fafc",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateScoreText();

    this.add
      .text(GAME_WIDTH - 8, 8, DEBUG_VERSION, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#cbd5e1",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);

    this.input.keyboard!.on("keydown-R", () => this.scene.restart());
  }

  update() {
    this.applyPlayerBody();
    this.updateBackground();

    const onFloor = this.player.body.blocked.down || this.player.body.touching.down;
    const left = this.keys.a.isDown || this.cursors.left.isDown;
    const right = this.keys.d.isDown || this.cursors.right.isDown;
    const debugJump = Phaser.Input.Keyboard.JustDown(this.keys.w);
    const normalJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);
    const jump = debugJump || normalJump;
    const canJump = onFloor || debugJump;
    let startedJump = false;
    const horizontalAcceleration = onFloor ? GROUND_ACCELERATION : AIR_ACCELERATION;
    this.player.setDragX(onFloor ? GROUND_DRAG : AIR_DRAG);

    if (left) {
      this.player.setAccelerationX(-horizontalAcceleration);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setAccelerationX(horizontalAcceleration);
      this.player.setFlipX(false);
    } else {
      this.player.setAccelerationX(0);
    }

    if (jump && canJump) {
      const jumpVelocity =
        Math.abs(this.player.body.velocity.x) >= BOOST_JUMP_SPEED_THRESHOLD ? BOOSTED_JUMP_VELOCITY : JUMP_VELOCITY;
      this.player.setVelocityY(jumpVelocity);
      this.isLanding = false;
      startedJump = true;
      this.player.anims.play("player-jump-start", true);
    }

    const isMovingHorizontally = Math.abs(this.player.body.velocity.x) > 8;
    const landedThisFrame = !this.wasOnFloor && onFloor && !startedJump;

    if (landedThisFrame) {
      this.isLanding = true;
      this.player.anims.play("player-land", true);
    } else if (this.isLanding) {
      if (!this.player.anims.isPlaying) {
        this.isLanding = false;
      }
    } else if (startedJump) {
      this.player.anims.play("player-jump-start", true);
    } else if (!onFloor) {
      const currentAnimation = this.player.anims.currentAnim?.key;
      if (currentAnimation !== "player-jump-start" || !this.player.anims.isPlaying) {
        this.player.anims.play("player-air", true);
      }
    } else if (isMovingHorizontally) {
      this.player.anims.play("player-walk", true);
    } else {
      this.player.anims.play("player-idle", true);
    }

    this.wasOnFloor = onFloor;

    if (this.player.y > WORLD_HEIGHT + 32) {
      this.scene.restart();
    }
  }

  private buildStage(platforms: Phaser.Physics.Arcade.StaticGroup) {
    for (let x = 0; x < WORLD_WIDTH; x += TILE) {
      this.addBlock(platforms, x, 672, "ground", false);
    }

    this.addPlatformPart(platforms, 360, 548, PLATFORM_ASSETS.short);
    this.addPlatformPart(platforms, 760, 488, PLATFORM_ASSETS.medium);
    this.addPlatformPart(platforms, 1180, 548, PLATFORM_ASSETS.stairsLow);
    this.addPlatformPart(platforms, 1580, 456, PLATFORM_ASSETS.medium);
    this.addPlatformPart(platforms, 2040, 548, PLATFORM_ASSETS.long);
    this.addPlatformPart(platforms, 2240, 344, PLATFORM_ASSETS.stairsMid);
    this.addPlatformPart(platforms, 2620, 260, PLATFORM_ASSETS.stairsTall);
    this.addPlatformPart(platforms, 3100, 188, PLATFORM_ASSETS.short);
    this.addPlatformPart(platforms, 3500, 292, PLATFORM_ASSETS.block);
    this.addPlatformPart(platforms, 3700, 560, PLATFORM_ASSETS.medium);
  }

  private createBackground() {
    this.add
      .image(0, 0, "background-stars")
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScrollFactor(0)
      .setDepth(-40);

    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x070a12, 0.2)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-35);

    this.cityLoopBackground = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "background-city-loop")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-15);

    this.footpathBackground = this.add
      .tileSprite(0, GAME_HEIGHT - FOOTPATH_DISPLAY_HEIGHT, GAME_WIDTH, FOOTPATH_DISPLAY_HEIGHT, "background-footpath")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-5);
    this.footpathBackground.setTileScale(FOOTPATH_SCALE, FOOTPATH_SCALE);
  }

  private updateBackground() {
    if (this.cityLoopBackground) {
      this.cityLoopBackground.tilePositionX = this.cameras.main.scrollX * 0.58;
    }

    if (this.footpathBackground) {
      this.footpathBackground.tilePositionX = this.cameras.main.scrollX / FOOTPATH_SCALE;
    }
  }

  private addBlock(platforms: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, texture: string, visible = true) {
    const block = platforms.create(x + TILE / 2, y + TILE / 2, texture);
    block.setVisible(visible);
    block.refreshBody();
  }

  private addPlatformPart(platforms: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, texture: PlatformAsset) {
    this.add.image(x, y, texture).setOrigin(0, 0).setDepth(-1);

    this.getPlatformHitboxes(texture).forEach((hitbox) => {
      const block = platforms.create(x + hitbox.x + hitbox.width / 2, y + hitbox.y + hitbox.height / 2, "platform-hitbox");
      block.setDisplaySize(hitbox.width, hitbox.height);
      block.setVisible(false);
      block.refreshBody();
    });
  }

  private createItems() {
    const items = this.physics.add.staticGroup();

    ITEM_PLACEMENTS.forEach((placement) => {
      const definition = ITEM_DEFINITIONS[placement.type];
      const item = items.create(placement.x, placement.y, definition.key) as Phaser.Physics.Arcade.Sprite;
      item.setData("itemType", placement.type);
      item.setDisplaySize(48, 48);
      item.refreshBody();
    });

    this.physics.add.overlap(this.player, items, (_, itemObject) => {
      this.collectItem(itemObject as Phaser.Physics.Arcade.Sprite);
    });
  }

  private collectItem(item: Phaser.Physics.Arcade.Sprite) {
    if (!item.active) {
      return;
    }

    const itemType = item.getData("itemType") as ItemType;
    const definition = ITEM_DEFINITIONS[itemType];
    this.score[itemType] += definition.points;
    this.updateScoreText();
    item.disableBody(true, true);
  }

  private updateScoreText() {
    const total = Object.values(this.score).reduce((sum, value) => sum + value, 0);
    const itemScores = (Object.keys(ITEM_DEFINITIONS) as ItemType[])
      .map((itemType) => `${ITEM_DEFINITIONS[itemType].label}:${this.score[itemType]}`)
      .join("  ");
    this.scoreText.setText(`SCORE:${total}  ${itemScores}`);
  }

  private getPlatformHitboxes(texture: PlatformAsset): PlatformHitbox[] {
    switch (texture) {
      case PLATFORM_ASSETS.short:
        return [{ x: 0, y: 0, width: 292, height: 134 }];
      case PLATFORM_ASSETS.medium:
        return [{ x: 0, y: 0, width: 599, height: 134 }];
      case PLATFORM_ASSETS.long:
        return [{ x: 0, y: 0, width: 1302, height: 135 }];
      case PLATFORM_ASSETS.stairsLow:
        return [
          { x: 0, y: 40, width: 228, height: 130 },
          { x: 228, y: 0, width: 91, height: 170 },
        ];
      case PLATFORM_ASSETS.stairsMid:
        return [
          { x: 0, y: 44, width: 140, height: 136 },
          { x: 140, y: 0, width: 191, height: 180 },
        ];
      case PLATFORM_ASSETS.stairsTall:
        return [
          { x: 0, y: 126, width: 92, height: 130 },
          { x: 92, y: 84, width: 78, height: 172 },
          { x: 170, y: 42, width: 78, height: 214 },
          { x: 248, y: 0, width: 130, height: 256 },
        ];
      case PLATFORM_ASSETS.block:
        return [{ x: 0, y: 0, width: 130, height: 156 }];
    }
  }

  private createPixelTexture(key: string, width: number, height: number, fill: number, stroke: number) {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(fill);
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(1, stroke);
    graphics.strokeRect(0.5, 0.5, width - 1, height - 1);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private createPlayerAnimations() {
    this.anims.create({
      key: "player-idle",
      frames: this.anims.generateFrameNumbers("player-idle", {
        start: 0,
        end: PLAYER_IDLE_FRAME_COUNT - 1,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "player-walk",
      frames: this.anims.generateFrameNumbers("player-walk", {
        start: 0,
        end: PLAYER_FRAME_COUNT - 1,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "player-jump-start",
      frames: this.anims.generateFrameNumbers("player-jump", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });

    this.anims.create({
      key: "player-air",
      frames: this.anims.generateFrameNumbers("player-jump", {
        start: 3,
        end: 6,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "player-land",
      frames: this.anims.generateFrameNumbers("player-jump", {
        start: 7,
        end: 14,
      }),
      frameRate: 14,
      repeat: 0,
    });
  }

  private applyPlayerBody() {
    this.player.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT);
    this.player.setOffset(PLAYER_BODY_OFFSET_X, PLAYER_BODY_OFFSET_Y);
  }

  private win() {
    if (this.hasWon) {
      return;
    }

    this.hasWon = true;
    this.statusText.setText("Goal! Press R to restart");
    this.player.setTint(0xfef08a);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: "#172033",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false,
    },
  },
  scene: PrototypeScene,
});
