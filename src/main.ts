import Phaser from "phaser";
import "./styles.css";
import {
  ITEM_DEFINITIONS,
  ENEMY_DEFINITIONS,
  PLATFORM_ASSETS,
  PROP_ASSETS,
  STAGE_OBJECT_ASSETS,
  resolveStageName,
  resolveStageText,
  type DashWallPlacement,
  type MiniChallengeDefinition,
  type StageMissionDefinition,
  type StageDefinition,
} from "./assets";
import { DEFAULT_STAGE_ID, PLAYABLE_STAGE_IDS, STAGES, cloneStage, normalizeStageId, type StageId } from "./stages";
import { RainbowWinPipeline } from "./rainbowPipeline";
import { StartCountdownOverlay } from "./countdown";
import { StartModal, TITLE_SOUND_CONFIRM_STORAGE_KEY, type ControlMode, type StageOption, type StartAccountStatus } from "./startModal";
import { StageEditor } from "./stageEditor";
import { resolveStageConstants, type ResolvedStageConstants } from "./stageConstants";
import {
  createStoryDialogue,
  resolveStoryDialogueLines,
  type StoryDialogueController,
  type StoryDialogueLine,
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
import { createBonusBlocks, populateBonusBlocks } from "./bonusBlocks";
import { defeatEnemy, findOverlappingStompEnemy, tryStompEnemy } from "./enemyCombat";
import { RewardSystem } from "./rewardSystem";
import {
  CheckpointController,
  OneWayGateController,
  handleSpecialPlatformCollision,
  movePlayerToCheckpointStart,
} from "./stageInteractives";
import {
  carryPlayerOnDescendingMovingPlatforms,
  isPlayerSupportedByDescendingMovingPlatform,
  renderStageObjects,
  updateMovingPlatforms,
  type MovingPlatformInstance,
} from "./stageRenderer";
import { BackgroundController } from "./backgrounds";
import {
  createGlobalUI as createGlobalUIElements,
  openGlobalOptionsModal,
  removeGlobalUI as removeGlobalUIElements,
  setGlobalSoundUI,
} from "./globalUi";
import {
  MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT,
  createMobileControls as createMobileControlElements,
  shouldShowMobileControlsLayoutSetup,
  type MobileInputKey,
} from "./mobileControls";
import { DanmakuOverlay, type DanmakuMode } from "./danmaku";
import { MinimapOverlay } from "./minimap";
import {
  DEFAULT_PLAYER_CHARACTER_ID,
  PLAYER_CHARACTERS,
  getPlayerAnimationKey,
  getPlayerTextureKey,
  normalizePlayerCharacterId,
  type PlayerAnimationName,
  type PlayerCharacterId,
  type PlayerCharacterMotion,
} from "./playerCharacters";
import {
  clearLeaderboardUserSettings,
  fetchLeaderboardEntries,
  fetchLeaderboardGhostOptions,
  fetchLeaderboardGhostReplay,
  fetchMyLeaderboardEntries,
  fetchLeaderboardUserSettings,
  getLeaderboardIdentity,
  isLeaderboardConfigured,
  logInLeaderboardWithGoogle,
  saveLeaderboardUserSettings,
  signInLeaderboardWithGoogle,
  signOutLeaderboardAuth,
  submitLeaderboardScore,
  type LeaderboardIdentity,
  type LeaderboardSubmitResult,
  type LeaderboardUserSettings,
  unlinkLeaderboardGoogleAccount,
} from "./leaderboard";
import { showLeaderboardPanel, type LeaderboardGhostSaveStatus } from "./leaderboardUi";
import { showAccountPanel } from "./accountUi";
import { initializePwaInstall } from "./pwaInstall";
import { getScaledSeVolume, SE_VOLUME_REGISTRY_KEY } from "./audioSettings";
import { hasFullscreenElement, isLikelySmartphone } from "./mobileViewport";
import {
  removeScreenshotPreview,
  showScreenshotPreview,
  type CapturedGameScreenshot,
} from "./screenshotPreview";
import { ensureLatestClientVersion } from "./versionSync";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const TILE = 32;
const ASSET_BASE = import.meta.env.BASE_URL;
const DEBUG_VERSION = "v0.1.435";
const HUD_PANEL_TEXTURE_KEY = "ui-hud-panel-fantasy";
const HUD_CHIP_TEXTURE_KEY = "ui-hud-label-plate";
const RESULT_PANEL_TEXTURE_KEY = "ui-result-panel-kawaii";
const MENU_ICON_SETTINGS_KEY = "ui-menu-icon-settings";
const MENU_ICON_RANKING_KEY = "ui-menu-icon-ranking";
const MENU_ICON_SCREENSHOT_KEY = "ui-menu-icon-screenshot";
const MENU_ICON_WORLD_MAP_KEY = "ui-menu-icon-world-map";
const UI_TEXT_FONT_FAMILY = 'Meiryo, "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif';
const UI_DISPLAY_FONT_FAMILY = 'Meiryo, "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif';
const UI_TEXT_RESOLUTION = 1;
const AQUA_MASCOT_STOMP_DIALOGUE_DURATION_MS = 5000;
const STAGE_MIDPOINT_DIALOGUE_DURATION_MS = 4000;
const STAMINA_EMPTY_DIALOGUE_DURATION_MS = 3500;
const GOAL_IN_VIEW_DIALOGUE_DURATION_MS = 3400;
const DANMAKU_TUTORIAL_DIALOGUE_DELAY_MS = 6800;
const DANMAKU_TUTORIAL_DIALOGUE_DURATION_MS = 8000;
type FixedStoryDialogueKey = "aquaMascotStomp" | "stageMidpoint" | "staminaEmpty" | "goalInView" | "danmakuTutorial";

type LocalizedStoryDialogueLine = {
  characterName: Record<Locale, string>;
  message: Record<Locale, string>;
  portraitUrl: string;
};

const ZANNENIN_SAN_NAME = {
  en: "Zannenin-san",
  ja: "残念院さん",
  zh: "残念院小姐",
  ko: "잔넨인 씨",
} satisfies Record<Locale, string>;

const FIXED_STORY_DIALOGUES: Record<FixedStoryDialogueKey, LocalizedStoryDialogueLine> = {
  aquaMascotStomp: {
    characterName: ZANNENIN_SAN_NAME,
    message: {
      en: "Eep... Puili-chan, I am so sorry!",
      ja: "ひゃっ...ぷいりちゃん、ごめんなさいっ",
      zh: "呀...噗伊莉，对不起！",
      ko: "꺅... 푸이리야, 미안해!",
    },
    portraitUrl: `${ASSET_BASE}assets/ui/message_faces/message_face_head_icon_07_sad.png`,
  },
  stageMidpoint: {
    characterName: ZANNENIN_SAN_NAME,
    message: {
      en: "We should be near the halfway point... I am getting a little tired...",
      ja: "そろそろ中間まで来ましたね...少々疲れました...",
      zh: "差不多到中段了呢...有点累了...",
      ko: "슬슬 중간 지점까지 온 것 같네요... 조금 지쳤어요...",
    },
    portraitUrl: `${ASSET_BASE}assets/ui/message_faces/message_face_head_icon_05_shy.webp`,
  },
  staminaEmpty: {
    characterName: ZANNENIN_SAN_NAME,
    message: {
      en: "Hah... hah... hah...",
      ja: "ハァ・・・ハァ・・・ハァッ・・・",
      zh: "哈...哈...哈...",
      ko: "하아... 하아... 하아...",
    },
    portraitUrl: `${ASSET_BASE}assets/ui/message_faces/message_face_head_icon_07_sad.png`,
  },
  goalInView: {
    characterName: ZANNENIN_SAN_NAME,
    message: {
      en: "That blue and white gate... could it be the goal?",
      ja: "あの青と白のゲートは、もしやゴールでは？",
      zh: "那个蓝白色的门...难道就是终点？",
      ko: "저 파란색과 흰색 게이트... 혹시 골인가요?",
    },
    portraitUrl: `${ASSET_BASE}assets/ui/message_faces/message_face_head_icon_03_happy_open.png`,
  },
  danmakuTutorial: {
    characterName: ZANNENIN_SAN_NAME,
    message: {
      en: "Those sudden danmaku comments startled me! I think you can toggle them or change their style from Options.",
      ja: "突然の弾幕・・・びっくりしました！設定から、オンオフやスタイルの切り替えが出来そうな気がします！",
      zh: "突然出现弹幕...吓了我一跳！好像可以在设置里开关，或者切换显示风格！",
      ko: "갑자기 탄막 댓글이 나와서 깜짝 놀랐어요! 설정에서 켜고 끄거나 표시 스타일을 바꿀 수 있을 것 같아요!",
    },
    portraitUrl: `${ASSET_BASE}assets/ui/message_faces/message_face_head_icon_06_surprised.png`,
  },
};

const resolveFixedStoryDialogue = (key: FixedStoryDialogueKey, locale: Locale): StoryDialogueLine => {
  const dialogue = FIXED_STORY_DIALOGUES[key];
  return {
    characterName: dialogue.characterName[locale] ?? dialogue.characterName.en,
    message: dialogue.message[locale] ?? dialogue.message.en,
    portraitUrl: dialogue.portraitUrl,
  };
};

const STAGE_ID_STORAGE_KEY = "actiongame_stage_id";
const PLAYER_CHARACTER_STORAGE_KEY = "actiongame_player_character";
const LEADERBOARD_PLAYER_ID_STORAGE_KEY = "actiongame_leaderboard_player_id";
const WORLD_MAP_CLEARED_STAGE_KEY_PREFIX = "actiongame_world_map_cleared_stage";
const DANMAKU_TUTORIAL_SEEN_STORAGE_KEY_PREFIX = "actiongame_danmaku_tutorial_seen";
const GAME_LAYOUT_REFRESH_EVENT = "actiongame:refresh-layout";
const RAINBOW_PIPELINE_KEY = "RainbowWinPipeline";
const GAME_TIME_SECONDS = 360;
const GAME_TIME_MS = GAME_TIME_SECONDS * 1000;
const SPRING_BIG_JUMP_INPUT_BUFFER_MS = 180;
const SPRING_BIG_JUMP_POST_LAUNCH_BUFFER_MS = 260;
const SPRING_LAUNCH_NORMAL_JUMP_SUPPRESS_MS = 140;
const STORY_DIALOGUE_ADVANCE_X = 600;
const STORY_DIALOGUE_STEP_DELAY_MS = 8000;
const STORY_DIALOGUE_TRIGGER_DURATION_SCALE = 0.5;
const TIME_BONUS_PER_SECOND = 10;
const SCORE_DANMAKU_THRESHOLD = 1000;
const CROUCH_DANMAKU_HOLD_MS = 2000;
const JUMP_CHAIN_DANMAKU_COUNT = 5;
const AFK_IDLE_DANMAKU_DELAY_MS = 15000;
const FALL_MISS_RESTART_DELAY_MS = 4800;
const TIME_UP_HURT_TO_MISS_DELAY_MS = 520;
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

const BOOT_LOADING_OVERLAY_ID = "boot-loading-overlay";
const BOOT_LOADING_OVERLAY_DELAY_MS = 1400;
const BOOT_LOADING_OVERLAY_MIN_VISIBLE_MS = 720;
const BOOT_LOADING_OVERLAY_FADE_MS = 220;
const BOOT_LOADING_STALL_MS = 18000;
const BOOT_LOADING_RUNNER_COLUMNS = 6;
const BOOT_LOADING_RUNNER_FRAMES = 13;
const BOOT_LOADING_RUNNER_FRAME_MS = 90;
const PLAYER_BODY_OFFSET_Y = 86;
const PLAYER_CROUCH_BODY_WIDTH = 58;
const PLAYER_CROUCH_BODY_HEIGHT = 94;
const PLAYER_CROUCH_BODY_OFFSET_X = 131;
const PLAYER_CROUCH_BODY_OFFSET_Y = PLAYER_BODY_OFFSET_Y + PLAYER_BODY_HEIGHT - PLAYER_CROUCH_BODY_HEIGHT;
const PLAYER_LONG_IDLE_TRIGGER_MS = 5000;
const GROUND_ACCELERATION = 2400;
const CROUCH_GROUND_ACCELERATION = 1600;
const AIR_ACCELERATION = 720;
const GROUND_DRAG = 2400;
const AIR_DRAG = 120;
const MAX_RUN_SPEED = 380;
const CROUCH_MAX_RUN_SPEED = 300;
const MAX_FALL_SPEED = 680;
const MAX_UPWARD_LAUNCH_SPEED = 1280;
const JUMP_VELOCITY = -590;
const BOOSTED_JUMP_VELOCITY = -675;
const BOOST_JUMP_SPEED_THRESHOLD = 285;
const STOMP_FREE_JUMP_BUFFER_MS = 420;
const DASH_SPEED_MULTIPLIER = 2;
const DASH_MAX_VERTICAL_SPEED = Math.abs(BOOSTED_JUMP_VELOCITY) * DASH_SPEED_MULTIPLIER;
const EDITOR_FLY_SPEED = 360;
const MAX_STAMINA = 100;
const AIR_JUMP_STAMINA_COST = 20;
const DASH_STAMINA_DRAIN_PER_SECOND = 16;
const DASH_LINGER_MS = 260;
const STAMINA_RECOVERY_PER_SECOND = 42;
const CROUCH_STAMINA_RECOVERY_MULTIPLIER = 2;
const HUD_SCALE_BASE_WIDTH = 1280;
const HUD_SCALE_BASE_HEIGHT = 720;
const HUD_MIN_SCALE = 0.76;
const HUD_MAX_SCALE = 1.2;
const HUD_PLAYER_NAME_FONT_SIZE = 14;
const HUD_MAIN_FONT_SIZE = 13;
const HUD_SCORE_FONT_SIZE = 16;
const HUD_HINT_FONT_SIZE = 11;
const HUD_PANEL_X = 14;
const HUD_PANEL_Y = 18;
const HUD_PANEL_WIDTH = 330;
const HUD_PANEL_HEIGHT = 104;
const HUD_TEXT_X = 42;
const HUD_PLAYER_NAME_Y = 33;
const HUD_SCORE_Y = 62;
const HUD_TIMER_X = 196;
const HUD_STAMINA_Y = 91;
const HUD_STAMINA_BAR_X = 142;
const HUD_STAMINA_BAR_Y = 101;
const HUD_STAMINA_BAR_WIDTH = 150;
const HUD_STAMINA_BAR_HEIGHT = 12;
const HUD_STAMINA_FILL_INSET = 4;
const HUD_STAMINA_FILL_X = HUD_STAMINA_BAR_X + HUD_STAMINA_FILL_INSET;
const HUD_STAMINA_FILL_WIDTH = HUD_STAMINA_BAR_WIDTH - HUD_STAMINA_FILL_INSET * 2;
const HUD_STAMINA_FILL_HEIGHT = 6;
const HUD_STAMINA_TICK_COUNT = 5;
const HUD_MODE_CHIP_X = HUD_PANEL_X + HUD_PANEL_WIDTH - 58;
const HUD_MODE_CHIP_Y = HUD_PANEL_Y + 13;
const HUD_MODE_CHIP_MIN_WIDTH = 82;
const HUD_MODE_CHIP_HEIGHT = 28;
const HUD_PLAYER_NAME_MAX_WIDTH = HUD_MODE_CHIP_X - HUD_MODE_CHIP_MIN_WIDTH / 2 - HUD_TEXT_X - 12;
const HUD_COMPACT_DISPLAY_WIDTH = 760;
const HUD_COMPACT_PLAYER_NAME_MAX_LENGTH = 12;
const OVERHEAD_STAMINA_BAR_WIDTH = 76;
const OVERHEAD_STAMINA_BAR_HEIGHT = 8;
const OVERHEAD_STAMINA_FILL_WIDTH = 70;
const OVERHEAD_STAMINA_FILL_HEIGHT = 4;
const OVERHEAD_STAMINA_OFFSET_Y = 18;
const GHOST_REPLAY_SCHEMA = "zannenin-ghost-v1";
const GHOST_RECORD_INTERVAL_MS = 50;
const CLEAR_ACTION_DESKTOP_X = GAME_WIDTH - 168;
const CLEAR_ACTION_DESKTOP_Y = 118;
const CLEAR_ACTION_DESKTOP_GAP = 58;
const CLEAR_ACTION_MOBILE_X = GAME_WIDTH / 2;
const CLEAR_ACTION_MOBILE_Y = GAME_HEIGHT - 214;
const CLEAR_ACTION_MOBILE_GAP = 82;
const SHOW_CLEAR_RANK_AND_MISSIONS = true;
const DECORATION_PLATFORM_LAND_TOLERANCE = 6;
const DECORATION_PLATFORM_DROP_CROUCH_MS = 500;
const DECORATION_PLATFORM_DROP_VELOCITY = 140;
const DASH_WALL_DEFAULT_WIDTH = 34;
const DASH_WALL_DEFAULT_HEIGHT = 260;
const DASH_WALL_DEFAULT_KNOCKBACK_X = -560;
const DASH_WALL_DEFAULT_KNOCKBACK_Y = -170;
const DASH_WALL_BOUNCE_COOLDOWN_MS = 420;
let bootLoadingRunnerTimer: number | null = null;
let bootLoadingOverlayTimer: number | null = null;
let bootLoadingOverlayHideTimer: number | null = null;
let bootLoadingStallTimer: number | null = null;
let bootLoadingOverlayShownAt = 0;
type FullscreenTarget = HTMLElement & {
  msRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FullscreenDocument = Document & {
  msFullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type QueuedStoryDialogue = {
  lines: StoryDialogueLine[];
  closeAtX?: number;
  stepDelayMs?: number;
  durationMs?: number;
};
type MiniChallengeState = {
  definition: MiniChallengeDefinition;
  started: boolean;
  completed: boolean;
  failed: boolean;
  coins: number;
};
type StageMidpointProgress = {
  axis: "x" | "y";
  midpoint: number;
  direction: 1 | -1;
};

type GhostReplayFrame = {
  t: number;
  x: number;
  y: number;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  dash: boolean;
  flipX: boolean;
  anim?: string;
};
type GhostReplayData = {
  schema: typeof GHOST_REPLAY_SCHEMA;
  gameVersion: string;
  stageId: string;
  playerName: string;
  controlMode: ControlMode;
  createdAt: string;
  durationMs: number;
  frames: GhostReplayFrame[];
};
type GhostReplayLoadResult = {
  label: string;
  stageId?: string;
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
  private dashWalls?: Phaser.Physics.Arcade.StaticGroup;
  private itemsGroup?: Phaser.Physics.Arcade.StaticGroup;
  private bonusBlocksGroup?: Phaser.Physics.Arcade.StaticGroup;
  private checkpointController?: CheckpointController;
  private oneWayGateController?: OneWayGateController;
  private enemiesGroup?: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"w" | "a" | "s" | "d" | "shift", Phaser.Input.Keyboard.Key>;
  private backgrounds?: BackgroundController;
  private hudPanelBack!: Phaser.GameObjects.Image;
  private hudPanelAccent!: Phaser.GameObjects.Rectangle;
  private playerNameText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private staminaText!: Phaser.GameObjects.Text;
  private staminaBarBack!: Phaser.GameObjects.Rectangle;
  private staminaBarFill!: Phaser.GameObjects.Rectangle;
  private staminaBarFrame!: Phaser.GameObjects.Rectangle;
  private staminaBarTicks: Phaser.GameObjects.Rectangle[] = [];
  private overheadStaminaBarBack!: Phaser.GameObjects.Rectangle;
  private overheadStaminaBarFill!: Phaser.GameObjects.Rectangle;
  private controlHintBack!: Phaser.GameObjects.Image;
  private controlHintText!: Phaser.GameObjects.Text;
  private hudScale = 1;
  private loadedGhostReplay?: GhostReplayData;
  private ghostReplaySprite?: Phaser.GameObjects.Sprite;
  private ghostReplayFrameIndex = 0;
  private ghostRecordingFrames: GhostReplayFrame[] = [];
  private ghostRecordingActive = false;
  private ghostRecordingDisabled = false;
  private lastGhostRecordAt = -Infinity;
  private ghostExportButton?: Phaser.GameObjects.Container;
  private clearMenuButton?: Phaser.GameObjects.Container;
  private clearScreenshotButton?: Phaser.GameObjects.Container;
  private canvasGlobalUiContainer?: Phaser.GameObjects.Container;
  private canvasGlobalDrawer?: Phaser.GameObjects.Container;
  private canvasGlobalMenuOpen = false;
  private canvasGlobalSoundText?: Phaser.GameObjects.Text;
  private canvasGlobalPositionText?: Phaser.GameObjects.Text;
  private lastScreenshot?: CapturedGameScreenshot;
  private screenshotCapturePending = false;
  private screenshotPreviewOpen = false;
  private screenshotPreviewPausedScene = false;
  private dashLingerUntil = -Infinity;
  private isDashActive = false;
  private lastDashWallBounceAt = -Infinity;
  private countdownOverlay?: StartCountdownOverlay;
  private resultScreenContainer?: Phaser.GameObjects.Container;
  private clearStampContainer?: Phaser.GameObjects.Container;
  private missText?: Phaser.GameObjects.Text;
  private danmaku?: DanmakuOverlay;
  private minimap?: MinimapOverlay;
  private mobileInput: Record<MobileInputKey, boolean> = { w: false, a: false, s: false, d: false, shift: false };
  private mobileJumpQueued = false;
  private mobileControlCleanup: Array<() => void> = [];
  private mobileFullscreenRecoveryOverlay?: HTMLDivElement;
  private mobileFullscreenWasActive = false;
  private mobileFullscreenRecoveryDismissed = false;
  private mobileLayoutPaused = false;
  private mobileLayoutShouldStartCountdown = false;
  private rewards?: RewardSystem;
  private startTime = 0;
  private editorTimerPausedMs = 0;
  private editorTimerPauseStartedAt = 0;
  private stamina = MAX_STAMINA;
  private hasUsedStageEditorThisRun = false;
  private isRunActive = false;
  private isRestarting = false;
  private setupComplete = false;
  private playerName = "PLAYER";
  private playerCharacterId: PlayerCharacterId = DEFAULT_PLAYER_CHARACTER_ID;
  private leaderboardPlayerId = "";
  private leaderboardGoogleLinked = false;
  private leaderboardGoogleEmail: string | null = null;
  private leaderboardGoogleDisplayName: string | null = null;
  private leaderboardSettingsSyncLoadedForPlayerId = "";
  private leaderboardSettingsSaveTimer: number | undefined;
  private applyingLeaderboardUserSettings = false;
  private controlMode: ControlMode = "pc";
  private currentStageId: StageId = DEFAULT_STAGE_ID;
  private locale: Locale = getBrowserLocale();
  private bgmVolumePercent = 50;
  private seVolumePercent = 50;
  private soundMuted = false;
  private danmakuEnabled = true;
  private danmakuMode: DanmakuMode = "classic";
  private startModal?: StartModal;
  private skipSplashIntroOnNextStartModal = false;
  private controlHint = t(this.locale, "hint.pc");
  private editorStage = cloneStage(STAGES[DEFAULT_STAGE_ID]);
  private stageConstants: ResolvedStageConstants = resolveStageConstants(STAGES[DEFAULT_STAGE_ID]);
  private stageEditor?: StageEditor;
  private restartStageEditorEnabled = false;
  private restartEditorStage?: StageDefinition;
  private readonly handleGameLayoutRefresh = () => {
    this.scale.refresh();
    this.applyHudScale();
  };
  private readonly handleFullscreenChange = () => {
    const fullscreenActive = hasFullscreenElement();
    if (fullscreenActive) {
      this.mobileFullscreenWasActive = true;
      this.mobileFullscreenRecoveryDismissed = false;
      this.removeMobileFullscreenRecovery();
    }
    this.scheduleGameLayoutRefresh();
    this.refreshMobileFullscreenRecovery();
  };
  private readonly handleScreenshotShortcut = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== "p" && event.key !== "PrintScreen") {
      return;
    }
    event.preventDefault();
    this.captureGameScreenshot({ preview: false });
  };
  private storyDialogue?: StoryDialogueController;
  private storyDialogueQueue: QueuedStoryDialogue[] = [];
  private triggeredStoryDialogueIndexes = new Set<number>();
  private stageMidpointProgress?: StageMidpointProgress;
  private hasShownStageMidpointDialogue = false;
  private miniChallengeStates: MiniChallengeState[] = [];
  private storyDialogueAdvanceEvents: Phaser.Time.TimerEvent[] = [];
  private storyDialogueRemoveEvent?: Phaser.Time.TimerEvent;
  private currentStoryDialogueCloseAtX?: number;
  private danmakuTutorialDialogueEvent?: Phaser.Time.TimerEvent;
  private stageRenderObjects: Phaser.GameObjects.GameObject[] = [];
  private hasWon = false;
  private hasScoreMilestoneDanmakuPlayed = false;
  private hasShownAquaMascotStompDialogue = false;
  private hasShownStaminaEmptyDialogue = false;
  private hasShownGoalInViewDialogue = false;
  private crouchDanmakuStartedAt = 0;
  private hasCrouchDanmakuPlayed = false;
  private jumpChainCount = 0;
  private hasJumpChainDanmakuPlayed = false;
  private afkIdleStartedAt = 0;
  private hasAfkIdleDanmakuPlayed = false;
  private lastJumpInputAt = -Infinity;
  private lastSpringLaunchAt = -Infinity;
  private pendingSpringBigJumpUntil = -Infinity;
  private pendingSpringBigJumpVelocity = 0;
  private pendingSpringBigJumpEffect?: () => void;
  private wasOnFloor = false;
  private isLanding = false;
  private landingFastForwarded = false;
  private idleStartedAt = 0;
  private isLongIdlePlaying = false;
  private isDefeatSequenceActive = false;
  private hurtUntil = 0;
  private stompFreeJumpUntil = 0;
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
    setBootLoadingProgress("Loading...");
    this.load.on("loaderror", (file: { key?: string; src?: string }) => {
      console.warn("Asset load failed during boot.", file.key ?? file.src ?? file);
      setBootLoadingProgress("一部の素材読み込みを再試行しています...");
    });
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
    this.load.image(HUD_PANEL_TEXTURE_KEY, `${ASSET_BASE}assets/ui/hud_panel_fantasy.png`);
    this.load.image(HUD_CHIP_TEXTURE_KEY, `${ASSET_BASE}assets/ui/fantasy/label_plate_safe.webp`);
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
    PLAYER_CHARACTERS.forEach((character) => {
      Object.entries(character.spriteSheets).forEach(([motion, spriteSheet]) => {
        this.load.spritesheet(
          getPlayerTextureKey(character.id, motion as PlayerCharacterMotion),
          `${ASSET_BASE}${spriteSheet.path}`,
          {
            frameWidth: spriteSheet.frameWidth,
            frameHeight: spriteSheet.frameHeight,
          },
        );
      });
    });
    this.createPixelTexture("platform-hitbox", 1, 1, 0xffffff, 0xffffff);
    this.load.image(GOAL_TEXTURE_KEY, `${ASSET_BASE}assets/stage_objects/goal_gate.webp`);
    this.load.image(RESULT_PANEL_TEXTURE_KEY, `${ASSET_BASE}assets/ui/result_screen/result_panel.webp`);
    this.load.image(MENU_ICON_SETTINGS_KEY, `${ASSET_BASE}assets/ui/menu_icons/settings_gear.webp`);
    this.load.image(MENU_ICON_RANKING_KEY, `${ASSET_BASE}assets/ui/menu_icons/ranking_trophy.webp`);
    this.load.image(MENU_ICON_SCREENSHOT_KEY, `${ASSET_BASE}assets/ui/menu_icons/screenshot_camera.webp`);
    this.load.image(MENU_ICON_WORLD_MAP_KEY, `${ASSET_BASE}assets/ui/menu_icons/world_map.webp`);
    this.load.audio("game-bgm", `${ASSET_BASE}assets/audio/gamebgm_default.mp3`);
    this.load.audio("item-pickup", `${ASSET_BASE}assets/audio/item_pickup.wav`);
    this.load.audio("player-jump-sfx", `${ASSET_BASE}assets/audio/player_jump.wav`);
    this.load.audio("countdown-tick", `${ASSET_BASE}assets/audio/countdown_tick.wav`);
    this.load.audio("countdown-go", `${ASSET_BASE}assets/audio/countdown_go.wav`);
  }

  create() {
    hideBootLoadingOverlay();
    this.registerRainbowPipeline();
    this.playerName = this.getCookieValue("actiongame_player_name") || this.playerName;
    this.playerCharacterId = normalizePlayerCharacterId(this.getCookieValue(PLAYER_CHARACTER_STORAGE_KEY));
    this.leaderboardPlayerId = this.getOrCreateLeaderboardPlayerId();
    void this.refreshLeaderboardIdentity();
    this.locale = this.getSavedLocale();
    this.currentStageId = this.getSavedStageId();
    this.editorStage = cloneStage(STAGES[this.currentStageId]);
    const savedVolumeSettings = this.getSavedVolumeSettings();
    this.bgmVolumePercent = savedVolumeSettings.bgm;
    this.seVolumePercent = savedVolumeSettings.se;
    this.soundMuted = this.getCookieValue("actiongame_muted") === "1";
    this.danmakuMode = this.getSavedDanmakuMode();
    this.danmakuEnabled = this.danmakuMode !== "none";
    this.applySoundSettings();
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", this.handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", this.handleFullscreenChange);
    document.removeEventListener("MSFullscreenChange", this.handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", this.handleFullscreenChange);
    this.resetRunState();
    this.isRestarting = false;
    this.stageConstants = resolveStageConstants(this.editorStage);
    this.stageMidpointProgress = this.resolveStageMidpointProgress();
    this.miniChallengeStates = this.createMiniChallengeStates();
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

    this.player = this.physics.add.sprite(
      this.editorStage.playerStart.x,
      this.editorStage.playerStart.y,
      this.playerTextureKey("idle"),
    );
    movePlayerToCheckpointStart(this.currentStageId, this.editorStage, this.player);
    this.rewards = new RewardSystem(
      this,
      () => this.player,
      () => this.updateScoreText(),
      () => this.tryEmitScoreDanmaku(),
    );
    this.player.setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
    this.player.setCollideWorldBounds(true);
    this.applyPlayerBody();
    this.player.setMaxVelocity(MAX_RUN_SPEED, MAX_FALL_SPEED);
    this.player.play(this.playerAnimationKey("idle"));
    this.wasOnFloor = true;
    this.player.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}${this.playerAnimationKey("land")}`, () => {
      this.isLanding = false;
      this.landingFastForwarded = false;
      this.player.anims.timeScale = 1;
    });
    this.player.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}${this.playerAnimationKey("longidle")}`, () => {
      this.isLongIdlePlaying = false;
      this.idleStartedAt = this.time.now;
      if (this.isRunActive && this.player.anims.currentAnim?.key === this.playerAnimationKey("longidle")) {
        this.player.anims.play(this.playerAnimationKey("idle"), true);
      }
    });

    this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, undefined, this);
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(this.player, this.decorationPlatforms, undefined, this.canLandOnDecorationPlatform, this);
    this.physics.add.overlap(this.player, goal, () => this.win());
    this.dashWalls = this.createDashWalls(this.editorStage.dashWalls ?? []);
    this.itemsGroup = createItems({
      scene: this,
      player: this.player,
      placements: this.editorStage.items,
      canCollect: () => !this.stageEditor?.isEnabled,
      onCollect: (itemType, points, x, y, placementIndex) => {
        this.rewards?.collectItem(itemType, points, x, y);
        this.noteMiniChallengeItem(itemType, x, y);
        this.minimap?.markItemCollected(placementIndex);
      },
      trackStageObject: (object) => this.trackStageObject(object),
    });
    this.bonusBlocksGroup = createBonusBlocks({
      scene: this,
      player: this.player,
      placements: this.editorStage.bonusBlocks ?? [],
      onReward: (itemType, x, y) => this.rewards?.applyBonusBlockReward(itemType, x, y),
    });
    this.checkpointController = new CheckpointController(
      this,
      this.player,
      () => this.currentStageId,
      () => this.editorStage,
      () => this.isRunActive && !this.stageEditor?.isEnabled,
      (x, y, text) => this.rewards?.showFloatingText(x, y, text),
      () => t(this.locale, "hud.checkpoint"),
    );
    this.checkpointController.create();
    this.oneWayGateController = new OneWayGateController(
      this,
      this.player,
      () => this.editorStage,
      () => this.isRunActive && !this.stageEditor?.isEnabled,
      (x, y, text) => this.rewards?.showFloatingText(x, y, text),
      () => t(this.locale, "hud.oneWay"),
    );
    this.oneWayGateController.create();
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

    this.hudPanelBack = this.add
      .image(HUD_PANEL_X, HUD_PANEL_Y, HUD_PANEL_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(96)
      .setAlpha(0.92);
    this.hudPanelBack.setDisplaySize(HUD_PANEL_WIDTH, HUD_PANEL_HEIGHT);
    this.hudPanelAccent = this.add
      .rectangle(HUD_PANEL_X + 14, HUD_PANEL_Y + 16, 3, HUD_PANEL_HEIGHT - 32, 0x67e8f9, 0.68)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(97)
      .setVisible(false);

    this.playerNameText = this.add
      .text(HUD_TEXT_X, HUD_PLAYER_NAME_Y, "", {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: `${HUD_PLAYER_NAME_FONT_SIZE}px`,
        fontStyle: "700",
        color: "#e0f2fe",
        stroke: "#03111f",
        strokeThickness: 0,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setDepth(100)
      .setShadow(0, 1, "#020617", 0, true, true)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(HUD_TEXT_X, HUD_SCORE_Y, "", {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: `${HUD_SCORE_FONT_SIZE}px`,
        fontStyle: "700",
        color: "#f8fafc",
        stroke: "#03111f",
        strokeThickness: 0,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 0, true, true);
    this.updateScoreText();

    this.timerText = this.add
      .text(HUD_TIMER_X, HUD_SCORE_Y, "", {
        fontFamily: UI_TEXT_FONT_FAMILY,
        fontSize: `${HUD_MAIN_FONT_SIZE}px`,
        fontStyle: "700",
        color: "#fde68a",
        stroke: "#03111f",
        strokeThickness: 0,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 0, true, true);
    this.updateTimerText();

    this.staminaText = this.add
      .text(HUD_TEXT_X, HUD_STAMINA_Y, "", {
        fontFamily: UI_TEXT_FONT_FAMILY,
        fontSize: `${HUD_MAIN_FONT_SIZE}px`,
        fontStyle: "700",
        color: "#bbf7d0",
        stroke: "#03111f",
        strokeThickness: 0,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 0, true, true);
    this.staminaBarBack = this.add
      .rectangle(HUD_STAMINA_BAR_X, HUD_STAMINA_BAR_Y, HUD_STAMINA_BAR_WIDTH, HUD_STAMINA_BAR_HEIGHT, 0x0f172a, 0.78)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(99);
    this.staminaBarFill = this.add
      .rectangle(HUD_STAMINA_FILL_X, HUD_STAMINA_BAR_Y, HUD_STAMINA_FILL_WIDTH, HUD_STAMINA_FILL_HEIGHT, 0x86efac, 0.95)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(100);
    this.staminaBarFrame = this.add
      .rectangle(HUD_STAMINA_BAR_X, HUD_STAMINA_BAR_Y, HUD_STAMINA_BAR_WIDTH, HUD_STAMINA_BAR_HEIGHT, 0x0f172a, 0)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.staminaBarFrame.setStrokeStyle(1, 0x86efac, 0.8);
    this.staminaBarTicks = Array.from({ length: HUD_STAMINA_TICK_COUNT - 1 }, (_, index) =>
      this.add
        .rectangle(
          HUD_STAMINA_BAR_X + (HUD_STAMINA_BAR_WIDTH / HUD_STAMINA_TICK_COUNT) * (index + 1),
          HUD_STAMINA_BAR_Y,
          1,
          HUD_STAMINA_BAR_HEIGHT,
          0xf8fafc,
          0.32,
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(102),
    );
    this.overheadStaminaBarBack = this.add
      .rectangle(this.player.x, this.player.y, OVERHEAD_STAMINA_BAR_WIDTH, OVERHEAD_STAMINA_BAR_HEIGHT, 0x020617, 0.78)
      .setOrigin(0.5, 0.5)
      .setDepth(130)
      .setVisible(false);
    this.overheadStaminaBarBack.setStrokeStyle(1, 0xbbf7d0, 0.82);
    this.overheadStaminaBarFill = this.add
      .rectangle(this.player.x, this.player.y, OVERHEAD_STAMINA_FILL_WIDTH, OVERHEAD_STAMINA_FILL_HEIGHT, 0x86efac, 0.98)
      .setOrigin(0, 0.5)
      .setDepth(131)
      .setVisible(false);
    this.updateStaminaHud();

    this.controlHintBack = this.add
      .image(HUD_MODE_CHIP_X, HUD_MODE_CHIP_Y, HUD_CHIP_TEXTURE_KEY)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(98)
      .setAlpha(0.9);
    this.controlHintBack.setDisplaySize(HUD_MODE_CHIP_MIN_WIDTH, HUD_MODE_CHIP_HEIGHT);
    this.controlHintText = this.add
      .text(HUD_MODE_CHIP_X, HUD_MODE_CHIP_Y + 7, "", {
        fontFamily: UI_TEXT_FONT_FAMILY,
        fontSize: `${HUD_HINT_FONT_SIZE}px`,
        fontStyle: "700",
        color: "#fde68a",
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 0, true, true);
    this.applyHudScale();
    this.scale.off("resize", this.handleScaleResize, this);
    this.scale.on("resize", this.handleScaleResize, this);
    window.removeEventListener(GAME_LAYOUT_REFRESH_EVENT, this.handleGameLayoutRefresh);
    window.addEventListener(GAME_LAYOUT_REFRESH_EVENT, this.handleGameLayoutRefresh);
    window.removeEventListener("keydown", this.handleScreenshotShortcut);
    window.addEventListener("keydown", this.handleScreenshotShortcut);
    this.updateControlHintText();
    this.minimap = new MinimapOverlay(
      this,
      () => this.editorStage,
      () => this.player,
      () => this.cameras.main,
    );
    this.danmaku = new DanmakuOverlay(this, GAME_WIDTH, GAME_HEIGHT, () => this.locale);
    this.danmaku.setMode(this.danmakuMode);

    this.input.keyboard!.off("keydown-R");
    this.input.keyboard!.on("keydown-R", () => this.handleRestartKey());
    this.input.keyboard!.off("keydown-W");
    this.input.keyboard!.off("keydown-SPACE");
    this.input.keyboard!.off("keydown-P");
    this.input.keyboard!.off("keydown-PRINT_SCREEN");
    this.input.keyboard!.on("keydown-W", () => this.noteJumpInput());
    this.input.keyboard!.on("keydown-SPACE", () => this.noteJumpInput());
    this.input.keyboard!.on("keydown-P", () => this.captureGameScreenshot({ preview: false }));
    this.input.keyboard!.on("keydown-PRINT_SCREEN", () => this.captureGameScreenshot({ preview: false }));
    this.createStageEditor();
    this.createGlobalUI();

    this.bgm = this.sound.add("game-bgm", { loop: true, volume: this.bgmVolumePercent / 100 });
    this.applySoundSettings();

    if (this.setupComplete) {
      this.startRun();
    } else {
      this.physics.pause();
      this.showStartModal();
    }
  }

  update(_time: number, deltaMs: number) {
    this.updateBackground();
    this.updateTimerText();
    this.updateGhostReplay();
    this.updateOverheadStaminaBar();
    this.minimap?.update(_time, this.isRunActive && !this.hasWon);
    const movingPlatformsActive = this.isRunActive && !this.stageEditor?.isEnabled;
    updateMovingPlatforms(this.movingPlatformInstances, movingPlatformsActive, deltaMs);
    if (!this.isRunActive) {
      if (!this.isDefeatSequenceActive) {
        this.applyPlayerBody(false);
        this.player.setVelocity(0, 0);
      }
      this.updateCollisionDebug();
      this.player.setAcceleration(0, 0);
      return;
    }
    if (this.getRemainingMilliseconds() <= 0) {
      this.playTimeUpMissSequence();
      return;
    }

    this.updateStoryDialogueProgress();
    this.updateStageMidpointProgress();
    this.updateMiniChallenges();
    this.updateGoalInViewDialogue();
    this.refreshDropThroughDecorationPlatform();
    this.oneWayGateController?.update();
    if (this.stageEditor?.isEnabled) {
      freezeEnemies(this.enemiesGroup);
    } else {
      updateEnemies(this.enemiesGroup, this.player, this.stageConstants.worldBottom + 32);
    }
    const left = this.keys.a.isDown || this.cursors.left.isDown || this.mobileInput.a;
    const right = this.keys.d.isDown || this.cursors.right.isDown || this.mobileInput.d;
    const up = this.keys.w.isDown || this.cursors.up.isDown || this.cursors.space.isDown || this.mobileInput.w;
    const down = this.keys.s.isDown || this.cursors.down.isDown || this.mobileInput.s;
    const wantsDash = this.keys.shift.isDown || this.mobileInput.shift;
    if (this.stageEditor?.isEnabled) {
      this.disableGhostRecording();
      this.updateEditorPlayerMovement(left, right, up, down, wantsDash);
      return;
    }
    const onDescendingMovingPlatform = isPlayerSupportedByDescendingMovingPlatform(
      this.player,
      this.movingPlatformInstances,
      movingPlatformsActive,
    );
    const onFloor = this.player.body.blocked.down || this.player.body.touching.down || onDescendingMovingPlatform;
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

    const isCrouchInputActive = down && onFloor;
    const isShiftSpeedActive = this.updateStamina(onFloor, wantsDash, isCrouchInputActive, deltaMs);
    this.isDashActive = isShiftSpeedActive;
    this.updateDashWallOverlap();
    const speedMultiplier = (isShiftSpeedActive ? DASH_SPEED_MULTIPLIER : 1) * (this.rewards?.getSpeedMultiplier() ?? 1);
    const jumpMultiplier = this.rewards?.getJumpMultiplier() ?? 1;
    this.updateDecorationPlatformDrop(down, onFloor);
    this.applyPlayerBody(isCrouchInputActive);
    this.player.setMaxVelocity(
      (isCrouchInputActive ? CROUCH_MAX_RUN_SPEED : MAX_RUN_SPEED) * speedMultiplier,
      this.player.body.velocity.y < 0 ? MAX_UPWARD_LAUNCH_SPEED : isShiftSpeedActive ? DASH_MAX_VERTICAL_SPEED : MAX_FALL_SPEED,
    );
    this.updateCollisionDebug();
    const debugJump = Phaser.Input.Keyboard.JustDown(this.keys.w) || this.mobileJumpQueued;
    if (this.mobileJumpQueued) {
      this.noteJumpInput();
    }
    this.mobileJumpQueued = false;
    const normalJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);
    if (normalJump || debugJump) {
      this.noteJumpInput();
    }
    const springLaunchedRecently = this.time.now - this.lastSpringLaunchAt <= SPRING_LAUNCH_NORMAL_JUMP_SUPPRESS_MS;
    const jump = (debugJump || normalJump) && !springLaunchedRecently;
    const hasGameplayInput = left || right || up || down || wantsDash || debugJump || normalJump;
    this.updateAfkIdleDanmaku(hasGameplayInput);
    const wantsStompFreeJump = jump && !onFloor && this.time.now <= this.stompFreeJumpUntil;
    const wantsAirJump = jump && !onFloor && (debugJump || normalJump);
    const canJump = onFloor || wantsStompFreeJump || (wantsAirJump && this.consumeStamina(AIR_JUMP_STAMINA_COST));
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
    carryPlayerOnDescendingMovingPlatforms(this.player, this.movingPlatformInstances, movingPlatformsActive);

    if (jump && canJump) {
      if (wantsStompFreeJump) {
        this.stompFreeJumpUntil = 0;
      }
      const isDashJumpInputActive = wantsDash && isShiftSpeedActive;
      const isSpeedBoostedJump = Math.abs(this.player.body.velocity.x) >= BOOST_JUMP_SPEED_THRESHOLD;
      const baseJumpVelocity =
        isDashJumpInputActive || isSpeedBoostedJump ? BOOSTED_JUMP_VELOCITY : JUMP_VELOCITY;
      const jumpSpeedMultiplier =
        (isDashJumpInputActive ? DASH_SPEED_MULTIPLIER : 1) * (this.rewards?.getSpeedMultiplier() ?? 1);
      this.player.setVelocityY(baseJumpVelocity * jumpSpeedMultiplier * jumpMultiplier);
      this.isLanding = false;
      this.landingFastForwarded = false;
      this.player.anims.timeScale = 1;
      startedJump = true;
      this.resetPlayerIdleState();
      this.player.anims.play(this.playerAnimationKey("jump-start"), true);
      this.sound.play("player-jump-sfx", { volume: getScaledSeVolume(this, 0.42) });
    }

    const isMovingHorizontally = Math.abs(this.player.body.velocity.x) > 8;
    const landedThisFrame = !this.wasOnFloor && onFloor && !startedJump;
    const isCrouching = down && onFloor && !startedJump;
    this.updateJumpChainDanmaku(startedJump, landedThisFrame);
    this.updateCrouchDanmaku(isCrouching);
    if (landedThisFrame && this.time.now > this.stompFreeJumpUntil) {
      this.rewards?.resetStompComboOnLanding();
    }

    if (landedThisFrame) {
      this.isLanding = true;
      this.landingFastForwarded = false;
      this.resetPlayerIdleState();
      this.player.anims.timeScale = 1;
      this.player.anims.play(this.playerAnimationKey("land"), true);
    } else if (this.isLanding) {
      if (down) {
        this.isLanding = false;
        this.landingFastForwarded = false;
        this.player.anims.timeScale = 1;
        this.player.anims.play(this.playerAnimationKey("crouch"));
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
      this.player.anims.play(this.playerAnimationKey("jump-start"), true);
    } else if (!onFloor) {
      this.resetPlayerIdleState();
      const currentAnimation = this.player.anims.currentAnim?.key;
      if (currentAnimation !== this.playerAnimationKey("jump-start") || !this.player.anims.isPlaying) {
        this.player.anims.play(this.playerAnimationKey("air"), true);
      }
    } else if (isCrouching) {
      this.resetPlayerIdleState();
      this.player.anims.timeScale = 1;
      if (this.player.anims.currentAnim?.key !== this.playerAnimationKey("crouch")) {
        this.player.anims.play(this.playerAnimationKey("crouch"));
      }
    } else if (left || right || isMovingHorizontally) {
      this.resetPlayerIdleState();
      if (wantsDash && isShiftSpeedActive && (left || right)) {
        this.player.anims.play(this.playerAnimationKey("dash"), true);
      } else {
        this.player.anims.play(this.playerAnimationKey("walk"), true);
      }
    } else {
      this.updatePlayerIdleAnimation();
    }

    this.recordGhostFrame({ left, right, up, down, dash: wantsDash });
    this.wasOnFloor = onFloor;

    if (this.player.y > this.stageConstants.worldBottom + 32) {
      this.playFallMissSequence();
    }
  }

  private updateEditorPlayerMovement(left: boolean, right: boolean, up: boolean, down: boolean, wantsDash: boolean) {
    const speed = EDITOR_FLY_SPEED * (wantsDash ? DASH_SPEED_MULTIPLIER : 1);
    const velocityX = left === right ? 0 : left ? -speed : speed;
    const velocityY = up === down ? 0 : up ? -speed : speed;
    this.applyPlayerBody(false);
    this.player.body.setAllowGravity(false);
    this.player.setAcceleration(0, 0);
    this.player.setDrag(0, 0);
    this.player.setMaxVelocity(speed, speed);
    this.player.setVelocity(velocityX, velocityY);
    if (velocityX < 0) {
      this.player.setFlipX(true);
    } else if (velocityX > 0) {
      this.player.setFlipX(false);
    }
    this.updateCollisionDebug();
    this.wasOnFloor = false;
    this.isLanding = false;
    this.landingFastForwarded = false;
    this.resetPlayerIdleState();
    if (velocityX !== 0 || velocityY !== 0) {
      this.player.anims.play(this.playerAnimationKey("air"), true);
    } else {
      this.updatePlayerIdleAnimation();
    }
  }

  private resetPlayerIdleState(startedAt = 0) {
    this.idleStartedAt = startedAt;
    this.isLongIdlePlaying = false;
  }

  private updatePlayerIdleAnimation() {
    this.player.anims.timeScale = 1;
    if (this.isLongIdlePlaying) {
      if (this.player.anims.currentAnim?.key !== this.playerAnimationKey("longidle")) {
        this.player.anims.play(this.playerAnimationKey("longidle"), true);
      }
      return;
    }

    if (this.idleStartedAt === 0) {
      this.idleStartedAt = this.time.now;
    }

    if (this.time.now - this.idleStartedAt >= PLAYER_LONG_IDLE_TRIGGER_MS) {
      this.isLongIdlePlaying = true;
      this.player.anims.play(this.playerAnimationKey("longidle"), true);
      return;
    }

    this.player.anims.play(this.playerAnimationKey("idle"), true);
  }

  private resetRunState() {
    this.scale.off("resize", this.handleScaleResize, this);
    window.removeEventListener(GAME_LAYOUT_REFRESH_EVENT, this.handleGameLayoutRefresh);
    window.removeEventListener("keydown", this.handleScreenshotShortcut);
    this.removeStartModal();
    this.removeMobileControls();
    this.removeStageEditor();
    this.removeGlobalUI();
    this.clearStoryDialogueTimers();
    this.clearDanmakuTutorialDialogueTimer();
    this.storyDialogue?.remove();
    this.storyDialogue = undefined;
    this.triggeredStoryDialogueIndexes.clear();
    this.hasShownAquaMascotStompDialogue = false;
    this.hasShownStaminaEmptyDialogue = false;
    this.hasShownGoalInViewDialogue = false;
    this.miniChallengeStates = [];
    this.countdownOverlay?.clear();
    this.countdownOverlay = undefined;
    this.missText?.destroy();
    this.missText = undefined;
    this.danmaku?.destroy();
    this.danmaku = undefined;
    this.ghostReplaySprite?.destroy();
    this.ghostReplaySprite = undefined;
    this.ghostReplayFrameIndex = 0;
    this.ghostExportButton?.destroy();
    this.ghostExportButton = undefined;
    this.clearMenuButton?.destroy();
    this.clearMenuButton = undefined;
    this.clearScreenshotButton?.destroy();
    this.clearScreenshotButton = undefined;
    this.screenshotCapturePending = false;
    this.screenshotPreviewOpen = false;
    this.screenshotPreviewPausedScene = false;
    this.ghostRecordingFrames = [];
    this.ghostRecordingActive = false;
    this.ghostRecordingDisabled = false;
    this.lastGhostRecordAt = -Infinity;
    this.dashLingerUntil = -Infinity;
    this.isDashActive = false;
    this.lastDashWallBounceAt = -Infinity;
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    this.rewards?.reset();
    this.startTime = 0;
    this.editorTimerPausedMs = 0;
    this.editorTimerPauseStartedAt = 0;
    this.stamina = MAX_STAMINA;
    this.dashLingerUntil = -Infinity;
    this.isDashActive = false;
    this.hasUsedStageEditorThisRun = false;
    this.isRunActive = false;
    this.hasWon = false;
    this.hasScoreMilestoneDanmakuPlayed = false;
    this.crouchDanmakuStartedAt = 0;
    this.hasCrouchDanmakuPlayed = false;
    this.jumpChainCount = 0;
    this.hasJumpChainDanmakuPlayed = false;
    this.afkIdleStartedAt = 0;
    this.hasAfkIdleDanmakuPlayed = false;
    this.lastJumpInputAt = -Infinity;
    this.lastSpringLaunchAt = -Infinity;
    this.pendingSpringBigJumpUntil = -Infinity;
    this.pendingSpringBigJumpVelocity = 0;
    this.pendingSpringBigJumpEffect = undefined;
    this.wasOnFloor = false;
    this.isLanding = false;
    this.landingFastForwarded = false;
    this.idleStartedAt = 0;
    this.isLongIdlePlaying = false;
    this.isDefeatSequenceActive = false;
    this.hurtUntil = 0;
    this.stompFreeJumpUntil = 0;
    this.invulnerableUntil = 0;
    this.damageTween?.stop();
    this.damageTween = undefined;
    this.decorationPlatformCrouchStartedAt = 0;
    this.dropThroughDecorationPlatformBody = undefined;
    this.collisionDebugGraphics?.clear();
    this.collisionDebugGraphics = undefined;
    this.stageMidpointProgress = undefined;
    this.miniChallengeStates = [];
    this.hasShownStageMidpointDialogue = false;
    this.hasShownGoalInViewDialogue = false;
    this.itemsGroup = undefined;
    this.bonusBlocksGroup = undefined;
    this.checkpointController = undefined;
    this.oneWayGateController = undefined;
    this.dashWalls = undefined;
    this.enemiesGroup = undefined;
    this.goal = undefined;
    this.resultScreenContainer?.destroy(true);
    this.resultScreenContainer = undefined;
    this.clearStampContainer?.destroy(true);
    this.clearStampContainer = undefined;
    this.missText = undefined;
  }

  private updateStoryDialogueProgress() {
    const storyDialogues = [
      ...(this.editorStage.storyDialogue ? [this.editorStage.storyDialogue] : []),
      ...(this.editorStage.storyDialogues ?? []),
    ];
    if (storyDialogues.length === 0) {
      return;
    }

    storyDialogues.forEach((storyDialogue, index) => {
      if (!storyDialogue.lines.length || this.triggeredStoryDialogueIndexes.has(index)) {
        return;
      }

      const triggerX = storyDialogue.triggerX ?? STORY_DIALOGUE_ADVANCE_X;
      if (this.player.x <= triggerX) {
        return;
      }

      this.triggeredStoryDialogueIndexes.add(index);
      const stepDelayMs = (storyDialogue.stepDelayMs ?? STORY_DIALOGUE_STEP_DELAY_MS) * STORY_DIALOGUE_TRIGGER_DURATION_SCALE;
      this.enqueueStoryDialogue({
        lines: resolveStoryDialogueLines(storyDialogue, this.locale),
        closeAtX: storyDialogue.closeAtX,
        stepDelayMs,
        durationMs: storyDialogue.durationMs,
      });
    });
    this.updateStoryDialogueAutoClose();
  }

  private resolveStageMidpointProgress(): StageMidpointProgress {
    const isWideStage = this.editorStage.worldWidth >= this.stageConstants.worldHeight;
    const axis = isWideStage ? "x" : "y";
    const start = this.editorStage.playerStart[axis];
    const goal = this.editorStage.goal[axis];
    return {
      axis,
      midpoint: (start + goal) / 2,
      direction: goal >= start ? 1 : -1,
    };
  }

  private updateStageMidpointProgress() {
    if (this.hasShownStageMidpointDialogue || !this.stageMidpointProgress || this.stageEditor?.isEnabled) {
      return;
    }

    const { axis, midpoint, direction } = this.stageMidpointProgress;
    const playerPosition = this.player[axis];
    const hasPassedMidpoint = direction > 0 ? playerPosition >= midpoint : playerPosition <= midpoint;
    if (!hasPassedMidpoint) {
      return;
    }

    this.hasShownStageMidpointDialogue = true;
    this.enqueueStoryDialogue({
      lines: [resolveFixedStoryDialogue("stageMidpoint", this.locale)],
      durationMs: STAGE_MIDPOINT_DIALOGUE_DURATION_MS,
    });
  }

  private createMiniChallengeStates(): MiniChallengeState[] {
    return (this.editorStage.miniChallenges ?? []).map((definition) => ({
      definition,
      started: false,
      completed: false,
      failed: false,
      coins: 0,
    }));
  }

  private updateMiniChallenges() {
    if (this.stageEditor?.isEnabled || !this.isRunActive || this.hasWon) {
      return;
    }

    this.miniChallengeStates.forEach((state) => {
      const { definition } = state;
      if (!state.started && this.player.x >= definition.startX && this.player.x <= definition.endX) {
        state.started = true;
        this.rewards?.showFloatingText(this.player.x, this.player.y - 130, resolveStageText(definition.title, this.locale));
      }

      if (!state.started || state.completed || state.failed || this.player.x <= definition.endX) {
        return;
      }

      state.failed = true;
      this.rewards?.showFloatingText(definition.endX, this.player.y - 110, "CHALLENGE --");
    });
  }

  private noteMiniChallengeItem(itemType: string, x: number, y: number) {
    if (itemType !== "coin" || this.stageEditor?.isEnabled || !this.isRunActive) {
      return;
    }

    this.miniChallengeStates.forEach((state) => {
      const { definition } = state;
      if (state.completed || state.failed || x < definition.startX || x > definition.endX) {
        return;
      }

      if (!state.started) {
        state.started = true;
        this.rewards?.showFloatingText(x, y - 88, resolveStageText(definition.title, this.locale));
      }

      state.coins += 1;
      const targetCoins = definition.targetCoins ?? 0;
      if (targetCoins <= 0 || state.coins < targetCoins) {
        return;
      }

      state.completed = true;
      this.rewards?.addChallengeBonus(definition.bonusScore ?? 0, x, y - 96);
    });
  }

  private updateGoalInViewDialogue() {
    if (this.hasShownGoalInViewDialogue || !this.goal || this.stageEditor?.isEnabled || this.hasWon) {
      return;
    }

    if (!Phaser.Geom.Rectangle.Overlaps(this.cameras.main.worldView, this.goal.getBounds())) {
      return;
    }

    this.hasShownGoalInViewDialogue = true;
    this.enqueueStoryDialogue({
      lines: [resolveFixedStoryDialogue("goalInView", this.locale)],
      durationMs: GOAL_IN_VIEW_DIALOGUE_DURATION_MS,
    });
  }

  private clearStoryDialogueTimers() {
    this.storyDialogueAdvanceEvents.forEach((event) => event.remove(false));
    this.storyDialogueRemoveEvent?.remove(false);
    this.storyDialogueAdvanceEvents.length = 0;
    this.storyDialogueRemoveEvent = undefined;
    this.currentStoryDialogueCloseAtX = undefined;
    this.storyDialogueQueue.length = 0;
  }

  private clearDanmakuTutorialDialogueTimer() {
    this.danmakuTutorialDialogueEvent?.remove(false);
    this.danmakuTutorialDialogueEvent = undefined;
  }

  private getDanmakuTutorialSeenStorageKey(playerId = this.leaderboardPlayerId) {
    const accountId = isLeaderboardPlayerId(playerId) ? playerId : this.getOrCreateLeaderboardPlayerId();
    return `${DANMAKU_TUTORIAL_SEEN_STORAGE_KEY_PREFIX}:${accountId}`;
  }

  private hasSeenDanmakuTutorialDialogue() {
    try {
      return window.localStorage.getItem(this.getDanmakuTutorialSeenStorageKey()) === "1";
    } catch (error) {
      console.warn("Could not read danmaku tutorial flag.", error);
      return this.getCookieValue(this.getDanmakuTutorialSeenStorageKey()) === "1";
    }
  }

  private markDanmakuTutorialDialogueSeen(playerId = this.leaderboardPlayerId) {
    const storageKey = this.getDanmakuTutorialSeenStorageKey(playerId);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch (error) {
      console.warn("Could not save danmaku tutorial flag.", error);
    }
    this.setCookieValue(storageKey, "1");
  }

  private scheduleDanmakuTutorialDialogue() {
    if (this.danmakuTutorialDialogueEvent || this.hasSeenDanmakuTutorialDialogue()) {
      return;
    }

    this.danmakuTutorialDialogueEvent = this.time.delayedCall(DANMAKU_TUTORIAL_DIALOGUE_DELAY_MS, () => {
      this.danmakuTutorialDialogueEvent = undefined;
      if (!this.isRunActive || this.stageEditor?.isEnabled || this.hasWon) {
        return;
      }
      this.markDanmakuTutorialDialogueSeen();
      this.scheduleLeaderboardUserSettingsSave();
      this.enqueueStoryDialogue({
        lines: [resolveFixedStoryDialogue("danmakuTutorial", this.locale)],
        durationMs: DANMAKU_TUTORIAL_DIALOGUE_DURATION_MS,
      });
    });
  }

  private showAquaMascotStompDialogueOnce(enemy: Phaser.Physics.Arcade.Sprite) {
    if (this.hasShownAquaMascotStompDialogue || enemy.getData("enemyType") !== "aquaMascot") {
      return;
    }

    this.hasShownAquaMascotStompDialogue = true;
    this.enqueueStoryDialogue({
      lines: [resolveFixedStoryDialogue("aquaMascotStomp", this.locale)],
      durationMs: AQUA_MASCOT_STOMP_DIALOGUE_DURATION_MS,
    });
  }

  private enqueueStoryDialogue(dialogue: QueuedStoryDialogue) {
    if (!dialogue.lines.length) {
      return;
    }

    this.storyDialogueQueue.push({
      ...dialogue,
      lines: [...dialogue.lines],
    });
    this.showNextQueuedStoryDialogue();
  }

  private showNextQueuedStoryDialogue() {
    if (this.storyDialogue || this.storyDialogueAdvanceEvents.length > 0 || this.storyDialogueRemoveEvent) {
      return;
    }

    let nextDialogue = this.storyDialogueQueue.shift();
    while (nextDialogue && nextDialogue.closeAtX !== undefined && this.player.x >= nextDialogue.closeAtX) {
      nextDialogue = this.storyDialogueQueue.shift();
    }
    if (!nextDialogue) {
      return;
    }

    this.storyDialogue = createStoryDialogue({
      lines: nextDialogue.lines,
      locale: this.locale,
    });
    this.currentStoryDialogueCloseAtX = nextDialogue.closeAtX;
    const stepDelayMs = nextDialogue.stepDelayMs ?? STORY_DIALOGUE_STEP_DELAY_MS;
    for (let lineIndex = 1; lineIndex < nextDialogue.lines.length; lineIndex += 1) {
      const advanceEvent = this.time.delayedCall(stepDelayMs * lineIndex, () => {
        this.storyDialogue?.next();
        this.storyDialogueAdvanceEvents = this.storyDialogueAdvanceEvents.filter((event) => event !== advanceEvent);
      });
      this.storyDialogueAdvanceEvents.push(advanceEvent);
    }
    const durationMs = nextDialogue.durationMs ?? stepDelayMs * Math.max(nextDialogue.lines.length, 1);
    this.storyDialogueRemoveEvent = this.time.delayedCall(durationMs, () => {
      this.closeCurrentStoryDialogue({ animate: true });
    });
  }

  private updateStoryDialogueAutoClose() {
    if (!this.storyDialogue || this.currentStoryDialogueCloseAtX === undefined || this.player.x < this.currentStoryDialogueCloseAtX) {
      return;
    }

    this.closeCurrentStoryDialogue({ animate: true });
  }

  private closeCurrentStoryDialogue(options?: { animate?: boolean }) {
    this.storyDialogueAdvanceEvents.forEach((event) => event.remove(false));
    this.storyDialogueRemoveEvent?.remove(false);
    this.storyDialogue?.remove(options);
    this.storyDialogue = undefined;
    this.storyDialogueRemoveEvent = undefined;
    this.storyDialogueAdvanceEvents.length = 0;
    this.currentStoryDialogueCloseAtX = undefined;
    this.showNextQueuedStoryDialogue();
  }

  private restartStage() {
    if (this.isRestarting) {
      return;
    }

    this.dismissLeaderboard();
    this.restartStageEditorEnabled = this.stageEditor?.isEnabled ?? false;
    this.restartEditorStage = cloneStage(this.editorStage);
    this.isRestarting = true;
    this.resetRunState();
    this.bgm?.stop();
    this.scene.restart();
  }

  private async returnToTitle() {
    if (this.isRestarting) {
      return;
    }
    if (!(await this.confirmReturnToWorldMap())) {
      return;
    }

    this.dismissLeaderboard();
    document.getElementById("account-modal")?.remove();
    document.body.classList.remove("is-account-modal-open");
    this.setupComplete = false;
    this.skipSplashIntroOnNextStartModal = true;
    this.restartStageEditorEnabled = false;
    this.restartEditorStage = undefined;
    this.isRestarting = true;
    this.resetRunState();
    this.bgm?.stop();
    this.scene.restart();
  }

  private confirmReturnToWorldMap() {
    document.getElementById("world-map-return-confirm")?.remove();
    document.body.classList.add("is-world-map-return-confirm-open");

    return new Promise<boolean>((resolve) => {
      const overlay = document.createElement("div");
      overlay.id = "world-map-return-confirm";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "world-map-return-confirm-title");

      const dialog = document.createElement("div");
      dialog.className = "world-map-return-confirm-dialog";

      const title = document.createElement("h2");
      title.id = "world-map-return-confirm-title";
      title.textContent = t(this.locale, "menu.returnToWorldMapTitle");

      const message = document.createElement("p");
      message.textContent = t(this.locale, "menu.returnToWorldMapConfirm");

      const actions = document.createElement("div");
      actions.className = "world-map-return-confirm-actions";

      const yesButton = document.createElement("button");
      yesButton.type = "button";
      yesButton.className = "world-map-return-confirm-yes";
      yesButton.textContent = t(this.locale, "menu.returnToWorldMapYes");

      const noButton = document.createElement("button");
      noButton.type = "button";
      noButton.className = "world-map-return-confirm-no";
      noButton.textContent = t(this.locale, "menu.returnToWorldMapNo");

      const finish = (shouldReturn: boolean) => {
        overlay.remove();
        document.body.classList.remove("is-world-map-return-confirm-open");
        resolve(shouldReturn);
      };

      yesButton.addEventListener("click", () => finish(true));
      noButton.addEventListener("click", () => finish(false));
      overlay.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        if (event.target === overlay) {
          finish(false);
        }
      });
      overlay.addEventListener("keydown", (event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          finish(false);
        }
        if (event.key === "Enter") {
          finish(true);
        }
      });

      actions.append(yesButton, noButton);
      dialog.append(title, message, actions);
      overlay.append(dialog);
      document.body.appendChild(overlay);
      noButton.focus();
    });
  }

  private handleRestartKey() {
    this.restartStage();
  }

  private dismissLeaderboard() {
    document.getElementById("leaderboard-modal")?.remove();
    document.body.classList.remove("is-leaderboard-modal-open");
  }

  private startRun() {
    this.removeStartModal();
    this.applySelectedStage(this.currentStageId);
    this.prepareGhostReplayForRun();
    this.updatePlayerNameText();
    this.controlHint = this.controlMode === "mobile" ? t(this.locale, "hint.mobile") : t(this.locale, "hint.pc");
    this.updateControlHintText();
    this.createGlobalUI();
    const shouldWaitForMobileLayoutSetup = this.controlMode === "mobile" && shouldShowMobileControlsLayoutSetup();
    this.mobileLayoutShouldStartCountdown = shouldWaitForMobileLayoutSetup;
    if (this.controlMode === "mobile") {
      this.mobileFullscreenWasActive = hasFullscreenElement();
      this.mobileFullscreenRecoveryDismissed = false;
      this.createMobileControls();
    }
    if (!shouldWaitForMobileLayoutSetup) {
      this.startCountdown();
    }
  }

  private startCountdown() {
    this.physics.pause();
    this.isRunActive = false;
    this.startTime = 0;
    this.editorTimerPausedMs = 0;
    this.editorTimerPauseStartedAt = 0;
    this.hasUsedStageEditorThisRun = false;
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
    this.editorTimerPausedMs = 0;
    this.editorTimerPauseStartedAt = this.stageEditor?.isEnabled ? this.time.now : 0;
    this.hasUsedStageEditorThisRun = this.stageEditor?.isEnabled ?? false;
    this.isRunActive = true;
    this.startGhostRecording();
    this.resetPlayerIdleState(this.time.now);
    this.resetAfkIdleDanmakuState(this.time.now);
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
      playerCharacterId: this.playerCharacterId,
      characterOptions: PLAYER_CHARACTERS,
      enableCharacterSelect: false,
      controlMode: this.controlMode,
      stageId: this.currentStageId,
      stageOptions: this.getStageOptions(),
      locale: this.locale,
      soundOn: !this.soundMuted && (this.bgmVolumePercent > 0 || this.seVolumePercent > 0),
      appVersion: DEBUG_VERSION,
      skipSplashIntro: this.skipSplashIntroOnNextStartModal,
      accountStatus: this.getStartAccountStatus(),
      onLocaleChange: (locale) => this.setLocale(locale),
      onSoundOnChange: (soundOn) => this.setSoundEnabled(soundOn),
      onGoogleLogin: () => this.logInLeaderboardGoogleAccount(),
      onGhostReplayLoad: (jsonText) => this.loadGhostReplayFromJson(jsonText),
      onFetchGhostOptions: (stageId) => fetchLeaderboardGhostOptions(this.resolveStageId(stageId), 10),
      onGhostReplaySelect: (ghostId) => this.loadLeaderboardGhostReplay(ghostId),
      onSubmit: ({ playerName, playerCharacterId, controlMode, stageId, soundOn, locale }) => {
        this.playerName = playerName;
        this.setCookieValue("actiongame_player_name", this.playerName);
        this.playerCharacterId = normalizePlayerCharacterId(playerCharacterId);
        this.setCookieValue(PLAYER_CHARACTER_STORAGE_KEY, this.playerCharacterId);
        this.player.setTexture(this.playerTextureKey("idle"));
        this.player.anims.play(this.playerAnimationKey("idle"), true);
        this.controlMode = controlMode;
        this.currentStageId = this.resolveStageId(stageId);
        this.setCookieValue(STAGE_ID_STORAGE_KEY, this.currentStageId);
        this.setLocale(locale);
        this.setSoundEnabled(soundOn);
        this.scheduleLeaderboardUserSettingsSave();
        this.setupComplete = true;
        this.startRun();
      },
    });
    this.skipSplashIntroOnNextStartModal = false;
    this.startModal.show();
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
        zh: resolveStageName(STAGES[id].name, "zh"),
        ko: resolveStageName(STAGES[id].name, "ko"),
      },
    }));
  }

  private getStartAccountStatus(): StartAccountStatus {
    return {
      playerId: this.leaderboardPlayerId,
      isGoogleLinked: this.leaderboardGoogleLinked,
      email: this.leaderboardGoogleEmail,
      displayName: this.leaderboardGoogleDisplayName,
    };
  }

  private getSavedStageId(): StageId {
    return this.resolveStageId(this.getCookieValue(STAGE_ID_STORAGE_KEY));
  }

  private resolveStageId(stageId: string): StageId {
    return normalizeStageId(stageId);
  }

  private applySelectedStage(stageId: StageId) {
    this.currentStageId = stageId;
    this.editorStage = this.restartEditorStage ? cloneStage(this.restartEditorStage) : cloneStage(STAGES[stageId]);
    this.restartEditorStage = undefined;
    this.restartStageEditorEnabled = false;
    this.stageConstants = resolveStageConstants(this.editorStage);
    this.stageMidpointProgress = this.resolveStageMidpointProgress();
    this.miniChallengeStates = this.createMiniChallengeStates();
    this.hasShownStageMidpointDialogue = false;
    this.hasShownGoalInViewDialogue = false;
    this.applyStageBackgroundDefaults();
    this.physics.world.setBounds(
      0,
      this.stageConstants.worldTop,
      this.editorStage.worldWidth,
      this.stageConstants.worldHeight + FALL_RESET_WORLD_MARGIN,
    );
    this.cameras.main.setBounds(0, this.stageConstants.worldTop, this.editorStage.worldWidth, this.stageConstants.worldHeight);
    movePlayerToCheckpointStart(this.currentStageId, this.editorStage, this.player);
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

  private saveWorldMapClearStamp(stageId: StageId) {
    try {
      window.localStorage.setItem(`${WORLD_MAP_CLEARED_STAGE_KEY_PREFIX}:${stageId}`, "1");
    } catch {
      // This is a map reward marker only; clearing the stage should still complete if storage is unavailable.
    }
  }

  private deleteCookieValue(name: string) {
    document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
  }

  private clearLeaderboardLocalTestData() {
    try {
      const appLocalStorageKeys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index)).filter(
        (key): key is string => Boolean(key?.startsWith("actiongame_")),
      );
      for (const key of appLocalStorageKeys) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore local storage failures; this action is best-effort cleanup for testing.
    }

    for (const key of [
      "actiongame_player_name",
      PLAYER_CHARACTER_STORAGE_KEY,
      STAGE_ID_STORAGE_KEY,
      "actiongame_muted",
      "actiongame_bgm_volume",
      "actiongame_se_volume",
      "actiongame_volume",
      "actiongame_danmaku_disabled",
      "actiongame_danmaku_mode",
      LEADERBOARD_PLAYER_ID_STORAGE_KEY,
    ]) {
      this.deleteCookieValue(key);
    }
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

  private async refreshLeaderboardIdentity() {
    if (!isLeaderboardConfigured()) {
      return undefined;
    }

    try {
      const identity = await getLeaderboardIdentity();
      if (!identity) {
        return undefined;
      }
      this.applyLeaderboardIdentity(identity);
      return identity;
    } catch (error) {
      console.warn("Could not refresh leaderboard identity.", error);
      return undefined;
    }
  }

  private applyLeaderboardIdentity(identity: LeaderboardIdentity) {
    this.leaderboardPlayerId = identity.playerId;
    this.leaderboardGoogleLinked = identity.isGoogleLinked;
    this.leaderboardGoogleEmail = identity.email;
    this.leaderboardGoogleDisplayName = identity.displayName;
    this.updatePlayerNameText();
    this.startModal?.setAccountStatus(this.getStartAccountStatus());
    void this.syncLeaderboardUserSettings();
  }

  private async syncLeaderboardUserSettings() {
    if (!this.leaderboardGoogleLinked || !this.leaderboardPlayerId) {
      this.leaderboardSettingsSyncLoadedForPlayerId = "";
      return;
    }
    if (this.leaderboardSettingsSyncLoadedForPlayerId === this.leaderboardPlayerId) {
      return;
    }

    try {
      const settings = await fetchLeaderboardUserSettings();
      this.leaderboardSettingsSyncLoadedForPlayerId = this.leaderboardPlayerId;
      if (settings && Object.keys(settings).length > 0) {
        this.applyLeaderboardUserSettings(settings);
        return;
      }
      await saveLeaderboardUserSettings(this.getLeaderboardUserSettings());
    } catch (error) {
      console.warn("Could not sync leaderboard user settings.", error);
    }
  }

  private getLeaderboardUserSettings(): LeaderboardUserSettings {
    return {
      playerName: this.playerName,
      locale: this.locale,
      stageId: this.currentStageId,
      soundVolumePercent: Math.round((this.bgmVolumePercent + this.seVolumePercent) / 2),
      bgmVolumePercent: this.bgmVolumePercent,
      seVolumePercent: this.seVolumePercent,
      soundMuted: this.soundMuted,
      controlMode: this.controlMode,
      danmakuEnabled: this.danmakuEnabled,
      danmakuMode: this.danmakuMode,
      danmakuTutorialSeen: this.hasSeenDanmakuTutorialDialogue(),
    };
  }

  private applyLeaderboardUserSettings(settings: LeaderboardUserSettings) {
    this.applyingLeaderboardUserSettings = true;
    try {
      if (settings.playerName) {
        this.playerName = settings.playerName;
        this.setCookieValue("actiongame_player_name", this.playerName);
      }
      if (settings.locale && isLocale(settings.locale)) {
        this.setLocale(settings.locale);
      }
      if (settings.stageId && (!this.setupComplete || this.startModal)) {
        this.currentStageId = this.resolveStageId(settings.stageId);
        this.setCookieValue(STAGE_ID_STORAGE_KEY, this.currentStageId);
      }
      const legacyVolumePercent =
        typeof settings.soundVolumePercent === "number" ? Phaser.Math.Clamp(Math.round(settings.soundVolumePercent), 0, 100) : undefined;
      this.bgmVolumePercent =
        typeof settings.bgmVolumePercent === "number"
          ? Phaser.Math.Clamp(Math.round(settings.bgmVolumePercent), 0, 100)
          : legacyVolumePercent ?? this.bgmVolumePercent;
      this.seVolumePercent =
        typeof settings.seVolumePercent === "number"
          ? Phaser.Math.Clamp(Math.round(settings.seVolumePercent), 0, 100)
          : legacyVolumePercent ?? this.seVolumePercent;
      if (typeof settings.soundMuted === "boolean") {
        this.soundMuted = settings.soundMuted;
      }
      if (settings.controlMode === "pc" || settings.controlMode === "mobile") {
        this.controlMode = settings.controlMode;
        this.controlHint = this.controlMode === "mobile" ? t(this.locale, "hint.mobile") : t(this.locale, "hint.pc");
      }
      if (settings.danmakuMode === "classic" || settings.danmakuMode === "liveChat" || settings.danmakuMode === "none") {
        this.danmakuMode = settings.danmakuMode;
        this.danmakuEnabled = this.danmakuMode !== "none";
        this.setCookieValue("actiongame_danmaku_mode", settings.danmakuMode);
        this.setCookieValue("actiongame_danmaku_disabled", this.danmakuEnabled ? "0" : "1");
        this.danmaku?.setMode(this.danmakuMode);
      } else if (typeof settings.danmakuEnabled === "boolean") {
        this.danmakuEnabled = settings.danmakuEnabled;
        this.danmakuMode = settings.danmakuEnabled && this.danmakuMode === "none" ? "classic" : this.danmakuMode;
        this.setCookieValue("actiongame_danmaku_disabled", settings.danmakuEnabled ? "0" : "1");
        this.setCookieValue("actiongame_danmaku_mode", this.danmakuMode);
        this.danmaku?.setMode(this.danmakuMode);
      }
      if (settings.danmakuTutorialSeen === true) {
        this.markDanmakuTutorialDialogueSeen();
      }
      this.applySoundSettings();
      this.refreshLocalizedUI();
      if (this.startModal) {
        this.showStartModal();
      }
      if (this.setupComplete) {
        this.createGlobalUI();
      }
    } finally {
      this.applyingLeaderboardUserSettings = false;
    }
  }

  private scheduleLeaderboardUserSettingsSave() {
    if (this.applyingLeaderboardUserSettings || !this.leaderboardGoogleLinked) {
      return;
    }
    if (this.leaderboardSettingsSaveTimer !== undefined) {
      window.clearTimeout(this.leaderboardSettingsSaveTimer);
    }
    this.leaderboardSettingsSaveTimer = window.setTimeout(() => {
      this.leaderboardSettingsSaveTimer = undefined;
      void saveLeaderboardUserSettings(this.getLeaderboardUserSettings()).catch((error) => {
        console.warn("Could not save leaderboard user settings.", error);
      });
    }, 400);
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
    this.scheduleLeaderboardUserSettingsSave();
  }

  private setControlMode(mode: ControlMode) {
    if (this.controlMode === mode) {
      return;
    }

    this.controlMode = mode;
    this.controlHint = this.controlMode === "mobile" ? t(this.locale, "hint.mobile") : t(this.locale, "hint.pc");
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    this.updatePlayerNameText();
    this.updateScoreText();
    this.updateTimerText();
    this.updateStaminaHud();
    this.updateControlHintText();

    if (this.controlMode === "mobile") {
      if (this.setupComplete && !this.startModal) {
        this.mobileFullscreenWasActive = hasFullscreenElement();
        this.mobileFullscreenRecoveryDismissed = false;
        this.createMobileControls();
      }
    } else {
      if (this.mobileLayoutPaused) {
        this.resumeFromMobileLayoutEdit();
      }
      this.mobileLayoutShouldStartCountdown = false;
      this.mobileFullscreenWasActive = false;
      this.mobileFullscreenRecoveryDismissed = false;
      this.removeMobileControls();
    }

    this.refreshMobileFullscreenRecovery();
    this.scheduleGameLayoutRefresh();
    this.scheduleLeaderboardUserSettingsSave();
  }

  private refreshLocalizedUI() {
    this.updatePlayerNameText();
    this.controlHint = this.controlMode === "mobile" ? t(this.locale, "hint.mobile") : t(this.locale, "hint.pc");
    this.updateScoreText();
    this.updateTimerText();
    this.updateStaminaHud();
    this.updateControlHintText();
  }

  private handleScaleResize() {
    this.applyHudScale();
    this.updatePlayerNameText();
    this.updateScoreText();
    this.updateTimerText();
    this.updateStaminaHud();
  }

  private calculateHudScale() {
    const displayWidth = this.scale.displaySize?.width ?? GAME_WIDTH;
    const displayHeight = this.scale.displaySize?.height ?? GAME_HEIGHT;
    if (displayHeight <= 520 && displayWidth > displayHeight) {
      return Phaser.Math.Clamp((displayHeight / HUD_SCALE_BASE_HEIGHT) * 1.35, HUD_MIN_SCALE, 0.92);
    }
    const fitScale = Math.min(displayWidth / HUD_SCALE_BASE_WIDTH, displayHeight / HUD_SCALE_BASE_HEIGHT);
    const targetScale = fitScale < 1 ? 1 + (1 - fitScale) * 0.35 : 1 + (fitScale - 1) * 0.28;
    return Phaser.Math.Clamp(targetScale, HUD_MIN_SCALE, HUD_MAX_SCALE);
  }

  private applyHudScale() {
    const scale = this.calculateHudScale();
    this.hudScale = scale;

    if (this.hudPanelBack) {
      this.hudPanelBack.setPosition(HUD_PANEL_X * scale, HUD_PANEL_Y * scale);
      this.hudPanelBack.setDisplaySize(HUD_PANEL_WIDTH * scale, HUD_PANEL_HEIGHT * scale);
    }

    if (this.hudPanelAccent) {
      this.hudPanelAccent.setPosition((HUD_PANEL_X + 14) * scale, (HUD_PANEL_Y + 16) * scale);
      this.hudPanelAccent.width = 3 * scale;
      this.hudPanelAccent.height = (HUD_PANEL_HEIGHT - 32) * scale;
    }

    if (this.playerNameText) {
      this.playerNameText.setPosition(HUD_TEXT_X * scale, HUD_PLAYER_NAME_Y * scale);
      this.playerNameText.setFontSize(`${Math.round(HUD_PLAYER_NAME_FONT_SIZE * scale)}px`);
    }

    if (this.scoreText) {
      this.scoreText.setPosition(HUD_TEXT_X * scale, HUD_SCORE_Y * scale);
      this.scoreText.setFontSize(`${Math.round(HUD_SCORE_FONT_SIZE * scale)}px`);
    }

    if (this.timerText) {
      this.timerText.setPosition(HUD_TIMER_X * scale, HUD_SCORE_Y * scale);
      this.timerText.setFontSize(`${Math.round(HUD_MAIN_FONT_SIZE * scale)}px`);
    }

    if (this.staminaText) {
      this.staminaText.setPosition(HUD_TEXT_X * scale, HUD_STAMINA_Y * scale);
      this.staminaText.setFontSize(`${Math.round(HUD_MAIN_FONT_SIZE * scale)}px`);
    }

    if (this.staminaBarBack) {
      this.staminaBarBack.setPosition(HUD_STAMINA_BAR_X * scale, HUD_STAMINA_BAR_Y * scale);
      this.staminaBarBack.setSize(HUD_STAMINA_BAR_WIDTH * scale, HUD_STAMINA_BAR_HEIGHT * scale);
    }

    if (this.staminaBarFill) {
      this.staminaBarFill.setPosition(HUD_STAMINA_FILL_X * scale, HUD_STAMINA_BAR_Y * scale);
      this.updateStaminaHud();
    }

    if (this.staminaBarFrame) {
      this.staminaBarFrame.setPosition(HUD_STAMINA_BAR_X * scale, HUD_STAMINA_BAR_Y * scale);
      this.staminaBarFrame.setSize(HUD_STAMINA_BAR_WIDTH * scale, HUD_STAMINA_BAR_HEIGHT * scale);
      this.staminaBarFrame.setStrokeStyle(Math.max(1, Math.round(scale)), 0x86efac, 0.8);
    }

    this.staminaBarTicks.forEach((tick, index) => {
      tick.setPosition((HUD_STAMINA_BAR_X + (HUD_STAMINA_BAR_WIDTH / HUD_STAMINA_TICK_COUNT) * (index + 1)) * scale, HUD_STAMINA_BAR_Y * scale);
      tick.setSize(Math.max(1, Math.round(scale)), HUD_STAMINA_BAR_HEIGHT * scale);
    });

    if (this.controlHintBack) {
      this.controlHintBack.setPosition(HUD_MODE_CHIP_X * scale, HUD_MODE_CHIP_Y * scale);
      this.resizeControlHintBack();
    }

    if (this.controlHintText) {
      this.controlHintText.setPosition(HUD_MODE_CHIP_X * scale, (HUD_MODE_CHIP_Y + 7) * scale);
      this.controlHintText.setFontSize(`${Math.round(HUD_HINT_FONT_SIZE * scale)}px`);
      this.resizeControlHintBack();
    }
  }

  private usesCompactHud() {
    const displayWidth = this.scale.displaySize?.width ?? GAME_WIDTH;
    return this.controlMode === "mobile" || displayWidth <= HUD_COMPACT_DISPLAY_WIDTH;
  }

  private formatCompactHudText(value: string, maxLength: number) {
    const characters = Array.from(value);
    if (characters.length <= maxLength) {
      return value;
    }
    return `${characters.slice(0, Math.max(1, maxLength - 3)).join("")}...`;
  }

  private setHudTextWithinWidth(textObject: Phaser.GameObjects.Text, value: string, maxWidth: number) {
    textObject.setText(value);
    if (textObject.width <= maxWidth) {
      return;
    }

    const suffix = "...";
    const characters = Array.from(value);
    for (let length = Math.max(1, characters.length - 1); length > 0; length -= 1) {
      textObject.setText(`${characters.slice(0, length).join("")}${suffix}`);
      if (textObject.width <= maxWidth) {
        return;
      }
    }

    textObject.setText(suffix);
  }

  private updatePlayerNameText() {
    if (!this.playerNameText) {
      return;
    }

    const scale = this.hudScale || 1;
    const maxWidth = HUD_PLAYER_NAME_MAX_WIDTH * scale;

    if (this.usesCompactHud()) {
      this.setHudTextWithinWidth(
        this.playerNameText,
        this.formatCompactHudText(this.playerName || "PLAYER", HUD_COMPACT_PLAYER_NAME_MAX_LENGTH),
        maxWidth,
      );
      return;
    }

    this.setHudTextWithinWidth(this.playerNameText, `${t(this.locale, "hud.player")}:${this.playerName || "PLAYER"}`, maxWidth);
  }

  private getSavedVolumeSettings() {
    const legacyVolume = this.getSavedVolumePercent("actiongame_volume", 50);
    return {
      bgm: this.getSavedVolumePercent("actiongame_bgm_volume", legacyVolume),
      se: this.getSavedVolumePercent("actiongame_se_volume", legacyVolume),
    };
  }

  private getSavedVolumePercent(cookieName: string, fallback: number) {
    const savedVolume = Number(this.getCookieValue(cookieName));
    if (!Number.isFinite(savedVolume)) {
      return fallback;
    }
    return Phaser.Math.Clamp(Math.round(savedVolume), 0, 100);
  }

  private getSavedDanmakuMode(): DanmakuMode {
    const savedMode = this.getCookieValue("actiongame_danmaku_mode");
    if (savedMode === "none" || this.getCookieValue("actiongame_danmaku_disabled") === "1") {
      return "none";
    }
    return savedMode === "liveChat" ? "liveChat" : "classic";
  }

  private saveVolumeSettings(bgmVolume: number, seVolume: number, isMuted: boolean) {
    const normalizedBgmVolume = Phaser.Math.Clamp(Math.round(bgmVolume), 0, 100);
    const normalizedSeVolume = Phaser.Math.Clamp(Math.round(seVolume), 0, 100);
    this.setCookieValue("actiongame_bgm_volume", String(normalizedBgmVolume));
    this.setCookieValue("actiongame_se_volume", String(normalizedSeVolume));
    this.setCookieValue("actiongame_volume", String(Math.round((normalizedBgmVolume + normalizedSeVolume) / 2)));
    this.setCookieValue("actiongame_muted", isMuted ? "1" : "0");
  }

  private applySoundSettings() {
    this.sound.volume = 1;
    this.sound.mute = this.soundMuted;
    this.registry.set(SE_VOLUME_REGISTRY_KEY, this.seVolumePercent);
    this.setBgmVolume();
    this.saveVolumeSettings(this.bgmVolumePercent, this.seVolumePercent, this.soundMuted);
    this.refreshGlobalSoundUI();
    this.scheduleLeaderboardUserSettingsSave();
  }

  private setSoundEnabled(soundOn: boolean) {
    if (soundOn && this.bgmVolumePercent === 0 && this.seVolumePercent === 0) {
      this.bgmVolumePercent = 50;
      this.seVolumePercent = 50;
    }
    this.soundMuted = !soundOn;
    this.applySoundSettings();
  }

  private refreshGlobalSoundUI() {
    setGlobalSoundUI(this.bgmVolumePercent, this.seVolumePercent, this.soundMuted);
    this.refreshCanvasGlobalSoundUI();
  }

  private setBgmVolume() {
    const bgm = this.bgm as (Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound) | undefined;
    bgm?.setVolume(this.bgmVolumePercent / 100);
  }

  private setDanmakuEnabled(enabled: boolean) {
    this.danmakuEnabled = enabled;
    this.setCookieValue("actiongame_danmaku_disabled", enabled ? "0" : "1");
    this.scheduleLeaderboardUserSettingsSave();
    if (!enabled) {
      this.danmaku?.clear();
    }
  }

  private setDanmakuMode(mode: DanmakuMode) {
    this.danmakuMode = mode;
    this.danmakuEnabled = mode !== "none";
    this.setCookieValue("actiongame_danmaku_mode", mode);
    this.setCookieValue("actiongame_danmaku_disabled", this.danmakuEnabled ? "0" : "1");
    this.danmaku?.setMode(mode);
    if (!this.danmakuEnabled) {
      this.danmaku?.clear();
    }
    this.scheduleLeaderboardUserSettingsSave();
  }

  private trackStageObject<T extends Phaser.GameObjects.GameObject>(object: T) {
    this.stageRenderObjects.push(object);
    return object;
  }

  private createDashWalls(walls: readonly DashWallPlacement[]) {
    const group = this.physics.add.staticGroup();
    walls.forEach((wall) => {
      const width = wall.width ?? DASH_WALL_DEFAULT_WIDTH;
      const height = wall.height ?? DASH_WALL_DEFAULT_HEIGHT;
      const hitbox = group.create(wall.x, wall.y, "platform-hitbox") as Phaser.Physics.Arcade.Image;
      hitbox.setDisplaySize(width, height);
      hitbox.setVisible(false);
      hitbox.setData("knockbackX", wall.knockbackX ?? DASH_WALL_DEFAULT_KNOCKBACK_X);
      hitbox.setData("knockbackY", wall.knockbackY ?? DASH_WALL_DEFAULT_KNOCKBACK_Y);
      hitbox.refreshBody();

      const visual = this.add.graphics().setDepth(0.12).setBlendMode(Phaser.BlendModes.MULTIPLY);
      visual.fillStyle(0x020617, 0.48);
      visual.fillRect(wall.x - width / 2, wall.y - height / 2, width, height);
      visual.lineStyle(2, 0x38bdf8, 0.28);
      visual.strokeRect(wall.x - width / 2, wall.y - height / 2, width, height);
      this.trackStageObject(visual);
    });
    return group;
  }

  private updateDashWallOverlap() {
    if (!this.dashWalls || this.stageEditor?.isEnabled || !this.isRunActive) {
      return;
    }

    this.physics.overlap(this.player, this.dashWalls, (_, wallObject) => {
      if (this.isDashActive || this.time.now - this.lastDashWallBounceAt < DASH_WALL_BOUNCE_COOLDOWN_MS) {
        return;
      }

      const wall = wallObject as Phaser.Physics.Arcade.Image;
      this.lastDashWallBounceAt = this.time.now;
      this.player.setVelocity(wall.getData("knockbackX") as number, wall.getData("knockbackY") as number);
      this.player.setX(Math.min(this.player.x, wall.x - (wall.displayWidth ?? DASH_WALL_DEFAULT_WIDTH) / 2 - 26));
      this.rewards?.showFloatingText(wall.x, wall.y - wall.displayHeight / 2 - 24, "DASH!");
    });
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
    this.clearStaticGroup(this.dashWalls);
    this.clearStaticGroup(this.itemsGroup);
    this.clearStaticGroup(this.bonusBlocksGroup);
    this.clearDynamicGroup(this.enemiesGroup);
    this.minimap?.resetProgress();

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
    this.dashWalls = this.createDashWalls(this.editorStage.dashWalls ?? []);
    populateItems({
      scene: this,
      itemsGroup: this.itemsGroup,
      placements: this.editorStage.items,
      trackStageObject: (object) => this.trackStageObject(object),
    });
    populateBonusBlocks({
      scene: this,
      blocksGroup: this.bonusBlocksGroup,
      placements: this.editorStage.bonusBlocks ?? [],
    });
    this.checkpointController?.rebuild();
    this.oneWayGateController?.rebuild();
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

  private handlePlatformCollision(
    _playerObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    platformObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
  ) {
    handleSpecialPlatformCollision({
      scene: this,
      player: this.player,
      platformObject,
      canInteract: () => this.isRunActive && !this.stageEditor?.isEnabled,
      shouldSpringBigJump: () => this.isSpringBigJumpInputActive(),
      bigJumpLabel: t(this.locale, "hud.bigJump"),
      onSpringLaunch: ({ isBigJump, bigJumpVelocity, showBigJumpEffect }) => {
        this.lastSpringLaunchAt = this.time.now;
        if (isBigJump) {
          this.clearPendingSpringBigJump();
          return;
        }

        this.pendingSpringBigJumpUntil = this.time.now + SPRING_BIG_JUMP_POST_LAUNCH_BUFFER_MS;
        this.pendingSpringBigJumpVelocity = bigJumpVelocity;
        this.pendingSpringBigJumpEffect = showBigJumpEffect;
      },
      onLaunch: () => {
        this.isLanding = false;
        this.landingFastForwarded = false;
      },
    });
  }

  private noteJumpInput() {
    this.lastJumpInputAt = this.time.now;
    this.tryUpgradePendingSpringBigJump();
  }

  private isSpringBigJumpInputActive() {
    return (
      this.keys.w.isDown ||
      this.cursors.space.isDown ||
      this.mobileInput.w ||
      this.time.now - this.lastJumpInputAt <= SPRING_BIG_JUMP_INPUT_BUFFER_MS
    );
  }

  private tryUpgradePendingSpringBigJump() {
    if (
      this.time.now > this.pendingSpringBigJumpUntil ||
      this.pendingSpringBigJumpVelocity >= 0 ||
      this.player.body.velocity.y >= 0
    ) {
      return;
    }

    this.player.setVelocityY(Math.min(this.player.body.velocity.y, this.pendingSpringBigJumpVelocity));
    this.lastSpringLaunchAt = this.time.now;
    this.pendingSpringBigJumpEffect?.();
    this.clearPendingSpringBigJump();
  }

  private clearPendingSpringBigJump() {
    this.pendingSpringBigJumpUntil = -Infinity;
    this.pendingSpringBigJumpVelocity = 0;
    this.pendingSpringBigJumpEffect = undefined;
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
    document.body.classList.add("is-mobile-controls-active");

    this.mobileControlCleanup = createMobileControlElements(this, {
      locale: this.locale,
      onInputChange: (key, pressed) => {
        this.mobileInput[key] = pressed;
      },
      onJumpQueued: () => {
        this.mobileJumpQueued = true;
      },
      onRestart: () => this.restartStage(),
      onToggleFullscreen: () => {
        void this.toggleMobileFullscreen();
      },
      onLayoutEditStart: () => this.pauseForMobileLayoutEdit(),
      onLayoutEditFinish: () => this.resumeFromMobileLayoutEdit(),
    });
    this.refreshMobileFullscreenRecovery();
  }

  private removeMobileControls({ keepCanvasLayout = false }: { keepCanvasLayout?: boolean } = {}) {
    this.mobileControlCleanup.forEach((cleanup) => cleanup());
    this.mobileControlCleanup = [];
    if (!keepCanvasLayout) {
      document.body.classList.remove("is-mobile-controls-active");
    }
    this.removeMobileFullscreenRecovery();
  }

  private pauseForMobileLayoutEdit() {
    if (this.mobileLayoutPaused) {
      return;
    }

    this.mobileLayoutPaused = true;
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    if (this.countdownOverlay) {
      this.countdownOverlay.clear();
      this.countdownOverlay = undefined;
      this.mobileLayoutShouldStartCountdown = true;
    }
    if (this.isRunActive) {
      this.editorTimerPauseStartedAt ||= this.time.now;
    }
    this.physics.pause();
    this.anims.pauseAll();
    this.tweens.pauseAll();
  }

  private resumeFromMobileLayoutEdit() {
    if (!this.mobileLayoutPaused) {
      return;
    }

    this.mobileLayoutPaused = false;
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    this.anims.resumeAll();
    this.tweens.resumeAll();
    if (this.mobileLayoutShouldStartCountdown) {
      this.mobileLayoutShouldStartCountdown = false;
      this.startCountdown();
      return;
    }
    if (this.isRunActive && this.editorTimerPauseStartedAt !== 0) {
      this.editorTimerPausedMs += Math.max(0, this.time.now - this.editorTimerPauseStartedAt);
      this.editorTimerPauseStartedAt = this.stageEditor?.isEnabled ? this.time.now : 0;
    }
    if (this.isRunActive && !this.stageEditor?.isEnabled && !this.hasWon) {
      this.physics.resume();
    }
    this.updateTimerText();
  }

  private async toggleMobileFullscreen() {
    if (hasFullscreenElement()) {
      await this.exitMobileFullscreen();
      return;
    }

    await this.enterMobileFullscreen();
  }

  private async exitMobileFullscreen() {
    const fullscreenDocument = document as FullscreenDocument;
    const exitFullscreen =
      fullscreenDocument.exitFullscreen ?? fullscreenDocument.webkitExitFullscreen ?? fullscreenDocument.msExitFullscreen;
    await Promise.resolve(exitFullscreen?.call(document)).catch(() => undefined);
  }

  private async enterMobileFullscreen() {
    const target = document.documentElement as FullscreenTarget;
    const requestFullscreen =
      target.requestFullscreen ?? target.webkitRequestFullscreen ?? target.msRequestFullscreen;
    await Promise.resolve(requestFullscreen?.call(target)).catch(() => undefined);
    await Promise.resolve(screen.orientation?.lock?.("landscape")).catch((error) =>
      console.warn("Landscape orientation lock failed.", error),
    );
    if (hasFullscreenElement()) {
      this.mobileFullscreenWasActive = true;
      this.mobileFullscreenRecoveryDismissed = false;
      this.removeMobileFullscreenRecovery();
    }
    this.scheduleGameLayoutRefresh();
  }

  private refreshMobileFullscreenRecovery() {
    if (
      this.controlMode !== "mobile" ||
      !this.setupComplete ||
      this.startModal ||
      !isLikelySmartphone() ||
      hasFullscreenElement() ||
      !this.mobileFullscreenWasActive ||
      this.mobileFullscreenRecoveryDismissed
    ) {
      this.removeMobileFullscreenRecovery();
      return;
    }

    if (this.mobileFullscreenRecoveryOverlay) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "mobile-fullscreen-recovery";
    overlay.innerHTML = `
      <strong>${t(this.locale, "mobile.fullscreenRestoreTitle")}</strong>
      <span>${t(this.locale, "mobile.fullscreenRestoreBody")}</span>
      <div class="mobile-fullscreen-recovery-actions">
        <button type="button" data-action="restore">${t(this.locale, "mobile.fullscreenRestoreButton")}</button>
        <button type="button" data-action="dismiss">${t(this.locale, "mobile.fullscreenRestoreLater")}</button>
        <button type="button" data-action="reload">${t(this.locale, "mobile.fullscreenRecoveryReload")}</button>
      </div>
    `;
    const restoreButton = overlay.querySelector<HTMLButtonElement>("[data-action='restore']")!;
    const dismissButton = overlay.querySelector<HTMLButtonElement>("[data-action='dismiss']")!;
    const reloadButton = overlay.querySelector<HTMLButtonElement>("[data-action='reload']")!;
    restoreButton.addEventListener("click", () => {
      void this.enterMobileFullscreen();
    });
    dismissButton.addEventListener("click", () => {
      this.mobileFullscreenRecoveryDismissed = true;
      this.removeMobileFullscreenRecovery();
    });
    reloadButton.addEventListener("click", () => {
      window.location.reload();
    });
    overlay.addEventListener("pointerdown", (event) => event.stopPropagation());
    document.body.appendChild(overlay);
    this.mobileFullscreenRecoveryOverlay = overlay;
  }

  private removeMobileFullscreenRecovery() {
    this.mobileFullscreenRecoveryOverlay?.remove();
    this.mobileFullscreenRecoveryOverlay = undefined;
  }

  private scheduleGameLayoutRefresh() {
    for (const delayMs of [0, 80, 180, 360, 720]) {
      window.setTimeout(this.handleGameLayoutRefresh, delayMs);
    }
  }

  private createStageEditor(initialEnabled = this.stageEditor?.isEnabled ?? this.restartStageEditorEnabled) {
    this.removeStageEditor();

    this.stageEditor = new StageEditor(this, {
      initialEnabled,
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
      getRemainingTimeSeconds: () => this.getRemainingMilliseconds() / 1000,
      setRemainingTimeSeconds: (seconds) => this.setRemainingTimeSeconds(seconds),
      onToggle: (enabled) => {
        this.updateEditorTimerPause(enabled);
        if (enabled) {
          this.disableGhostRecording();
        }
        this.player.body.setAllowGravity(!enabled);
        this.player.setAcceleration(0, 0);
        this.player.setVelocity(0, 0);
        if (!enabled) {
          this.player.setMaxVelocity(MAX_RUN_SPEED, MAX_FALL_SPEED);
        }
        this.rebuildEditableStageObjects();
        this.updateControlHintText();
        this.updateTimerText();
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
      locale: this.locale,
      bgmVolumePercent: this.bgmVolumePercent,
      seVolumePercent: this.seVolumePercent,
      soundMuted: this.soundMuted,
      controlMode: this.controlMode,
      danmakuEnabled: this.danmakuEnabled,
      danmakuMode: this.danmakuMode,
      onSoundChange: (bgmVolumePercent, seVolumePercent, muted) => {
        this.bgmVolumePercent = bgmVolumePercent;
        this.seVolumePercent = seVolumePercent;
        this.soundMuted = muted;
        this.applySoundSettings();
      },
      onControlModeChange: (mode) => this.setControlMode(mode),
      onDanmakuModeChange: (mode) => this.setDanmakuMode(mode),
      onLocaleChange: (locale) => {
        this.setLocale(locale);
        this.createStageEditor(this.stageEditor?.isEnabled ?? false);
        this.createGlobalUI();
      },
    });
    this.createCanvasGlobalUI();
  }

  private removeGlobalUI() {
    this.canvasGlobalUiContainer?.destroy(true);
    this.canvasGlobalUiContainer = undefined;
    this.canvasGlobalDrawer?.destroy(true);
    this.canvasGlobalDrawer = undefined;
    this.canvasGlobalMenuOpen = false;
    this.canvasGlobalSoundText = undefined;
    this.canvasGlobalPositionText = undefined;
    removeGlobalUIElements();
    removeScreenshotPreview();
  }

  private createCanvasGlobalUI() {
    this.canvasGlobalUiContainer?.destroy(true);
    this.canvasGlobalDrawer?.destroy(true);
    this.canvasGlobalDrawer = undefined;
    this.canvasGlobalSoundText = undefined;
    this.canvasGlobalPositionText = undefined;

    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(520);
    const versionText = this.add
      .text(GAME_WIDTH - 184, 36, DEBUG_VERSION, {
        fontFamily: UI_TEXT_FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "800",
        color: "#dbeafe",
        stroke: "#020617",
        strokeThickness: 3,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(1, 0.5);
    const screenshotButton = this.createCanvasGlobalButton(GAME_WIDTH - 124, 36, "CAM", () => {
      this.captureGameScreenshot({ preview: true });
      this.setCanvasGlobalMenuOpen(false);
    }, { width: 58, height: 58, fontSize: 14, iconKey: MENU_ICON_SCREENSHOT_KEY, iconSize: 46, iconOnly: true });
    const menuButton = this.createCanvasGlobalButton(GAME_WIDTH - 58, 36, "MENU", () => {
      this.setCanvasGlobalMenuOpen(!this.canvasGlobalMenuOpen);
    }, { width: 58, fontSize: 12, active: this.canvasGlobalMenuOpen });

    container.add([versionText, screenshotButton, menuButton]);
    this.canvasGlobalUiContainer = container;
    if (this.canvasGlobalMenuOpen) {
      this.createCanvasGlobalDrawer();
    }
  }

  private createCanvasGlobalDrawer() {
    this.canvasGlobalDrawer?.destroy(true);
    this.canvasGlobalSoundText = undefined;
    this.canvasGlobalPositionText = undefined;

    const drawer = this.add.container(GAME_WIDTH - 16, 92).setScrollFactor(0).setDepth(519);
    const buttonSize = 60;
    const gap = 8;
    const columns = 3;
    const drawerPadding = 14;
    const buttonDefinitions: Array<{
      label: string;
      onPress: () => void;
      fontSize?: number;
      active?: boolean;
      soundLabel?: boolean;
      iconKey?: string;
      iconSize?: number;
      iconOnly?: boolean;
    }> = [
      {
        label: "HIT",
        onPress: () => {
          this.collisionDebugEnabled = !this.collisionDebugEnabled;
          this.updateCollisionDebug();
          this.refreshCanvasGlobalDrawer();
        },
        active: this.collisionDebugEnabled,
      },
      {
        label: "LB",
        onPress: () => {
          this.showLeaderboard();
          this.setCanvasGlobalMenuOpen(false);
        },
        iconKey: MENU_ICON_RANKING_KEY,
        iconOnly: true,
      },
      {
        label: t(this.locale, "global.accountShort"),
        onPress: () => {
          this.showAccount();
          this.setCanvasGlobalMenuOpen(false);
        },
        fontSize: 10,
      },
      {
        label: t(this.locale, "global.playerSpecShort"),
        onPress: () => {
          window.open(`${ASSET_BASE}player-spec/index.html?lang=${encodeURIComponent(this.locale)}`, "_blank", "noopener");
          this.setCanvasGlobalMenuOpen(false);
        },
        fontSize: 9,
      },
      {
        label: t(this.locale, "global.titleShort"),
        onPress: () => {
          void this.returnToTitle();
          this.setCanvasGlobalMenuOpen(false);
        },
        fontSize: 15,
        iconKey: MENU_ICON_WORLD_MAP_KEY,
        iconOnly: true,
      },
      {
        label: this.getCanvasGlobalSoundLabel(),
        onPress: () => {
          if (this.bgmVolumePercent === 0 && this.seVolumePercent === 0) {
            this.bgmVolumePercent = 50;
            this.seVolumePercent = 50;
            this.soundMuted = false;
          } else {
            this.soundMuted = !this.soundMuted;
          }
          this.applySoundSettings();
          this.refreshCanvasGlobalDrawer();
        },
        fontSize: 10,
        soundLabel: true,
      },
      {
        label: "OPT",
        onPress: () => {
          openGlobalOptionsModal();
          this.setCanvasGlobalMenuOpen(false);
        },
        fontSize: 11,
        iconKey: MENU_ICON_SETTINGS_KEY,
        iconOnly: true,
      },
    ];
    if (this.setupComplete && !this.startModal && this.controlMode === "mobile") {
      buttonDefinitions.push({
        label: t(this.locale, "global.mobileLayoutShort"),
        onPress: () => {
          window.dispatchEvent(new Event(MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT));
          this.setCanvasGlobalMenuOpen(false);
        },
        fontSize: 9,
      });
    }

    const rows = Math.max(1, Math.ceil(buttonDefinitions.length / columns));
    const contentWidth = columns * buttonSize + (columns - 1) * gap;
    const contentHeight = rows * buttonSize + (rows - 1) * gap;
    const width = contentWidth + drawerPadding * 2;
    const height = contentHeight + drawerPadding * 2 + (this.collisionDebugEnabled ? 30 : 0);
    const panel = this.add.graphics();
    panel.fillStyle(0x020617, 0.9);
    panel.fillRoundedRect(-width + 8, -18, width, height, 10);
    panel.lineStyle(2, 0x7dd3fc, 0.42);
    panel.strokeRoundedRect(-width + 8, -18, width, height, 10);
    drawer.add(panel);

    const addButton = (
      index: number,
      label: string,
      onPress: () => void,
      options: { fontSize?: number; active?: boolean; iconKey?: string; iconSize?: number; iconOnly?: boolean } = {},
    ) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = -width + 8 + drawerPadding + buttonSize / 2 + col * (buttonSize + gap);
      const y = -18 + drawerPadding + buttonSize / 2 + row * (buttonSize + gap);
      const button = this.createCanvasGlobalButton(x, y, label, onPress, {
        width: buttonSize,
        height: buttonSize,
        fontSize: options.fontSize ?? 12,
        active: options.active,
        iconKey: options.iconKey,
        iconSize: options.iconSize,
        iconOnly: options.iconOnly,
      });
      drawer.add(button);
      return button;
    };

    buttonDefinitions.forEach((definition, index) => {
      const button = addButton(index, definition.label, definition.onPress, {
        fontSize: definition.fontSize,
        active: definition.active,
        iconKey: definition.iconKey,
        iconSize: definition.iconSize,
        iconOnly: definition.iconOnly,
      });
      if (definition.soundLabel) {
        this.canvasGlobalSoundText = button.getByName("label") as Phaser.GameObjects.Text | undefined;
      }
    });

    if (this.collisionDebugEnabled) {
      this.canvasGlobalPositionText = this.add
        .text(-width / 2 + 4, height - 26, `POS ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, {
          fontFamily: UI_TEXT_FONT_FAMILY,
          fontSize: "12px",
          fontStyle: "800",
          color: "#fef3c7",
          stroke: "#020617",
          strokeThickness: 3,
          align: "center",
          fixedWidth: width - 24,
          resolution: UI_TEXT_RESOLUTION,
        })
        .setOrigin(0.5);
      drawer.add(this.canvasGlobalPositionText);
    }

    this.canvasGlobalDrawer = drawer;
  }

  private createCanvasGlobalButton(
    x: number,
    y: number,
    label: string,
    onPress: () => void,
    options: {
      width?: number;
      height?: number;
      fontSize?: number;
      active?: boolean;
      iconKey?: string;
      iconSize?: number;
      iconOnly?: boolean;
    } = {},
  ) {
    const width = options.width ?? 44;
    const height = options.height ?? 44;
    const container = this.add.container(x, y);
    const zone = this.add.zone(0, 0, width, height).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const back = this.add.graphics();
    const fill = options.active ? 0x193a52 : 0x071526;
    const line = options.active ? 0xfacc15 : 0x7dd3fc;
    back.fillStyle(0x020617, 0.38);
    back.fillRoundedRect(-width / 2 + 4, -height / 2 + 5, width, height, 10);
    back.fillStyle(fill, 0.88);
    back.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    back.lineStyle(2, line, options.active ? 0.88 : 0.46);
    back.strokeRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 10);
    const icon = options.iconKey
      ? this.add
          .image(0, options.iconOnly ? 0 : height >= 52 ? -4 : -2, options.iconKey)
          .setDisplaySize(options.iconSize ?? Math.min(width, height) * (options.iconOnly ? 0.78 : 0.72), options.iconSize ?? Math.min(width, height) * (options.iconOnly ? 0.78 : 0.72))
      : undefined;
    const textY = icon ? height / 2 - 9 : 0;
    const text = options.iconOnly
      ? undefined
      : this.add
          .text(0, textY, label, {
            fontFamily: UI_DISPLAY_FONT_FAMILY,
            fontSize: `${icon ? Math.min(options.fontSize ?? 10, 10) : options.fontSize ?? 14}px`,
            fontStyle: "900",
            color: options.active ? "#fff7d6" : "#e0f2fe",
            align: "center",
            fixedWidth: width - 8,
            resolution: UI_TEXT_RESOLUTION,
          })
          .setName("label")
          .setOrigin(0.5);
    container.add([zone, back, ...(icon ? [icon] : []), ...(text ? [text] : [])]);
    zone
      .on("pointerover", () => container.setScale(1.04))
      .on("pointerout", () => container.setScale(1))
      .on("pointerdown", () => container.setScale(0.96))
      .on("pointerup", () => {
        container.setScale(1.04);
        onPress();
      });
    return container;
  }

  private setCanvasGlobalMenuOpen(open: boolean) {
    this.canvasGlobalMenuOpen = open;
    this.createCanvasGlobalUI();
  }

  private refreshCanvasGlobalDrawer() {
    if (!this.canvasGlobalMenuOpen) {
      return;
    }
    this.createCanvasGlobalDrawer();
  }

  private getCanvasGlobalSoundLabel() {
    return this.soundMuted || (this.bgmVolumePercent === 0 && this.seVolumePercent === 0) ? "MUTE" : "SND";
  }

  private refreshCanvasGlobalSoundUI() {
    this.canvasGlobalSoundText?.setText(this.getCanvasGlobalSoundLabel());
  }

  private updateCanvasPositionDebugUI() {
    if (!this.canvasGlobalPositionText || !this.collisionDebugEnabled) {
      return;
    }
    this.canvasGlobalPositionText.setText(`POS ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`);
  }

  private pauseForScreenshotPreview() {
    if (this.screenshotPreviewOpen) {
      return;
    }

    this.screenshotPreviewOpen = true;
    if (this.hasWon) {
      this.screenshotPreviewPausedScene = false;
      return;
    }

    this.screenshotPreviewPausedScene = true;
    if (this.isRunActive) {
      this.editorTimerPauseStartedAt ||= this.time.now;
    }
    this.physics.pause();
    this.anims.pauseAll();
    this.tweens.pauseAll();
  }

  private resumeFromScreenshotPreview() {
    if (!this.screenshotPreviewOpen) {
      return;
    }

    this.screenshotPreviewOpen = false;
    if (!this.screenshotPreviewPausedScene) {
      this.updateTimerText();
      return;
    }

    this.screenshotPreviewPausedScene = false;
    if (this.isRunActive && this.editorTimerPauseStartedAt !== 0) {
      this.editorTimerPausedMs += Math.max(0, this.time.now - this.editorTimerPauseStartedAt);
      this.editorTimerPauseStartedAt = this.stageEditor?.isEnabled ? this.time.now : 0;
    }
    this.anims.resumeAll();
    this.tweens.resumeAll();
    if (this.isRunActive && !this.stageEditor?.isEnabled && !this.hasWon) {
      this.physics.resume();
    }
    this.updateTimerText();
  }

  private showStoredScreenshotPreview() {
    if (!this.lastScreenshot) {
      return;
    }

    this.pauseForScreenshotPreview();
    showScreenshotPreview({
      screenshot: this.lastScreenshot,
      locale: this.locale,
      onClose: () => this.resumeFromScreenshotPreview(),
    });
  }

  private moveGoalTo(x: number, y: number) {
    if (!this.goal) {
      return;
    }

    this.goal.setPosition(x, y);
    this.goal.refreshBody();
  }

  private damagePlayer(enemy: Phaser.Physics.Arcade.Sprite) {
    if (!this.isRunActive || this.stageEditor?.isEnabled || !enemy.active) {
      return;
    }

    if (this.rewards?.isStarActive()) {
      this.minimap?.markEnemyDefeated(enemy.getData("placementIndex") as number | undefined);
      defeatEnemy(enemy, false);
      this.rewards.addEnemyDefeatScore(enemy);
      return;
    }

    const stompTarget = findOverlappingStompEnemy(this.player, this.enemiesGroup) ?? enemy;
    const stomped = tryStompEnemy(this.player, stompTarget, () => {
      this.isLanding = false;
      this.landingFastForwarded = false;
      this.stompFreeJumpUntil = this.time.now + STOMP_FREE_JUMP_BUFFER_MS;
      this.minimap?.markEnemyDefeated(stompTarget.getData("placementIndex") as number | undefined);
      this.rewards?.addEnemyDefeatScore(stompTarget);
      this.showAquaMascotStompDialogueOnce(stompTarget);
    });
    if (stomped || this.time.now < this.invulnerableUntil) {
      return;
    }

    const direction = this.player.x < enemy.x ? -1 : 1;
    this.rewards?.noteDamage();
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
    this.player.anims.play(this.playerAnimationKey("air"), true);
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

    const total = this.rewards?.getItemScore() ?? 0;
    if (this.usesCompactHud()) {
      this.scoreText.setText(`S:${total}`);
      return;
    }
    this.scoreText.setText(`${t(this.locale, "hud.score")}:${total}`);
  }

  private updateStamina(onFloor: boolean, wantsDash: boolean, isCrouching: boolean, deltaMs: number) {
    const deltaSeconds = deltaMs / 1000;

    if (wantsDash && this.stamina > 0) {
      this.stamina = Math.max(0, this.stamina - DASH_STAMINA_DRAIN_PER_SECOND * deltaSeconds);
      this.dashLingerUntil = this.time.now + DASH_LINGER_MS;
      this.tryShowStaminaEmptyDialogue();
    } else if (onFloor && !wantsDash) {
      const recoveryMultiplier = isCrouching ? CROUCH_STAMINA_RECOVERY_MULTIPLIER : 1;
      this.stamina = Math.min(MAX_STAMINA, this.stamina + STAMINA_RECOVERY_PER_SECOND * recoveryMultiplier * deltaSeconds);
    }

    this.updateStaminaHud();
    return this.time.now <= this.dashLingerUntil;
  }

  private consumeStamina(cost: number) {
    if (this.stamina < cost) {
      return false;
    }

    this.stamina = Math.max(0, this.stamina - cost);
    this.tryShowStaminaEmptyDialogue();
    this.updateStaminaHud();
    return true;
  }

  private tryShowStaminaEmptyDialogue() {
    if (this.hasShownStaminaEmptyDialogue || this.stamina > 0 || this.stageEditor?.isEnabled) {
      return;
    }

    this.hasShownStaminaEmptyDialogue = true;
    this.enqueueStoryDialogue({
      lines: [resolveFixedStoryDialogue("staminaEmpty", this.locale)],
      durationMs: STAMINA_EMPTY_DIALOGUE_DURATION_MS,
    });
  }

  private updateStaminaHud() {
    if (!this.staminaText || !this.staminaBarFill) {
      return;
    }

    const staminaValue = Math.max(0, Math.min(MAX_STAMINA, this.stamina));
    const ratio = staminaValue / MAX_STAMINA;
    const scale = this.hudScale || 1;
    const fillColor = ratio > 0.5 ? 0x86efac : ratio > 0.22 ? 0xfde68a : 0xfb7185;
    const fillAlpha = ratio <= 0.22 ? 0.66 + Math.abs(Math.sin(this.time.now * 0.012)) * 0.32 : 0.95;
    this.staminaText.setText(this.usesCompactHud() ? `ST:${Math.round(staminaValue)}` : `${t(this.locale, "hud.stamina")}:${Math.round(staminaValue)}`);
    this.staminaBarFill.setSize(HUD_STAMINA_FILL_WIDTH * ratio * scale, HUD_STAMINA_FILL_HEIGHT * scale);
    this.staminaBarFill.setFillStyle(fillColor, fillAlpha);
    this.staminaBarFrame?.setStrokeStyle(Math.max(1, Math.round(scale)), fillColor, ratio <= 0.22 ? 0.98 : 0.82);
    this.staminaBarTicks.forEach((tick, index) => {
      tick.setAlpha(ratio > (index + 1) / HUD_STAMINA_TICK_COUNT ? 0.22 : 0.44);
    });
    this.updateOverheadStaminaBar(ratio, fillColor);
  }

  private updateOverheadStaminaBar(staminaRatio?: number, fillColor?: number) {
    if (!this.overheadStaminaBarBack || !this.overheadStaminaBarFill || !this.player?.body) {
      return;
    }

    const ratio = staminaRatio ?? Math.max(0, Math.min(MAX_STAMINA, this.stamina)) / MAX_STAMINA;
    const isVisible = ratio < 1;
    this.overheadStaminaBarBack.setVisible(isVisible);
    this.overheadStaminaBarFill.setVisible(isVisible);
    if (!isVisible) {
      return;
    }

    const playerBody = this.player.body;
    const centerX = playerBody.x + playerBody.width / 2;
    const centerY = playerBody.y - OVERHEAD_STAMINA_OFFSET_Y;
    this.overheadStaminaBarBack.setPosition(centerX, centerY);
    this.overheadStaminaBarFill.setPosition(centerX - OVERHEAD_STAMINA_FILL_WIDTH / 2, centerY);
    this.overheadStaminaBarFill.width = OVERHEAD_STAMINA_FILL_WIDTH * ratio;
    this.overheadStaminaBarFill.setFillStyle(fillColor ?? (ratio > 0.5 ? 0x86efac : ratio > 0.22 ? 0xfde68a : 0xfb7185), 0.98);
  }

  private loadGhostReplayFromJson(jsonText: string): GhostReplayLoadResult {
    const parsed = JSON.parse(jsonText) as Partial<GhostReplayData>;
    return this.loadGhostReplayData(parsed);
  }

  private async loadLeaderboardGhostReplay(ghostId: string): Promise<GhostReplayLoadResult> {
    return this.loadGhostReplayData((await fetchLeaderboardGhostReplay(ghostId)) as Partial<GhostReplayData>);
  }

  private loadGhostReplayData(parsed: Partial<GhostReplayData>): GhostReplayLoadResult {
    if (
      parsed.schema !== GHOST_REPLAY_SCHEMA ||
      typeof parsed.stageId !== "string" ||
      typeof parsed.playerName !== "string" ||
      typeof parsed.durationMs !== "number" ||
      !Array.isArray(parsed.frames)
    ) {
      throw new Error("Invalid ghost replay JSON.");
    }

    const frames = parsed.frames
      .map((frame) => ({
        t: Number(frame.t),
        x: Number(frame.x),
        y: Number(frame.y),
        left: Boolean(frame.left),
        right: Boolean(frame.right),
        up: Boolean(frame.up),
        down: Boolean(frame.down),
        dash: Boolean(frame.dash),
        flipX: Boolean(frame.flipX),
        anim: typeof frame.anim === "string" ? frame.anim : undefined,
      }))
      .filter((frame) => Number.isFinite(frame.t) && Number.isFinite(frame.x) && Number.isFinite(frame.y))
      .sort((a, b) => a.t - b.t);

    if (frames.length < 2) {
      throw new Error("Ghost replay has no frames.");
    }

    this.loadedGhostReplay = {
      schema: GHOST_REPLAY_SCHEMA,
      gameVersion: typeof parsed.gameVersion === "string" ? parsed.gameVersion : "unknown",
      stageId: parsed.stageId,
      playerName: parsed.playerName,
      controlMode: parsed.controlMode === "mobile" ? "mobile" : "pc",
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
      durationMs: Math.max(0, Number(parsed.durationMs) || frames[frames.length - 1].t),
      frames,
    };

    return {
      stageId: this.loadedGhostReplay.stageId,
      label: `${t(this.locale, "start.ghostLoaded")} ${this.loadedGhostReplay.playerName} / ${this.loadedGhostReplay.stageId}`,
    };
  }

  private prepareGhostReplayForRun() {
    this.ghostReplaySprite?.destroy();
    this.ghostReplaySprite = undefined;
    this.ghostReplayFrameIndex = 0;
    if (!this.loadedGhostReplay || this.loadedGhostReplay.stageId !== this.currentStageId) {
      return;
    }

    const firstFrame = this.loadedGhostReplay.frames[0];
    this.ghostReplaySprite = this.add
      .sprite(firstFrame.x, firstFrame.y, this.playerTextureKey("idle"))
      .setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT)
      .setAlpha(0.34)
      .setTint(0x67e8f9)
      .setDepth(88);
    this.ghostReplaySprite.play(this.playerAnimationKey("idle"), true);
  }

  private updateGhostReplay() {
    if (!this.ghostReplaySprite || !this.loadedGhostReplay || !this.isRunActive || this.startTime === 0) {
      return;
    }

    const frames = this.loadedGhostReplay.frames;
    if (frames.length < 2) {
      return;
    }

    const elapsedMs = this.getRunElapsedMilliseconds();
    while (this.ghostReplayFrameIndex < frames.length - 2 && frames[this.ghostReplayFrameIndex + 1].t <= elapsedMs) {
      this.ghostReplayFrameIndex += 1;
    }

    const current = frames[this.ghostReplayFrameIndex];
    const next = frames[Math.min(this.ghostReplayFrameIndex + 1, frames.length - 1)];
    const span = Math.max(1, next.t - current.t);
    const progress = Phaser.Math.Clamp((elapsedMs - current.t) / span, 0, 1);
    this.ghostReplaySprite.setPosition(Phaser.Math.Linear(current.x, next.x, progress), Phaser.Math.Linear(current.y, next.y, progress));
    this.ghostReplaySprite.setFlipX(current.flipX);
    if (current.anim && this.anims.exists(current.anim) && this.ghostReplaySprite.anims.currentAnim?.key !== current.anim) {
      this.ghostReplaySprite.play(current.anim, true);
    }
  }

  private startGhostRecording() {
    this.ghostRecordingFrames = [];
    this.ghostRecordingDisabled = this.stageEditor?.isEnabled ?? false;
    this.ghostRecordingActive = !this.ghostRecordingDisabled;
    this.lastGhostRecordAt = -Infinity;
    if (this.ghostRecordingActive) {
      this.recordGhostFrame({ left: false, right: false, up: false, down: false, dash: false }, true);
    }
  }

  private disableGhostRecording() {
    if (!this.ghostRecordingActive && this.ghostRecordingDisabled) {
      return;
    }

    this.ghostRecordingActive = false;
    this.ghostRecordingDisabled = true;
    this.ghostRecordingFrames = [];
  }

  private recordGhostFrame(
    input: Pick<GhostReplayFrame, "left" | "right" | "up" | "down" | "dash">,
    force = false,
  ) {
    if (!this.ghostRecordingActive || this.ghostRecordingDisabled || this.startTime === 0) {
      return;
    }

    const elapsedMs = this.getRunElapsedMilliseconds();
    if (!force && elapsedMs - this.lastGhostRecordAt < GHOST_RECORD_INTERVAL_MS) {
      return;
    }

    this.lastGhostRecordAt = elapsedMs;
    this.ghostRecordingFrames.push({
      t: Math.round(elapsedMs),
      x: Math.round(this.player.x * 10) / 10,
      y: Math.round(this.player.y * 10) / 10,
      left: input.left,
      right: input.right,
      up: input.up,
      down: input.down,
      dash: input.dash,
      flipX: this.player.flipX,
      anim: this.player.anims.currentAnim?.key,
    });
  }

  private stopGhostRecording() {
    if (!this.ghostRecordingActive) {
      return;
    }

    this.recordGhostFrame({ left: false, right: false, up: false, down: false, dash: false }, true);
    this.ghostRecordingActive = false;
  }

  private buildGhostReplayJson() {
    return JSON.stringify(this.buildGhostReplayData(), null, 2);
  }

  private buildGhostReplayData(): GhostReplayData {
    return {
      schema: GHOST_REPLAY_SCHEMA,
      gameVersion: DEBUG_VERSION,
      stageId: this.currentStageId,
      playerName: this.playerName,
      controlMode: this.controlMode,
      createdAt: new Date().toISOString(),
      durationMs: this.getRunElapsedMilliseconds(),
      frames: this.ghostRecordingFrames,
    };
  }

  private getClearActionButtonPosition(index: number) {
    if (this.controlMode === "mobile") {
      return {
        x: CLEAR_ACTION_MOBILE_X,
        y: CLEAR_ACTION_MOBILE_Y + CLEAR_ACTION_MOBILE_GAP * index,
      };
    }

    return {
      x: CLEAR_ACTION_DESKTOP_X,
      y: CLEAR_ACTION_DESKTOP_Y + CLEAR_ACTION_DESKTOP_GAP * index,
    };
  }

  private createClearActionButton(
    index: number,
    label: string,
    theme: { accent: number; fill: number; labelColor: string },
    onPress: () => void,
    variant: "primary" | "secondary" = "secondary",
    options: { iconKey?: string; iconSize?: number } = {},
  ) {
    const position = this.getClearActionButtonPosition(index);
    const isMobileLayout = this.controlMode === "mobile";
    const isPrimary = variant === "primary";
    const width = isMobileLayout ? (isPrimary ? 380 : 348) : isPrimary ? 292 : 232;
    const height = isMobileLayout ? (isPrimary ? 84 : 76) : isPrimary ? 54 : 38;
    const radius = isMobileLayout ? 22 : 18;
    const container = this.add.container(position.x, position.y).setScrollFactor(0).setDepth(260).setSize(width, height);
    const hitZone = this.add.zone(0, 0, width, height).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const shadow = this.add.graphics();
    shadow.fillStyle(0x020617, isPrimary ? 0.5 : 0.34);
    shadow.fillRoundedRect(-width / 2 + 6, -height / 2 + (isPrimary ? 10 : 7), width, height, radius);

    const panel = this.add.graphics();
    panel.fillStyle(isPrimary ? 0x0b1f2d : 0x061629, isPrimary ? 0.94 : 0.82);
    panel.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    panel.fillStyle(theme.fill, isPrimary ? 0.42 : 0.2);
    panel.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, radius - 2);
    panel.lineStyle(isPrimary ? 3 : 2, theme.accent, isPrimary ? 0.95 : 0.6);
    panel.strokeRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, radius);
    panel.lineStyle(1, 0xfff7d6, isPrimary ? 0.28 : 0.14);
    panel.strokeRoundedRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, Math.max(8, radius - 6));
    if (isPrimary) {
      panel.lineStyle(2, 0xffffff, 0.16);
      panel.lineBetween(-width / 2 + 24, -height / 2 + 13, width / 2 - 24, -height / 2 + 13);
    }

    const accent = this.add.graphics();
    accent.fillStyle(theme.accent, isPrimary ? 1 : 0.84);
    accent.fillRoundedRect(-width / 2 + 13, -height / 2 + 9, isPrimary ? 44 : 30, height - 18, 12);
    accent.fillStyle(0xffffff, isPrimary ? 0.36 : 0.18);
    accent.fillCircle(-width / 2 + (isPrimary ? 35 : 28), 0, isPrimary ? 7 : 5);

    const icon = options.iconKey
      ? this.add
          .image(-width / 2 + (isPrimary ? 38 : 30), 0, options.iconKey)
          .setDisplaySize(options.iconSize ?? (isPrimary ? 48 : 34), options.iconSize ?? (isPrimary ? 48 : 34))
      : undefined;
    const textX = options.iconKey ? (isPrimary ? 56 : 42) : isPrimary ? 34 : 22;
    const textWidth = width - (options.iconKey ? (isPrimary ? 130 : 104) : isPrimary ? 86 : 64);
    const text = this.add
      .text(textX, 0, label, {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: isMobileLayout ? (isPrimary ? "24px" : "19px") : isPrimary ? "18px" : "14px",
        fontStyle: "800",
        color: theme.labelColor,
        stroke: "#020617",
        strokeThickness: 0,
        align: "center",
        fixedWidth: textWidth,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);

    container.add(icon ? [hitZone, shadow, panel, accent, icon, text] : [hitZone, shadow, panel, accent, text]);
    hitZone
      .on("pointerover", () => {
        container.setScale(1.025);
        panel.setAlpha(1);
        accent.setAlpha(1);
      })
      .on("pointerout", () => {
        container.setScale(1);
        panel.setAlpha(1);
        accent.setAlpha(0.92);
      })
      .on("pointerdown", () => container.setScale(0.985))
      .on("pointerup", () => {
        container.setScale(1.025);
        onPress();
      });
    return container;
  }

  private showGhostExportButton() {
    this.ghostExportButton?.destroy();
    this.ghostExportButton = undefined;
    if (this.ghostRecordingDisabled || this.ghostRecordingFrames.length < 2) {
      return;
    }

    this.ghostExportButton = this.createClearActionButton(
      1,
      t(this.locale, "ghost.exportJson"),
      { accent: 0xf5c76a, fill: 0x12343a, labelColor: "#fff7d6" },
      () => this.downloadGhostReplayJson(),
    );
  }

  private showScreenshotPreviewOrCapture() {
    if (this.lastScreenshot) {
      this.showStoredScreenshotPreview();
      return;
    }
    this.captureGameScreenshot({ preview: true });
  }

  private showClearScreenshotButton() {
    this.clearScreenshotButton?.destroy();
    this.clearScreenshotButton = this.createClearActionButton(
      2,
      t(this.locale, "screenshot.view"),
      { accent: 0x7dd3fc, fill: 0x0d2a4a, labelColor: "#e0f2fe" },
      () => this.showScreenshotPreviewOrCapture(),
      "secondary",
      { iconKey: MENU_ICON_SCREENSHOT_KEY },
    );
  }

  private captureGameScreenshot({ preview }: { preview: boolean }) {
    if (this.screenshotCapturePending) {
      return;
    }

    this.screenshotCapturePending = true;
    const capturedAt = Date.now();
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer & {
      snapshot: (
        callback: (image: HTMLImageElement | Phaser.Display.Color) => void,
        type?: string,
        encoderOptions?: number,
      ) => void;
    };
    const finish = (dataUrl: string | undefined) => {
      this.screenshotCapturePending = false;
      if (!dataUrl) {
        this.controlHintText?.setText(t(this.locale, "screenshot.captureFailed"));
        return;
      }

      this.lastScreenshot = {
        dataUrl,
        capturedAt,
        stageId: this.currentStageId,
      };
      if (preview) {
        this.showStoredScreenshotPreview();
      }
    };

    try {
      renderer.snapshot((image) => {
        finish(image instanceof HTMLImageElement ? image.src : this.game.canvas?.toDataURL("image/png"));
      }, "image/png");
    } catch {
      try {
        finish(this.game.canvas?.toDataURL("image/png"));
      } catch {
        finish(undefined);
      }
    }
  }

  private showClearMenuButton() {
    this.clearMenuButton?.destroy();
    this.clearMenuButton = this.createClearActionButton(
      0,
      t(this.locale, "menu.backToMenu"),
      { accent: 0xf8d66d, fill: 0x4b2f08, labelColor: "#fff7d6" },
      () => void this.returnToTitle(),
      "primary",
      { iconKey: MENU_ICON_WORLD_MAP_KEY },
    );
  }

  private downloadGhostReplayJson() {
    const blob = new Blob([this.buildGhostReplayJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ghost-${this.currentStageId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private tryEmitScoreDanmaku() {
    if (this.hasScoreMilestoneDanmakuPlayed || (this.rewards?.getItemScore() ?? 0) <= SCORE_DANMAKU_THRESHOLD) {
      return;
    }

    this.hasScoreMilestoneDanmakuPlayed = true;
    if (!this.danmakuEnabled) {
      return;
    }

    this.danmaku?.emitScoreMilestone();
    this.scheduleDanmakuTutorialDialogue();
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
    this.scheduleDanmakuTutorialDialogue();
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
    this.scheduleDanmakuTutorialDialogue();
  }

  private resetAfkIdleDanmakuState(startedAt = 0) {
    this.afkIdleStartedAt = startedAt;
    this.hasAfkIdleDanmakuPlayed = false;
  }

  private updateAfkIdleDanmaku(hasGameplayInput: boolean) {
    if (this.hasAfkIdleDanmakuPlayed) {
      return;
    }

    if (hasGameplayInput) {
      this.afkIdleStartedAt = this.time.now;
      return;
    }

    if (this.afkIdleStartedAt === 0) {
      this.afkIdleStartedAt = this.time.now;
      return;
    }

    if (this.time.now - this.afkIdleStartedAt < AFK_IDLE_DANMAKU_DELAY_MS) {
      return;
    }

    this.hasAfkIdleDanmakuPlayed = true;
    if (!this.danmakuEnabled) {
      return;
    }

    this.danmaku?.emitAfkIdle();
    this.scheduleDanmakuTutorialDialogue();
  }

  private updateTimerText() {
    if (!this.timerText || this.hasWon) {
      return;
    }

    const timeText = this.formatTimeSeconds(this.getRemainingMilliseconds());
    this.timerText.setText(this.usesCompactHud() ? `T:${timeText}` : `${t(this.locale, "hud.time")}:${timeText}`);
  }

  private updateEditorTimerPause(enabled = this.stageEditor?.isEnabled ?? false) {
    if (!this.isRunActive) {
      this.editorTimerPauseStartedAt = 0;
      return;
    }

    if (enabled) {
      this.hasUsedStageEditorThisRun = true;
      this.editorTimerPauseStartedAt ||= this.time.now;
      return;
    }

    if (this.editorTimerPauseStartedAt === 0) {
      return;
    }

    this.editorTimerPausedMs += Math.max(0, this.time.now - this.editorTimerPauseStartedAt);
    this.editorTimerPauseStartedAt = 0;
  }

  private updateControlHintText() {
    if (!this.controlHintText) {
      return;
    }

    this.controlHintText.setText(this.getHudModeLabel());
    this.resizeControlHintBack();
  }

  private getHudModeLabel() {
    if (this.stageEditor?.isEnabled) {
      return "EDIT";
    }
    return this.controlMode === "mobile" ? "MOBILE" : "PC";
  }

  private resizeControlHintBack() {
    if (!this.controlHintBack || !this.controlHintText) {
      return;
    }

    const scale = this.hudScale || 1;
    const width = Math.max(HUD_MODE_CHIP_MIN_WIDTH * scale, this.controlHintText.width + 28 * scale);
    this.controlHintBack.setDisplaySize(width, HUD_MODE_CHIP_HEIGHT * scale);
  }

  private updateCollisionDebug() {
    if (!this.player) {
      this.collisionDebugGraphics?.clear();
      return;
    }

    this.updateCanvasPositionDebugUI();
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

  private getRemainingMilliseconds() {
    if (!this.isRunActive || this.startTime === 0) {
      return GAME_TIME_MS;
    }

    return Math.max(0, GAME_TIME_MS - this.getRunElapsedMilliseconds());
  }

  private getRunElapsedMilliseconds() {
    if (this.startTime === 0) {
      return 0;
    }

    const activeEditorPauseMs =
      this.editorTimerPauseStartedAt === 0 ? 0 : Math.max(0, this.time.now - this.editorTimerPauseStartedAt);
    return Math.max(0, this.time.now - this.startTime - this.editorTimerPausedMs - activeEditorPauseMs);
  }

  private setRemainingTimeSeconds(seconds: number) {
    if (!this.isRunActive || this.startTime === 0 || !Number.isFinite(seconds)) {
      return;
    }

    const remainingMs = Phaser.Math.Clamp(Math.round(seconds * 1000), 0, GAME_TIME_MS);
    const activeEditorPauseMs =
      this.editorTimerPauseStartedAt === 0 ? 0 : Math.max(0, this.time.now - this.editorTimerPauseStartedAt);
    const elapsedMs = GAME_TIME_MS - remainingMs;
    this.startTime = this.time.now - this.editorTimerPausedMs - activeEditorPauseMs - elapsedMs;
    this.updateTimerText();
  }

  private formatTimeSeconds(milliseconds: number) {
    return (milliseconds / 1000).toFixed(2);
  }

  private formatScoreValue(score: number) {
    return score.toFixed(2);
  }

  private roundScoreValue(score: number) {
    return Math.round(score * 100) / 100;
  }

  private showLeaderboard(
    statusMessage?: string,
    currentSubmissionId?: string,
    currentScore?: { score: number; rank?: number; scoreUpdated: boolean; ghostStatus?: LeaderboardGhostSaveStatus },
    showAccountPrompt = false,
  ) {
    showLeaderboardPanel({
      stageName: resolveStageName(this.editorStage.name, this.locale),
      gameVersion: DEBUG_VERSION,
      locale: this.locale,
      statusMessage: isLeaderboardConfigured() ? statusMessage : t(this.locale, "leaderboard.notConfigured"),
      currentSubmissionId,
      currentPlayerId: this.leaderboardPlayerId,
      currentScore,
      accountPrompt: showAccountPrompt
        ? {
            show: !this.leaderboardGoogleLinked,
            onGoogleSignIn: async () => {
              await this.linkLeaderboardGoogleAccount();
            },
          }
        : undefined,
      fetchEntries: () => fetchLeaderboardEntries(this.currentStageId),
    });
  }

  private async linkLeaderboardGoogleAccount() {
    const result = await signInLeaderboardWithGoogle();
    if (!result.ok) {
      throw new Error(result.reason);
    }

    this.applyLeaderboardIdentity(result.identity);
    return result.identity;
  }

  private async logInLeaderboardGoogleAccount() {
    const result = await logInLeaderboardWithGoogle();
    if (!result.ok) {
      throw new Error(result.reason);
    }

    this.applyLeaderboardIdentity(result.identity);
    return result.identity;
  }

  private async unlinkLeaderboardGoogleAccount() {
    const result = await unlinkLeaderboardGoogleAccount();
    if (!result.ok) {
      throw new Error(result.reason);
    }

    this.applyLeaderboardIdentity(result.identity);
    return result.identity;
  }

  private async clearLeaderboardGoogleTestData() {
    const result = await clearLeaderboardUserSettings();
    if (!result.ok) {
      throw new Error(result.reason);
    }

    if (this.leaderboardSettingsSaveTimer !== undefined) {
      window.clearTimeout(this.leaderboardSettingsSaveTimer);
      this.leaderboardSettingsSaveTimer = undefined;
    }
    this.clearLeaderboardLocalTestData();
    await signOutLeaderboardAuth();
    this.leaderboardSettingsSyncLoadedForPlayerId = "";
    this.leaderboardPlayerId = "";
    this.leaderboardGoogleLinked = false;
    this.leaderboardGoogleEmail = null;
    this.leaderboardGoogleDisplayName = null;
    this.startModal?.setAccountStatus(this.getStartAccountStatus());
    this.updatePlayerNameText();
    return undefined;
  }

  private showAccount() {
    showAccountPanel({
      locale: this.locale,
      getIdentity: async () => {
        const identity = await this.refreshLeaderboardIdentity();
        return identity;
      },
      fetchEntries: () => fetchMyLeaderboardEntries(),
      onGoogleSignIn: () => this.linkLeaderboardGoogleAccount(),
      onGoogleLogin: () => this.logInLeaderboardGoogleAccount(),
      onGoogleUnlink: () => this.unlinkLeaderboardGoogleAccount(),
      onGoogleTestDataClear: () => this.clearLeaderboardGoogleTestData(),
    });
  }

  private async submitWinScore(finalScore: number, itemScore: number, timeBonus: number, remainingMs: number) {
    if (!isLeaderboardConfigured()) {
      return;
    }

    if (this.hasUsedStageEditorThisRun) {
      this.showLeaderboard(t(this.locale, "leaderboard.editedStageNotSubmitted"), undefined, {
        score: finalScore,
        scoreUpdated: false,
      });
      return;
    }

    const identity = await this.refreshLeaderboardIdentity();
    const playerId =
      identity?.playerId ??
      (isLeaderboardPlayerId(this.leaderboardPlayerId) ? this.leaderboardPlayerId : this.getOrCreateLeaderboardPlayerId());
    this.leaderboardPlayerId = playerId;
    const elapsedMs = Math.max(0, GAME_TIME_MS - remainingMs);
    const submissionId = createSubmissionId();
    const ghostReplay =
      !this.ghostRecordingDisabled && this.ghostRecordingFrames.length >= 2 ? this.buildGhostReplayData() : undefined;
    try {
      const result = await submitLeaderboardScore({
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
        ghostReplay,
      });

        if (!result.ok) {
          throw new Error("Leaderboard score was rejected.");
        }
        const ghostStatus = await this.verifySubmittedLeaderboardGhost(result, playerId, ghostReplay);
        const currentScore = { score: finalScore, rank: result.rank, scoreUpdated: result.scoreUpdated, ghostStatus };
        this.showLeaderboard(
          result.scoreUpdated ? t(this.locale, "leaderboard.scoreSubmitted") : t(this.locale, "leaderboard.scoreSubmittedBestNotUpdated"),
          result.scoreUpdated && "submissionId" in result ? result.submissionId ?? submissionId : undefined,
          currentScore,
          !this.leaderboardGoogleLinked,
        );
    } catch (error) {
      console.warn("Score submission failed.", error);
      this.showLeaderboard(t(this.locale, "leaderboard.scoreSubmitFailed"));
    }
  }

  private async verifySubmittedLeaderboardGhost(
    result: Extract<LeaderboardSubmitResult, { ok: true }>,
    playerId: string,
    ghostReplay: GhostReplayData | undefined,
  ): Promise<LeaderboardGhostSaveStatus> {
    if (!result.scoreUpdated || typeof result.rank !== "number" || result.rank > 10) {
      return "notEligible";
    }
    if (!ghostReplay) {
      return "notRecorded";
    }

    const ghostId = `${this.currentStageId}_${playerId}`;
    try {
      await fetchLeaderboardGhostReplay(ghostId);
      return "saved";
    } catch (error) {
      console.warn("Leaderboard ghost save could not be verified.", {
        error,
        ghostId,
        ghostSaved: result.ghostSaved,
        rank: result.rank,
        scoreUpdated: result.scoreUpdated,
        frames: ghostReplay.frames.length,
      });
      return result.ghostSaved === true ? "unknown" : "missing";
    }
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

  private playerTextureKey(motion: PlayerCharacterMotion) {
    return getPlayerTextureKey(this.playerCharacterId, motion);
  }

  private playerAnimationKey(animation: PlayerAnimationName) {
    return getPlayerAnimationKey(this.playerCharacterId, animation);
  }

  private createPlayerAnimations() {
    PLAYER_CHARACTERS.forEach((character) => {
      if (this.anims.exists(getPlayerAnimationKey(character.id, "idle"))) {
        return;
      }

      this.anims.create({
        key: getPlayerAnimationKey(character.id, "idle"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, "idle"), {
          start: 0,
          end: character.spriteSheets.idle.frameCount - 1,
        }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: getPlayerAnimationKey(character.id, "longidle"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, "longidle"), {
          start: 0,
          end: character.spriteSheets.longidle.frameCount - 1,
        }),
        frameRate: 8,
        repeat: 0,
      });

      this.anims.create({
        key: getPlayerAnimationKey(character.id, "walk"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, "walk"), {
          start: 0,
          end: character.spriteSheets.walk.frameCount - 1,
        }),
        frameRate: 12,
        repeat: -1,
      });

      const dashSpriteSheet = character.spriteSheets.dash ?? character.spriteSheets.walk;
      const dashTextureMotion: PlayerCharacterMotion = character.spriteSheets.dash ? "dash" : "walk";
      this.anims.create({
        key: getPlayerAnimationKey(character.id, "dash"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, dashTextureMotion), {
          start: 0,
          end: dashSpriteSheet.frameCount - 1,
        }),
        frameRate: 18,
        repeat: -1,
      });

      this.anims.create({
        key: getPlayerAnimationKey(character.id, "jump-start"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, "jump"), {
          start: 0,
          end: 2,
        }),
        frameRate: 12,
        repeat: 0,
      });

      this.anims.create({
        key: getPlayerAnimationKey(character.id, "air"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, "jump"), {
          start: 3,
          end: 6,
        }),
        frameRate: 8,
        repeat: -1,
      });

      this.anims.create({
        key: getPlayerAnimationKey(character.id, "land"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, "jump"), {
          start: 7,
          end: character.spriteSheets.jump.frameCount - 1,
        }),
        frameRate: 14,
        repeat: 0,
      });

      this.anims.create({
        key: getPlayerAnimationKey(character.id, "crouch"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, "crouch"), {
          start: 0,
          end: character.spriteSheets.crouch.frameCount - 1,
        }),
        frameRate: 16,
        repeat: 0,
      });

      this.anims.create({
        key: getPlayerAnimationKey(character.id, "defeat"),
        frames: this.anims.generateFrameNumbers(getPlayerTextureKey(character.id, "defeat"), {
          start: 0,
          end: character.spriteSheets.defeat.frameCount - 1,
        }),
        frameRate: 11,
        repeat: 0,
      });
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
    this.stompFreeJumpUntil = 0;
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
    this.player.anims.play(this.playerAnimationKey("defeat"), true);
    this.player.once(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}${this.playerAnimationKey("defeat")}`, () => {
      this.time.delayedCall(180, () => this.restartStage());
    });
  }

  private playTimeUpMissSequence() {
    if (this.isDefeatSequenceActive || this.isRestarting || this.hasWon) {
      return;
    }

    this.dismissLeaderboard();
    this.isDefeatSequenceActive = true;
    this.isRunActive = false;
    this.hurtUntil = 0;
    this.stompFreeJumpUntil = 0;
    this.invulnerableUntil = 0;
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    freezeEnemies(this.enemiesGroup);
    this.timerText?.setText(`${t(this.locale, "hud.time")}:0.00`);
    this.isLanding = false;
    this.landingFastForwarded = false;
    this.resetPlayerIdleState();
    this.damageTween?.stop();
    this.damageTween = undefined;
    this.player.clearTint();
    this.player.setAlpha(1);
    this.player.setAngle(0);
    this.applyPlayerBody(false);
    this.player.body.setAllowGravity(true);
    this.player.setAcceleration(0, 0);
    this.player.setVelocity(this.player.flipX ? DAMAGE_KNOCKBACK_X : -DAMAGE_KNOCKBACK_X, DAMAGE_KNOCKBACK_Y);
    this.player.setDragX(AIR_DRAG);
    this.player.anims.timeScale = 1;
    this.player.anims.play(this.playerAnimationKey("air"), true);
    this.playDamageMotion(this.player.flipX ? -1 : 1);
    this.cameras.main.flash(180, 253, 224, 71);
    this.cameras.main.shake(220, 0.008);
    this.time.delayedCall(TIME_UP_HURT_TO_MISS_DELAY_MS, () => {
      this.damageTween?.stop();
      this.damageTween = undefined;
      this.player.clearTint();
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.player.setAlpha(0.55);
      this.showMissPresentation("timeUp");
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
    this.stompFreeJumpUntil = 0;
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
    this.showMissPresentation("miss");
  }

  private showMissPresentation(danmakuKind: "miss" | "timeUp") {
    if (this.danmakuEnabled) {
      if (danmakuKind === "timeUp") {
        this.danmaku?.emitTimeUp();
      } else {
        this.danmaku?.emitMiss();
      }
    }
    this.missText?.destroy();
    const missLabel = t(this.locale, "hud.miss");
    const missBurst = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, missLabel, {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "104px",
        fontStyle: "900",
        color: "#ff003c",
        stroke: "#fff7cf",
        strokeThickness: 10,
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(218)
      .setAlpha(0.72)
      .setShadow(0, 0, "#ff003c", 24, true, true);
    const missEchoLeft = this.add
      .text(GAME_WIDTH / 2 - 18, GAME_HEIGHT / 2 + 10, missLabel, {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "72px",
        fontStyle: "900",
        color: "#38bdf8",
        stroke: "#0f172a",
        strokeThickness: 8,
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(217)
      .setAlpha(0.58);
    const missEchoRight = this.add
      .text(GAME_WIDTH / 2 + 20, GAME_HEIGHT / 2 - 8, missLabel, {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "72px",
        fontStyle: "900",
        color: "#fde047",
        stroke: "#7f1d1d",
        strokeThickness: 8,
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(217)
      .setAlpha(0.58);
    this.missText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, missLabel, {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "82px",
        fontStyle: "900",
        color: "#ff1f4f",
        stroke: "#fff7cf",
        strokeThickness: 9,
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
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

  private getClearMissionLines(remainingMs: number, gameTimeMs: number) {
    const missions = this.editorStage.missions ?? [];
    if (missions.length === 0) {
      const fallback = this.rewards?.getMissionSummary(remainingMs, gameTimeMs);
      return fallback ? [fallback] : [];
    }

    return missions.map((mission) => {
      const achieved = this.isStageMissionAchieved(mission, remainingMs, gameTimeMs);
      const label = resolveStageText(mission.label, this.locale);
      return `${achieved ? "OK" : "--"} ${label}`;
    });
  }

  private isStageMissionAchieved(mission: StageMissionDefinition, remainingMs: number, gameTimeMs: number) {
    if (mission.type === "noDamage") {
      return (this.rewards?.getDamageTaken() ?? 0) === 0;
    }
    if (mission.type === "fastClear") {
      const targetRatio = mission.target ?? 0.55;
      return remainingMs >= gameTimeMs * targetRatio;
    }
    if (mission.type === "minCoins") {
      return (this.rewards?.getCollectedCoins() ?? 0) >= (mission.target ?? 1);
    }
    if (mission.type === "defeatEnemies") {
      return (this.rewards?.getEnemyDefeats() ?? 0) >= (mission.target ?? 1);
    }
    if (mission.type === "miniChallenge") {
      return this.miniChallengeStates.some((state) => state.definition.id === mission.challengeId && state.completed);
    }
    return false;
  }

  private win() {
    if (this.hasWon) {
      return;
    }

    this.hasWon = true;
    this.removeMobileControls({ keepCanvasLayout: this.controlMode === "mobile" });
    this.mobileInput = { w: false, a: false, s: false, d: false, shift: false };
    this.mobileJumpQueued = false;
    const remaining = this.getRemainingMilliseconds();
    const timeBonus = this.roundScoreValue((remaining / 1000) * TIME_BONUS_PER_SECOND);
    const itemScore = this.roundScoreValue(this.rewards?.getItemScore() ?? 0);
    const finalScore = this.roundScoreValue(itemScore + timeBonus);
    const clearRank = this.rewards?.getClearRank(finalScore, remaining, GAME_TIME_MS) ?? "C";
    const missionLines = this.getClearMissionLines(remaining, GAME_TIME_MS);
    this.saveWorldMapClearStamp(this.currentStageId);
    this.stopGhostRecording();
    this.timerText.setText("");
    this.scoreText.setText(`${t(this.locale, "hud.itemScore")}:${itemScore}`);
    this.startRainbowWinEffect();
    this.showClearResultScreen({
      finalScore,
      itemScore,
      timeBonus,
      remaining,
      clearRank,
      missionLines,
    });
    this.showClearStampReward();
    this.showGhostExportButton();
    this.showClearMenuButton();
    this.showClearScreenshotButton();
    this.submitWinScore(finalScore, itemScore, timeBonus, remaining);
  }

  private showClearResultScreen({
    finalScore,
    itemScore,
    timeBonus,
    remaining,
    clearRank,
    missionLines,
  }: {
    finalScore: number;
    itemScore: number;
    timeBonus: number;
    remaining: number;
    clearRank: string;
    missionLines: string[];
  }) {
    this.resultScreenContainer?.destroy(true);

    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(220).setAlpha(0);
    const shade = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x07111f, 1)
      .setOrigin(0.5);
    const panel = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, RESULT_PANEL_TEXTURE_KEY);
    const panelScale = Math.min(1070 / panel.width, 590 / panel.height);
    panel.setScale(panelScale * 0.985);

    const title = this.add
      .text(GAME_WIDTH / 2, 148, t(this.locale, "result.stageClear"), {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "42px",
        fontStyle: "900",
        color: "#6f2741",
        stroke: "#fff3d0",
        strokeThickness: 5,
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);

    const stageName = this.add
      .text(GAME_WIDTH / 2, 198, resolveStageName(this.editorStage.name, this.locale), {
        fontFamily: UI_TEXT_FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "800",
        color: "#6b4a34",
        align: "center",
        fixedWidth: 680,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);

    const rankText = this.add
      .text(GAME_WIDTH / 2, 268, `${t(this.locale, "result.rank")} ${clearRank}`, {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "66px",
        fontStyle: "900",
        color: "#ef5f83",
        stroke: "#fff8dc",
        strokeThickness: 7,
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    rankText.setScale(0.94);

    const scoreBlock = this.createResultMetricBlock(416, 368, t(this.locale, "hud.score"), this.formatScoreValue(finalScore), 0xef5f83);
    const timeBlock = this.createResultMetricBlock(864, 368, t(this.locale, "result.timeLeft"), `${this.formatTimeSeconds(remaining)}s`, 0x14b8a6);

    const detailText = this.add
      .text(
        GAME_WIDTH / 2,
        438,
        `${t(this.locale, "hud.itemScore")}  ${this.formatScoreValue(itemScore)}    ${t(
          this.locale,
          "hud.timeBonus",
        )}  ${this.formatScoreValue(timeBonus)}`,
        {
          fontFamily: UI_TEXT_FONT_FAMILY,
          fontSize: "21px",
          fontStyle: "800",
          color: "#7c4a32",
          align: "center",
          fixedWidth: 760,
          resolution: UI_TEXT_RESOLUTION,
        },
      )
      .setOrigin(0.5);

    const missionTitle = this.add
      .text(GAME_WIDTH / 2, 492, t(this.locale, "result.missions"), {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "22px",
        fontStyle: "900",
        color: "#92513a",
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    const missionSummary =
      SHOW_CLEAR_RANK_AND_MISSIONS && missionLines.length > 0
        ? missionLines.map((line) => line.replace(/^OK /, "* ").replace(/^-- /, "- ")).join("\n")
        : t(this.locale, "result.noMissions");
    const missions = this.add
      .text(GAME_WIDTH / 2, 538, missionSummary, {
        fontFamily: UI_TEXT_FONT_FAMILY,
        fontSize: missionLines.length >= 3 ? "18px" : "20px",
        fontStyle: "800",
        color: "#5f4635",
        align: "center",
        fixedWidth: 820,
        wordWrap: { width: 820, useAdvancedWrap: true },
        lineSpacing: 4,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);

    const sparkles = [
      this.createResultSparkle(296, 196, 0xffc4d6, 0),
      this.createResultSparkle(988, 208, 0x86efac, 120),
      this.createResultSparkle(320, 538, 0xfacc15, 240),
      this.createResultSparkle(958, 520, 0x7dd3fc, 360),
    ];

    container.add([shade, panel, title, stageName, rankText, scoreBlock, timeBlock, detailText, missionTitle, missions, ...sparkles]);
    this.resultScreenContainer = container;

    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 280,
      ease: "Sine.Out",
    });
    this.tweens.add({
      targets: panel,
      scale: panelScale,
      duration: 380,
      ease: "Cubic.Out",
    });
    this.tweens.add({
      targets: rankText,
      scale: 1,
      duration: 420,
      ease: "Back.Out",
    });
  }

  private createResultMetricBlock(x: number, y: number, label: string, value: string, accentColor: number) {
    const container = this.add.container(x, y);
    const back = this.add.graphics();
    back.fillStyle(0xffffff, 0.48);
    back.fillRoundedRect(-158, -42, 316, 84, 22);
    back.lineStyle(3, accentColor, 0.7);
    back.strokeRoundedRect(-158, -42, 316, 84, 22);
    const labelText = this.add
      .text(0, -18, label, {
        fontFamily: UI_TEXT_FONT_FAMILY,
        fontSize: "18px",
        fontStyle: "900",
        color: "#7c4a32",
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    const valueText = this.add
      .text(0, 14, value, {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "28px",
        fontStyle: "900",
        color: "#3b2440",
        align: "center",
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    container.add([back, labelText, valueText]);
    return container;
  }

  private createResultSparkle(x: number, y: number, color: number, delay: number) {
    const sparkle = this.add.graphics({ x, y });
    sparkle.fillStyle(color, 0.86);
    sparkle.fillTriangle(0, -18, 8, -5, -8, -5);
    sparkle.fillTriangle(0, 18, 8, 5, -8, 5);
    sparkle.fillTriangle(-18, 0, -5, -8, -5, 8);
    sparkle.fillTriangle(18, 0, 5, -8, 5, 8);
    sparkle.fillStyle(0xffffff, 0.92);
    sparkle.fillCircle(0, 0, 5);
    sparkle.setAlpha(0);
    this.tweens.add({
      targets: sparkle,
      alpha: 1,
      duration: 260,
      ease: "Sine.Out",
      delay,
    });
    return sparkle;
  }

  private showClearStampReward() {
    this.clearStampContainer?.destroy(true);

    const container = this.add.container(GAME_WIDTH / 2 + 278, GAME_HEIGHT / 2 - 104);
    container.setScrollFactor(0).setDepth(235).setAlpha(0).setScale(0.34).setAngle(-18);

    const stamp = this.add.graphics();
    stamp.fillStyle(0x7f1d1d, 0.88);
    stamp.fillRoundedRect(-118, -48, 236, 96, 14);
    stamp.lineStyle(4, 0xfff7d6, 0.92);
    stamp.strokeRoundedRect(-118, -48, 236, 96, 14);
    stamp.lineStyle(2, 0xfca5a5, 0.72);
    stamp.strokeRoundedRect(-104, -35, 208, 70, 9);

    const text = this.add
      .text(0, -4, "CLEAR STAMP\nGET!", {
        fontFamily: UI_DISPLAY_FONT_FAMILY,
        fontSize: "26px",
        fontStyle: "900",
        color: "#fff7d6",
        stroke: "#450a0a",
        strokeThickness: 4,
        align: "center",
        lineSpacing: -3,
        resolution: UI_TEXT_RESOLUTION,
      })
      .setOrigin(0.5);

    const shine = this.add
      .rectangle(-78, -54, 42, 8, 0xfef3c7, 0.78)
      .setOrigin(0.5)
      .setAngle(-16)
      .setBlendMode(Phaser.BlendModes.ADD);

    container.add([stamp, text, shine]);
    this.clearStampContainer = container;

    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      angle: -7,
      duration: 360,
      ease: "Back.Out",
    });
    this.tweens.add({
      targets: container,
      y: container.y - 10,
      duration: 760,
      yoyo: true,
      repeat: 1,
      ease: "Sine.InOut",
      delay: 360,
    });
    this.tweens.add({
      targets: shine,
      x: 88,
      alpha: 0,
      duration: 680,
      ease: "Cubic.Out",
      delay: 180,
    });
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

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

initializePwaInstall();
registerServiceWorker();
document.body.classList.add("is-game-booting");
void startGame();

async function startGame() {
  try {
    const reloadRequested = await ensureLatestClientVersion(DEBUG_VERSION);
    if (reloadRequested) {
      return;
    }

    showBootLoadingOverlay();

    new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      pixelArt: false,
      antialias: true,
      roundPixels: false,
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
  } catch (error) {
    showBootLoadingFailure(error);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${ASSET_BASE}sw.js`).catch((error) => {
      console.warn("Service worker registration failed.", error);
    });
  });
}

function showBootLoadingOverlay() {
  if (bootLoadingOverlayTimer !== null) {
    window.clearTimeout(bootLoadingOverlayTimer);
    bootLoadingOverlayTimer = null;
  }
  if (bootLoadingOverlayHideTimer !== null) {
    window.clearTimeout(bootLoadingOverlayHideTimer);
    bootLoadingOverlayHideTimer = null;
  }
  clearBootLoadingStallTimer();
  const existing = document.getElementById(BOOT_LOADING_OVERLAY_ID);
  if (existing) {
    existing.remove();
  }

  bootLoadingOverlayTimer = window.setTimeout(() => {
    bootLoadingOverlayTimer = null;
    showBootLoadingOverlayNow();
  }, BOOT_LOADING_OVERLAY_DELAY_MS);
}

function showBootLoadingOverlayNow() {
  const overlay = document.createElement("div");
  overlay.id = BOOT_LOADING_OVERLAY_ID;
  overlay.innerHTML = `
    <div class="boot-loading-panel" role="status" aria-live="polite" aria-label="Loading game">
      <div class="boot-loading-brand">ZANNENIN LAND</div>
      <div class="boot-loading-runner" data-boot-loading-runner></div>
      <div class="boot-loading-meter" aria-hidden="true"><span></span></div>
      <p class="boot-loading-text" data-boot-loading-text>Loading...</p>
      <div class="boot-loading-actions" data-boot-loading-actions hidden></div>
    </div>
  `;
  const runner = overlay.querySelector<HTMLDivElement>("[data-boot-loading-runner]");
  if (runner) {
    runner.style.backgroundImage = `url('${ASSET_BASE}assets/sprites/player_walk_13_6x3_320x260.webp')`;
    startBootLoadingRunner(runner);
  }
  bootLoadingOverlayShownAt = performance.now();
  document.body.appendChild(overlay);
  window.requestAnimationFrame(() => overlay.classList.add("is-visible"));
  scheduleBootLoadingStallNotice();
}

function setBootLoadingProgress(text: string) {
  const label = document.querySelector<HTMLElement>("[data-boot-loading-text]");
  if (!label) {
    return;
  }
  label.textContent = text;
}

function hideBootLoadingOverlay() {
  document.body.classList.remove("is-game-booting");
  if (bootLoadingOverlayTimer !== null) {
    window.clearTimeout(bootLoadingOverlayTimer);
    bootLoadingOverlayTimer = null;
  }
  if (bootLoadingOverlayHideTimer !== null) {
    window.clearTimeout(bootLoadingOverlayHideTimer);
    bootLoadingOverlayHideTimer = null;
  }
  clearBootLoadingStallTimer();
  const overlay = document.getElementById(BOOT_LOADING_OVERLAY_ID);
  if (!overlay) {
    stopBootLoadingRunner();
    return;
  }
  const visibleElapsedMs = performance.now() - bootLoadingOverlayShownAt;
  const delayMs = Math.max(0, BOOT_LOADING_OVERLAY_MIN_VISIBLE_MS - visibleElapsedMs);
  bootLoadingOverlayHideTimer = window.setTimeout(() => {
    bootLoadingOverlayHideTimer = null;
    overlay.classList.add("is-exiting");
    window.setTimeout(() => {
      stopBootLoadingRunner();
      overlay.remove();
    }, BOOT_LOADING_OVERLAY_FADE_MS);
  }, delayMs);
}

function clearBootLoadingStallTimer() {
  if (bootLoadingStallTimer !== null) {
    window.clearTimeout(bootLoadingStallTimer);
    bootLoadingStallTimer = null;
  }
}

function scheduleBootLoadingStallNotice() {
  clearBootLoadingStallTimer();
  bootLoadingStallTimer = window.setTimeout(() => {
    bootLoadingStallTimer = null;
    showBootLoadingStallNotice("読み込みに時間がかかっています");
  }, BOOT_LOADING_STALL_MS);
}

function showBootLoadingStallNotice(message: string) {
  const overlay = document.getElementById(BOOT_LOADING_OVERLAY_ID);
  if (!overlay) {
    return;
  }
  overlay.classList.add("is-stalled");
  setBootLoadingProgress(message);
  const actions = overlay.querySelector<HTMLDivElement>("[data-boot-loading-actions]");
  if (!actions) {
    return;
  }
  actions.hidden = false;
  actions.innerHTML = "";
  const reloadButton = document.createElement("button");
  reloadButton.type = "button";
  reloadButton.className = "boot-loading-retry";
  reloadButton.textContent = "再読み込み";
  reloadButton.addEventListener("click", () => window.location.reload());
  actions.appendChild(reloadButton);
}

function showBootLoadingFailure(error: unknown) {
  console.error("Game boot failed.", error);
  if (bootLoadingOverlayTimer !== null) {
    window.clearTimeout(bootLoadingOverlayTimer);
    bootLoadingOverlayTimer = null;
  }
  if (!document.getElementById(BOOT_LOADING_OVERLAY_ID)) {
    showBootLoadingOverlayNow();
  }
  document.body.classList.remove("is-game-booting");
  clearBootLoadingStallTimer();
  showBootLoadingStallNotice("読み込みに失敗しました");
}

function startBootLoadingRunner(runner: HTMLDivElement) {
  stopBootLoadingRunner();
  let frame = 0;
  const setFrame = (frameIndex: number) => {
    const column = frameIndex % BOOT_LOADING_RUNNER_COLUMNS;
    const row = Math.floor(frameIndex / BOOT_LOADING_RUNNER_COLUMNS);
    runner.style.backgroundPosition = `${-(column * 20)}% ${-(row * 50)}%`;
  };
  setFrame(0);
  bootLoadingRunnerTimer = window.setInterval(() => {
    frame = (frame + 1) % BOOT_LOADING_RUNNER_FRAMES;
    setFrame(frame);
  }, BOOT_LOADING_RUNNER_FRAME_MS);
}

function stopBootLoadingRunner() {
  if (bootLoadingRunnerTimer !== null) {
    window.clearInterval(bootLoadingRunnerTimer);
    bootLoadingRunnerTimer = null;
  }
}
