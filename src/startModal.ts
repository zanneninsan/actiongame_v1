import { LOCALE_OPTIONS, t, type Locale } from "./i18n";
import { canPromptPwaInstall, isPwaInstalled, promptPwaInstall } from "./pwaInstall";
import { hasFullscreenElement, isLandscapeViewport, isLikelySmartphone } from "./mobileViewport";
import {
  getPlayerCharacterDefinition,
  type PlayerCharacterDefinition,
  type PlayerCharacterId,
} from "./playerCharacters";
import { getWorldMapDailyStageId, getWorldMapStageDetail, getWorldMapUiText } from "./worldMapFeatures";

const GAME_LAYOUT_REFRESH_EVENT = "actiongame:refresh-layout";
const ASSET_BASE = import.meta.env.BASE_URL;
const PWA_INSTALL_DISMISSED_KEY = "actiongame_pwa_install_dismissed";
const WORLD_MAP_FAVORITE_STAGE_KEY = "actiongame_world_map_favorite_stage";
const WORLD_MAP_VISITED_STAGE_KEY_PREFIX = "actiongame_world_map_visited_stage";
const WORLD_MAP_CLEARED_STAGE_KEY_PREFIX = "actiongame_world_map_cleared_stage";
const WORLD_MAP_FILTER_STORAGE_KEY = "actiongame_world_map_stage_filter";
export const TITLE_SOUND_CONFIRM_STORAGE_KEY = "actiongame_title_sound_confirmed";
const TITLE_MUSIC_VOLUME = 0.72;
const TITLE_MUSIC_FADE_SECONDS = 3;
const TITLE_MUSIC_REPLAY_GAP_MS = 5000;
const TITLE_INITIAL_STILL_MS = 3000;
const TITLE_REPEAT_STILL_MS = 10000;
const MAKER_SPLASH_AUTO_ADVANCE_MS = 8000;
const WORLD_MAP_MOVE_STEP_MS = 360;
const WORLD_MAP_NODE_POSITIONS = [
  { x: 10, y: 72 },
  { x: 22, y: 44 },
  { x: 36, y: 60 },
  { x: 49, y: 30 },
  { x: 62, y: 48 },
  { x: 74, y: 24 },
  { x: 86, y: 52 },
  { x: 94, y: 30 },
] as const;

export type ControlMode = "pc" | "mobile";
export type StageOption = { id: string; label: Record<Locale, string> };
export type StartAccountStatus = {
  playerId: string;
  isGoogleLinked: boolean;
  email: string | null;
  displayName: string | null;
};
export type StartGhostLoadResult = {
  label: string;
  stageId?: string;
};
export type StartGhostOption = {
  id: string;
  label: string;
  stageId: string;
};

type StartModalOptions = {
  playerName: string;
  playerCharacterId: PlayerCharacterId;
  characterOptions: PlayerCharacterDefinition[];
  enableCharacterSelect?: boolean;
  controlMode: ControlMode;
  stageId: string;
  stageOptions: StageOption[];
  soundOn: boolean;
  skipSplashIntro?: boolean;
  locale: Locale;
  accountStatus?: StartAccountStatus;
  onLocaleChange: (locale: Locale) => void;
  onSoundOnChange: (soundOn: boolean) => void;
  onGoogleLogin: () => Promise<StartAccountStatus | undefined>;
  onGhostReplayLoad: (jsonText: string) => StartGhostLoadResult;
  onFetchGhostOptions: (stageId: string) => Promise<StartGhostOption[]>;
  onGhostReplaySelect: (ghostId: string) => Promise<StartGhostLoadResult>;
  onSubmit: (settings: {
    playerName: string;
    playerCharacterId: PlayerCharacterId;
    controlMode: ControlMode;
    stageId: string;
    soundOn: boolean;
    locale: Locale;
  }) => void;
};

type StartSettings = {
  playerName: string;
  playerCharacterId: PlayerCharacterId;
  controlMode: ControlMode;
  stageId: string;
  soundOn: boolean;
  locale: Locale;
};
type OrientationPromptMode = "initial" | "startConfirm";
type WorldMapFilter =
  | "all"
  | "new"
  | "cleared"
  | "favorite"
  | "ghost"
  | "daily"
  | "pc"
  | "mobile"
  | "short"
  | "challenge";
type AdventureDemoLine = {
  speaker: string;
  message: string;
  focus: "main" | "sub";
  choices?: string[];
};

export class StartModal {
  private readonly options: StartModalOptions;
  private overlay?: HTMLDivElement;
  private makerSplashTimer?: number;
  private titleDismissTimer?: number;
  private titleLoopTimer?: number;
  private titleMusicGapTimer?: number;
  private soundGateDismissed = false;
  private makerSplashDismissed = false;
  private titleScreenDismissed = false;
  private orientationPromptDismissed = false;
  private orientationPromptSatisfied = false;
  private removeOrientationPromptListeners?: () => void;

  constructor(options: StartModalOptions) {
    this.options = options;
  }

  show() {
    this.remove();

    const overlay = document.createElement("div");
    overlay.id = "start-modal";
    this.soundGateDismissed = getStorageValue(TITLE_SOUND_CONFIRM_STORAGE_KEY) === "1";
    if (this.options.skipSplashIntro) {
      this.soundGateDismissed = true;
      this.makerSplashDismissed = true;
      this.titleScreenDismissed = true;
    }
    if (this.titleScreenDismissed) {
      overlay.classList.add("is-title-cleared");
    }
    const characterSelectEnabled = this.options.enableCharacterSelect === true;
    overlay.innerHTML = `
      <div class="title-sound-gate${this.soundGateDismissed ? " is-dismissed" : ""}" role="dialog" aria-modal="true" aria-label="${t(
        this.options.locale,
        "start.soundSetting",
      )}">
        <div class="title-sound-gate-panel">
          <p class="title-sound-gate-title">音を鳴らしますか？ / Play sound? / 播放声音吗？ / 소리를 켤까요?</p>
          <p class="title-sound-gate-body">
            タイトル画面で音楽が流れます。あとからトップ画面でも変更できます。<br />
            Music will play on the title screen. You can change this later from the world-map settings.<br />
            标题画面会播放音乐。之后也可以在开始菜单中更改。<br />
            타이틀 화면에서 음악이 재생됩니다. 나중에 시작 메뉴에서도 변경할 수 있습니다.
          </p>
          <div class="title-sound-gate-actions">
            <button type="button" class="title-sound-on">${t(this.options.locale, "start.soundOn")}</button>
            <button type="button" class="title-sound-off">${t(this.options.locale, "start.soundOff")}</button>
          </div>
        </div>
      </div>
      <button class="maker-splash-screen${this.soundGateDismissed ? " is-ready" : ""}${this.makerSplashDismissed ? " is-dismissed" : ""}" type="button" aria-label="${escapeHtml(
        t(this.options.locale, "start.start"),
      )}">
        <img class="maker-splash-logo" src="./assets/ui/fantasy/maker_splash_logo.webp" alt="満足教 Presents" />
      </button>
      <button class="start-title-screen${this.makerSplashDismissed ? " is-ready" : ""}${this.titleScreenDismissed ? " is-dismissed" : ""}" type="button" aria-label="${escapeHtml(
        t(this.options.locale, "start.start"),
      )}">
        <img class="start-title-logo" src="./assets/ui/fantasy/title_splash_logo.webp" alt="${escapeHtml(t(this.options.locale, "start.title"))}" />
        <video class="start-title-video" src="./assets/ui/fantasy/title_splash_loop.mp4" preload="auto" muted playsinline></video>
        <audio class="start-title-music" src="./assets/audio/title_opening.mp3" preload="auto"></audio>
        <span class="start-title-prompt" aria-hidden="true"></span>
      </button>
      <div class="start-orientation-prompt" hidden>
        <div class="start-orientation-dialog" role="dialog" aria-modal="true">
          <p class="start-orientation-message"></p>
          <p class="start-orientation-note" hidden></p>
          <div class="start-orientation-actions">
            <button type="button" class="start-orientation-yes">${t(this.options.locale, "start.orientationYes")}</button>
            <button type="button" class="start-orientation-no">${t(this.options.locale, "start.orientationNo")}</button>
          </div>
        </div>
      </div>
      <section class="start-world-map-panel" aria-label="${t(this.options.locale, "start.worldMap")}">
        <div class="start-world-map-art">
          <div class="start-world-map-glow" aria-hidden="true"></div>
          ${renderWorldMapPath(this.options.stageOptions)}
          ${this.options.stageOptions
            .map((option, index) =>
              renderWorldMapNode(option, index, this.options.stageOptions.length, this.options.stageId, this.options.locale),
            )
            .join("")}
          <div class="start-world-player" aria-hidden="true"></div>
        </div>
        <div class="start-world-map-caption">
          <span>${t(this.options.locale, "start.worldMap")}</span>
          <strong class="start-world-current"></strong>
          <em>${t(this.options.locale, "start.worldMapPrompt")}</em>
        </div>
        <div class="start-world-map-toolbar" aria-label="${escapeHtml(t(this.options.locale, "start.worldMap"))}">
          <button type="button" class="start-world-route-prev"></button>
          <button type="button" class="start-world-random"></button>
          <button type="button" class="start-world-favorite"></button>
          <button type="button" class="start-world-adventure"></button>
          <button type="button" class="start-world-settings-toggle"></button>
          <button type="button" class="start-world-route-next"></button>
        </div>
        <section class="start-adventure-layer" hidden role="dialog" aria-modal="true" aria-label="Adventure demo">
          <div class="start-adventure-backdrop" aria-hidden="true"></div>
          <div class="start-adventure-topbar">
            <span class="start-adventure-kicker">ADVENTURE</span>
            <strong class="start-adventure-title"></strong>
            <button type="button" class="start-adventure-close"></button>
          </div>
          <div class="start-adventure-stage" aria-hidden="true">
            <img
              class="start-adventure-character start-adventure-character-main is-active"
              src="./assets/story/adventure/zannenin_maid_full.webp"
              alt=""
            />
            <img
              class="start-adventure-character start-adventure-character-sub"
              src="./assets/story/adventure/zannenin_mama_maid_full.webp"
              alt=""
            />
          </div>
          <div class="start-adventure-dialogue">
            <div class="start-adventure-name"></div>
            <p class="start-adventure-text"></p>
            <div class="start-adventure-choices"></div>
            <div class="start-adventure-actions">
              <button type="button" class="start-adventure-next"></button>
              <button type="button" class="start-adventure-end"></button>
            </div>
          </div>
        </section>
        <div class="start-world-map-dashboard" aria-live="polite">
          <div class="start-world-progress-card">
            <span class="start-world-progress-label"></span>
            <strong class="start-world-progress-value"></strong>
            <i class="start-world-progress-meter"><b></b></i>
          </div>
          <label class="start-world-search">
            <span></span>
            <input type="search" class="start-world-search-input" autocomplete="off" />
          </label>
          <div class="start-world-filter-row" role="group"></div>
          <div class="start-world-rail" role="listbox"></div>
        </div>
        <aside class="start-world-settings-panel" hidden>
          <div class="start-world-settings-head">
            <strong></strong>
            <button type="button" class="start-world-settings-close">×</button>
          </div>
          <label class="start-world-setting-field">
            <span></span>
            <select name="locale">
              ${LOCALE_OPTIONS.map(
                (option) =>
                  `<option value="${option.locale}"${option.locale === this.options.locale ? " selected" : ""}>${option.label}</option>`,
              ).join("")}
            </select>
          </label>
          <div class="start-world-setting-field">
            <span></span>
            <div class="mode-row" role="group" aria-label="${t(this.options.locale, "start.controlMode")}">
              <button type="button" data-mode="pc" class="mode-button">${t(this.options.locale, "start.modePc")}</button>
              <button type="button" data-mode="mobile" class="mode-button">${t(this.options.locale, "start.modeMobile")}</button>
            </div>
          </div>
          <div class="start-world-setting-field">
            <span></span>
            <div class="sound-row" role="group" aria-label="${t(this.options.locale, "start.soundSetting")}">
              <button type="button" data-sound="on" class="sound-button">&#128266; ${t(this.options.locale, "start.soundOn")}</button>
              <button type="button" data-sound="off" class="sound-button">&#128263; ${t(this.options.locale, "start.soundOff")}</button>
            </div>
          </div>
          <p class="start-world-settings-note"></p>
        </aside>
        <aside class="start-world-stage-card" aria-live="polite"></aside>
        <div class="start-world-confirm" hidden role="dialog" aria-live="polite">
          <p class="start-world-confirm-message"></p>
          <div class="start-world-confirm-actions">
            <button type="button" class="start-world-confirm-yes">${t(this.options.locale, "start.worldMapConfirmYes")}</button>
            <button type="button" class="start-world-confirm-no">${t(this.options.locale, "start.worldMapConfirmNo")}</button>
          </div>
        </div>
      </section>
      <form class="start-dialog">
        <button type="button" class="start-map-back">${t(this.options.locale, "start.worldMapBack")}</button>
        <div class="start-primary-panel">
          <label class="start-field">
            <span>${t(this.options.locale, "start.playerName")}</span>
            <input name="playerName" type="text" maxlength="16" autocomplete="off" value="${escapeHtml(this.options.playerName)}" />
          </label>
          ${
            characterSelectEnabled
              ? `<div class="start-field start-character-field">
            <span>${t(this.options.locale, "start.character")}</span>
            <div class="start-character-grid" role="radiogroup" aria-label="${t(this.options.locale, "start.character")}">
              ${renderCharacterOptions(this.options.characterOptions, this.options.playerCharacterId, this.options.locale)}
            </div>
          </div>`
              : ""
          }
          <select name="stage" class="start-stage-hidden-select" hidden>
            ${this.options.stageOptions
              .map(
                (option) =>
                  `<option value="${escapeHtml(option.id)}"${option.id === this.options.stageId ? " selected" : ""}>${escapeHtml(
                    option.label[this.options.locale],
                  )}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="start-install-panel" hidden>
          <strong>${t(this.options.locale, "start.installTitle")}</strong>
          <span>${t(this.options.locale, "start.installBody")}</span>
          <div class="start-install-actions">
            <button type="button" class="start-install-button">${t(this.options.locale, "start.installButton")}</button>
            <button type="button" class="start-install-dismiss">${t(this.options.locale, "start.installLater")}</button>
          </div>
          <p class="start-install-note" hidden></p>
        </div>
        <details class="start-advanced-panel">
          <summary>${t(this.options.locale, "start.advanced")}</summary>
          <div class="start-ghost-panel">
            <input id="start-ghost-file" class="start-ghost-file" type="file" accept="application/json,.json" />
            <label for="start-ghost-file" class="start-ghost-load">${t(this.options.locale, "start.ghostLoad")}</label>
            <select name="leaderboardGhost" class="start-ghost-select">
              <option value="">${t(this.options.locale, "start.ghostRankingEmpty")}</option>
            </select>
            <span class="start-ghost-status">${t(this.options.locale, "start.ghostEmpty")}</span>
            <button type="button" class="start-ghost-fullscreen" hidden>${t(this.options.locale, "start.ghostRestoreFullscreen")}</button>
          </div>
        </details>
        <div class="start-account-panel">
          <span class="start-account-status"></span>
          <div class="start-account-actions">
            <button type="submit" class="start-button"></button>
            <button type="button" class="start-google-login"></button>
          </div>
        </div>
      </form>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("is-start-modal-open");
    document.body.classList.remove("is-game-booting");
    this.overlay = overlay;

    const soundGate = overlay.querySelector<HTMLDivElement>(".title-sound-gate")!;
    const soundGateOn = overlay.querySelector<HTMLButtonElement>(".title-sound-on")!;
    const soundGateOff = overlay.querySelector<HTMLButtonElement>(".title-sound-off")!;
    const makerSplash = overlay.querySelector<HTMLButtonElement>(".maker-splash-screen")!;
    const titleScreen = overlay.querySelector<HTMLButtonElement>(".start-title-screen")!;
    const titleVideo = overlay.querySelector<HTMLVideoElement>(".start-title-video")!;
    const titleMusic = overlay.querySelector<HTMLAudioElement>(".start-title-music")!;
    const form = overlay.querySelector("form")!;
    const input = overlay.querySelector<HTMLInputElement>("input[name='playerName']")!;
    const localeSelect = overlay.querySelector<HTMLSelectElement>("select[name='locale']")!;
    const stageSelect = overlay.querySelector<HTMLSelectElement>("select[name='stage']")!;
    const ghostSelect = overlay.querySelector<HTMLSelectElement>("select[name='leaderboardGhost']")!;
    const characterButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-character-id]"));
    const worldMapNodes = Array.from(overlay.querySelectorAll<HTMLButtonElement>(".start-world-node"));
    const worldCurrent = overlay.querySelector<HTMLElement>(".start-world-current")!;
    const worldMapPanel = overlay.querySelector<HTMLElement>(".start-world-map-panel")!;
    const worldConfirm = overlay.querySelector<HTMLDivElement>(".start-world-confirm")!;
    const worldConfirmMessage = overlay.querySelector<HTMLParagraphElement>(".start-world-confirm-message")!;
    const worldConfirmYes = overlay.querySelector<HTMLButtonElement>(".start-world-confirm-yes")!;
    const worldConfirmNo = overlay.querySelector<HTMLButtonElement>(".start-world-confirm-no")!;
    const worldStageCard = overlay.querySelector<HTMLElement>(".start-world-stage-card")!;
    const worldRoutePrev = overlay.querySelector<HTMLButtonElement>(".start-world-route-prev")!;
    const worldRouteNext = overlay.querySelector<HTMLButtonElement>(".start-world-route-next")!;
    const worldRandomButton = overlay.querySelector<HTMLButtonElement>(".start-world-random")!;
    const worldFavoriteButton = overlay.querySelector<HTMLButtonElement>(".start-world-favorite")!;
    const worldAdventureButton = overlay.querySelector<HTMLButtonElement>(".start-world-adventure")!;
    const worldSettingsToggle = overlay.querySelector<HTMLButtonElement>(".start-world-settings-toggle")!;
    const worldSettingsPanel = overlay.querySelector<HTMLElement>(".start-world-settings-panel")!;
    const worldSettingsClose = overlay.querySelector<HTMLButtonElement>(".start-world-settings-close")!;
    const worldSettingsTitle = overlay.querySelector<HTMLElement>(".start-world-settings-head strong")!;
    const worldSettingsLabels = Array.from(overlay.querySelectorAll<HTMLElement>(".start-world-setting-field > span"));
    const worldSettingsNote = overlay.querySelector<HTMLElement>(".start-world-settings-note")!;
    const worldProgressLabel = overlay.querySelector<HTMLElement>(".start-world-progress-label")!;
    const worldProgressValue = overlay.querySelector<HTMLElement>(".start-world-progress-value")!;
    const worldProgressMeter = overlay.querySelector<HTMLElement>(".start-world-progress-meter b")!;
    const worldSearchLabel = overlay.querySelector<HTMLElement>(".start-world-search span")!;
    const worldSearchInput = overlay.querySelector<HTMLInputElement>(".start-world-search-input")!;
    const worldFilterRow = overlay.querySelector<HTMLElement>(".start-world-filter-row")!;
    const worldStageRail = overlay.querySelector<HTMLElement>(".start-world-rail")!;
    const adventureLayer = overlay.querySelector<HTMLElement>(".start-adventure-layer")!;
    const adventureTitle = overlay.querySelector<HTMLElement>(".start-adventure-title")!;
    const adventureCloseButton = overlay.querySelector<HTMLButtonElement>(".start-adventure-close")!;
    const adventureName = overlay.querySelector<HTMLElement>(".start-adventure-name")!;
    const adventureText = overlay.querySelector<HTMLElement>(".start-adventure-text")!;
    const adventureChoices = overlay.querySelector<HTMLElement>(".start-adventure-choices")!;
    const adventureNextButton = overlay.querySelector<HTMLButtonElement>(".start-adventure-next")!;
    const adventureEndButton = overlay.querySelector<HTMLButtonElement>(".start-adventure-end")!;
    const adventureCharacters = Array.from(overlay.querySelectorAll<HTMLImageElement>(".start-adventure-character"));
    const mapBackButton = overlay.querySelector<HTMLButtonElement>(".start-map-back")!;
    const modeButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-mode]"));
    const soundButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-sound]"));
    const ghostFileInput = overlay.querySelector<HTMLInputElement>("#start-ghost-file")!;
    const ghostStatus = overlay.querySelector<HTMLSpanElement>(".start-ghost-status")!;
    const ghostFullscreenButton = overlay.querySelector<HTMLButtonElement>(".start-ghost-fullscreen")!;
    const accountStatus = overlay.querySelector<HTMLSpanElement>(".start-account-status")!;
    const startButton = overlay.querySelector<HTMLButtonElement>(".start-button")!;
    const googleLoginButton = overlay.querySelector<HTMLButtonElement>(".start-google-login")!;
    const installPanel = overlay.querySelector<HTMLDivElement>(".start-install-panel")!;
    const installButton = overlay.querySelector<HTMLButtonElement>(".start-install-button")!;
    const installDismissButton = overlay.querySelector<HTMLButtonElement>(".start-install-dismiss")!;
    const installNote = overlay.querySelector<HTMLParagraphElement>(".start-install-note")!;
    const orientationPrompt = overlay.querySelector<HTMLDivElement>(".start-orientation-prompt")!;
    const orientationMessage = overlay.querySelector<HTMLParagraphElement>(".start-orientation-message")!;
    const orientationNote = overlay.querySelector<HTMLParagraphElement>(".start-orientation-note")!;
    const orientationYes = overlay.querySelector<HTMLButtonElement>(".start-orientation-yes")!;
    const orientationNo = overlay.querySelector<HTMLButtonElement>(".start-orientation-no")!;
    let selectedMode = this.options.controlMode;
    let selectedStageId = this.options.stageId;
    let soundOn = this.options.soundOn;
    let selectedLocale = this.options.locale;
    let selectedCharacterId = this.options.playerCharacterId;
    let localGhostFileLoaded = false;
    let orientationPromptMode: OrientationPromptMode = "initial";
    let pendingStartSettings: StartSettings | undefined;
    let titleMusicEnabled = soundOn;
    let titleVideoHasPlayed = false;
    let removeTitleMusicGestureRetry: (() => void) | undefined;
    let isWorldPlayerMoving = false;
    let worldMoveTimers: number[] = [];
    let leaderboardGhostCount: number | undefined;
    let favoriteStageId = getStorageValue(WORLD_MAP_FAVORITE_STAGE_KEY);
    const dailyStageId = getWorldMapDailyStageId(this.options.stageOptions.map((option) => option.id));
    let worldMapFilter = normalizeWorldMapFilter(getStorageValue(WORLD_MAP_FILTER_STORAGE_KEY));
    let worldSearchQuery = "";
    let adventureLineIndex = 0;

    const getSelectedStageLabel = () =>
      this.options.stageOptions.find((option) => option.id === selectedStageId)?.label[selectedLocale] ?? selectedStageId;
    const getStageIndex = (stageId: string) => this.options.stageOptions.findIndex((option) => option.id === stageId);
    const getSelectedCharacter = () => getPlayerCharacterDefinition(selectedCharacterId);
    const isStageVisited = (stageId: string) => getStorageValue(`${WORLD_MAP_VISITED_STAGE_KEY_PREFIX}:${stageId}`) === "1";
    const isStageCleared = (stageId: string) => getStorageValue(`${WORLD_MAP_CLEARED_STAGE_KEY_PREFIX}:${stageId}`) === "1";
    const markStageVisited = (stageId: string) => setStorageValue(`${WORLD_MAP_VISITED_STAGE_KEY_PREFIX}:${stageId}`, "1");
    const getExtraText = () => getWorldMapExtraText(selectedLocale);
    const getClearedCount = () => this.options.stageOptions.filter((option) => isStageCleared(option.id)).length;
    const getVisitedCount = () => this.options.stageOptions.filter((option) => isStageVisited(option.id)).length;
    const getNextUnclearedStage = () => this.options.stageOptions.find((option) => !isStageCleared(option.id));
    const getStageLabel = (stageId: string) =>
      this.options.stageOptions.find((option) => option.id === stageId)?.label[selectedLocale] ?? stageId;
    const getStageRouteNote = (stageId: string) => {
      const detail = getWorldMapStageDetail(stageId);
      const ui = getWorldMapUiText(selectedLocale);
      const extra = getExtraText();
      const cleared = isStageCleared(stageId);
      const ghostKnown = stageId === selectedStageId ? leaderboardGhostCount : undefined;
      const ghostText =
        ghostKnown === undefined ? ui.ghostLoading : ghostKnown > 0 ? `${ui.ghostReady} (${ghostKnown})` : ui.ghostEmpty;
      return [
        cleared ? extra.clearedPlan : extra.newPlan,
        `${extra.energyPlan}: ${detail.energy}`,
        `${extra.recommendedPlan}: ${ui.controlLabels[detail.recommendedMode]}`,
        ghostText,
      ].join(" / ");
    };
    const getAdventureText = () => getAdventureDemoText(selectedLocale);
    const getAdventureLines = () => getAdventureDemoLines(selectedLocale);
    const doesStageMatchFilter = (stageId: string) => {
      const detail = getWorldMapStageDetail(stageId);
      switch (worldMapFilter) {
        case "new":
          return !isStageCleared(stageId);
        case "cleared":
          return isStageCleared(stageId);
        case "favorite":
          return favoriteStageId === stageId;
        case "ghost":
          return stageId === selectedStageId ? (leaderboardGhostCount ?? 0) > 0 : true;
        case "daily":
          return dailyStageId === stageId;
        case "pc":
          return detail.recommendedMode === "pc" || detail.recommendedMode === "either";
        case "mobile":
          return detail.recommendedMode === "mobile" || detail.recommendedMode === "either";
        case "short":
          return detail.length === "short";
        case "challenge":
          return detail.difficulty >= 4 || detail.energy >= 85;
        case "all":
        default:
          return true;
      }
    };
    const getVisibleStageOptions = () => {
      const normalizedQuery = worldSearchQuery.trim().toLocaleLowerCase();
      return this.options.stageOptions.filter((option) => {
        if (!doesStageMatchFilter(option.id)) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        const detail = getWorldMapStageDetail(option.id);
        const searchable = [
          option.id,
          option.label[selectedLocale],
          option.label.en,
          detail.area[selectedLocale],
          detail.badge[selectedLocale],
          detail.mood[selectedLocale],
          detail.gimmicks.map((gimmick) => gimmick[selectedLocale]).join(" "),
        ]
          .join(" ")
          .toLocaleLowerCase();
        return searchable.includes(normalizedQuery);
      });
    };

    const renderStars = (rating: number) =>
      Array.from({ length: 5 }, (_, index) => `<span class="${index < rating ? "is-filled" : ""}">★</span>`).join("");

    const refreshWorldSettingsPanel = () => {
      const extra = getExtraText();
      worldSettingsToggle.textContent = extra.settings;
      worldAdventureButton.textContent = extra.adventure;
      worldAdventureButton.title = extra.adventureTitle;
      worldAdventureButton.setAttribute("aria-label", extra.adventureTitle);
      worldSettingsTitle.textContent = extra.settingsTitle;
      worldSettingsClose.setAttribute("aria-label", extra.closeSettings);
      worldSettingsLabels[0]!.textContent = t(this.options.locale, "start.language");
      worldSettingsLabels[1]!.textContent = t(this.options.locale, "start.controlMode");
      worldSettingsLabels[2]!.textContent = t(this.options.locale, "start.soundSetting");
      worldSettingsNote.textContent = extra.settingsNote;
    };

    const refreshAdventureScene = () => {
      const text = getAdventureText();
      const lines = getAdventureLines();
      const line = lines[Math.min(adventureLineIndex, lines.length - 1)]!;
      adventureTitle.textContent = text.title;
      adventureCloseButton.textContent = text.close;
      adventureCloseButton.setAttribute("aria-label", text.close);
      adventureName.textContent = line.speaker;
      adventureText.textContent = line.message;
      adventureNextButton.textContent = adventureLineIndex >= lines.length - 1 ? text.replay : text.next;
      adventureEndButton.textContent = text.backToMap;
      adventureCharacters.forEach((character) => {
        const isActive =
          (line.focus === "main" && character.classList.contains("start-adventure-character-main")) ||
          (line.focus === "sub" && character.classList.contains("start-adventure-character-sub"));
        character.classList.toggle("is-active", isActive);
      });
      adventureChoices.innerHTML =
        line.choices?.map((choice) => `<button type="button">${escapeHtml(choice)}</button>`).join("") ?? "";
      adventureChoices.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        button.addEventListener("click", () => {
          adventureLineIndex = Math.min(adventureLineIndex + 1, lines.length - 1);
          refreshAdventureScene();
          adventureNextButton.focus();
        });
      });
    };

    const openAdventureScene = () => {
      hideWorldConfirm();
      worldSettingsPanel.hidden = true;
      worldMapPanel.classList.remove("is-settings-open");
      adventureLineIndex = 0;
      refreshAdventureScene();
      adventureLayer.hidden = false;
      worldMapPanel.classList.add("is-adventure-open");
      window.setTimeout(() => adventureNextButton.focus(), 80);
    };

    const closeAdventureScene = () => {
      adventureLayer.hidden = true;
      worldMapPanel.classList.remove("is-adventure-open");
      worldAdventureButton.focus();
    };

    const refreshWorldFilters = () => {
      const extra = getExtraText();
      const filters = getWorldMapFilterOptions(selectedLocale);
      worldFilterRow.setAttribute("aria-label", extra.filters);
      worldFilterRow.innerHTML = filters
        .map(
          (filter) =>
            `<button type="button" class="${filter.id === worldMapFilter ? "is-selected" : ""}" data-world-filter="${filter.id}">${escapeHtml(
              filter.label,
            )}</button>`,
        )
        .join("");
      worldFilterRow.querySelectorAll<HTMLButtonElement>("[data-world-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          worldMapFilter = normalizeWorldMapFilter(button.dataset.worldFilter);
          setStorageValue(WORLD_MAP_FILTER_STORAGE_KEY, worldMapFilter);
          refreshWorldMap();
        });
      });
    };

    const refreshWorldDashboard = () => {
      const extra = getExtraText();
      const total = Math.max(1, this.options.stageOptions.length);
      const clearedCount = getClearedCount();
      const visitedCount = getVisitedCount();
      const progress = (clearedCount / total) * 100;
      const nextStage = getNextUnclearedStage();
      const selectedDetail = getWorldMapStageDetail(selectedStageId);
      const visibleStages = getVisibleStageOptions();
      const nextLabel = nextStage ? getStageLabel(nextStage.id) : extra.allClear;

      worldProgressLabel.textContent = `${extra.progress} / ${extra.stamps}`;
      worldProgressValue.textContent = `${clearedCount}/${this.options.stageOptions.length} CLEAR · ${visitedCount} ${extra.visits}`;
      worldProgressMeter.style.width = `${progress.toFixed(2)}%`;
      worldSearchLabel.textContent = extra.search;
      worldSearchInput.placeholder = extra.searchPlaceholder;
      worldSearchInput.value = worldSearchQuery;
      worldStageRail.innerHTML = visibleStages.length
        ? visibleStages
            .map((option) => {
              const detail = getWorldMapStageDetail(option.id);
              const isSelected = option.id === selectedStageId;
              const badges = [
                option.id === dailyStageId ? extra.dailyShort : "",
                option.id === favoriteStageId ? extra.favoriteShort : "",
                isStageCleared(option.id) ? "CLEAR" : "",
              ].filter(Boolean);
              return `
                <button type="button" class="${isSelected ? "is-selected" : ""}" data-rail-stage-id="${escapeHtml(option.id)}">
                  <span>${escapeHtml(option.label[selectedLocale])}</span>
                  <small>${escapeHtml(detail.area[selectedLocale])} / ${escapeHtml(detail.mood[selectedLocale])}</small>
                  <em>${escapeHtml(badges.join(" · ") || getStageRouteNote(option.id))}</em>
                </button>
              `;
            })
            .join("")
        : `<p class="start-world-rail-empty">${escapeHtml(extra.noFilterResults)}</p>`;
      worldStageRail.querySelectorAll<HTMLButtonElement>("[data-rail-stage-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const stageId = button.dataset.railStageId;
          if (stageId) {
            moveWorldPlayerToStage(stageId);
          }
        });
      });
      worldMapPanel.style.setProperty("--stage-accent", selectedDetail.accent);
      worldMapPanel.style.setProperty("--clear-progress", `${progress.toFixed(2)}%`);
      worldMapPanel.dataset.nextStage = nextLabel;
    };

    const refreshWorldStageCard = () => {
      const option = this.options.stageOptions.find((stageOption) => stageOption.id === selectedStageId);
      const stageIndex = Math.max(0, getStageIndex(selectedStageId));
      const detail = getWorldMapStageDetail(selectedStageId);
      const ui = getWorldMapUiText(selectedLocale);
      const stageLabel = option?.label[selectedLocale] ?? selectedStageId;
      const routeProgress = this.options.stageOptions.length <= 1 ? 100 : (stageIndex / (this.options.stageOptions.length - 1)) * 100;
      const extra = getExtraText();
      const stageCleared = isStageCleared(selectedStageId);
      const nextStage = getNextUnclearedStage();
      const nextStageLabel = nextStage ? getStageLabel(nextStage.id) : extra.allClear;
      const guideText = selectedMode === "mobile" ? extra.mobileGuide : extra.pcGuide;
      const masteryText = stageCleared ? extra.masteryCleared : extra.masteryOpen;
      const ghostLabel =
        leaderboardGhostCount === undefined
          ? ui.ghostLoading
          : leaderboardGhostCount > 0
            ? `${ui.ghostReady} (${leaderboardGhostCount})`
            : ui.ghostEmpty;
      const visitedLabel = stageCleared ? ui.clearStamp : isStageVisited(selectedStageId) ? ui.visited : ui.unvisited;
      const favoriteLabel = favoriteStageId === selectedStageId ? ui.favoriteSet : ui.favorite;
      const dailyBadge =
        selectedStageId === dailyStageId ? `<span class="start-world-daily">${escapeHtml(ui.daily)}</span>` : "";
      const clearBadge = stageCleared ? `<span class="start-world-clear-stamp">CLEAR</span>` : "";

      worldStageCard.style.setProperty("--stage-accent", detail.accent);
      worldMapPanel.classList.remove("is-stage-card-left");
      worldStageCard.innerHTML = `
        <div class="start-world-card-passport" aria-hidden="true"></div>
        <div class="start-world-card-head">
          <span class="start-world-card-area">${escapeHtml(detail.area[selectedLocale])}</span>
          ${dailyBadge}
          ${clearBadge}
          <strong>${escapeHtml(stageLabel)}</strong>
          <em>${escapeHtml(detail.tagline[selectedLocale])}</em>
        </div>
        <div class="start-world-badges">
          <span>${escapeHtml(detail.badge[selectedLocale])}</span>
          <span>${escapeHtml(detail.mood[selectedLocale])}</span>
          <span>${escapeHtml(visitedLabel)}</span>
          <span>${escapeHtml(ghostLabel)}</span>
        </div>
        <div class="start-world-route-meter" aria-label="${escapeHtml(ui.route)}">
          <span>${escapeHtml(ui.route)} ${stageIndex + 1}/${this.options.stageOptions.length}</span>
          <i><b style="width: ${routeProgress.toFixed(2)}%;"></b></i>
        </div>
        <div class="start-world-plan-grid">
          <span><em>${escapeHtml(extra.nextTarget)}</em><strong>${escapeHtml(nextStageLabel)}</strong></span>
          <span><em>${escapeHtml(extra.routePlan)}</em><strong>${escapeHtml(getStageRouteNote(selectedStageId))}</strong></span>
          <span><em>${escapeHtml(extra.playStyle)}</em><strong>${escapeHtml(guideText)}</strong></span>
          <span><em>${escapeHtml(extra.mastery)}</em><strong>${escapeHtml(masteryText)}</strong></span>
        </div>
        <div class="start-world-stat-grid">
          <span><em>${escapeHtml(ui.difficulty)}</em><strong class="start-world-stars">${renderStars(detail.difficulty)}</strong></span>
          <span><em>${escapeHtml(ui.tempo)}</em><strong>${detail.energy}</strong></span>
          <span><em>${escapeHtml(ui.length)}</em><strong>${escapeHtml(ui.lengthLabels[detail.length])}</strong></span>
          <span><em>${escapeHtml(ui.control)}</em><strong>${escapeHtml(ui.controlLabels[detail.recommendedMode])}</strong></span>
          <span><em>${escapeHtml(ui.missions)}</em><strong>${detail.missionCount}</strong></span>
          <span><em>${escapeHtml(ui.secrets)}</em><strong>${detail.secretCount}</strong></span>
        </div>
        <div class="start-world-info-grid">
          <section>
            <h3>${escapeHtml(ui.missions)}</h3>
            <ul>${detail.missions.map((mission) => `<li>${escapeHtml(mission[selectedLocale])}</li>`).join("")}</ul>
          </section>
          <section>
            <h3>${escapeHtml(ui.gimmicks)}</h3>
            <div class="start-world-chip-list">${detail.gimmicks
              .map((gimmick) => `<span>${escapeHtml(gimmick[selectedLocale])}</span>`)
              .join("")}</div>
            <p><b>${escapeHtml(ui.reward)}</b>${escapeHtml(detail.reward[selectedLocale])}</p>
          </section>
        </div>
      `;

      worldFavoriteButton.textContent = favoriteLabel;
      worldFavoriteButton.title = favoriteLabel;
      worldFavoriteButton.setAttribute("aria-label", favoriteLabel);
      worldFavoriteButton.classList.toggle("is-selected", favoriteStageId === selectedStageId);
      worldFavoriteButton.setAttribute("aria-pressed", favoriteStageId === selectedStageId ? "true" : "false");
      worldRandomButton.textContent = ui.random;
      worldRandomButton.title = ui.random;
      worldRandomButton.setAttribute("aria-label", ui.random);
      worldSettingsToggle.textContent = extra.settings;
      worldSettingsToggle.title = extra.settingsTitle;
      worldSettingsToggle.setAttribute("aria-label", extra.settingsTitle);
      worldRoutePrev.textContent = ui.previous;
      worldRouteNext.textContent = ui.next;
      worldRoutePrev.title = ui.previous;
      worldRouteNext.title = ui.next;
      worldRoutePrev.setAttribute("aria-label", ui.previous);
      worldRouteNext.setAttribute("aria-label", ui.next);
      worldRoutePrev.disabled = stageIndex <= 0 || isWorldPlayerMoving;
      worldRouteNext.disabled = stageIndex >= this.options.stageOptions.length - 1 || isWorldPlayerMoving;
      refreshWorldSettingsPanel();
      refreshWorldFilters();
      refreshWorldDashboard();
    };

    const refreshCharacterSelection = () => {
      const selectedCharacter = getSelectedCharacter();
      worldMapPanel.style.setProperty("--world-player-idle-image", `url("${getAssetUrl(selectedCharacter.spriteSheets.idle.path)}")`);
      worldMapPanel.style.setProperty("--world-player-walk-image", `url("${getAssetUrl(selectedCharacter.spriteSheets.walk.path)}")`);
      characterButtons.forEach((button) => {
        const isSelected = button.dataset.characterId === selectedCharacterId;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-checked", isSelected ? "true" : "false");
      });
    };

    const clearWorldMoveTimers = () => {
      worldMoveTimers.forEach((timer) => window.clearTimeout(timer));
      worldMoveTimers = [];
      isWorldPlayerMoving = false;
      worldMapPanel.classList.remove("is-moving", "is-facing-left", "is-facing-right");
    };

    const refreshWorldMap = () => {
      const selectedIndex = Math.max(0, this.options.stageOptions.findIndex((option) => option.id === selectedStageId));
      const selectedPosition = getWorldMapNodePosition(selectedIndex, this.options.stageOptions.length);
      worldMapPanel.style.setProperty("--player-x", `${selectedPosition.x}%`);
      worldMapPanel.style.setProperty("--player-y", `${selectedPosition.y}%`);
      worldMapNodes.forEach((node) => {
        const isSelected = node.dataset.stageId === selectedStageId;
        const stageId = node.dataset.stageId ?? "";
        node.classList.toggle("is-selected", isSelected);
        node.classList.toggle("is-daily", stageId === dailyStageId);
        node.classList.toggle("is-favorite", stageId !== "" && stageId === favoriteStageId);
        node.classList.toggle("is-visited", stageId !== "" && isStageVisited(stageId));
        node.classList.toggle("is-cleared", stageId !== "" && isStageCleared(stageId));
        node.classList.toggle("is-filtered-out", stageId !== "" && !doesStageMatchFilter(stageId));
        node.setAttribute("aria-pressed", isSelected ? "true" : "false");
      });
      worldCurrent.textContent = `${t(this.options.locale, "start.worldMapCurrent")}: ${getSelectedStageLabel()}`;
      refreshWorldStageCard();
    };

    const openStageConfig = () => {
      hideWorldConfirm();
      overlay.classList.add("is-stage-config-open");
    };

    const closeStageConfig = () => {
      hideWorldConfirm();
      overlay.classList.remove("is-stage-config-open");
      const selectedNode = worldMapNodes.find((node) => node.dataset.stageId === selectedStageId);
      window.setTimeout(() => selectedNode?.focus(), 120);
    };

    const showWorldConfirm = () => {
      worldConfirmMessage.textContent = t(this.options.locale, "start.worldMapConfirm").replace("{stage}", getSelectedStageLabel());
      worldConfirm.hidden = false;
      worldMapPanel.classList.add("is-confirming");
      window.setTimeout(() => worldConfirmYes.focus(), 80);
    };

    function hideWorldConfirm() {
      worldConfirm.hidden = true;
      worldMapPanel.classList.remove("is-confirming");
    }

    const selectStage = (stageId: string, shouldRefreshGhostOptions: boolean) => {
      hideWorldConfirm();
      selectedStageId = stageId;
      this.options.stageId = selectedStageId;
      stageSelect.value = selectedStageId;
      if (shouldRefreshGhostOptions) {
        leaderboardGhostCount = undefined;
      }
      refreshWorldMap();
      if (shouldRefreshGhostOptions) {
        void loadGhostOptions();
      }
    };

    const moveWorldPlayerToStage = (stageId: string) => {
      if (isWorldPlayerMoving || stageId === selectedStageId) {
        return;
      }

      const currentIndex = getStageIndex(selectedStageId);
      const targetIndex = getStageIndex(stageId);
      if (currentIndex < 0 || targetIndex < 0) {
        selectStage(stageId, true);
        return;
      }

      hideWorldConfirm();
      clearWorldMoveTimers();
      isWorldPlayerMoving = true;
      const direction = Math.sign(targetIndex - currentIndex);
      worldMapPanel.classList.add("is-moving", direction < 0 ? "is-facing-left" : "is-facing-right");
      refreshWorldStageCard();

      const route: number[] = [];
      for (let index = currentIndex + direction; direction < 0 ? index >= targetIndex : index <= targetIndex; index += direction) {
        route.push(index);
      }

      route.forEach((routeIndex, stepIndex) => {
        const timer = window.setTimeout(() => {
          const routeStageId = this.options.stageOptions[routeIndex]?.id;
          if (!routeStageId) {
            return;
          }
          selectedStageId = routeStageId;
          this.options.stageId = selectedStageId;
          stageSelect.value = selectedStageId;
          refreshWorldMap();

          if (stepIndex === route.length - 1) {
            isWorldPlayerMoving = false;
            worldMoveTimers = [];
            worldMapPanel.classList.remove("is-moving", "is-facing-left", "is-facing-right");
            leaderboardGhostCount = undefined;
            refreshWorldStageCard();
            void loadGhostOptions();
            worldMapNodes.find((node) => node.dataset.stageId === selectedStageId)?.focus();
          }
        }, WORLD_MAP_MOVE_STEP_MS * (stepIndex + 1));
        worldMoveTimers.push(timer);
      });
    };

    const stopTitleMusic = () => {
      if (this.titleMusicGapTimer !== undefined) {
        window.clearTimeout(this.titleMusicGapTimer);
        this.titleMusicGapTimer = undefined;
      }
      removeTitleMusicGestureRetry?.();
      removeTitleMusicGestureRetry = undefined;
      titleMusic.pause();
      titleMusic.currentTime = 0;
      titleMusic.volume = 0;
    };
    const scheduleTitleMusicReplay = () => {
      if (!titleMusicEnabled || this.titleScreenDismissed) {
        return;
      }
      if (this.titleMusicGapTimer !== undefined) {
        window.clearTimeout(this.titleMusicGapTimer);
      }
      this.titleMusicGapTimer = window.setTimeout(() => playTitleMusic(false), TITLE_MUSIC_REPLAY_GAP_MS);
    };
    const queueTitleMusicGestureRetry = () => {
      if (removeTitleMusicGestureRetry || !titleMusicEnabled || this.titleScreenDismissed) {
        return;
      }
      const retry = () => {
        removeTitleMusicGestureRetry?.();
        removeTitleMusicGestureRetry = undefined;
        playTitleMusic(false);
      };
      window.addEventListener("pointerdown", retry, { capture: true, once: true });
      window.addEventListener("keydown", retry, { capture: true, once: true });
      removeTitleMusicGestureRetry = () => {
        window.removeEventListener("pointerdown", retry, { capture: true });
        window.removeEventListener("keydown", retry, { capture: true });
      };
    };
    const playTitleMusic = (allowGestureRetry = true) => {
      if (!titleMusicEnabled || this.titleScreenDismissed) {
        return;
      }
      if (this.titleMusicGapTimer !== undefined) {
        window.clearTimeout(this.titleMusicGapTimer);
        this.titleMusicGapTimer = undefined;
      }
      titleMusic.currentTime = 0;
      titleMusic.volume = TITLE_MUSIC_VOLUME;
      void titleMusic.play().catch(() => {
        titleMusic.pause();
        titleMusic.currentTime = 0;
        titleMusic.volume = 0;
        if (!titleMusicEnabled || this.titleScreenDismissed) {
          return;
        }
        if (allowGestureRetry) {
          queueTitleMusicGestureRetry();
        }
        scheduleTitleMusicReplay();
      });
    };
    const startMakerSplash = () => {
      if (this.makerSplashDismissed || this.makerSplashTimer !== undefined) {
        return;
      }
      makerSplash.classList.add("is-ready");
      this.makerSplashTimer = window.setTimeout(revealTitleScreen, MAKER_SPLASH_AUTO_ADVANCE_MS);
    };
    const revealTitleScreen = () => {
      if (this.makerSplashDismissed) {
        return;
      }
      this.makerSplashDismissed = true;
      if (this.makerSplashTimer !== undefined) {
        window.clearTimeout(this.makerSplashTimer);
        this.makerSplashTimer = undefined;
      }
      makerSplash.classList.add("is-dismissed");
      titleScreen.classList.add("is-ready");
      if (!this.titleScreenDismissed) {
        scheduleTitleVideo();
        playTitleMusic();
      }
    };
    const stopTitleLoop = () => {
      if (this.titleLoopTimer !== undefined) {
        window.clearTimeout(this.titleLoopTimer);
        this.titleLoopTimer = undefined;
      }
      titleVideo.pause();
      titleVideo.currentTime = 0;
      titleScreen.classList.remove("is-playing-video");
    };
    const scheduleTitleVideo = () => {
      if (this.titleScreenDismissed) {
        return;
      }
      if (titleVideoHasPlayed) {
        titleScreen.classList.add("has-played-video");
      }
      titleScreen.classList.remove("is-playing-video");
      titleVideo.load();
      const stillDurationMs = titleVideoHasPlayed ? TITLE_REPEAT_STILL_MS : TITLE_INITIAL_STILL_MS;
      this.titleLoopTimer = window.setTimeout(() => {
        if (this.titleScreenDismissed) {
          return;
        }
        titleVideo.currentTime = 0;
        titleVideoHasPlayed = true;
        titleScreen.classList.add("is-playing-video");
        void titleVideo.play().catch(() => {
          titleScreen.classList.remove("is-playing-video");
          scheduleTitleVideo();
        });
      }, stillDurationMs);
    };
    const dismissTitleScreen = () => {
      if (this.titleScreenDismissed) {
        return;
      }
      this.titleScreenDismissed = true;
      stopTitleLoop();
      stopTitleMusic();
      overlay.classList.add("is-revealing-start-dialog", "is-title-cleared");
      titleScreen.classList.add("is-exiting");
      this.titleDismissTimer = window.setTimeout(() => {
        titleScreen.classList.add("is-dismissed");
        this.titleDismissTimer = undefined;
        worldMapNodes.find((node) => node.dataset.stageId === selectedStageId)?.focus();
      }, 820);
    };
    const dismissSoundGate = (nextSoundOn: boolean) => {
      this.soundGateDismissed = true;
      setStorageValue(TITLE_SOUND_CONFIRM_STORAGE_KEY, "1");
      soundOn = nextSoundOn;
      titleMusicEnabled = nextSoundOn;
      this.options.soundOn = nextSoundOn;
      this.options.onSoundOnChange(nextSoundOn);
      soundGate.classList.add("is-dismissed");
      startMakerSplash();
    };
    titleScreen.addEventListener("click", dismissTitleScreen);
    titleVideo.addEventListener("ended", scheduleTitleVideo);
    titleMusic.addEventListener("ended", scheduleTitleMusicReplay);
    titleMusic.addEventListener("timeupdate", () => {
      if (!titleMusicEnabled || !Number.isFinite(titleMusic.duration) || titleMusic.duration <= 0) {
        return;
      }
      const remaining = titleMusic.duration - titleMusic.currentTime;
      titleMusic.volume =
        remaining <= TITLE_MUSIC_FADE_SECONDS
          ? Math.max(0, Math.min(TITLE_MUSIC_VOLUME, (remaining / TITLE_MUSIC_FADE_SECONDS) * TITLE_MUSIC_VOLUME))
          : TITLE_MUSIC_VOLUME;
    });
    soundGateOn.addEventListener("click", () => dismissSoundGate(true));
    soundGateOff.addEventListener("click", () => dismissSoundGate(false));
    makerSplash.addEventListener("click", revealTitleScreen);
    if (!this.soundGateDismissed) {
      soundGateOn.focus();
    } else if (!this.makerSplashDismissed) {
      startMakerSplash();
    } else if (!this.titleScreenDismissed) {
      scheduleTitleVideo();
      playTitleMusic();
    }

    input.addEventListener("keydown", (event) => event.stopPropagation());
    input.addEventListener("keyup", (event) => event.stopPropagation());
    input.addEventListener("keypress", (event) => event.stopPropagation());
    localeSelect.addEventListener("keydown", (event) => event.stopPropagation());
    localeSelect.addEventListener("keyup", (event) => event.stopPropagation());
    localeSelect.addEventListener("keypress", (event) => event.stopPropagation());
    stageSelect.addEventListener("keydown", (event) => event.stopPropagation());
    stageSelect.addEventListener("keyup", (event) => event.stopPropagation());
    stageSelect.addEventListener("keypress", (event) => event.stopPropagation());
    ghostFileInput.addEventListener("keydown", (event) => event.stopPropagation());
    ghostFileInput.addEventListener("keyup", (event) => event.stopPropagation());
    ghostFileInput.addEventListener("keypress", (event) => event.stopPropagation());
    ghostSelect.addEventListener("keydown", (event) => event.stopPropagation());
    ghostSelect.addEventListener("keyup", (event) => event.stopPropagation());
    ghostSelect.addEventListener("keypress", (event) => event.stopPropagation());
    const refreshInstallPanel = () => {
      const shouldShow = isLikelySmartphone() && !isPwaInstalled() && getStorageValue(PWA_INSTALL_DISMISSED_KEY) !== "1";
      installPanel.hidden = !shouldShow;
      installNote.hidden = true;
      installButton.textContent = canPromptPwaInstall()
        ? t(this.options.locale, "start.installButton")
        : t(this.options.locale, "start.installHowTo");
    };

    installButton.addEventListener("click", async () => {
      installButton.disabled = true;
      try {
        if (canPromptPwaInstall()) {
          const result = await promptPwaInstall();
          installNote.textContent = result === "accepted" ? t(this.options.locale, "start.installAccepted") : t(this.options.locale, "start.installDismissed");
          installNote.hidden = false;
          if (result === "accepted") {
            installPanel.hidden = true;
          }
        } else {
          installNote.textContent = getManualInstallMessage(this.options.locale);
          installNote.hidden = false;
        }
      } finally {
        installButton.disabled = false;
        installButton.textContent = canPromptPwaInstall()
          ? t(this.options.locale, "start.installButton")
          : t(this.options.locale, "start.installHowTo");
      }
    });
    installDismissButton.addEventListener("click", () => {
      setStorageValue(PWA_INSTALL_DISMISSED_KEY, "1");
      installPanel.hidden = true;
    });
    window.addEventListener("actiongame:pwa-install-ready", refreshInstallPanel);
    window.addEventListener("actiongame:pwa-installed", refreshInstallPanel);
    window.addEventListener("focus", refreshInstallPanel);
    window.addEventListener("pageshow", refreshInstallPanel);
    document.addEventListener("visibilitychange", refreshInstallPanel);
    const updateOrientationPromptText = (failed = false, mode: OrientationPromptMode = orientationPromptMode) => {
      orientationPromptMode = mode;
      orientationMessage.textContent =
        mode === "startConfirm" ? t(this.options.locale, "start.orientationStartPrompt") : t(this.options.locale, "start.orientationPrompt");
      orientationNote.hidden = !failed;
      orientationNote.textContent = failed ? t(this.options.locale, "start.orientationFallback") : "";
      orientationYes.hidden = false;
      orientationNo.hidden = false;
      orientationYes.textContent =
        mode === "startConfirm" ? t(this.options.locale, "start.orientationTurnLandscape") : t(this.options.locale, "start.orientationYes");
      orientationNo.textContent =
        mode === "startConfirm" ? t(this.options.locale, "start.orientationContinuePortrait") : t(this.options.locale, "start.orientationNo");
    };

    const showOrientationPrompt = (failed = false, mode: OrientationPromptMode = "initial") => {
      if ((mode === "initial" && this.orientationPromptDismissed) || this.orientationPromptSatisfied || !shouldSuggestMobileFullscreen()) {
        orientationPrompt.hidden = true;
        return;
      }
      updateOrientationPromptText(failed, mode);
      orientationPrompt.hidden = false;
      orientationYes.focus();
    };

    const refreshOrientationPrompt = () => {
      if (isLandscapeViewport()) {
        this.orientationPromptSatisfied = true;
        orientationPrompt.hidden = true;
        return;
      }
      this.orientationPromptSatisfied = false;
      showOrientationPrompt(!orientationNote.hidden, orientationPromptMode);
    };

    const refreshGhostFullscreenButton = () => {
      ghostFullscreenButton.hidden = !localGhostFileLoaded || !shouldSuggestMobileFullscreen();
    };

    orientationYes.addEventListener("click", async () => {
      selectedMode = "mobile";
      this.options.controlMode = selectedMode;
      refreshMode();
      orientationYes.disabled = true;
      orientationNo.disabled = true;
      orientationYes.textContent = t(this.options.locale, "start.orientationTrying");
      try {
        const succeeded = await requestFullscreenAndLandscape();
        scheduleGameLayoutRefresh();
        this.orientationPromptSatisfied = succeeded || isLandscapeViewport();
        if (this.orientationPromptSatisfied) {
          orientationMessage.textContent = t(this.options.locale, "start.orientationSuccess");
          orientationNote.hidden = true;
          orientationYes.hidden = true;
          orientationNo.hidden = true;
          if (pendingStartSettings) {
            const settings = pendingStartSettings;
            pendingStartSettings = undefined;
            window.setTimeout(() => this.options.onSubmit({ ...settings, controlMode: selectedMode }), 350);
          } else {
            window.setTimeout(() => {
              orientationPrompt.hidden = true;
            }, 850);
          }
        } else {
          showOrientationPrompt(true, orientationPromptMode);
        }
      } finally {
        orientationYes.disabled = false;
        orientationNo.disabled = false;
        if (!this.orientationPromptSatisfied) {
          updateOrientationPromptText(!orientationNote.hidden, orientationPromptMode);
        }
      }
    });
    orientationNo.addEventListener("click", () => {
      if (orientationPromptMode === "startConfirm" && pendingStartSettings) {
        const settings = pendingStartSettings;
        pendingStartSettings = undefined;
        orientationPrompt.hidden = true;
        this.options.onSubmit(settings);
        return;
      }
      this.orientationPromptDismissed = true;
      orientationPrompt.hidden = true;
    });
    orientationPrompt.addEventListener("pointerdown", (event) => event.stopPropagation());
    orientationPrompt.addEventListener("keydown", (event) => event.stopPropagation());
    window.addEventListener("resize", refreshOrientationPrompt, { passive: true });
    screen.orientation?.addEventListener?.("change", refreshOrientationPrompt);
    document.addEventListener("fullscreenchange", refreshGhostFullscreenButton);
    window.addEventListener("resize", refreshGhostFullscreenButton, { passive: true });
    screen.orientation?.addEventListener?.("change", refreshGhostFullscreenButton);
    this.removeOrientationPromptListeners = () => {
      window.removeEventListener("resize", refreshOrientationPrompt);
      screen.orientation?.removeEventListener?.("change", refreshOrientationPrompt);
      document.removeEventListener("fullscreenchange", refreshGhostFullscreenButton);
      window.removeEventListener("resize", refreshGhostFullscreenButton);
      screen.orientation?.removeEventListener?.("change", refreshGhostFullscreenButton);
      window.removeEventListener("actiongame:pwa-install-ready", refreshInstallPanel);
      window.removeEventListener("actiongame:pwa-installed", refreshInstallPanel);
      window.removeEventListener("focus", refreshInstallPanel);
      window.removeEventListener("pageshow", refreshInstallPanel);
      document.removeEventListener("visibilitychange", refreshInstallPanel);
      clearWorldMoveTimers();
    };
    const loadGhostOptions = async () => {
      const stageIdForRequest = selectedStageId;
      ghostSelect.innerHTML = `<option value="">${t(this.options.locale, "start.ghostRankingLoading")}</option>`;
      ghostSelect.disabled = true;
      try {
        const options = await this.options.onFetchGhostOptions(stageIdForRequest);
        if (stageIdForRequest !== selectedStageId) {
          return;
        }
        leaderboardGhostCount = options.length;
        ghostSelect.innerHTML = options.length
          ? [
              `<option value="" selected>${t(this.options.locale, "start.ghostRankingSelect")}</option>`,
              ...options.map((option) => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>`),
            ].join("")
          : `<option value="">${t(this.options.locale, "start.ghostRankingEmpty")}</option>`;
        ghostSelect.disabled = options.length === 0;
      } catch (error) {
        if (stageIdForRequest !== selectedStageId) {
          return;
        }
        console.warn("Could not load leaderboard ghost options.", error);
        leaderboardGhostCount = 0;
        ghostSelect.innerHTML = `<option value="">${t(this.options.locale, "start.ghostRankingFailed")}</option>`;
        ghostSelect.disabled = true;
      } finally {
        refreshWorldStageCard();
      }
    };
    stageSelect.addEventListener("change", () => {
      selectStage(stageSelect.value, true);
    });
    worldMapNodes.forEach((node) => {
      node.addEventListener("click", () => {
        const stageId = node.dataset.stageId;
        if (!stageId) {
          return;
        }
        if (stageId !== selectedStageId) {
          moveWorldPlayerToStage(stageId);
          return;
        }
        if (isWorldPlayerMoving) {
          return;
        }
        showWorldConfirm();
      });
    });
    worldConfirmYes.addEventListener("click", openStageConfig);
    worldConfirmNo.addEventListener("click", () => {
      hideWorldConfirm();
      worldMapNodes.find((node) => node.dataset.stageId === selectedStageId)?.focus();
    });
    worldRoutePrev.addEventListener("click", () => {
      const target = this.options.stageOptions[Math.max(0, getStageIndex(selectedStageId) - 1)];
      if (target) {
        moveWorldPlayerToStage(target.id);
      }
    });
    worldRouteNext.addEventListener("click", () => {
      const target = this.options.stageOptions[Math.min(this.options.stageOptions.length - 1, getStageIndex(selectedStageId) + 1)];
      if (target) {
        moveWorldPlayerToStage(target.id);
      }
    });
    worldRandomButton.addEventListener("click", () => {
      const candidates = this.options.stageOptions.filter((option) => option.id !== selectedStageId);
      const options = candidates.length > 0 ? candidates : this.options.stageOptions;
      const target = options[Math.floor(Math.random() * options.length)];
      if (target) {
        moveWorldPlayerToStage(target.id);
      }
    });
    worldFavoriteButton.addEventListener("click", () => {
      favoriteStageId = favoriteStageId === selectedStageId ? "" : selectedStageId;
      setStorageValue(WORLD_MAP_FAVORITE_STAGE_KEY, favoriteStageId);
      refreshWorldMap();
    });
    worldAdventureButton.addEventListener("click", openAdventureScene);
    adventureCloseButton.addEventListener("click", closeAdventureScene);
    adventureEndButton.addEventListener("click", closeAdventureScene);
    adventureNextButton.addEventListener("click", () => {
      const lines = getAdventureLines();
      adventureLineIndex = adventureLineIndex >= lines.length - 1 ? 0 : adventureLineIndex + 1;
      refreshAdventureScene();
    });
    adventureLayer.addEventListener("pointerdown", (event) => event.stopPropagation());
    adventureLayer.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        closeAdventureScene();
      }
    });
    worldSettingsToggle.addEventListener("click", () => {
      const shouldOpen = worldSettingsPanel.hidden === true;
      worldSettingsPanel.hidden = !shouldOpen;
      worldMapPanel.classList.toggle("is-settings-open", shouldOpen);
      if (shouldOpen) {
        worldSettingsClose.focus();
      } else {
        worldSettingsToggle.focus();
      }
    });
    worldSettingsClose.addEventListener("click", () => {
      worldSettingsPanel.hidden = true;
      worldMapPanel.classList.remove("is-settings-open");
      worldSettingsToggle.focus();
    });
    worldSearchInput.addEventListener("input", () => {
      worldSearchQuery = worldSearchInput.value;
      refreshWorldMap();
    });
    worldSearchInput.addEventListener("keydown", (event) => event.stopPropagation());
    worldSearchInput.addEventListener("keyup", (event) => event.stopPropagation());
    worldSearchInput.addEventListener("keypress", (event) => event.stopPropagation());
    mapBackButton.addEventListener("click", closeStageConfig);
    localeSelect.addEventListener("change", () => {
      selectedLocale = localeSelect.value as Locale;
      this.options.onLocaleChange(selectedLocale);
      this.options.playerName = input.value;
      this.options.playerCharacterId = selectedCharacterId;
      this.options.controlMode = selectedMode;
      this.options.stageId = selectedStageId;
      this.options.soundOn = soundOn;
      this.options.locale = selectedLocale;
      this.show();
    });

    const refreshMode = () => {
      modeButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.mode === selectedMode);
      });
    };

    const refreshSound = () => {
      soundButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.sound === (soundOn ? "on" : "off"));
      });
    };

    const refreshAccount = () => {
      accountStatus.textContent = this.getAccountStatusText();
      startButton.textContent = this.options.accountStatus?.isGoogleLinked
        ? t(this.options.locale, "start.start")
        : t(this.options.locale, "start.anonymousPlay");
      googleLoginButton.textContent = this.options.accountStatus?.isGoogleLinked
        ? t(this.options.locale, "start.googleLoggedIn")
        : t(this.options.locale, "start.googleLogin");
      googleLoginButton.disabled = Boolean(this.options.accountStatus?.isGoogleLinked);
    };

    this.refreshAccountUi = refreshAccount;

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedMode = button.dataset.mode === "mobile" ? "mobile" : "pc";
        refreshMode();
      });
    });

    characterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedCharacterId = (button.dataset.characterId ?? this.options.playerCharacterId) as PlayerCharacterId;
        this.options.playerCharacterId = selectedCharacterId;
        refreshCharacterSelection();
      });
    });

    soundButtons.forEach((button) => {
      button.addEventListener("click", () => {
        soundOn = button.dataset.sound === "on";
        titleMusicEnabled = soundOn;
        this.options.onSoundOnChange(soundOn);
        refreshSound();
      });
    });

    googleLoginButton.addEventListener("click", async () => {
      let loginFailed = false;
      googleLoginButton.disabled = true;
      googleLoginButton.textContent = t(this.options.locale, "start.googleLoggingIn");
      try {
        const status = await this.options.onGoogleLogin();
        if (status) {
          this.setAccountStatus(status);
        } else {
          refreshAccount();
        }
      } catch (error) {
        console.warn("Could not log in with Google from start modal.", error);
        loginFailed = true;
        accountStatus.textContent = t(this.options.locale, "start.googleLoginFailed");
      } finally {
        if (!loginFailed) {
          refreshAccount();
        } else {
          googleLoginButton.disabled = Boolean(this.options.accountStatus?.isGoogleLinked);
          googleLoginButton.textContent = this.options.accountStatus?.isGoogleLinked
            ? t(this.options.locale, "start.googleLoggedIn")
            : t(this.options.locale, "start.googleLogin");
        }
      }
    });

    ghostFileInput.addEventListener("change", async () => {
      const file = ghostFileInput.files?.[0];
      if (!file) {
        return;
      }

      try {
        const result = this.options.onGhostReplayLoad(await file.text());
        ghostStatus.textContent = result.label;
        if (result.stageId && Array.from(stageSelect.options).some((option) => option.value === result.stageId)) {
          selectStage(result.stageId, true);
        }
        localGhostFileLoaded = true;
        window.setTimeout(refreshGhostFullscreenButton, 250);
      } catch (error) {
        console.warn("Could not load ghost replay.", error);
        ghostStatus.textContent = t(this.options.locale, "start.ghostLoadFailed");
        ghostFileInput.value = "";
        localGhostFileLoaded = false;
        refreshGhostFullscreenButton();
      }
    });

    ghostFullscreenButton.addEventListener("click", async () => {
      selectedMode = "mobile";
      this.options.controlMode = selectedMode;
      refreshMode();
      ghostFullscreenButton.disabled = true;
      ghostFullscreenButton.textContent = t(this.options.locale, "start.orientationTrying");
      try {
        const succeeded = await requestFullscreenAndLandscape();
        scheduleGameLayoutRefresh();
        this.orientationPromptSatisfied = succeeded || isLandscapeViewport();
        refreshGhostFullscreenButton();
      } finally {
        ghostFullscreenButton.disabled = false;
        ghostFullscreenButton.textContent = t(this.options.locale, "start.ghostRestoreFullscreen");
      }
    });

    ghostSelect.addEventListener("change", async () => {
      const selectedGhostId = ghostSelect.value;
      if (!selectedGhostId) {
        return;
      }

      ghostSelect.disabled = true;
      ghostStatus.textContent = t(this.options.locale, "start.ghostRankingLoading");
      try {
        const result = await this.options.onGhostReplaySelect(selectedGhostId);
        ghostStatus.textContent = result.label;
        if (result.stageId && Array.from(stageSelect.options).some((option) => option.value === result.stageId)) {
          selectStage(result.stageId, false);
        }
      } catch (error) {
        console.warn("Could not load leaderboard ghost replay.", error);
        ghostStatus.textContent = t(this.options.locale, "start.ghostRankingFailed");
      } finally {
        ghostSelect.disabled = false;
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const settings = {
        playerName: input.value.trim() || "PLAYER",
        playerCharacterId: selectedCharacterId,
        controlMode: selectedMode,
        stageId: selectedStageId,
        soundOn,
        locale: selectedLocale,
      };
      markStageVisited(selectedStageId);
      if (shouldConfirmPortraitStart() || (shouldSuggestMobileFullscreen() && !this.orientationPromptSatisfied)) {
        pendingStartSettings = settings;
        refreshWorldMap();
        showOrientationPrompt(false, "startConfirm");
        return;
      }
      refreshWorldMap();
      this.options.onSubmit(settings);
    });

    refreshMode();
    refreshSound();
    refreshCharacterSelection();
    refreshWorldMap();
    refreshAccount();
    refreshInstallPanel();
    void loadGhostOptions();
    showOrientationPrompt();
    if (orientationPrompt.hidden) {
      const selectedNode = worldMapNodes.find((node) => node.dataset.stageId === selectedStageId);
      selectedNode?.focus();
    }
  }

  setAccountStatus(status: StartAccountStatus | undefined) {
    this.options.accountStatus = status;
    this.refreshAccountUi?.();
  }

  remove() {
    if (this.makerSplashTimer !== undefined) {
      window.clearTimeout(this.makerSplashTimer);
      this.makerSplashTimer = undefined;
    }
    if (this.titleDismissTimer !== undefined) {
      window.clearTimeout(this.titleDismissTimer);
      this.titleDismissTimer = undefined;
    }
    if (this.titleLoopTimer !== undefined) {
      window.clearTimeout(this.titleLoopTimer);
      this.titleLoopTimer = undefined;
    }
    if (this.titleMusicGapTimer !== undefined) {
      window.clearTimeout(this.titleMusicGapTimer);
      this.titleMusicGapTimer = undefined;
    }
    this.overlay?.querySelector<HTMLVideoElement>(".start-title-video")?.pause();
    this.overlay?.querySelector<HTMLAudioElement>(".start-title-music")?.pause();
    this.overlay?.remove();
    this.overlay = undefined;
    this.refreshAccountUi = undefined;
    this.removeOrientationPromptListeners?.();
    this.removeOrientationPromptListeners = undefined;
    document.getElementById("start-modal")?.remove();
    document.body.classList.remove("is-start-modal-open");
  }

  private refreshAccountUi?: () => void;

  private getAccountStatusText() {
    const status = this.options.accountStatus;
    if (!status?.playerId) {
      return t(this.options.locale, "start.accountLoading");
    }
    const playerId = status.playerId.slice(0, 8);
    const loginStatus = status.isGoogleLinked
      ? t(this.options.locale, "start.googleLoggedIn")
      : t(this.options.locale, "start.googleNotLinked");
    const accountName = status.displayName || status.email;
    return accountName ? `#${playerId} / ${loginStatus} / ${accountName}` : `#${playerId} / ${loginStatus}`;
  }
}

function shouldSuggestMobileFullscreen() {
  if (!isLikelySmartphone()) {
    return false;
  }
  return !isLandscapeViewport() || !hasFullscreenElement();
}

function shouldConfirmPortraitStart() {
  return isLikelySmartphone() && !isLandscapeViewport();
}

function getManualInstallMessage(locale: Locale) {
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return t(locale, "start.installIos");
  }
  return t(locale, "start.installManual");
}

function getStorageValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures; the prompt can simply appear again next session.
  }
}

function normalizeWorldMapFilter(value: string | null | undefined): WorldMapFilter {
  const filters: WorldMapFilter[] = ["all", "new", "cleared", "favorite", "ghost", "daily", "pc", "mobile", "short", "challenge"];
  return filters.includes(value as WorldMapFilter) ? (value as WorldMapFilter) : "all";
}

function getWorldMapFilterOptions(locale: Locale): Array<{ id: WorldMapFilter; label: string }> {
  const text = getWorldMapExtraText(locale);
  return [
    { id: "all", label: text.filterAll },
    { id: "new", label: text.filterNew },
    { id: "cleared", label: text.filterCleared },
    { id: "favorite", label: text.filterFavorite },
    { id: "ghost", label: text.filterGhost },
    { id: "daily", label: text.filterDaily },
    { id: "pc", label: text.filterPc },
    { id: "mobile", label: text.filterMobile },
    { id: "short", label: text.filterShort },
    { id: "challenge", label: text.filterChallenge },
  ];
}

function getWorldMapExtraText(locale: Locale) {
  const ja = {
    adventure: "ADV",
    adventureTitle: "アドベンチャーパートを開く",
    settings: "設定",
    settingsTitle: "マップ設定",
    closeSettings: "設定を閉じる",
    settingsNote: "言語・操作・サウンドはここで変更できます。ステージ開始前の画面は最終確認に絞りました。",
    filters: "ステージフィルタ",
    search: "さがす",
    searchPlaceholder: "ステージ名・エリア・ギミック",
    progress: "進行度",
    stamps: "スタンプ帳",
    visits: "訪問",
    noFilterResults: "条件に合うステージがありません。",
    allClear: "全ステージCLEAR",
    dailyShort: "TODAY",
    favoriteShort: "FAV",
    nextTarget: "次の目的地",
    routePlan: "ルートメモ",
    playStyle: "プレイ方針",
    mastery: "やりこみ",
    energyPlan: "テンポ",
    recommendedPlan: "推奨",
    clearedPlan: "クリア済み",
    newPlan: "未クリア",
    pcGuide: "精密操作とタイム狙い",
    mobileGuide: "横画面でゆったり攻略",
    masteryCleared: "ミッション・ゴースト更新へ",
    masteryOpen: "まずはCLEARスタンプ狙い",
    filterAll: "ALL",
    filterNew: "未CLEAR",
    filterCleared: "CLEAR",
    filterFavorite: "お気に入り",
    filterGhost: "ゴースト",
    filterDaily: "本日",
    filterPc: "PC向け",
    filterMobile: "スマホ向け",
    filterShort: "短め",
    filterChallenge: "高難度",
  };
  const en = {
    adventure: "ADV",
    adventureTitle: "Open adventure scene",
    settings: "Settings",
    settingsTitle: "Map Settings",
    closeSettings: "Close settings",
    settingsNote: "Language, controls, and sound now live on the map. The start panel stays focused on final run setup.",
    filters: "Stage filters",
    search: "Search",
    searchPlaceholder: "Stage, area, gimmick",
    progress: "Progress",
    stamps: "Stamp book",
    visits: "visits",
    noFilterResults: "No stages match this view.",
    allClear: "All stages CLEAR",
    dailyShort: "TODAY",
    favoriteShort: "FAV",
    nextTarget: "Next target",
    routePlan: "Route memo",
    playStyle: "Play style",
    mastery: "Mastery",
    energyPlan: "Tempo",
    recommendedPlan: "Best on",
    clearedPlan: "Cleared",
    newPlan: "Uncleared",
    pcGuide: "Precision and score routes",
    mobileGuide: "Relaxed landscape play",
    masteryCleared: "Chase missions and ghosts",
    masteryOpen: "Aim for the CLEAR stamp",
    filterAll: "ALL",
    filterNew: "Uncleared",
    filterCleared: "CLEAR",
    filterFavorite: "Favorite",
    filterGhost: "Ghosts",
    filterDaily: "Daily",
    filterPc: "PC",
    filterMobile: "Mobile",
    filterShort: "Short",
    filterChallenge: "Challenge",
  };
  return locale === "ja" ? ja : en;
}

function getAdventureDemoText(locale: Locale) {
  if (locale === "ja") {
    return {
      title: "残念院さんランド・ナイトティー",
      close: "閉じる",
      next: "次へ",
      replay: "もう一度",
      backToMap: "マップへ戻る",
    };
  }
  return {
    title: "Zannenin Land Night Tea",
    close: "Close",
    next: "Next",
    replay: "Replay",
    backToMap: "Back to map",
  };
}

function getAdventureDemoLines(locale: Locale): AdventureDemoLine[] {
  if (locale === "ja") {
    return [
      {
        speaker: "残念院さん",
        message: "いらっしゃいませ。ここは、ステージに出る前に少しだけ息を整えるためのティールームです。",
        focus: "main",
      },
      {
        speaker: "残念院さん",
        message: "今日はどのルートにしますか？ 走り込みでも、寄り道でも、あなたのペースで決めてください。",
        focus: "sub",
        choices: ["おすすめを聞く", "もう少し話す"],
      },
      {
        speaker: "残念院さん",
        message: "では、まずはシブヤシティから。クリアだけなら素直に、スコア狙いなら少し欲張るのがコツです。",
        focus: "main",
      },
      {
        speaker: "残念院さん",
        message: "これはまだおためし版です。次は好感度、会話分岐、ステージ前イベントにつなげられます。",
        focus: "sub",
      },
    ];
  }
  return [
    {
      speaker: "Zannenin-san",
      message: "Welcome. This tea room is a quiet pause before you step into the next stage.",
      focus: "main",
    },
    {
      speaker: "Zannenin-san",
      message: "Which route feels right today? A clean clear, a score route, or a little detour?",
      focus: "sub",
      choices: ["Ask for a route", "Keep talking"],
    },
    {
      speaker: "Zannenin-san",
      message: "Start with Shibuya City. Play it straight for a clear, or get greedy if you want score.",
      focus: "main",
    },
    {
      speaker: "Zannenin-san",
      message: "This is a prototype. Later it can grow into affection, choices, and pre-stage events.",
      focus: "sub",
    },
  ];
}

function getWorldMapNodePosition(index: number, total: number) {
  if (index < WORLD_MAP_NODE_POSITIONS.length) {
    return WORLD_MAP_NODE_POSITIONS[index];
  }
  const progress = total <= 1 ? 0 : index / (total - 1);
  return {
    x: 8 + progress * 84,
    y: 54 - Math.sin(progress * Math.PI * 3) * 24,
  };
}

function renderWorldMapPath(stageOptions: StageOption[]) {
  const points = stageOptions
    .map((_, index) => {
      const position = getWorldMapNodePosition(index, stageOptions.length);
      return `${position.x},${position.y}`;
    })
    .join(" ");
  return `
    <svg class="start-world-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${points}" />
    </svg>
  `;
}

function renderWorldMapNode(option: StageOption, index: number, total: number, selectedStageId: string, locale: Locale) {
  const position = getWorldMapNodePosition(index, total);
  const isSelected = option.id === selectedStageId;
  const stageName = option.label[locale];
  return `
    <button
      type="button"
      class="start-world-node${isSelected ? " is-selected" : ""}"
      data-stage-id="${escapeHtml(option.id)}"
      style="--map-x: ${position.x}%; --map-y: ${position.y}%;"
      aria-pressed="${isSelected ? "true" : "false"}"
      aria-label="${escapeHtml(stageName)}"
    >
      <span class="start-world-node-index">${index + 1}</span>
      <span class="start-world-node-label">${escapeHtml(stageName)}</span>
    </button>
  `;
}

async function requestFullscreenAndLandscape() {
  let fullscreenSucceeded = hasFullscreenElement();
  try {
    if (!fullscreenSucceeded && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
      fullscreenSucceeded = true;
    }
  } catch (error) {
    console.warn("Fullscreen request failed.", error);
  }

  let orientationSucceeded = isLandscapeViewport();
  try {
    const orientation = screen.orientation as ScreenOrientation | undefined;
    if (orientation?.lock) {
      await orientation.lock("landscape");
      orientationSucceeded = true;
    }
  } catch (error) {
    console.warn("Landscape orientation lock failed.", error);
  }

  return fullscreenSucceeded && orientationSucceeded;
}

function scheduleGameLayoutRefresh() {
  for (const delayMs of [0, 80, 180, 360, 720]) {
    window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event(GAME_LAYOUT_REFRESH_EVENT));
    }, delayMs);
  }
}

function getAssetUrl(path: string) {
  return `${ASSET_BASE}${path}`;
}

function renderCharacterOptions(characters: PlayerCharacterDefinition[], selectedCharacterId: PlayerCharacterId, locale: Locale) {
  return characters
    .map((character) => {
      const isSelected = character.id === selectedCharacterId;
      return `
        <button
          type="button"
          class="start-character-button${isSelected ? " is-selected" : ""}"
          role="radio"
          aria-checked="${isSelected ? "true" : "false"}"
          data-character-id="${escapeHtml(character.id)}"
        >
          <span class="start-character-preview" style="background-image: url('${escapeHtml(
            getAssetUrl(character.spriteSheets.idle.path),
          )}')"></span>
          <span class="start-character-copy">
            <strong>${escapeHtml(character.label[locale] ?? character.label.en)}</strong>
            <em>${escapeHtml(character.tagline[locale] ?? character.tagline.en)}</em>
          </span>
        </button>
      `;
    })
    .join("");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
