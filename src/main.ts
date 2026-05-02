import Phaser from "phaser";
import "./styles.css";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const TILE = 32;
const WORLD_WIDTH = 8400;
const WORLD_TOP = -360;
const WORLD_BOTTOM = 720;
const WORLD_HEIGHT = WORLD_BOTTOM - WORLD_TOP;
const ASSET_BASE = import.meta.env.BASE_URL;
const DEBUG_VERSION = "v0.1.14";
const RAINBOW_PIPELINE_KEY = "RainbowWinPipeline";
const GAME_TIME_SECONDS = 180;
const TIME_BONUS_PER_SECOND = 10;
const PLATFORM_UNIT_WIDTH = 64;
const PLATFORM_UNIT_HEIGHT = 32;
const GROUND_TOP_Y = 672;
const GROUND_VISUAL_Y = GROUND_TOP_Y;
const STREET_LAMP_GROUND_Y = 672;
const PLATFORM_DEPTH = -0.55;
const DECORATION_DEPTH = -1.2;
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
  left: "platform-unit-left",
  middle: "platform-unit-middle",
  right: "platform-unit-right",
  single: "platform-unit-single",
} as const;
const PROP_ASSETS = {
  lampSingle: "street-lamp-single",
  lampDouble: "street-lamp-double",
} as const;
type ItemType = "energyDrink" | "shoppingBag" | "bubbleTea";
type ScoreState = Record<ItemType, number>;
type PlatformAsset = (typeof PLATFORM_ASSETS)[keyof typeof PLATFORM_ASSETS];
type StageObjectAsset = { key: string; path: string };

const RAINBOW_FRAGMENT_SHADER = `
#define SHADER_NAME RAINBOW_WIN_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform float uTime;
varying vec2 outTexCoord;
varying vec4 outTint;

vec3 rainbow(float t) {
  vec3 phase = vec3(0.0, 0.33, 0.67);
  return 0.55 + 0.45 * cos(6.28318 * (t + phase));
}

void main () {
  vec4 texture = texture2D(uMainSampler, outTexCoord);
  float band = fract(outTexCoord.x * 1.85 + uTime * 1.6);
  float shine = smoothstep(0.18, 0.0, abs(fract(band * 3.0) - 0.5));
  float luminance = dot(texture.rgb, vec3(0.299, 0.587, 0.114));
  vec3 rainbowColor = rainbow(band) * (0.58 + luminance * 0.9 + shine * 0.35);
  vec3 color = mix(texture.rgb, rainbowColor, 0.82);
  gl_FragColor = vec4(color, texture.a * outTint.a);
}
`;

class RainbowWinPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader: RAINBOW_FRAGMENT_SHADER,
    });
  }

  onPreRender() {
    this.set1f("uTime", this.game.loop.time / 1000);
  }
}

const STAGE_OBJECT_ASSETS = [
  { key: "stage-props-traffic-cone", path: "assets/stage_objects/props_traffic_cone.webp" },
  { key: "stage-props-construction-barricade", path: "assets/stage_objects/props_construction_barricade.webp" },
  { key: "stage-props-roadwork-sign", path: "assets/stage_objects/props_roadwork_sign.webp" },
  { key: "stage-props-sidewalk-sign", path: "assets/stage_objects/props_sidewalk_sign.webp" },
  { key: "stage-props-park-bench", path: "assets/stage_objects/props_park_bench.webp" },
  { key: "stage-props-trash-bin", path: "assets/stage_objects/props_trash_bin.webp" },
  { key: "stage-props-planter-box", path: "assets/stage_objects/props_planter_box.webp" },
  { key: "stage-props-bike-rack", path: "assets/stage_objects/props_bike_rack.webp" },
  { key: "stage-props-bus-stop-sign", path: "assets/stage_objects/props_bus_stop_sign.webp" },
  { key: "stage-props-vending-machine", path: "assets/stage_objects/props_vending_machine.webp" },
  { key: "stage-props-utility-box", path: "assets/stage_objects/props_utility_box.webp" },
  { key: "stage-props-guard-rail", path: "assets/stage_objects/props_guard_rail.webp" },
  { key: "stage-structures-bus-shelter", path: "assets/stage_objects/structures_bus_shelter.webp" },
  { key: "stage-structures-phone-booth", path: "assets/stage_objects/structures_phone_booth.webp" },
  { key: "stage-structures-street-kiosk", path: "assets/stage_objects/structures_street_kiosk.webp" },
  { key: "stage-structures-shutter-storefront", path: "assets/stage_objects/structures_shutter_storefront.webp" },
  { key: "stage-structures-subway-stairs", path: "assets/stage_objects/structures_subway_stairs.webp" },
  { key: "stage-structures-concrete-pillar", path: "assets/stage_objects/structures_concrete_pillar.webp" },
  { key: "stage-structures-construction-fence", path: "assets/stage_objects/structures_construction_fence.webp" },
  { key: "stage-structures-chainlink-fence", path: "assets/stage_objects/structures_chainlink_fence.webp" },
  { key: "stage-structures-vending-kiosk", path: "assets/stage_objects/structures_vending_kiosk.webp" },
  { key: "stage-structures-station-wall-railing", path: "assets/stage_objects/structures_station_wall_railing.webp" },
  { key: "stage-structures-station-entrance", path: "assets/stage_objects/structures_station_entrance.webp" },
] as const satisfies readonly StageObjectAsset[];

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
  { type: "energyDrink", x: 4385, y: 464 },
  { type: "bubbleTea", x: 4825, y: 404 },
  { type: "shoppingBag", x: 5085, y: 504 },
  { type: "energyDrink", x: 5485, y: 364 },
  { type: "bubbleTea", x: 5975, y: 244 },
  { type: "shoppingBag", x: 6425, y: 444 },
  { type: "energyDrink", x: 6745, y: 364 },
  { type: "bubbleTea", x: 7125, y: 492 },
  { type: "shoppingBag", x: 7465, y: 424 },
  { type: "energyDrink", x: 7775, y: 344 },
  { type: "bubbleTea", x: 8125, y: 504 },
];

class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private cityLoopBackground?: Phaser.GameObjects.TileSprite;
  private statusText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private finalScoreText?: Phaser.GameObjects.Text;
  private score: ScoreState = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0 };
  private startTime = 0;
  private hasWon = false;
  private wasOnFloor = false;
  private isLanding = false;

  constructor() {
    super("prototype");
  }

  preload() {
    this.load.image("background-stars", `${ASSET_BASE}assets/backgrounds/starry_sky.webp`);
    this.load.image("background-city-loop", `${ASSET_BASE}assets/backgrounds/city_loop_strip.webp`);
    this.load.image(PLATFORM_ASSETS.left, `${ASSET_BASE}assets/platforms/platform_unit_left.webp`);
    this.load.image(PLATFORM_ASSETS.middle, `${ASSET_BASE}assets/platforms/platform_unit_middle.webp`);
    this.load.image(PLATFORM_ASSETS.right, `${ASSET_BASE}assets/platforms/platform_unit_right.webp`);
    this.load.image(PLATFORM_ASSETS.single, `${ASSET_BASE}assets/platforms/platform_unit_single.webp`);
    this.load.image(PROP_ASSETS.lampSingle, `${ASSET_BASE}assets/props/street_lamp_single.webp`);
    this.load.image(PROP_ASSETS.lampDouble, `${ASSET_BASE}assets/props/street_lamp_double.webp`);
    STAGE_OBJECT_ASSETS.forEach((asset) => {
      this.load.image(asset.key, `${ASSET_BASE}${asset.path}`);
    });
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
    this.registerRainbowPipeline();
    this.physics.world.setBounds(0, WORLD_TOP, WORLD_WIDTH, WORLD_HEIGHT);
    this.startTime = this.time.now;
    this.createBackground();

    const platforms = this.physics.add.staticGroup();
    this.buildStage(platforms);
    this.createStreetLamps();
    this.createStageObjects();

    const goal = this.physics.add.staticImage(8260, 568, "goal");
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

    this.cameras.main.setBounds(0, WORLD_TOP, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(260, 140);
    this.cameras.main.setBackgroundColor("#080b16");

    this.statusText = this.add
      .text(8, 8, "A/D: move  W/Space: jump  R: restart", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#e5e7eb",
      })
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(8, 30, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#f8fafc",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateScoreText();

    this.timerText = this.add
      .text(8, 52, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fde68a",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateTimerText();

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
    this.updateTimerText();

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

    if (this.player.y > WORLD_BOTTOM + 32) {
      this.scene.restart();
    }
  }

  private buildStage(platforms: Phaser.Physics.Arcade.StaticGroup) {
    for (let x = 0; x < WORLD_WIDTH; x += TILE) {
      this.addBlock(platforms, x, GROUND_TOP_Y, "ground", false);
    }

    this.addPlatformRun(platforms, 0, GROUND_VISUAL_Y, Math.ceil(WORLD_WIDTH / PLATFORM_UNIT_WIDTH) + 1, false);
    this.addPlatformRun(platforms, 360, 548, 4);
    this.addPlatformRun(platforms, 744, 488, 7);
    this.addPlatformRun(platforms, 1160, 548, 3);
    this.addPlatformRun(platforms, 1288, 500, 3);
    this.addPlatformRun(platforms, 1580, 456, 6);
    this.addPlatformRun(platforms, 1980, 548, 10);
    this.addPlatformRun(platforms, 2200, 420, 3);
    this.addPlatformRun(platforms, 2392, 372, 3);
    this.addPlatformRun(platforms, 2584, 324, 4);
    this.addPlatformRun(platforms, 2920, 292, 3);
    this.addPlatformRun(platforms, 3112, 244, 3);
    this.addPlatformRun(platforms, 3304, 196, 4);
    this.addPlatformRun(platforms, 3540, 300, 1);
    this.addPlatformRun(platforms, 3720, 560, 7);
    this.addPlatformRun(platforms, 4280, 520, 5);
    this.addPlatformRun(platforms, 4700, 460, 4);
    this.addPlatformRun(platforms, 5000, 560, 7);
    this.addPlatformRun(platforms, 5380, 420, 3);
    this.addPlatformRun(platforms, 5600, 360, 3);
    this.addPlatformRun(platforms, 5880, 300, 4);
    this.addPlatformRun(platforms, 6260, 500, 5);
    this.addPlatformRun(platforms, 6620, 420, 4);
    this.addPlatformRun(platforms, 6960, 548, 8);
    this.addPlatformRun(platforms, 7350, 480, 3);
    this.addPlatformRun(platforms, 7600, 400, 4);
    this.addPlatformRun(platforms, 7900, 560, 6);
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
  }

  private updateBackground() {
    if (this.cityLoopBackground) {
      this.cityLoopBackground.tilePositionX = this.cameras.main.scrollX * 0.58;
      this.cityLoopBackground.y = -this.cameras.main.scrollY;
    }

  }

  private addBlock(platforms: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, texture: string, visible = true) {
    const block = platforms.create(x + TILE / 2, y + TILE / 2, texture);
    block.setVisible(visible);
    block.refreshBody();
  }

  private addPlatformRun(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
    units: number,
    collides = true,
  ) {
    for (let i = 0; i < units; i += 1) {
      let texture: PlatformAsset = PLATFORM_ASSETS.middle;
      if (units === 1) {
        texture = PLATFORM_ASSETS.single;
      } else if (i === 0) {
        texture = PLATFORM_ASSETS.left;
      } else if (i === units - 1) {
        texture = PLATFORM_ASSETS.right;
      }

      const unitX = x + i * PLATFORM_UNIT_WIDTH;
      this.add.image(unitX, y, texture).setOrigin(0, 0).setDepth(PLATFORM_DEPTH);
      if (collides) {
        this.addPlatformHitbox(platforms, unitX, y, PLATFORM_UNIT_WIDTH, PLATFORM_UNIT_HEIGHT);
      }
    }
  }

  private createStreetLamps() {
    [
      { x: 260, key: PROP_ASSETS.lampSingle, scale: 0.68 },
      { x: 910, key: PROP_ASSETS.lampDouble, scale: 0.64 },
      { x: 1500, key: PROP_ASSETS.lampSingle, scale: 0.66 },
      { x: 2140, key: PROP_ASSETS.lampDouble, scale: 0.66 },
      { x: 2860, key: PROP_ASSETS.lampSingle, scale: 0.68 },
      { x: 3440, key: PROP_ASSETS.lampDouble, scale: 0.64 },
      { x: 4040, key: PROP_ASSETS.lampSingle, scale: 0.66 },
      { x: 4540, key: PROP_ASSETS.lampDouble, scale: 0.64 },
      { x: 5200, key: PROP_ASSETS.lampSingle, scale: 0.66 },
      { x: 5850, key: PROP_ASSETS.lampDouble, scale: 0.64 },
      { x: 6480, key: PROP_ASSETS.lampSingle, scale: 0.68 },
      { x: 7160, key: PROP_ASSETS.lampDouble, scale: 0.64 },
      { x: 7820, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    ].forEach((lamp) => {
      this.add
        .image(lamp.x, STREET_LAMP_GROUND_Y, lamp.key)
        .setOrigin(0.5, 1)
        .setScale(lamp.scale)
        .setDepth(DECORATION_DEPTH);
    });
  }

  private createStageObjects() {
    [
      { x: 540, y: GROUND_TOP_Y, key: "stage-props-park-bench", scale: 0.9 },
      { x: 705, y: GROUND_TOP_Y, key: "stage-props-trash-bin", scale: 0.9 },
      { x: 1050, y: GROUND_TOP_Y, key: "stage-props-guard-rail", scale: 0.9 },
      { x: 1320, y: 548, key: "stage-props-traffic-cone", scale: 0.72 },
      { x: 1710, y: 456, key: "stage-props-planter-box", scale: 0.72 },
      { x: 2065, y: GROUND_TOP_Y, key: "stage-structures-bus-shelter", scale: 0.72 },
      { x: 2460, y: GROUND_TOP_Y, key: "stage-props-bus-stop-sign", scale: 0.85 },
      { x: 2705, y: 324, key: "stage-props-construction-barricade", scale: 0.64 },
      { x: 3020, y: GROUND_TOP_Y, key: "stage-props-vending-machine", scale: 0.8 },
      { x: 3360, y: GROUND_TOP_Y, key: "stage-structures-phone-booth", scale: 0.78 },
      { x: 3860, y: GROUND_TOP_Y, key: "stage-structures-subway-stairs", scale: 0.68 },
      { x: 4380, y: GROUND_TOP_Y, key: "stage-props-bike-rack", scale: 0.82 },
      { x: 4740, y: GROUND_TOP_Y, key: "stage-structures-vending-kiosk", scale: 0.78 },
      { x: 5140, y: 560, key: "stage-props-utility-box", scale: 0.58 },
      { x: 5520, y: 420, key: "stage-props-roadwork-sign", scale: 0.58 },
      { x: 5910, y: GROUND_TOP_Y, key: "stage-structures-station-wall-railing", scale: 0.72 },
      { x: 6360, y: GROUND_TOP_Y, key: "stage-structures-construction-fence", scale: 0.62 },
      { x: 6800, y: 420, key: "stage-props-sidewalk-sign", scale: 0.58 },
      { x: 7160, y: GROUND_TOP_Y, key: "stage-structures-street-kiosk", scale: 0.62 },
      { x: 7540, y: 480, key: "stage-props-planter-box", scale: 0.62 },
      { x: 7960, y: GROUND_TOP_Y, key: "stage-structures-station-entrance", scale: 0.64 },
    ].forEach((object) => {
      this.add
        .image(object.x, object.y, object.key)
        .setOrigin(0.5, 1)
        .setScale(object.scale)
        .setDepth(DECORATION_DEPTH);
    });
  }

  private addPlatformHitbox(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const block = platforms.create(x + width / 2, y + height / 2, "platform-hitbox");
    block.setDisplaySize(width, height);
    block.setVisible(false);
    block.refreshBody();
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
    const total = this.getItemScore();
    const itemScores = (Object.keys(ITEM_DEFINITIONS) as ItemType[])
      .map((itemType) => `${ITEM_DEFINITIONS[itemType].label}:${this.score[itemType]}`)
      .join("  ");
    this.scoreText.setText(`SCORE:${total}  ${itemScores}`);
  }

  private updateTimerText() {
    if (!this.timerText || this.hasWon) {
      return;
    }

    this.timerText.setText(`TIME:${this.getRemainingSeconds()}`);
  }

  private getItemScore() {
    return Object.values(this.score).reduce((sum, value) => sum + value, 0);
  }

  private getRemainingSeconds() {
    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
    return Math.max(0, GAME_TIME_SECONDS - elapsed);
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
    const remaining = this.getRemainingSeconds();
    const timeBonus = remaining * TIME_BONUS_PER_SECOND;
    const itemScore = this.getItemScore();
    const finalScore = itemScore + timeBonus;
    this.statusText.setText("GOAL!");
    this.timerText.setText(`TIME:${remaining}  BONUS:${timeBonus}`);
    this.scoreText.setText(`ITEM SCORE:${itemScore}`);
    this.startRainbowWinEffect();
    this.finalScoreText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        `CLEAR!\nSCORE ${finalScore}\nTIME BONUS ${timeBonus}`,
        {
          fontFamily: "monospace",
          fontSize: "48px",
          color: "#f8fafc",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setShadow(3, 3, "#020617", 4, true, true);
  }

  private registerRainbowPipeline() {
    if (this.game.renderer.type !== Phaser.WEBGL) {
      return;
    }

    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (renderer.pipelines.get(RAINBOW_PIPELINE_KEY)) {
      return;
    }

    renderer.pipelines.add(RAINBOW_PIPELINE_KEY, new RainbowWinPipeline(this.game));
  }

  private startRainbowWinEffect() {
    if (this.game.renderer.type === Phaser.WEBGL) {
      this.player.setPipeline(RAINBOW_PIPELINE_KEY);
    } else {
      this.player.setTint(0xff66ff, 0x66ffff, 0xffff66, 0x66ff66);
    }
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
