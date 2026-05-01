import Phaser from "phaser";
import "./styles.css";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const TILE = 32;
const WORLD_WIDTH = 4200;
const WORLD_HEIGHT = 720;
const ASSET_BASE = import.meta.env.BASE_URL;
const BACKGROUND_DISPLAY_WIDTH = 1280;
const BACKGROUND_DISPLAY_HEIGHT = 720;
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

class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private statusText!: Phaser.GameObjects.Text;
  private hasWon = false;
  private wasOnFloor = false;
  private isLanding = false;

  constructor() {
    super("prototype");
  }

  preload() {
    this.load.image("background-shibuya", `${ASSET_BASE}assets/backgrounds/shibuya_evening.png`);
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

    this.input.keyboard!.on("keydown-R", () => this.scene.restart());
  }

  update() {
    this.applyPlayerBody();

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
      this.addBlock(platforms, x, 672, "ground");
    }

    [
      [420, 568, 5],
      [760, 488, 5],
      [1120, 568, 6],
      [1500, 456, 6],
      [1940, 568, 7],
      [1840, 392, 5],
      [2220, 320, 5],
      [2600, 248, 7],
      [3040, 176, 7],
      [3480, 264, 5],
      [2380, 496, 5],
      [2800, 568, 6],
      [3260, 512, 5],
      [3620, 600, 6],
    ].forEach(([x, y, count]) => {
      for (let i = 0; i < count; i += 1) {
        this.addBlock(platforms, x + i * TILE, y, "platform");
      }
    });
  }

  private createBackground() {
    const repeats = Math.ceil(WORLD_WIDTH / BACKGROUND_DISPLAY_WIDTH) + 1;

    for (let i = 0; i < repeats; i += 1) {
      this.add
        .image(i * BACKGROUND_DISPLAY_WIDTH, 0, "background-shibuya")
        .setOrigin(0, 0)
        .setDisplaySize(BACKGROUND_DISPLAY_WIDTH, BACKGROUND_DISPLAY_HEIGHT)
        .setScrollFactor(0.72, 1)
        .setDepth(-30);
    }

    this.add
      .rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x070a12, 0.28)
      .setOrigin(0, 0)
      .setScrollFactor(0.72, 1)
      .setDepth(-20);
  }

  private addBlock(platforms: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, texture: string) {
    const block = platforms.create(x + TILE / 2, y + TILE / 2, texture);
    block.refreshBody();
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
