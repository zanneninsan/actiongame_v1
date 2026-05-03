import Phaser from "phaser";
import "./styles.css";
import {
  ITEM_DEFINITIONS,
  ITEM_GLOW_COLORS,
  ITEM_GLOW_TEXTURE_KEY,
  PLATFORM_ASSETS,
  PROP_ASSETS,
  STAGE_OBJECT_ASSETS,
  type ItemPlacement,
  type ItemType,
  type PlatformAsset,
  type PlatformRunPlacement,
  type ScoreState,
  type StageDecorationPlacement,
  type StreetLampKey,
  type StreetLampPlacement,
} from "./assets";
import { ACTIVE_STAGE, cloneStage } from "./stages";
import { RainbowWinPipeline } from "./rainbowPipeline";
import { StartCountdownOverlay } from "./countdown";
import { StartModal, type ControlMode } from "./startModal";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const TILE = 32;
const WORLD_TOP = -360;
const WORLD_BOTTOM = 720;
const WORLD_HEIGHT = WORLD_BOTTOM - WORLD_TOP;
const ASSET_BASE = import.meta.env.BASE_URL;
const DEBUG_VERSION = "v0.1.51";
const RAINBOW_PIPELINE_KEY = "RainbowWinPipeline";
const GAME_TIME_SECONDS = 360;
const TIME_BONUS_PER_SECOND = 10;
const PLATFORM_UNIT_WIDTH = 64;
const PLATFORM_UNIT_HEIGHT = 32;
const GROUND_TOP_Y = 672;
const GROUND_VISUAL_Y = GROUND_TOP_Y;
const STREET_LAMP_GROUND_Y = 672;
const PLATFORM_DEPTH = -0.55;
const DECORATION_DEPTH = -1.2;
const STREET_LAMP_LIGHT_DEPTH = DECORATION_DEPTH - 0.08;
const STREET_LAMP_GROUND_LIGHT_DEPTH = PLATFORM_DEPTH + 0.02;
const PLAYER_DISPLAY_WIDTH = 320;
const PLAYER_DISPLAY_HEIGHT = 260;
const PLAYER_BODY_WIDTH = 52;
const PLAYER_BODY_HEIGHT = 164;
const PLAYER_BODY_OFFSET_X = 134;
const PLAYER_BODY_OFFSET_Y = 86;
const PLAYER_CROUCH_BODY_WIDTH = 58;
const PLAYER_CROUCH_BODY_HEIGHT = 94;
const PLAYER_CROUCH_BODY_OFFSET_X = 131;
const PLAYER_CROUCH_BODY_OFFSET_Y = PLAYER_BODY_OFFSET_Y + PLAYER_BODY_HEIGHT - PLAYER_CROUCH_BODY_HEIGHT;
const PLAYER_IDLE_FRAME_COUNT = 8;
const PLAYER_FRAME_COUNT = 13;
const PLAYER_CROUCH_FRAME_COUNT = 27;
const GROUND_ACCELERATION = 2400;
const CROUCH_GROUND_ACCELERATION = 1600;
const AIR_ACCELERATION = 720;
const GROUND_DRAG = 2400;
const AIR_DRAG = 120;
const MAX_RUN_SPEED = 380;
const CROUCH_MAX_RUN_SPEED = 300;
const MAX_FALL_SPEED = 680;
const JUMP_VELOCITY = -575;
const BOOSTED_JUMP_VELOCITY = -655;
const BOOST_JUMP_SPEED_THRESHOLD = 285;
type MobileInputKey = "w" | "a" | "s" | "d";
type EditorTool = "platform" | "item" | "streetLamp" | "decoration" | "playerStart" | "goal";
type FullscreenTarget = HTMLElement & {
  msRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullscreen?: () => Promise<void> | void;
};

let extraTouchPointersAdded = false;

class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private goal?: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private itemsGroup?: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private cityLoopBackground?: Phaser.GameObjects.TileSprite;
  private playerNameText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private controlHintText!: Phaser.GameObjects.Text;
  private countdownOverlay?: StartCountdownOverlay;
  private finalScoreText?: Phaser.GameObjects.Text;
  private mobileInput: Record<MobileInputKey, boolean> = { w: false, a: false, s: false, d: false };
  private mobileJumpQueued = false;
  private mobileControlCleanup: Array<() => void> = [];
  private score: ScoreState = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0 };
  private startTime = 0;
  private isRunActive = false;
  private setupComplete = false;
  private playerName = "PLAYER";
  private controlMode: ControlMode = "pc";
  private soundVolumePercent = 50;
  private soundMuted = false;
  private startModal?: StartModal;
  private controlHint = "A/D: move  W/Space: jump  R: restart";
  private editorStage = cloneStage(ACTIVE_STAGE);
  private editorEnabled = false;
  private editorTool: EditorTool = "platform";
  private editorPanel?: HTMLDivElement;
  private editorExport?: HTMLTextAreaElement;
  private editorPlatformUnitsInput?: HTMLInputElement;
  private editorItemTypeSelect?: HTMLSelectElement;
  private editorLampTypeSelect?: HTMLSelectElement;
  private editorDecorationSelect?: HTMLSelectElement;
  private editorMarkers: Phaser.GameObjects.GameObject[] = [];
  private editorCleanup: Array<() => void> = [];
  private hasWon = false;
  private wasOnFloor = false;
  private isLanding = false;
  private landingFastForwarded = false;
  private collisionDebugEnabled = false;
  private collisionDebugGraphics?: Phaser.GameObjects.Graphics;
  private bgm?: Phaser.Sound.BaseSound;

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
    this.load.spritesheet("player-crouch", `${ASSET_BASE}assets/sprites/player_crouch_27_320x260.png`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.createPixelTexture("ground", TILE, TILE, 0x263244, 0x8bd3ff);
    this.createPixelTexture("platform", TILE, TILE, 0x384257, 0xf6c453);
    this.createPixelTexture("platform-hitbox", 1, 1, 0xffffff, 0xffffff);
    this.createPixelTexture("goal", 12, 48, 0xfb7185, 0x881337);
    this.load.audio("game-bgm", `${ASSET_BASE}assets/audio/gamebgm_default.mp3`);
    this.load.audio("item-pickup", `${ASSET_BASE}assets/audio/item_pickup.wav`);
  }

  create() {
    this.registerRainbowPipeline();
    this.playerName = this.getCookieValue("actiongame_player_name") || this.playerName;
    this.soundVolumePercent = this.getSavedVolumePercent();
    this.soundMuted = this.getCookieValue("actiongame_muted") === "1";
    this.applySoundSettings();
    this.resetRunState();
    if (!extraTouchPointersAdded) {
      this.input.addPointer(4);
      extraTouchPointersAdded = true;
    }
    this.physics.world.setBounds(0, WORLD_TOP, this.editorStage.worldWidth, WORLD_HEIGHT);
    this.createBackground();

    this.platforms = this.physics.add.staticGroup();
    this.buildStage(this.platforms);
    this.createStreetLamps();
    this.createStageObjects();

    const goal = this.physics.add.staticImage(this.editorStage.goal.x, this.editorStage.goal.y, "goal");
    goal.setDisplaySize(24, 96);
    goal.setSize(24, 96);
    this.goal = goal;

    this.createPlayerAnimations();

    this.player = this.physics.add.sprite(this.editorStage.playerStart.x, this.editorStage.playerStart.y, "player-idle");
    this.player.setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
    this.player.setCollideWorldBounds(true);
    this.applyPlayerBody();
    this.player.setMaxVelocity(MAX_RUN_SPEED, MAX_FALL_SPEED);
    this.player.play("player-idle");
    this.wasOnFloor = true;
    this.player.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}player-land`, () => {
      this.isLanding = false;
      this.landingFastForwarded = false;
      this.player.anims.timeScale = 1;
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, goal, () => this.win());
    this.createItems();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.cameras.main.setBounds(0, WORLD_TOP, this.editorStage.worldWidth, WORLD_HEIGHT);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(260, 140);
    this.cameras.main.setBackgroundColor("#080b16");
    this.collisionDebugGraphics = this.add.graphics().setDepth(300);

    this.playerNameText = this.add
      .text(58, 40, "", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#e0f2fe",
      })
      .setDepth(100)
      .setShadow(0, 0, "#22d3ee", 8, true, true)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(58, 68, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#f8fafc",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateScoreText();

    this.timerText = this.add
      .text(178, 68, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fde68a",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateTimerText();

    this.controlHintText = this.add
      .text(GAME_WIDTH - 82, 8, "", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#fde68a",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateControlHintText();

    this.input.keyboard!.off("keydown-R");
    this.input.keyboard!.on("keydown-R", () => this.restartStage());
    this.input.off("pointerdown", this.handleEditorPointerDown, this);
    this.input.on("pointerdown", this.handleEditorPointerDown, this);
    this.createStageEditor();
    this.createGlobalUI();

    this.bgm = this.sound.add("game-bgm", { loop: true, volume: 1.0 });

    if (this.setupComplete) {
      this.startRun();
    } else {
      this.physics.pause();
      this.showStartModal();
    }
  }

  update() {
    this.updateBackground();
    this.updateTimerText();
    if (!this.isRunActive) {
      this.applyPlayerBody(false);
      this.updateCollisionDebug();
      this.player.setAcceleration(0, 0);
      this.player.setVelocity(0, 0);
      return;
    }

    const onFloor = this.player.body.blocked.down || this.player.body.touching.down;
    const left = this.keys.a.isDown || this.cursors.left.isDown || this.mobileInput.a;
    const right = this.keys.d.isDown || this.cursors.right.isDown || this.mobileInput.d;
    const down = this.keys.s.isDown || this.cursors.down.isDown || this.mobileInput.s;
    const isCrouchInputActive = down && onFloor;
    this.applyPlayerBody(isCrouchInputActive);
    this.player.setMaxVelocity(isCrouchInputActive ? CROUCH_MAX_RUN_SPEED : MAX_RUN_SPEED, MAX_FALL_SPEED);
    this.updateCollisionDebug();
    const debugJump = Phaser.Input.Keyboard.JustDown(this.keys.w) || this.mobileJumpQueued;
    this.mobileJumpQueued = false;
    const normalJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);
    const jump = debugJump || normalJump;
    const canJump = onFloor || debugJump;
    let startedJump = false;
    const horizontalAcceleration = onFloor
      ? isCrouchInputActive
        ? CROUCH_GROUND_ACCELERATION
        : GROUND_ACCELERATION
      : AIR_ACCELERATION;
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
      this.landingFastForwarded = false;
      this.player.anims.timeScale = 1;
      startedJump = true;
      this.player.anims.play("player-jump-start", true);
    }

    const isMovingHorizontally = Math.abs(this.player.body.velocity.x) > 8;
    const landedThisFrame = !this.wasOnFloor && onFloor && !startedJump;
    const isCrouching = down && onFloor && !startedJump;

    if (landedThisFrame) {
      this.isLanding = true;
      this.landingFastForwarded = false;
      this.player.anims.timeScale = 1;
      this.player.anims.play("player-land", true);
    } else if (this.isLanding) {
      if (down) {
        this.isLanding = false;
        this.landingFastForwarded = false;
        this.player.anims.timeScale = 1;
        this.player.anims.play("player-crouch");
      } else if ((left || right) && !this.landingFastForwarded) {
        this.landingFastForwarded = true;
        this.player.anims.timeScale = 2;
      }
      if (!this.player.anims.isPlaying) {
        this.isLanding = false;
        this.landingFastForwarded = false;
        this.player.anims.timeScale = 1;
      }
    } else if (startedJump) {
      this.player.anims.play("player-jump-start", true);
    } else if (!onFloor) {
      const currentAnimation = this.player.anims.currentAnim?.key;
      if (currentAnimation !== "player-jump-start" || !this.player.anims.isPlaying) {
        this.player.anims.play("player-air", true);
      }
    } else if (isCrouching) {
      this.player.anims.timeScale = 1;
      if (this.player.anims.currentAnim?.key !== "player-crouch") {
        this.player.anims.play("player-crouch");
      }
    } else if (isMovingHorizontally) {
      this.player.anims.play("player-walk", true);
    } else {
      this.player.anims.play("player-idle", true);
    }

    this.wasOnFloor = onFloor;

    if (this.player.y > WORLD_BOTTOM + 32) {
      this.restartStage();
    }
  }

  private resetRunState() {
    this.removeStartModal();
    this.removeMobileControls();
    this.removeStageEditor();
    this.removeGlobalUI();
    this.countdownOverlay?.clear();
    this.countdownOverlay = undefined;
    this.mobileInput = { w: false, a: false, s: false, d: false };
    this.mobileJumpQueued = false;
    this.score = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0 };
    this.startTime = 0;
    this.isRunActive = false;
    this.hasWon = false;
    this.wasOnFloor = false;
    this.isLanding = false;
    this.landingFastForwarded = false;
    this.collisionDebugGraphics?.clear();
    this.collisionDebugGraphics = undefined;
    this.goal = undefined;
    this.finalScoreText = undefined;
  }

  private restartStage() {
    this.resetRunState();
    this.bgm?.stop();
    this.scene.restart();
  }

  private startRun() {
    this.removeStartModal();
    this.playerNameText.setText(`PLAYER:${this.playerName}`);
    this.controlHint =
      this.controlMode === "mobile" ? "TOUCH: move/jump  R: restart" : "A/D: move  W/Space: jump  R: restart";
    this.updateControlHintText();
    if (this.controlMode === "mobile") {
      this.createMobileControls();
    }
    this.startCountdown();
  }

  private startCountdown() {
    this.physics.pause();
    this.isRunActive = false;
    this.startTime = 0;
    this.updateTimerText();

    this.countdownOverlay = new StartCountdownOverlay({
      scene: this,
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      rainbowPipelineKey: RAINBOW_PIPELINE_KEY,
      onComplete: () => this.activateRun(),
    });
    this.countdownOverlay.start();
  }

  private activateRun() {
    this.countdownOverlay?.clear();
    this.countdownOverlay = undefined;
    this.startTime = this.time.now;
    this.isRunActive = true;
    this.physics.resume();
    this.updateTimerText();
    if (!this.bgm?.isPlaying) {
      this.bgm?.play();
    }
  }

  private showStartModal() {
    this.removeStartModal();

    this.startModal = new StartModal({
      playerName: this.playerName,
      controlMode: this.controlMode,
      soundOn: !this.soundMuted && this.soundVolumePercent > 0,
      onSoundOnChange: (soundOn) => this.setSoundEnabled(soundOn),
      onSubmit: ({ playerName, controlMode, soundOn }) => {
        this.playerName = playerName;
        this.setCookieValue("actiongame_player_name", this.playerName);
        this.controlMode = controlMode;
        this.setSoundEnabled(soundOn);
        this.setupComplete = true;
        if (this.controlMode === "mobile") {
          this.requestMobileFullscreen();
        }
        this.startRun();
      },
    });
    this.startModal.show();
  }

  private requestMobileFullscreen() {
    if (document.fullscreenElement) {
      return;
    }

    const target = document.documentElement as FullscreenTarget;
    const requestFullscreen =
      target.requestFullscreen ?? target.webkitRequestFullscreen ?? target.msRequestFullscreen;

    if (!requestFullscreen) {
      return;
    }

    void Promise.resolve(requestFullscreen.call(target)).catch(() => undefined);
  }

  private removeStartModal() {
    this.startModal?.remove();
    this.startModal = undefined;
    document.getElementById("start-modal")?.remove();
  }

  private getCookieValue(name: string) {
    const prefix = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(prefix));
    if (!cookie) {
      return "";
    }
    return decodeURIComponent(cookie.slice(prefix.length));
  }

  private setCookieValue(name: string, value: string) {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=Lax`;
  }

  private getSavedVolumePercent() {
    const savedVolume = Number(this.getCookieValue("actiongame_volume"));
    if (!Number.isFinite(savedVolume)) {
      return 50;
    }
    return Phaser.Math.Clamp(Math.round(savedVolume), 0, 100);
  }

  private saveVolumeSettings(volume: number, isMuted: boolean) {
    this.setCookieValue("actiongame_volume", String(Phaser.Math.Clamp(Math.round(volume), 0, 100)));
    this.setCookieValue("actiongame_muted", isMuted ? "1" : "0");
  }

  private applySoundSettings() {
    this.sound.volume = this.soundVolumePercent / 100;
    this.sound.mute = this.soundMuted;
    this.saveVolumeSettings(this.soundVolumePercent, this.soundMuted);
    this.refreshGlobalSoundUI();
  }

  private setSoundEnabled(soundOn: boolean) {
    if (soundOn && this.soundVolumePercent === 0) {
      this.soundVolumePercent = 50;
    }
    this.soundMuted = !soundOn;
    this.applySoundSettings();
  }

  private refreshGlobalSoundUI() {
    const bgmToggle = document.getElementById("bgm-toggle") as HTMLButtonElement | null;
    const volumeSlider = document.getElementById("volume-slider") as HTMLInputElement | null;
    if (volumeSlider) {
      volumeSlider.value = String(this.soundVolumePercent);
    }
    if (bgmToggle) {
      bgmToggle.innerHTML = this.soundMuted || this.soundVolumePercent === 0 ? "&#128263;" : "&#128266;";
    }
  }

  private buildStage(platforms: Phaser.Physics.Arcade.StaticGroup) {
    for (let x = 0; x < this.editorStage.worldWidth; x += TILE) {
      this.addBlock(platforms, x, GROUND_TOP_Y, "ground", false);
    }

    this.addPlatformRun(platforms, 0, GROUND_VISUAL_Y, Math.ceil(this.editorStage.worldWidth / PLATFORM_UNIT_WIDTH) + 1, false);
    this.editorStage.platforms.forEach((platform) => {
      this.addPlatformRun(platforms, platform.x, platform.y, platform.units, platform.collides ?? true);
    });
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
    this.editorStage.streetLamps.forEach((lamp) => {
      this.createStreetLamp(lamp);
    });
  }

  private createStreetLamp(lamp: StreetLampPlacement) {
    this.createStreetLampLight(lamp.x, lamp.key, lamp.scale);
    this.add
      .image(lamp.x, STREET_LAMP_GROUND_Y, lamp.key)
      .setOrigin(0.5, 1)
      .setScale(lamp.scale)
      .setDepth(DECORATION_DEPTH);
  }

  private createStreetLampLight(x: number, key: StreetLampKey, scale: number) {
    const isDoubleLamp = key === PROP_ASSETS.lampDouble;
    const sourceY = STREET_LAMP_GROUND_Y - 420 * scale;
    const groundY = STREET_LAMP_GROUND_Y - 5;
    const sources = isDoubleLamp ? [-92 * scale, 92 * scale] : [32 * scale];

    sources.forEach((offsetX) => {
      const sourceX = x + offsetX;
      const beamHalfWidth = (isDoubleLamp ? 150 : 190) * scale;
      const poolWidth = (isDoubleLamp ? 210 : 250) * scale;
      const light = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);

      light.fillStyle(0xffefad, 0.12);
      light.fillTriangle(sourceX, sourceY, sourceX - beamHalfWidth, groundY, sourceX + beamHalfWidth, groundY);
      light.fillStyle(0xfff4c7, 0.07);
      light.fillTriangle(sourceX, sourceY - 8 * scale, sourceX - beamHalfWidth * 0.72, groundY, sourceX + beamHalfWidth * 0.72, groundY);
      light.setDepth(STREET_LAMP_LIGHT_DEPTH);

      const groundLight = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
      groundLight.fillStyle(0xffe7a3, 0.17);
      groundLight.fillEllipse(sourceX, groundY + 2, poolWidth, 26 * scale);
      groundLight.fillStyle(0xfff8d2, 0.1);
      groundLight.fillEllipse(sourceX, groundY + 1, poolWidth * 0.58, 12 * scale);
      groundLight.setDepth(STREET_LAMP_GROUND_LIGHT_DEPTH);

    });
  }

  private createStageObjects() {
    this.editorStage.decorations.forEach((object) => {
      this.createStageDecoration(object);
    });
  }

  private createStageDecoration(object: StageDecorationPlacement) {
    this.add
      .image(object.x, object.y, object.key)
      .setOrigin(0.5, 1)
      .setScale(object.scale)
      .setDepth(DECORATION_DEPTH);
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

  private createMobileControls() {
    this.removeMobileControls();

    const controls = document.createElement("div");
    controls.id = "mobile-controls";
    controls.innerHTML = `
      <div class="mobile-pad">
        <button class="mobile-button pad-up" data-key="w" type="button" aria-label="Jump">&uarr;</button>
        <button class="mobile-button pad-left" data-key="a" type="button" aria-label="Move left">&larr;</button>
        <button class="mobile-button pad-down" data-key="s" type="button" aria-label="Down">&darr;</button>
        <button class="mobile-button pad-right" data-key="d" type="button" aria-label="Move right">&rarr;</button>
      </div>
      <div class="mobile-actions">
        <button class="mobile-button" data-key="w" type="button" aria-label="Jump">&uarr;</button>
        <button class="mobile-button restart-button" data-action="restart" type="button">R</button>
      </div>
    `;
    document.body.appendChild(controls);

    controls.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((button) => {
      const key = button.dataset.key as MobileInputKey;
      this.bindMobileButton(button, (pressed) => {
        this.mobileInput[key] = pressed;
        if (key === "w" && pressed) {
          this.mobileJumpQueued = true;
        }
      });
    });

    const restartButton = controls.querySelector<HTMLButtonElement>("[data-action='restart']");
    if (restartButton) {
      this.bindMobileButton(restartButton, (pressed) => {
        if (pressed) {
          this.restartStage();
        }
      });
    }
  }

  private bindMobileButton(button: HTMLButtonElement, onPressedChange: (pressed: boolean) => void) {
    const activePointers = new Set<number>();
    const setPressed = (pressed: boolean) => {
      button.classList.toggle("is-pressed", pressed);
      onPressedChange(pressed);
    };
    const clearPressed = () => {
      activePointers.clear();
      setPressed(false);
    };
    const press = (event: PointerEvent) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      activePointers.add(event.pointerId);
      setPressed(true);
    };
    const release = (event: PointerEvent) => {
      event.preventDefault();
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
      activePointers.delete(event.pointerId);
      setPressed(activePointers.size > 0);
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    window.addEventListener("blur", clearPressed);
    document.addEventListener("visibilitychange", clearPressed);
    this.mobileControlCleanup.push(() => {
      button.removeEventListener("pointerdown", press);
      button.removeEventListener("pointerup", release);
      button.removeEventListener("pointercancel", release);
      button.removeEventListener("lostpointercapture", release);
      window.removeEventListener("blur", clearPressed);
      document.removeEventListener("visibilitychange", clearPressed);
    });
  }

  private removeMobileControls() {
    this.mobileControlCleanup.forEach((cleanup) => cleanup());
    this.mobileControlCleanup = [];
    document.getElementById("mobile-controls")?.remove();
  }

  private createStageEditor() {
    this.removeStageEditor();

    const panel = document.createElement("div");
    panel.id = "stage-editor";
    panel.innerHTML = `
      <button class="editor-toggle" type="button">EDITOR</button>
      <div class="editor-body">
        <div class="editor-row">
          <label>Tool</label>
          <select data-editor-tool>
            <option value="platform">Platform</option>
            <option value="item">Item</option>
            <option value="streetLamp">Street Lamp</option>
            <option value="decoration">Decoration</option>
            <option value="playerStart">Player Start</option>
            <option value="goal">Goal</option>
          </select>
        </div>
        <div class="editor-row">
          <label>Units</label>
          <input data-platform-units type="number" min="1" max="16" value="3" />
        </div>
        <div class="editor-row">
          <label>Item</label>
          <select data-item-type>
            <option value="energyDrink">Energy</option>
            <option value="bubbleTea">Tea</option>
            <option value="shoppingBag">Bag</option>
          </select>
        </div>
        <div class="editor-row">
          <label>Lamp</label>
          <select data-lamp-type>
            <option value="${PROP_ASSETS.lampSingle}">Single</option>
            <option value="${PROP_ASSETS.lampDouble}">Double</option>
          </select>
        </div>
        <div class="editor-row">
          <label>Object</label>
          <select data-decoration-key>
            ${STAGE_OBJECT_ASSETS.map((asset) => `<option value="${asset.key}">${asset.key.replace("stage-", "")}</option>`).join("")}
          </select>
        </div>
        <p class="editor-help">Enable, then click the stage. Export copies current placements as JSON.</p>
        <button class="editor-export-button" type="button">EXPORT JSON</button>
        <textarea data-editor-export readonly spellcheck="false"></textarea>
      </div>
    `;

    document.body.appendChild(panel);
    this.editorPanel = panel;
    this.editorExport = panel.querySelector<HTMLTextAreaElement>("[data-editor-export]")!;
    this.editorPlatformUnitsInput = panel.querySelector<HTMLInputElement>("[data-platform-units]")!;
    this.editorItemTypeSelect = panel.querySelector<HTMLSelectElement>("[data-item-type]")!;
    this.editorLampTypeSelect = panel.querySelector<HTMLSelectElement>("[data-lamp-type]")!;
    this.editorDecorationSelect = panel.querySelector<HTMLSelectElement>("[data-decoration-key]")!;

    const toggleButton = panel.querySelector<HTMLButtonElement>(".editor-toggle")!;
    const toolSelect = panel.querySelector<HTMLSelectElement>("[data-editor-tool]")!;
    const exportButton = panel.querySelector<HTMLButtonElement>(".editor-export-button")!;
    const toggleEditor = () => {
      this.editorEnabled = !this.editorEnabled;
      panel.classList.toggle("is-open", this.editorEnabled);
      toggleButton.textContent = this.editorEnabled ? "EDITOR ON" : "EDITOR";
    };
    const setTool = () => {
      this.editorTool = toolSelect.value as EditorTool;
    };
    const exportStage = () => {
      this.refreshEditorExport();
      this.editorExport?.select();
      void navigator.clipboard?.writeText(this.editorExport?.value ?? "").catch(() => undefined);
    };

    toggleButton.addEventListener("click", toggleEditor);
    toolSelect.addEventListener("change", setTool);
    exportButton.addEventListener("click", exportStage);
    this.editorCleanup.push(() => {
      toggleButton.removeEventListener("click", toggleEditor);
      toolSelect.removeEventListener("change", setTool);
      exportButton.removeEventListener("click", exportStage);
    });
    this.refreshEditorExport();
  }

  private removeStageEditor() {
    this.editorCleanup.forEach((cleanup) => cleanup());
    this.editorCleanup = [];
    this.editorPanel?.remove();
    this.editorPanel = undefined;
    this.editorExport = undefined;
    this.editorPlatformUnitsInput = undefined;
    this.editorItemTypeSelect = undefined;
    this.editorLampTypeSelect = undefined;
    this.editorDecorationSelect = undefined;
    this.editorEnabled = false;
    this.editorMarkers.forEach((marker) => marker.destroy());
    this.editorMarkers = [];
  }

  private createGlobalUI() {
    this.removeGlobalUI();

    const uiContainer = document.createElement("div");
    uiContainer.id = "global-ui";
    uiContainer.innerHTML = `
      <span id="version-label">${DEBUG_VERSION}</span>
      <button id="collision-debug-toggle" class="ui-button debug-toggle" type="button" aria-label="Toggle collision boxes">HIT</button>
      <button id="bgm-toggle" class="ui-button" type="button" aria-label="Toggle Sound">&#128266;</button>
      <button id="options-toggle" class="ui-button" type="button" aria-label="Options">&#9881;&#65039;</button>
    `;
    document.body.appendChild(uiContainer);

    const optionsModal = document.createElement("div");
    optionsModal.id = "options-modal";
    optionsModal.innerHTML = `
      <div class="options-dialog">
        <h2>Options</h2>
        <label>
          <span>Volume</span>
          <input id="volume-slider" type="range" min="0" max="100" />
        </label>
        <button id="options-close" class="ui-button" type="button">Close</button>
      </div>
    `;
    document.body.appendChild(optionsModal);

    const bgmToggle = document.getElementById("bgm-toggle") as HTMLButtonElement;
    const collisionDebugToggle = document.getElementById("collision-debug-toggle") as HTMLButtonElement;
    const optionsToggle = document.getElementById("options-toggle") as HTMLButtonElement;
    const optionsClose = document.getElementById("options-close") as HTMLButtonElement;
    const volumeSlider = document.getElementById("volume-slider") as HTMLInputElement;

    this.applySoundSettings();
    collisionDebugToggle.classList.toggle("is-active", this.collisionDebugEnabled);

    collisionDebugToggle.addEventListener("click", () => {
      this.collisionDebugEnabled = !this.collisionDebugEnabled;
      collisionDebugToggle.classList.toggle("is-active", this.collisionDebugEnabled);
      this.updateCollisionDebug();
    });

    bgmToggle.addEventListener("click", () => {
      const currentVolume = parseInt(volumeSlider.value, 10);
      if (currentVolume === 0) {
        this.soundVolumePercent = 50;
        this.soundMuted = false;
      } else {
        this.soundMuted = !this.soundMuted;
      }
      this.applySoundSettings();
    });

    optionsToggle.addEventListener("click", () => {
      optionsModal.style.display = "grid";
    });

    optionsClose.addEventListener("click", () => {
      optionsModal.style.display = "none";
    });

    volumeSlider.addEventListener("input", (e) => {
      e.stopPropagation();
      const val = parseInt(volumeSlider.value, 10);
      this.soundVolumePercent = val;
      if (val > 0 && this.soundMuted) {
        this.soundMuted = false;
      }
      this.applySoundSettings();
    });

    optionsModal.addEventListener("keydown", (e) => e.stopPropagation());
    optionsModal.addEventListener("keyup", (e) => e.stopPropagation());
    optionsModal.addEventListener("keypress", (e) => e.stopPropagation());
    optionsModal.addEventListener("pointerdown", (e) => e.stopPropagation());
    uiContainer.addEventListener("pointerdown", (e) => e.stopPropagation());
  }

  private removeGlobalUI() {
    document.getElementById("global-ui")?.remove();
    document.getElementById("options-modal")?.remove();
  }

  private handleEditorPointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.editorEnabled || pointer.event?.target !== this.game.canvas) {
      return;
    }

    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const x = Math.round(point.x / TILE) * TILE;
    const y = Math.round(point.y / TILE) * TILE;

    if (this.editorTool === "platform") {
      const units = Phaser.Math.Clamp(Number(this.editorPlatformUnitsInput?.value) || 3, 1, 16);
      const placement: PlatformRunPlacement = { x, y, units };
      this.editorStage.platforms.push(placement);
      this.addPlatformRun(this.platforms, placement.x, placement.y, placement.units, placement.collides ?? true);
    } else if (this.editorTool === "item") {
      const type = (this.editorItemTypeSelect?.value ?? "energyDrink") as ItemType;
      const placement: ItemPlacement = { type, x, y };
      this.editorStage.items.push(placement);
      this.createItemSprite(placement);
    } else if (this.editorTool === "streetLamp") {
      const key = (this.editorLampTypeSelect?.value ?? PROP_ASSETS.lampSingle) as StreetLampKey;
      const placement: StreetLampPlacement = { x, key, scale: key === PROP_ASSETS.lampDouble ? 0.64 : 0.66 };
      this.editorStage.streetLamps.push(placement);
      this.createStreetLamp(placement);
    } else if (this.editorTool === "decoration") {
      const key = this.editorDecorationSelect?.value ?? STAGE_OBJECT_ASSETS[0].key;
      const placement: StageDecorationPlacement = { x, y, key, scale: 0.68 };
      this.editorStage.decorations.push(placement);
      this.createStageDecoration(placement);
    } else if (this.editorTool === "playerStart") {
      this.editorStage.playerStart = { x, y };
      this.addEditorMarker(x, y, 0x38bdf8, "START");
    } else if (this.editorTool === "goal") {
      this.editorStage.goal = { x, y };
      this.addEditorMarker(x, y, 0xfb7185, "GOAL");
    }

    this.refreshEditorExport();
  }

  private addEditorMarker(x: number, y: number, color: number, label: string) {
    const marker = this.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.editorMarkers.push(marker);
  }

  private refreshEditorExport() {
    if (this.editorExport) {
      this.editorExport.value = JSON.stringify(this.editorStage, null, 2);
    }
  }

  private createItems() {
    const items = this.physics.add.staticGroup();
    this.itemsGroup = items;
    this.createItemGlowTexture();

    this.editorStage.items.forEach((placement) => {
      this.createItemSprite(placement);
    });

    this.physics.add.overlap(this.player, items, (_, itemObject) => {
      this.collectItem(itemObject as Phaser.Physics.Arcade.Sprite);
    });
  }

  private createItemSprite(placement: ItemPlacement) {
    if (!this.itemsGroup) {
      return;
    }

    const definition = ITEM_DEFINITIONS[placement.type];
    const glow = this.add
      .image(placement.x, placement.y, ITEM_GLOW_TEXTURE_KEY)
      .setDisplaySize(108, 108)
      .setTint(ITEM_GLOW_COLORS[placement.type])
      .setAlpha(0.48)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(0.1);
    const item = this.itemsGroup.create(placement.x, placement.y, definition.key) as Phaser.Physics.Arcade.Sprite;
    item.setData("itemType", placement.type);
    item.setData("glow", glow);
    item.setDisplaySize(48, 48);
    item.setDepth(0.2);
    item.refreshBody();

    this.tweens.add({
      targets: glow,
      alpha: 0.72,
      scale: 1.16,
      duration: 950,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: (placement.x % 700) + (placement.y % 180),
    });
  }

  private createItemGlowTexture() {
    if (this.textures.exists(ITEM_GLOW_TEXTURE_KEY)) {
      return;
    }

    const size = 96;
    const center = size / 2;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);

    for (let radius = center; radius > 0; radius -= 3) {
      const strength = 1 - radius / center;
      graphics.fillStyle(0xffffff, 0.018 + strength * 0.055);
      graphics.fillCircle(center, center, radius);
    }

    graphics.generateTexture(ITEM_GLOW_TEXTURE_KEY, size, size);
    graphics.destroy();
  }

  private collectItem(item: Phaser.Physics.Arcade.Sprite) {
    if (!item.active) {
      return;
    }

    const itemType = item.getData("itemType") as ItemType;
    const definition = ITEM_DEFINITIONS[itemType];
    this.score[itemType] += definition.points;
    this.sound.play("item-pickup", { volume: 0.65 });
    this.updateScoreText();
    const glow = item.getData("glow") as Phaser.GameObjects.Image | undefined;
    if (glow) {
      this.tweens.killTweensOf(glow);
      glow.destroy();
    }
    item.disableBody(true, true);
  }

  private updateScoreText() {
    const total = this.getItemScore();
    this.scoreText.setText(`SCORE:${total}`);
  }

  private updateTimerText() {
    if (!this.timerText || this.hasWon) {
      return;
    }

    this.timerText.setText(`TIME:${this.getRemainingSeconds()}`);
  }

  private updateControlHintText() {
    if (!this.controlHintText) {
      return;
    }

    this.controlHintText.setText(this.controlHint);
  }

  private updateCollisionDebug() {
    if (!this.collisionDebugGraphics) {
      return;
    }

    this.collisionDebugGraphics.clear();
    if (!this.collisionDebugEnabled) {
      return;
    }

    if (this.player.body) {
      this.drawCollisionBody(this.player.body, 0x38bdf8, 0.28);
    }

    this.platforms?.getChildren().forEach((child) => {
      const body = (child as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody | undefined;
      if (body) {
        this.drawCollisionBody(body, 0xfacc15, 0.12);
      }
    });

    this.itemsGroup?.getChildren().forEach((child) => {
      const item = child as Phaser.Physics.Arcade.Sprite;
      if (item.active && item.body) {
        this.drawCollisionBody(item.body as Phaser.Physics.Arcade.StaticBody, 0x22c55e, 0.18);
      }
    });

    if (this.goal?.body) {
      this.drawCollisionBody(this.goal.body, 0xfb7185, 0.2);
    }
  }

  private drawCollisionBody(
    body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody,
    color: number,
    fillAlpha: number,
  ) {
    this.collisionDebugGraphics
      ?.lineStyle(2, color, 0.95)
      .fillStyle(color, fillAlpha)
      .fillRect(body.x, body.y, body.width, body.height)
      .strokeRect(body.x, body.y, body.width, body.height);
  }

  private getItemScore() {
    return Object.values(this.score).reduce((sum, value) => sum + value, 0);
  }

  private getRemainingSeconds() {
    if (!this.isRunActive || this.startTime === 0) {
      return GAME_TIME_SECONDS;
    }

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

    this.anims.create({
      key: "player-crouch",
      frames: this.anims.generateFrameNumbers("player-crouch", {
        start: 0,
        end: PLAYER_CROUCH_FRAME_COUNT - 1,
      }),
      frameRate: 16,
      repeat: 0,
    });
  }

  private applyPlayerBody(isCrouching = false) {
    if (isCrouching) {
      this.player.setSize(PLAYER_CROUCH_BODY_WIDTH, PLAYER_CROUCH_BODY_HEIGHT);
      this.player.setOffset(PLAYER_CROUCH_BODY_OFFSET_X, PLAYER_CROUCH_BODY_OFFSET_Y);
      return;
    }

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
