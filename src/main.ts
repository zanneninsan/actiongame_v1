import Phaser from "phaser";
import "./styles.css";
import {
  ITEM_DEFINITIONS,
  ENEMY_DEFINITIONS,
  PLATFORM_ASSETS,
  PROP_ASSETS,
  STAGE_OBJECT_ASSETS,
  resolveStageName,
  type ItemType,
  type ScoreState,
} from "./assets";
import { DEFAULT_STAGE_ID, PLAYABLE_STAGE_IDS, STAGES, cloneStage, type StageId } from "./stages";
import { RainbowWinPipeline } from "./rainbowPipeline";
import { StartCountdownOverlay } from "./countdown";
import { StartModal, type ControlMode, type StageOption } from "./startModal";
import { StageEditor } from "./stageEditor";
import { resolveStageConstants, type ResolvedStageConstants } from "./stageConstants";
import {
  createStoryDialogue,
  DEFAULT_STORY_DIALOGUE_LINES,
  type StoryDialogueController,
} from "./storyDialogue";
import { getBrowserLocale, isLocale, LOCALE_STORAGE_KEY, t, type Locale } from "./i18n";
import { MIDGROUND_BACKGROUNDS, REAR_BACKGROUNDS } from "virtual:background-assets";
import {
  createEnemies,
  createEnemyAnimations,
  freezeEnemies,
  populateEnemies,
  updateEnemies,
} from "./enemies";
import { createItems, populateItems } from "./items";
import {
  renderStageObjects,
  updateMovingPlatforms,
  type MovingPlatformInstance,
} from "./stageRenderer";
import { BackgroundController } from "./backgrounds";
import {
  createGlobalUI as createGlobalUIElements,
  removeGlobalUI as removeGlobalUIElements,
  setGlobalSoundUI,
} from "./globalUi";
import {
  createMobileControls as createMobileControlElements,
  type MobileInputKey,
} from "./mobileControls";
import { DanmakuOverlay } from "./danmaku";
import {
  fetchLeaderboardEntries,
  isLeaderboardConfigured,
  submitLeaderboardScore,
} from "./leaderboard";
import { showLeaderboardPanel } from "./leaderboardUi";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const TILE = 32;
const ASSET_BASE = import.meta.env.BASE_URL;
const DEBUG_VERSION = "v0.1.167";
const STAGE_ID_STORAGE_KEY = "actiongame_stage_id";
const LEADERBOARD_PLAYER_ID_STORAGE_KEY = "actiongame_leaderboard_player_id";
const RAINBOW_PIPELINE_KEY = "RainbowWinPipeline";
const GAME_TIME_SECONDS = 360;
const GAME_TIME_MS = GAME_TIME_SECONDS * 1000;
const STORY_DIALOGUE_ADVANCE_X = 600;
const STORY_DIALOGUE_STEP_DELAY_MS = 8000;
const TIME_BONUS_PER_SECOND = 10;
const SCORE_DANMAKU_THRESHOLD = 1000;
const CROUCH_DANMAKU_HOLD_MS = 2000;
const JUMP_CHAIN_DANMAKU_COUNT = 5;
const FALL_MISS_RESTART_DELAY_MS = 4800;
const FALL_RESET_WORLD_MARGIN = 640;
const PLATFORM_UNIT_WIDTH = 64;
const PLATFORM_UNIT_HEIGHT = 32;
const GOAL_TEXTURE_KEY = "goal-gate";
const GOAL_DISPLAY_WIDTH = 58;
const GOAL_DISPLAY_HEIGHT = 192;
const DAMAGE_INVULNERABLE_MS = 1150;
const DAMAGE_INPUT_LOCK_MS = 280;
const DAMAGE_KNOCKBACK_X = 430;
const DAMAGE_KNOCKBACK_Y = -245;
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
const PLAYER_LONG_IDLE_FRAME_COUNT = 29;
const PLAYER_FRAME_COUNT = 13;
const PLAYER_CROUCH_FRAME_COUNT = 27;
const PLAYER_DEFEAT_FRAME_COUNT = 8;
const PLAYER_LONG_IDLE_TRIGGER_MS = 5000;
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
const DASH_SPEED_MULTIPLIER = 2;
const DASH_MAX_VERTICAL_SPEED = Math.abs(BOOSTED_JUMP_VELOCITY) * DASH_SPEED_MULTIPLIER;
const MOBILE_FULLSCREEN_MIN_LANDSCAPE_HEIGHT = 430;
const DECORATION_PLATFORM_LAND_TOLERANCE = 6;
const DECORATION_PLATFORM_DROP_CROUCH_MS = 500;
const DECORATION_PLATFORM_DROP_VELOCITY = 140;
type FullscreenTarget = HTMLElement & {
  msRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type OrientationLockScreen = Screen & {
  orientation?: ScreenOrientation & {
    lock?: (orientation: OrientationLockType) => Promise<void>;
  };
};

let extraTouchPointersAdded = false;
let stageBackgroundDefaultsAppliedFor: StageId | undefined;

class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private goal?: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private movingPlatforms!: Phaser.Physics.Arcade.Group;
  private movingPlatformInstances: MovingPlatformInstance[] = [];
  private decorationPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private itemsGroup?: Phaser.Physics.Arcade.StaticGroup;
  private enemiesGroup?: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"w" | "a" | "s" | "d" | "shift", Phaser.Input.Keyboard.Key>;
  private backgrounds?: BackgroundController;
  private playerNameText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private controlHintText!: Phaser.GameObjects.Text;
  private countdownOverlay?: StartCountdownOverlay;
  private finalScoreText?: Phaser.GameObjects.Text;
  private missText?: Phaser.GameObjects.Text;
  private danmaku?: DanmakuOverlay;
  private mobileInput: Record<MobileInputKey, boolean> = { w: false, a: false, s: false, d: false, shift: false };
  private mobileJumpQueued = false;
  private mobileControlCleanup: Array<() => void> = [];
  private mobileOrientationCleanup: Array<() => void> = [];
  private score: ScoreState = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0 };
  private startTime = 0;
  private isRunActive = false;
  private isRestarting = false;
  private setupComplete = false;
  private playerName = "PLAYER";
  private leaderboardPlayerId = "";
  private controlMode: ControlMode = "pc";
  private currentStageId: StageId = DEFAULT_STAGE_ID;
  private locale: Locale = getBrowserLocale();
  private soundVolumePercent = 50;
  private soundMuted = false;
  private danmakuEnabled = true;
  private startModal?: StartModal;
  private controlHint = t(this.locale, "hint.pc");
  private editorStage = cloneStage(STAGES[DEFAULT_STAGE_ID]);
  private stageConstants: ResolvedStageConstants = resolveStageConstants(STAGES[DEFAULT_STAGE_ID]);
  private stageEditor?: StageEditor;
  private storyDialogue?: StoryDialogueController;
  private hasAdvancedStoryDialogueAtX = false;
  private storyDialogueNextEvent?: Phaser.Time.TimerEvent;
  private storyDialogueRemoveEvent?: Phaser.Time.TimerEvent;
  private stageRenderObjects: Phaser.GameObjects.GameObject[] = [];
  private hasWon = false;
  private hasScoreMilestoneDanmakuPlayed = false;
  private crouchDanmakuStartedAt = 0;
  private hasCrouchDanmakuPlayed = false;
  private jumpChainCount = 0;
  private hasJumpChainDanmakuPlayed = false;
  private wasOnFloor = false;
  private isLanding = false;
  private landingFastForwarded = false;
  private idleStartedAt = 0;
  private isLongIdlePlaying = false;
  private isDefeatSequenceActive = false;
  private hurtUntil = 0;
  private invulnerableUntil = 0;
  private damageTween?: Phaser.Tweens.Tween;
  private collisionDebugEnabled = false;
  private collisionDebugGraphics?: Phaser.GameObjects.Graphics;
  private decorationPlatformCrouchStartedAt = 0;
  private dropThroughDecorationPlatformBody?: Phaser.Physics.Arcade.StaticBody;
  private bgm?: Phaser.Sound.BaseSound;

  constructor() {
    super("prototype");
  }

  preload() {
    REAR_BACKGROUNDS.forEach((background) => {
      this.load.image(background.key, `${ASSET_BASE}${background.path}`);
    });
    MIDGROUND_BACKGROUNDS.forEach((background) => {
      this.load.image(background.key, `${ASSET_BASE}${background.path}`);
    });
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
    Object.values(ENEMY_DEFINITIONS).forEach((enemy) => {
      if (enemy.assetPath) {
        this.load.image(enemy.key, `${ASSET_BASE}${enemy.assetPath}`);
      }
      if (enemy.animation) {
        this.load.spritesheet(enemy.animation.key, `${ASSET_BASE}${enemy.animation.assetPath}`, {
          frameWidth: enemy.animation.frameWidth,
          frameHeight: enemy.animation.frameHeight,
        });
      }
    });
    this.load.spritesheet("player-idle", `${ASSET_BASE}assets/sprites/player_idle_8_320x260.webp`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-longidle", `${ASSET_BASE}assets/sprites/player_longidle_320x260.webp`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-walk", `${ASSET_BASE}assets/sprites/player_walk_13_320x260.webp`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-jump", `${ASSET_BASE}assets/sprites/player_jump_15_320x260.webp`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-crouch", `${ASSET_BASE}assets/sprites/player_crouch_27_9x3_320x260.webp`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-defeat", `${ASSET_BASE}assets/sprites/player_defeat_8_320x260.webp`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.createPixelTexture("platform-hitbox", 1, 1, 0xffffff, 0xffffff);
    this.load.image(GOAL_TEXTURE_KEY, `${ASSET_BASE}assets/stage_objects/goal_gate.webp`);
    this.load.audio("game-bgm", `${ASSET_BASE}assets/audio/gamebgm_default.mp3`);
    this.load.audio("item-pickup", `${ASSET_BASE}assets/audio/item_pickup.wav`);
    this.load.audio("countdown-tick", `${ASSET_BASE}assets/audio/countdown_tick.wav`);
    this.load.audio("countdown-go", `${ASSET_BASE}assets/audio/countdown_go.wav`);
  }

  create() {
    this.registerRainbowPipeline();
    this.playerName = this.getCookieValue("actiongame_player_name") || this.playerName;
    this.leaderboardPlayerId = this.getOrCreateLeaderboardPlayerId();
    this.locale = this.getSavedLocale();
    this.currentStageId = this.getSavedStageId();
    this.editorStage = cloneStage(STAGES[this.currentStageId]);
    this.soundVolumePercent = this.getSavedVolumePercent();
    this.soundMuted = this.getCookieValue("actiongame_muted") === "1";
    this.danmakuEnabled = this.getCookieValue("actiongame_danmaku_disabled") !== "1";
    this.applySoundSettings();
    this.resetRunState();
    this.isRestarting = false;
    this.stageConstants = resolveStageConstants(this.editorStage);
    if (!extraTouchPointersAdded) {
      this.input.addPointer(4);
      extraTouchPointersAdded = true;
    }
    this.physics.world.setBounds(
      0,
      this.stageConstants.worldTop,
      this.editorStage.worldWidth,
      this.stageConstants.worldHeight + FALL_RESET_WORLD_MARGIN,
    );
    this.createBackground();

    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
    this.decorationPlatforms = this.physics.add.staticGroup();
    this.rebuildEditableStageObjects();

    const goal = this.physics.add.staticImage(this.editorStage.goal.x, this.editorStage.goal.y, GOAL_TEXTURE_KEY);
    goal.setDisplaySize(GOAL_DISPLAY_WIDTH, GOAL_DISPLAY_HEIGHT);
    goal.setSize(GOAL_DISPLAY_WIDTH, GOAL_DISPLAY_HEIGHT);
    goal.refreshBody();
    this.goal = goal;

    this.createPlayerAnimations();
    createEnemyAnimations(this);

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
    this.player.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}player-longidle`, () => {
      this.isLongIdlePlaying = false;
      this.idleStartedAt = this.time.now;
      if (this.isRunActive && this.player.anims.currentAnim?.key === "player-longidle") {
        this.player.anims.play("player-idle", true);
      }
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(this.player, this.decorationPlatforms, undefined, this.canLandOnDecorationPlatform, this);
    this.physics.add.overlap(this.player, goal, () => this.win());
    this.itemsGroup = createItems({
      scene: this,
      player: this.player,
      placements: this.editorStage.items,
      canCollect: () => !this.stageEditor?.isEnabled,
      onCollect: (itemType, points) => {
        this.score[itemType] += points;
        this.updateScoreText();
        this.tryEmitScoreDanmaku();
      },
      trackStageObject: (object) => this.trackStageObject(object),
    });
    this.enemiesGroup = createEnemies(this, this.player, this.editorStage.enemies ?? [], (enemy) =>
      this.damagePlayer(enemy),
    );
    this.physics.add.collider(this.enemiesGroup, this.platforms);
    this.physics.add.collider(this.enemiesGroup, this.movingPlatforms);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      shift: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };

    this.cameras.main.setBounds(0, this.stageConstants.worldTop, this.editorStage.worldWidth, this.stageConstants.worldHeight);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(260, 140);
    this.cameras.main.setBackgroundColor("#080b16");
    this.collisionDebugGraphics = this.add.graphics().setDepth(300);

    this.playerNameText = this.add
      .text(58, 40, "", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#e0f2fe",
      })
      .setDepth(100)
      .setShadow(0, 0, "#22d3ee", 8, true, true)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(58, 68, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#f8fafc",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateScoreText();

    this.timerText = this.add
      .text(178, 68, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#fde68a",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateTimerText();

    this.controlHintText = this.add
      .text(GAME_WIDTH / 2, 8, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fde68a",
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateControlHintText();
    this.danmaku = new DanmakuOverlay(this, GAME_WIDTH, GAME_HEIGHT);

    this.input.keyboard!.off("keydown-R");
    this.input.keyboard!.on("keydown-R", () => this.handleRestartKey());
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
    const movingPlatformsActive = this.isRunActive && !this.stageEditor?.isEnabled;
    updateMovingPlatforms(this.movingPlatformInstances, movingPlatformsActive);
    if (!this.isRunActive) {
      if (!this.isDefeatSequenceActive) {
        this.applyPlayerBody(false);
      }
      this.updateCollisionDebug();
      this.player.setAcceleration(0, 0);
      this.player.setVelocity(0, 0);
      return;
    }

    this.updateStoryDialogueProgress();
    this.refreshDropThroughDecorationPlatform();
    if (this.stageEditor?.isEnabled) {
      freezeEnemies(this.enemiesGroup);
    } else {
      updateEnemies(this.enemiesGroup, this.player, this.stageConstants.worldBottom + 32);
    }
    const onFloor = this.player.body.blocked.down || this.player.body.touching.down;
    if (this.time.now < this.hurtUntil) {
      this.updateCollisionDebug();
      this.player.setAcceleration(0, 0);
      this.player.setDragX(AIR_DRAG);
      this.wasOnFloor = onFloor;
      if (this.player.y > this.stageConstants.worldBottom + 32) {
        this.playFallMissSequence();
      }
      return;
    }

    const left = this.keys.a.isDown || this.cursors.left.isDown || this.mobileInput.a;
    const right = this.keys.d.isDown || this.cursors.right.isDown || this.mobileInput.d;
    const down = this.keys.s.isDown || this.cursors.down.isDown || this.mobileInput.s;
    const isShiftSpeedActive = this.keys.shift.isDown || this.mobileInput.shift;
    const speedMultiplier = isShiftSpeedActive ? DASH_SPEED_MULTIPLIER : 1;
    const isCrouchInputActive = down && onFloor;
    this.updateDecorationPlatformDrop(down, onFloor);
    this.applyPlayerBody(isCrouchInputActive);
    this.player.setMaxVelocity(
      (isCrouchInputActive ? CROUCH_MAX_RUN_SPEED : MAX_RUN_SPEED) * speedMultiplier,
      isShiftSpeedActive ? DASH_MAX_VERTICAL_SPEED : MAX_FALL_SPEED,
    );
    this.updateCollisionDebug();
    const debugJump = Phaser.Input.Keyboard.JustDown(this.keys.w) || this.mobileJumpQueued;
    this.mobileJumpQueued = false;
    const normalJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);
    const jump = debugJump || normalJump;
    const canJump = onFloor || debugJump;
    let startedJump = false;
    const baseHorizontalAcceleration = onFloor
      ? isCrouchInputActive
        ? CROUCH_GROUND_ACCELERATION
        : GROUND_ACCELERATION
      : AIR_ACCELERATION;
    const horizontalAcceleration = baseHorizontalAcceleration * speedMultiplier;
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
      const baseJumpVelocity =
        Math.abs(this.player.body.velocity.x) >= BOOST_JUMP_SPEED_THRESHOLD ? BOOSTED_JUMP_VELOCITY : JUMP_VELOCITY;
      this.player.setVelocityY(baseJumpVelocity * speedMultiplier);
      this.isLanding = false;
      this.landingFastForwarded = false;
      this.player.anims.timeScale = 1;
      startedJump = true;
      this.resetPlayerIdleState();
      this.player.anims.play("player-jump-start", true);
    }

    const isMovingHorizontally = Math.abs(this.player.body.velocity.x) > 8;
    const landedThisFrame = !this.wasOnFloor && onFloor && !startedJump;
    const isCrouching = down && onFloor && !startedJump;
    this.updateJumpChainDanmaku(startedJump, landedThisFrame);
    this.updateCrouchDanmaku(isCrouching);

    if (landedThisFrame) {
      this.isLanding = true;
      this.landingFastForwarded = false;
      this.resetPlayerIdleState();
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
      this.resetPlayerIdleState();
      this.player.anims.play("player-jump-start", true);
    } else if (!onFloor) {
      this.resetPlayerIdleState();
      const currentAnimation = this.player.anims.currentAnim?.key;
      if (currentAnimation !== "player-jump-start" || !this.player.anims.isPlaying) {
        this.player.anims.play("player-air", true);
      }
    } else if (isCrouching) {
      this.resetPlayerIdleState();
      this.player.anims.timeScale = 1;
      if (this.player.anims.currentAnim?.key !== "player-crouch") {
        this.player.anims.play("player-crouch");
      }
    } else if (left || right || isMovingHorizontally) {
      this.resetPlayerIdleState();
      this.player.anims.play("player-walk", true);
    } else {
      this.updatePlayerIdleAnimation();
    }

    this.wasOnFloor = onFloor;

    if (this.player.y > this.stageConstants.worldBottom + 32) {
      this.playFallMissSequence();
    }
  }

  private resetPlayerIdleState(startedAt = 0) {
    this.idleStartedAt = startedAt;
    this.isLongIdlePlaying = false;
  }

  private updatePlayerIdleAnimation() {
    this.player.anims.timeScale = 1;
    if (this.isLongIdlePlaying) {
      if (this.player.anims.currentAnim?.key !== "player-longidle") {
        this.player.anims.play("player-longidle", true);
      }
      return;
    }

    if (this.idleStartedAt === 0) {
      this.idleStartedAt = this.time.now;
    }

    if (this.time.now - this.idleStartedAt >= PLAYER_LONG_IDLE_TRIGGER_MS) {
      this.isLongIdlePlaying = true;
      this.player.anims.play("player-longidle", true);
      return;
    }

    this.player.anims.play("player-idle", true);
  }

  private resetRunState() {
    this.removeStartModal();
    this.removeMobileControls();
    this.removeMobileOrientationPrompt();
    this.removeStageEditor();
    this.removeGlobalUI();
    this.clearStoryDialogueTimers();
    this.storyDialogue?.remove();
    this.storyDialogue = undefined;
    this.hasAdvancedStoryDialogueAtX = false;
    this.countdownOverlay?.clear();
    this.countdownOverlay = undefined;
    this.missText?.destroy();
    this.missText = undefined;
    this.danmaku?.destroy();
    this.danmaku = undefined;
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    this.score = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0 };
    this.startTime = 0;
    this.isRunActive = false;
    this.hasWon = false;
    this.hasScoreMilestoneDanmakuPlayed = false;
    this.crouchDanmakuStartedAt = 0;
    this.hasCrouchDanmakuPlayed = false;
    this.jumpChainCount = 0;
    this.hasJumpChainDanmakuPlayed = false;
    this.wasOnFloor = false;
    this.isLanding = false;
    this.landingFastForwarded = false;
    this.idleStartedAt = 0;
    this.isLongIdlePlaying = false;
    this.isDefeatSequenceActive = false;
    this.hurtUntil = 0;
    this.invulnerableUntil = 0;
    this.damageTween?.stop();
    this.damageTween = undefined;
    this.decorationPlatformCrouchStartedAt = 0;
    this.dropThroughDecorationPlatformBody = undefined;
    this.collisionDebugGraphics?.clear();
    this.collisionDebugGraphics = undefined;
    this.itemsGroup = undefined;
    this.enemiesGroup = undefined;
    this.goal = undefined;
    this.finalScoreText = undefined;
    this.missText = undefined;
  }

  private updateStoryDialogueProgress() {
    if (this.hasAdvancedStoryDialogueAtX || this.player.x <= STORY_DIALOGUE_ADVANCE_X) {
      return;
    }

    this.hasAdvancedStoryDialogueAtX = true;
    this.storyDialogue = createStoryDialogue({ lines: DEFAULT_STORY_DIALOGUE_LINES });
    this.storyDialogueNextEvent = this.time.delayedCall(STORY_DIALOGUE_STEP_DELAY_MS, () => {
      this.storyDialogue?.next();
      this.storyDialogueNextEvent = undefined;
    });
    this.storyDialogueRemoveEvent = this.time.delayedCall(STORY_DIALOGUE_STEP_DELAY_MS * 2, () => {
      this.storyDialogue?.remove({ animate: true });
      this.storyDialogue = undefined;
      this.storyDialogueRemoveEvent = undefined;
    });
  }

  private clearStoryDialogueTimers() {
    this.storyDialogueNextEvent?.remove(false);
    this.storyDialogueRemoveEvent?.remove(false);
    this.storyDialogueNextEvent = undefined;
    this.storyDialogueRemoveEvent = undefined;
  }

  private restartStage() {
    if (this.isRestarting) {
      return;
    }

    this.dismissLeaderboard();
    this.isRestarting = true;
    this.resetRunState();
    this.bgm?.stop();
    this.scene.restart();
  }

  private handleRestartKey() {
    this.restartStage();
  }

  private dismissLeaderboard() {
    document.getElementById("leaderboard-modal")?.remove();
  }

  private startRun() {
    this.removeStartModal();
    this.applySelectedStage(this.currentStageId);
    this.updatePlayerNameText();
    this.controlHint = this.controlMode === "mobile" ? t(this.locale, "hint.mobile") : t(this.locale, "hint.pc");
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
      locale: this.locale,
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
    this.resetPlayerIdleState(this.time.now);
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
      stageId: this.currentStageId,
      stageOptions: this.getStageOptions(),
      locale: this.locale,
      soundOn: !this.soundMuted && this.soundVolumePercent > 0,
      onLocaleChange: (locale) => this.setLocale(locale),
      onSoundOnChange: (soundOn) => this.setSoundEnabled(soundOn),
      onSubmit: ({ playerName, controlMode, stageId, soundOn, locale }) => {
        this.playerName = playerName;
        this.setCookieValue("actiongame_player_name", this.playerName);
        this.controlMode = controlMode;
        this.currentStageId = this.resolveStageId(stageId);
        this.setCookieValue(STAGE_ID_STORAGE_KEY, this.currentStageId);
        this.setLocale(locale);
        this.setSoundEnabled(soundOn);
        this.setupComplete = true;
        if (this.controlMode === "mobile") {
          void this.startMobileRunInLandscape();
          return;
        }
        this.startRun();
      },
    });
    this.startModal.show();
  }

  private async startMobileRunInLandscape() {
    this.createMobileOrientationPrompt();
    this.requestMobileLandscapeLock();

    if (!this.isPortraitViewport()) {
      await this.requestMobileFullscreenIfShortLandscape();
      this.startRun();
      return;
    }

    this.removeStartModal();
    const startWhenLandscape = () => {
      if (this.isPortraitViewport()) {
        return;
      }
      cleanup();
      void this.startMobileRunAfterLandscapeReady();
    };
    const cleanup = () => {
      window.removeEventListener("resize", startWhenLandscape);
      window.removeEventListener("orientationchange", startWhenLandscape);
      screen.orientation?.removeEventListener("change", startWhenLandscape);
      this.mobileOrientationCleanup = this.mobileOrientationCleanup.filter((entry) => entry !== cleanup);
    };

    window.addEventListener("resize", startWhenLandscape);
    window.addEventListener("orientationchange", startWhenLandscape);
    screen.orientation?.addEventListener("change", startWhenLandscape);
    this.mobileOrientationCleanup.push(cleanup);
  }

  private async startMobileRunAfterLandscapeReady() {
    await this.requestMobileFullscreenIfShortLandscape();
    this.startRun();
  }

  private requestMobileLandscapeLock() {
    const orientation = (screen as OrientationLockScreen).orientation;
    void orientation?.lock?.("landscape").catch(() => undefined);
  }

  private async requestMobileFullscreenIfShortLandscape() {
    if (this.isPortraitViewport() || document.fullscreenElement || this.getMobileViewportHeight() >= MOBILE_FULLSCREEN_MIN_LANDSCAPE_HEIGHT) {
      return;
    }

    const target = document.documentElement as FullscreenTarget;
    const requestFullscreen =
      target.requestFullscreen ?? target.webkitRequestFullscreen ?? target.msRequestFullscreen;

    if (!requestFullscreen) {
      return;
    }

    await Promise.resolve(requestFullscreen.call(target)).catch(() => undefined);
  }

  private getMobileViewportHeight() {
    return Math.round(window.visualViewport?.height ?? window.innerHeight);
  }

  private isPortraitViewport() {
    return window.matchMedia("(orientation: portrait)").matches;
  }

  private createMobileOrientationPrompt() {
    document.getElementById("mobile-orientation-prompt")?.remove();

    const prompt = document.createElement("div");
    prompt.id = "mobile-orientation-prompt";
    prompt.innerHTML = `
      <div class="orientation-dialog">
        <div class="orientation-icon" aria-hidden="true">&#8635;</div>
        <div class="orientation-title">${this.locale === "ja" ? "横画面にしてください" : "Rotate to landscape"}</div>
        <div class="orientation-message">${this.locale === "ja" ? "スマホモードは横向きでプレイできます。" : "Mobile mode plays in landscape."}</div>
      </div>
    `;
    document.body.appendChild(prompt);
  }

  private removeMobileOrientationPrompt() {
    this.mobileOrientationCleanup.forEach((cleanup) => cleanup());
    this.mobileOrientationCleanup = [];
    document.getElementById("mobile-orientation-prompt")?.remove();
  }

  private removeStartModal() {
    this.startModal?.remove();
    this.startModal = undefined;
    document.getElementById("start-modal")?.remove();
  }

  private getStageOptions(): StageOption[] {
    return PLAYABLE_STAGE_IDS.map((id) => ({
      id,
      label: {
        ja: resolveStageName(STAGES[id].name, "ja"),
        en: resolveStageName(STAGES[id].name, "en"),
      },
    }));
  }

  private getSavedStageId(): StageId {
    return this.resolveStageId(this.getCookieValue(STAGE_ID_STORAGE_KEY));
  }

  private resolveStageId(stageId: string): StageId {
    return stageId in STAGES ? (stageId as StageId) : DEFAULT_STAGE_ID;
  }

  private applySelectedStage(stageId: StageId) {
    this.currentStageId = stageId;
    this.editorStage = cloneStage(STAGES[stageId]);
    this.stageConstants = resolveStageConstants(this.editorStage);
    this.applyStageBackgroundDefaults();
    this.physics.world.setBounds(
      0,
      this.stageConstants.worldTop,
      this.editorStage.worldWidth,
      this.stageConstants.worldHeight + FALL_RESET_WORLD_MARGIN,
    );
    this.cameras.main.setBounds(0, this.stageConstants.worldTop, this.editorStage.worldWidth, this.stageConstants.worldHeight);
    this.player.setPosition(this.editorStage.playerStart.x, this.editorStage.playerStart.y);
    this.player.setVelocity(0, 0);
    this.player.setAcceleration(0, 0);
    this.player.setDrag(0, 0);
    this.applyPlayerBody(false);
    this.rebuildEditableStageObjects();
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.centerOn(this.player.x, this.player.y);
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

  private getOrCreateLeaderboardPlayerId() {
    try {
      const savedPlayerId = window.localStorage.getItem(LEADERBOARD_PLAYER_ID_STORAGE_KEY);
      if (savedPlayerId && isLeaderboardPlayerId(savedPlayerId)) {
        return savedPlayerId;
      }

      const playerId = createSubmissionId();
      window.localStorage.setItem(LEADERBOARD_PLAYER_ID_STORAGE_KEY, playerId);
      return playerId;
    } catch {
      const cookiePlayerId = this.getCookieValue(LEADERBOARD_PLAYER_ID_STORAGE_KEY);
      if (cookiePlayerId && isLeaderboardPlayerId(cookiePlayerId)) {
        return cookiePlayerId;
      }

      const playerId = createSubmissionId();
      this.setCookieValue(LEADERBOARD_PLAYER_ID_STORAGE_KEY, playerId);
      return playerId;
    }
  }

  private getSavedLocale() {
    try {
      const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      return savedLocale && isLocale(savedLocale) ? savedLocale : getBrowserLocale();
    } catch {
      return getBrowserLocale();
    }
  }

  private setLocale(locale: Locale) {
    this.locale = locale;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Ignore storage failures; the current session can still use the chosen language.
    }
    this.refreshLocalizedUI();
  }

  private refreshLocalizedUI() {
    this.updatePlayerNameText();
    this.controlHint = this.controlMode === "mobile" ? t(this.locale, "hint.mobile") : t(this.locale, "hint.pc");
    this.updateScoreText();
    this.updateTimerText();
    this.updateControlHintText();
  }

  private updatePlayerNameText() {
    if (!this.playerNameText) {
      return;
    }

    const playerIdLabel = isLeaderboardPlayerId(this.leaderboardPlayerId) ? ` #${this.leaderboardPlayerId.slice(0, 8)}` : "";
    this.playerNameText.setText(`${t(this.locale, "hud.player")}:${this.playerName}${playerIdLabel}`);
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
    setGlobalSoundUI(this.soundVolumePercent, this.soundMuted);
  }

  private setDanmakuEnabled(enabled: boolean) {
    this.danmakuEnabled = enabled;
    this.setCookieValue("actiongame_danmaku_disabled", enabled ? "0" : "1");
    if (!enabled) {
      this.danmaku?.clear();
    }
  }

  private trackStageObject<T extends Phaser.GameObjects.GameObject>(object: T) {
    this.stageRenderObjects.push(object);
    return object;
  }

  private rebuildEditableStageObjects() {
    this.stageConstants = resolveStageConstants(this.editorStage);
    this.stageRenderObjects.forEach((object) => object.destroy());
    this.stageRenderObjects = [];
    this.decorationPlatformCrouchStartedAt = 0;
    this.dropThroughDecorationPlatformBody = undefined;
    this.clearStaticGroup(this.platforms);
    this.clearDynamicGroup(this.movingPlatforms);
    this.movingPlatformInstances = [];
    this.clearStaticGroup(this.decorationPlatforms);
    this.clearStaticGroup(this.itemsGroup);
    this.clearDynamicGroup(this.enemiesGroup);

    renderStageObjects({
      scene: this,
      stage: this.editorStage,
      stageConstants: this.stageConstants,
      platforms: this.platforms,
      movingPlatforms: this.movingPlatforms,
      movingPlatformInstances: this.movingPlatformInstances,
      decorationPlatforms: this.decorationPlatforms,
      trackStageObject: (object) => this.trackStageObject(object),
    });
    populateItems({
      scene: this,
      itemsGroup: this.itemsGroup,
      placements: this.editorStage.items,
      trackStageObject: (object) => this.trackStageObject(object),
    });
    populateEnemies(this.enemiesGroup, this.editorStage.enemies ?? []);
    if (this.stageEditor?.isEnabled) {
      freezeEnemies(this.enemiesGroup);
    }
    this.moveGoalTo(this.editorStage.goal.x, this.editorStage.goal.y);
    this.updateCollisionDebug();
  }

  private clearStaticGroup(group?: Phaser.Physics.Arcade.StaticGroup) {
    const children = (group as Phaser.Physics.Arcade.StaticGroup & { children?: Phaser.Structs.Set<Phaser.GameObjects.GameObject> } | undefined)
      ?.children;
    if (!children) {
      return;
    }

    group?.clear(true, true);
  }

  private clearDynamicGroup(group?: Phaser.Physics.Arcade.Group) {
    group?.clear(true, true);
  }

  private createBackground() {
    this.backgrounds = new BackgroundController(this, GAME_WIDTH, GAME_HEIGHT);
    this.backgrounds.create();
    this.applyStageBackgroundDefaults();
  }

  private updateBackground() {
    this.backgrounds?.update(this.cameras.main.scrollX, this.cameras.main.scrollY);
  }

  private applyStageBackgroundDefaults() {
    if (stageBackgroundDefaultsAppliedFor === this.currentStageId) {
      return;
    }

    this.backgrounds?.applyStageDefaults(this.editorStage.backgrounds);
    stageBackgroundDefaultsAppliedFor = this.currentStageId;
  }

  private canLandOnDecorationPlatform(
    playerObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    platformObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
  ) {
    const playerBody = (playerObject as Phaser.Types.Physics.Arcade.GameObjectWithBody).body as Phaser.Physics.Arcade.Body | undefined;
    const platformBody = (platformObject as Phaser.Types.Physics.Arcade.GameObjectWithBody).body as Phaser.Physics.Arcade.StaticBody | undefined;
    if (!playerBody || !platformBody) {
      return false;
    }

    if (platformBody === this.dropThroughDecorationPlatformBody) {
      return false;
    }

    const previousBottom = playerBody.prev.y + playerBody.height;
    return playerBody.velocity.y >= 0 && previousBottom <= platformBody.y + DECORATION_PLATFORM_LAND_TOLERANCE;
  }

  private updateDecorationPlatformDrop(isCrouchInputDown: boolean, onFloor: boolean) {
    const standingPlatformBody = this.getStandingDecorationPlatformBody();
    if (!isCrouchInputDown || !onFloor || !standingPlatformBody) {
      this.decorationPlatformCrouchStartedAt = 0;
      return;
    }

    if (this.decorationPlatformCrouchStartedAt === 0) {
      this.decorationPlatformCrouchStartedAt = this.time.now;
      return;
    }

    if (this.time.now - this.decorationPlatformCrouchStartedAt < DECORATION_PLATFORM_DROP_CROUCH_MS) {
      return;
    }

    this.dropThroughDecorationPlatformBody = standingPlatformBody;
    this.decorationPlatformCrouchStartedAt = 0;
    this.player.setVelocityY(Math.max(this.player.body.velocity.y, DECORATION_PLATFORM_DROP_VELOCITY));
  }

  private refreshDropThroughDecorationPlatform() {
    const platformBody = this.dropThroughDecorationPlatformBody;
    if (!platformBody) {
      return;
    }

    const playerBody = this.player.body;
    const overlapsHorizontally = playerBody.right > platformBody.x && playerBody.x < platformBody.x + platformBody.width;
    const hasDroppedBelow = playerBody.y > platformBody.y + platformBody.height;
    const isClearlyAbove = playerBody.y + playerBody.height < platformBody.y - DECORATION_PLATFORM_LAND_TOLERANCE;
    if (hasDroppedBelow || isClearlyAbove || !overlapsHorizontally) {
      this.dropThroughDecorationPlatformBody = undefined;
    }
  }

  private getStandingDecorationPlatformBody() {
    const playerBody = this.player.body;
    const playerBottom = playerBody.y + playerBody.height;
    const platformBody = this.findDecorationPlatformBody((body) => {
      const overlapsHorizontally = playerBody.right > body.x && playerBody.x < body.x + body.width;
      const touchesTop = Math.abs(playerBottom - body.y) <= DECORATION_PLATFORM_LAND_TOLERANCE;
      return overlapsHorizontally && touchesTop;
    });

    return platformBody;
  }

  private findDecorationPlatformBody(predicate: (body: Phaser.Physics.Arcade.StaticBody) => boolean) {
    const children = this.decorationPlatforms?.getChildren() ?? [];
    for (const child of children) {
      const body = (child as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody | undefined;
      if (body && predicate(body)) {
        return body;
      }
    }

    return undefined;
  }

  private createMobileControls() {
    this.removeMobileControls();

    this.mobileControlCleanup = createMobileControlElements({
      locale: this.locale,
      onInputChange: (key, pressed) => {
        this.mobileInput[key] = pressed;
      },
      onJumpQueued: () => {
        this.mobileJumpQueued = true;
      },
      onRestart: () => this.restartStage(),
    });
  }

  private removeMobileControls() {
    this.mobileControlCleanup.forEach((cleanup) => cleanup());
    this.mobileControlCleanup = [];
    document.getElementById("mobile-controls")?.remove();
  }

  private createStageEditor() {
    this.removeStageEditor();

    this.stageEditor = new StageEditor(this, {
      tile: TILE,
      platformUnitWidth: PLATFORM_UNIT_WIDTH,
      platformUnitHeight: PLATFORM_UNIT_HEIGHT,
      getStage: () => this.editorStage,
      setStage: (stage) => {
        this.editorStage = stage;
      },
      getLocale: () => this.locale,
      getStageConstants: () => this.stageConstants,
      rebuildStageObjects: () => this.rebuildEditableStageObjects(),
      moveGoalTo: (x, y) => this.moveGoalTo(x, y),
      onToggle: () => {
        this.rebuildEditableStageObjects();
        this.updateControlHintText();
      },
    });
    this.stageEditor.show();
  }

  private removeStageEditor() {
    this.stageEditor?.remove();
    this.stageEditor = undefined;
  }

  private createGlobalUI() {
    createGlobalUIElements({
      version: DEBUG_VERSION,
      locale: this.locale,
      soundVolumePercent: this.soundVolumePercent,
      soundMuted: this.soundMuted,
      danmakuEnabled: this.danmakuEnabled,
      collisionDebugEnabled: this.collisionDebugEnabled,
      onCollisionToggle: (button) => {
        this.collisionDebugEnabled = !this.collisionDebugEnabled;
        button.classList.toggle("is-active", this.collisionDebugEnabled);
        this.updateCollisionDebug();
      },
      onRearBackgroundToggle: (button) => this.backgrounds?.cycleRearBackground(button),
      onMidgroundBackgroundToggle: (button) => this.backgrounds?.cycleMidgroundBackground(button),
      updateRearBackgroundToggle: (button) => this.backgrounds?.updateRearDebugToggle(button),
      updateMidgroundBackgroundToggle: (button) => this.backgrounds?.updateMidgroundDebugToggle(button),
      onSoundChange: (volumePercent, muted) => {
        this.soundVolumePercent = volumePercent;
        this.soundMuted = muted;
        this.applySoundSettings();
      },
      onDanmakuChange: (enabled) => this.setDanmakuEnabled(enabled),
      onLocaleChange: (locale) => {
        this.setLocale(locale);
        this.removeStageEditor();
        this.createStageEditor();
        this.createGlobalUI();
      },
      onLeaderboardOpen: () => this.showLeaderboard(),
    });
  }

  private removeGlobalUI() {
    removeGlobalUIElements();
  }

  private moveGoalTo(x: number, y: number) {
    if (!this.goal) {
      return;
    }

    this.goal.setPosition(x, y);
    this.goal.refreshBody();
  }

  private damagePlayer(enemy: Phaser.Physics.Arcade.Sprite) {
    if (!this.isRunActive || this.stageEditor?.isEnabled || this.time.now < this.invulnerableUntil || !enemy.active) {
      return;
    }

    const direction = this.player.x < enemy.x ? -1 : 1;
    this.hurtUntil = this.time.now + DAMAGE_INPUT_LOCK_MS;
    this.invulnerableUntil = this.time.now + DAMAGE_INVULNERABLE_MS;
    this.isLanding = false;
    this.landingFastForwarded = false;
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    this.player.setAcceleration(0, 0);
    this.player.setVelocity(direction * DAMAGE_KNOCKBACK_X, DAMAGE_KNOCKBACK_Y);
    this.player.setDragX(AIR_DRAG);
    this.player.anims.timeScale = 1;
    this.player.anims.play("player-air", true);
    this.resetPlayerIdleState();
    this.playDamageMotion(direction);
  }

  private playDamageMotion(direction: number) {
    this.damageTween?.stop();
    this.player.clearTint();
    this.player.setAlpha(1);
    this.player.setAngle(0);
    this.cameras.main.shake(120, 0.004);
    this.damageTween = this.tweens.add({
      targets: this.player,
      alpha: 0.28,
      angle: direction * -4,
      duration: 70,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: Math.max(1, Math.floor(DAMAGE_INVULNERABLE_MS / 140) - 1),
      onYoyo: () => this.player.setTintFill(0xfff1f2),
      onRepeat: () => this.player.clearTint(),
      onComplete: () => {
        this.player.clearTint();
        this.player.setAlpha(1);
        this.player.setAngle(0);
        this.damageTween = undefined;
      },
    });
  }

  private updateScoreText() {
    if (!this.scoreText) {
      return;
    }

    const total = this.getItemScore();
    this.scoreText.setText(`${t(this.locale, "hud.score")}:${total}`);
  }

  private tryEmitScoreDanmaku() {
    if (this.hasScoreMilestoneDanmakuPlayed || this.getItemScore() <= SCORE_DANMAKU_THRESHOLD) {
      return;
    }

    this.hasScoreMilestoneDanmakuPlayed = true;
    if (!this.danmakuEnabled) {
      return;
    }

    this.danmaku?.emitScoreMilestone();
  }

  private updateCrouchDanmaku(isCrouching: boolean) {
    if (!isCrouching) {
      this.crouchDanmakuStartedAt = 0;
      this.hasCrouchDanmakuPlayed = false;
      return;
    }

    if (this.crouchDanmakuStartedAt === 0) {
      this.crouchDanmakuStartedAt = this.time.now;
      return;
    }

    if (this.hasCrouchDanmakuPlayed || this.time.now - this.crouchDanmakuStartedAt < CROUCH_DANMAKU_HOLD_MS) {
      return;
    }

    this.hasCrouchDanmakuPlayed = true;
    if (!this.danmakuEnabled) {
      return;
    }

    this.danmaku?.emitCrouchHold();
  }

  private updateJumpChainDanmaku(startedJump: boolean, landedThisFrame: boolean) {
    if (landedThisFrame) {
      this.jumpChainCount = 0;
      return;
    }

    if (!startedJump) {
      return;
    }

    this.jumpChainCount += 1;
    if (this.hasJumpChainDanmakuPlayed || this.jumpChainCount < JUMP_CHAIN_DANMAKU_COUNT) {
      return;
    }

    this.hasJumpChainDanmakuPlayed = true;
    if (!this.danmakuEnabled) {
      return;
    }

    this.danmaku?.emitJumpChain();
  }

  private updateTimerText() {
    if (!this.timerText || this.hasWon) {
      return;
    }

    this.timerText.setText(`${t(this.locale, "hud.time")}:${this.formatTimeSeconds(this.getRemainingMilliseconds())}`);
  }

  private updateControlHintText() {
    if (!this.controlHintText) {
      return;
    }

    const editorHint = this.stageEditor?.isEnabled ? `\n${t(this.locale, "hint.editor")}` : "";
    this.controlHintText.setText(`${this.controlHint}${editorHint}`);
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

    this.decorationPlatforms?.getChildren().forEach((child) => {
      const body = (child as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody | undefined;
      if (body) {
        this.drawCollisionBody(body, 0xfb923c, 0.16);
      }
    });

    this.movingPlatforms?.getChildren().forEach((child) => {
      const body = (child as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        this.drawCollisionBody(body, 0xa78bfa, 0.16);
      }
    });

    this.itemsGroup?.getChildren().forEach((child) => {
      const item = child as Phaser.Physics.Arcade.Sprite;
      if (item.active && item.body) {
        this.drawCollisionBody(item.body as Phaser.Physics.Arcade.StaticBody, 0x22c55e, 0.18);
      }
    });

    this.enemiesGroup?.getChildren().forEach((child) => {
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (enemy.active && enemy.body) {
        this.drawCollisionBody(enemy.body as Phaser.Physics.Arcade.Body, 0xef4444, 0.2);
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

  private getRemainingMilliseconds() {
    if (!this.isRunActive || this.startTime === 0) {
      return GAME_TIME_MS;
    }

    const elapsed = Math.max(0, this.time.now - this.startTime);
    return Math.max(0, GAME_TIME_MS - elapsed);
  }

  private formatTimeSeconds(milliseconds: number) {
    return (milliseconds / 1000).toFixed(2);
  }

  private formatScoreValue(score: number) {
    return score.toFixed(2);
  }

  private showLeaderboard(
    statusMessage?: string,
    currentSubmissionId?: string,
    currentScore?: { score: number; rank?: number; scoreUpdated: boolean },
  ) {
    showLeaderboardPanel({
      stageName: resolveStageName(this.editorStage.name, this.locale),
      gameVersion: DEBUG_VERSION,
      statusMessage: isLeaderboardConfigured() ? statusMessage : "Leaderboard is not configured.",
      currentSubmissionId,
      currentPlayerId: this.leaderboardPlayerId,
      currentScore,
      fetchEntries: () => fetchLeaderboardEntries(this.currentStageId),
    });
  }

  private submitWinScore(finalScore: number, itemScore: number, timeBonus: number, remainingMs: number) {
    if (!isLeaderboardConfigured()) {
      return;
    }

    const playerId = isLeaderboardPlayerId(this.leaderboardPlayerId) ? this.leaderboardPlayerId : this.getOrCreateLeaderboardPlayerId();
    this.leaderboardPlayerId = playerId;
    const elapsedMs = Math.max(0, GAME_TIME_MS - remainingMs);
    const submissionId = createSubmissionId();
    submitLeaderboardScore({
      submissionId,
      playerId,
      stageId: this.currentStageId,
      stageName: resolveStageName(this.editorStage.name, this.locale),
      gameVersion: DEBUG_VERSION,
      playerName: this.playerName,
      score: finalScore,
      itemScore,
      timeBonus,
      elapsedMs,
      remainingMs,
    })
      .then((result) => {
        if (!result.ok) {
          throw new Error("Leaderboard score was rejected.");
        }
        const currentScore = { score: finalScore, rank: result.rank, scoreUpdated: result.scoreUpdated };
        this.showLeaderboard(
          result.scoreUpdated ? "Score submitted." : "Score submitted. Best score was not updated.",
          result.scoreUpdated && "submissionId" in result ? result.submissionId ?? submissionId : undefined,
          currentScore,
        );
      })
      .catch(() => this.showLeaderboard("Score could not be submitted."));
  }

  private createPixelTexture(key: string, width: number, height: number, fill: number, stroke: number) {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(fill);
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(1, stroke);
    graphics.strokeRect(0.5, 0.5, width - 1, height - 1);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private createPlayerAnimations() {
    if (this.anims.exists("player-idle")) {
      return;
    }

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
      key: "player-longidle",
      frames: this.anims.generateFrameNumbers("player-longidle", {
        start: 0,
        end: PLAYER_LONG_IDLE_FRAME_COUNT - 1,
      }),
      frameRate: 8,
      repeat: 0,
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

    this.anims.create({
      key: "player-defeat",
      frames: this.anims.generateFrameNumbers("player-defeat", {
        start: 0,
        end: PLAYER_DEFEAT_FRAME_COUNT - 1,
      }),
      frameRate: 11,
      repeat: 0,
    });
  }

  private playDefeatSequence() {
    if (this.isDefeatSequenceActive || this.isRestarting) {
      return;
    }

    this.dismissLeaderboard();
    this.isDefeatSequenceActive = true;
    this.isRunActive = false;
    this.isLanding = false;
    this.landingFastForwarded = false;
    this.resetPlayerIdleState();
    this.hurtUntil = 0;
    this.invulnerableUntil = 0;
    this.damageTween?.stop();
    this.damageTween = undefined;
    this.player.clearTint();
    this.player.setAlpha(1);
    this.player.setAngle(0);
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    this.applyPlayerBody(false);
    this.player.setAcceleration(0, 0);
    this.player.setVelocity(0, 0);
    this.player.setDrag(0, 0);
    this.player.body.setAllowGravity(false);
    this.player.anims.timeScale = 1;
    this.player.anims.play("player-defeat", true);
    this.player.once(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}player-defeat`, () => {
      this.time.delayedCall(180, () => this.restartStage());
    });
  }

  private playFallMissSequence() {
    if (this.isDefeatSequenceActive || this.isRestarting) {
      return;
    }

    this.dismissLeaderboard();
    this.isDefeatSequenceActive = true;
    this.isRunActive = false;
    this.hurtUntil = 0;
    this.invulnerableUntil = 0;
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    freezeEnemies(this.enemiesGroup);
    this.player.setAcceleration(0, 0);
    this.player.setVelocity(0, 0);
    this.player.anims.timeScale = 1;
    this.player.anims.stop();
    this.player.setAlpha(0.55);
    this.cameras.main.flash(220, 255, 34, 68);
    this.cameras.main.shake(320, 0.012);
    if (this.danmakuEnabled) {
      this.danmaku?.emitMiss();
    }
    this.missText?.destroy();
    const missBurst = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "MISS", {
        fontFamily: "monospace",
        fontSize: "104px",
        color: "#ff003c",
        stroke: "#fff7cf",
        strokeThickness: 10,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(218)
      .setAlpha(0.72)
      .setShadow(0, 0, "#ff003c", 24, true, true);
    const missEchoLeft = this.add
      .text(GAME_WIDTH / 2 - 18, GAME_HEIGHT / 2 + 10, "MISS", {
        fontFamily: "monospace",
        fontSize: "72px",
        color: "#38bdf8",
        stroke: "#0f172a",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(217)
      .setAlpha(0.58);
    const missEchoRight = this.add
      .text(GAME_WIDTH / 2 + 20, GAME_HEIGHT / 2 - 8, "MISS", {
        fontFamily: "monospace",
        fontSize: "72px",
        color: "#fde047",
        stroke: "#7f1d1d",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(217)
      .setAlpha(0.58);
    this.missText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "MISS", {
        fontFamily: "monospace",
        fontSize: "82px",
        color: "#ff1f4f",
        stroke: "#fff7cf",
        strokeThickness: 9,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(220)
      .setShadow(0, 0, "#ff003c", 18, true, true);
    this.tweens.add({
      targets: this.missText,
      scale: { from: 0.55, to: 1.18 },
      angle: { from: -7, to: 2 },
      alpha: 1,
      duration: 260,
      yoyo: true,
      repeat: 2,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: [missBurst, missEchoLeft, missEchoRight],
      scale: 1.42,
      alpha: 0,
      angle: { from: 0, to: 8 },
      duration: 760,
      ease: "Expo.easeOut",
      onComplete: () => {
        missBurst.destroy();
        missEchoLeft.destroy();
        missEchoRight.destroy();
      },
    });
    this.time.delayedCall(FALL_MISS_RESTART_DELAY_MS, () => this.restartStage());
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
    const remaining = this.getRemainingMilliseconds();
    const timeBonus = (remaining / 1000) * TIME_BONUS_PER_SECOND;
    const itemScore = this.getItemScore();
    const finalScore = itemScore + timeBonus;
    this.timerText.setText(
      `${t(this.locale, "hud.time")}:${this.formatTimeSeconds(remaining)}  ${t(this.locale, "hud.bonus")}:${this.formatScoreValue(timeBonus)}`,
    );
    this.scoreText.setText(`${t(this.locale, "hud.itemScore")}:${itemScore}`);
    this.startRainbowWinEffect();
    this.finalScoreText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        `${t(this.locale, "hud.clear")}\n${t(this.locale, "hud.score")} ${this.formatScoreValue(finalScore)}\n${t(
          this.locale,
          "hud.timeBonus",
        )} ${this.formatScoreValue(timeBonus)}`,
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
    this.submitWinScore(finalScore, itemScore, timeBonus, remaining);
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

function createSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isLeaderboardPlayerId(playerId: string) {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(playerId);
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
