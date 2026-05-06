import { isLocale, LOCALE_OPTIONS, t, type Locale } from "./i18n";
import type { DanmakuMode } from "./danmaku";

const getPlayerSpecUrl = (locale: Locale) =>
  `${import.meta.env.BASE_URL}player-spec/index.html?lang=${encodeURIComponent(locale)}`;

type GlobalUiOptions = {
  version: string;
  locale: Locale;
  bgmVolumePercent: number;
  seVolumePercent: number;
  soundMuted: boolean;
  danmakuEnabled: boolean;
  danmakuMode: DanmakuMode;
  collisionDebugEnabled: boolean;
  onCollisionToggle: (button: HTMLButtonElement) => void;
  onRearBackgroundToggle: (button: HTMLButtonElement) => void;
  onMidgroundBackgroundToggle: (button: HTMLButtonElement) => void;
  updateRearBackgroundToggle: (button: HTMLButtonElement) => void;
  updateMidgroundBackgroundToggle: (button: HTMLButtonElement) => void;
  onSoundChange: (bgmVolumePercent: number, seVolumePercent: number, muted: boolean) => void;
  onDanmakuModeChange: (mode: DanmakuMode) => void;
  onLocaleChange: (locale: Locale) => void;
  onLeaderboardOpen: () => void;
  onAccountOpen: () => void;
  onReturnToTitle: () => void;
  onScreenshotOpen: () => void;
};

export const createGlobalUI = (options: GlobalUiOptions) => {
  removeGlobalUI();

  const uiContainer = document.createElement("div");
  uiContainer.id = "global-ui";
  uiContainer.innerHTML = `
    <span id="version-label">${options.version}</span>
    <button id="screenshot-toggle" class="ui-button screenshot-quick-toggle" type="button" aria-label="${t(options.locale, "aria.screenshot")}">📷</button>
    <button id="global-menu-toggle" class="ui-button global-menu-toggle" type="button" aria-label="${t(
      options.locale,
      "aria.globalMenu",
    )}" aria-controls="global-ui-drawer" aria-expanded="false">&#9776;</button>
    <div id="global-ui-drawer" class="global-ui-drawer">
      <span id="player-position-label" hidden>POS --,--</span>
      <button id="collision-debug-toggle" class="ui-button debug-toggle" type="button" aria-label="${t(options.locale, "aria.toggleCollision")}">HIT</button>
      <button id="rear-debug-toggle" class="ui-button debug-toggle" type="button" aria-label="Switch rear background">RB1</button>
      <button id="midground-debug-toggle" class="ui-button debug-toggle" type="button" aria-label="Switch midground background">MG1</button>
      <button id="leaderboard-toggle" class="ui-button" type="button" aria-label="Open leaderboard">&#127942;</button>
      <button id="account-toggle" class="ui-button account-toggle" type="button" aria-label="${t(
        options.locale,
        "aria.account",
      )}">${t(options.locale, "global.accountShort")}</button>
      <button id="player-spec-toggle" class="ui-button spec-toggle" type="button" aria-label="${t(
        options.locale,
        "aria.playerSpec",
      )}">${t(options.locale, "global.playerSpecShort")}</button>
      <button id="title-toggle" class="ui-button title-toggle" type="button" aria-label="${t(
        options.locale,
        "aria.returnToTitle",
      )}">${t(options.locale, "global.titleShort")}</button>
      <button id="bgm-toggle" class="ui-button" type="button" aria-label="${t(options.locale, "aria.toggleSound")}">&#128266;</button>
      <button id="options-toggle" class="ui-button" type="button" aria-label="${t(options.locale, "aria.options")}">&#9881;&#65039;</button>
    </div>
  `;
  document.body.appendChild(uiContainer);

  const selectedDanmakuMode: DanmakuMode = options.danmakuEnabled ? options.danmakuMode : "none";
  const optionsModal = document.createElement("div");
  optionsModal.id = "options-modal";
  optionsModal.innerHTML = `
    <div class="options-dialog">
      <h2>${t(options.locale, "options.title")}</h2>
      <label>
        <span>${t(options.locale, "options.bgmVolume")}</span>
        <input id="bgm-volume-slider" type="range" min="0" max="100" />
      </label>
      <label>
        <span>${t(options.locale, "options.seVolume")}</span>
        <input id="se-volume-slider" type="range" min="0" max="100" />
      </label>
      <label>
        <span>${t(options.locale, "options.language")}</span>
        <select id="language-select">
          ${LOCALE_OPTIONS.map(
            (option) => `<option value="${option.locale}"${option.locale === options.locale ? " selected" : ""}>${option.label}</option>`,
          ).join("")}
        </select>
      </label>
      <label>
        <span>${t(options.locale, "options.danmakuMode")}</span>
        <select id="danmaku-mode-select">
          <option value="none"${selectedDanmakuMode === "none" ? " selected" : ""}>${t(options.locale, "options.danmakuMode.none")}</option>
          <option value="classic"${selectedDanmakuMode === "classic" ? " selected" : ""}>${t(options.locale, "options.danmakuMode.classic")}</option>
          <option value="liveChat"${selectedDanmakuMode === "liveChat" ? " selected" : ""}>${t(options.locale, "options.danmakuMode.liveChat")}</option>
        </select>
      </label>
      <button id="options-close" class="ui-button" type="button">${t(options.locale, "options.close")}</button>
    </div>
  `;
  document.body.appendChild(optionsModal);

  const bgmToggle = document.getElementById("bgm-toggle") as HTMLButtonElement;
  const globalMenuToggle = document.getElementById("global-menu-toggle") as HTMLButtonElement;
  const collisionDebugToggle = document.getElementById("collision-debug-toggle") as HTMLButtonElement;
  const rearDebugToggle = document.getElementById("rear-debug-toggle") as HTMLButtonElement;
  const midgroundDebugToggle = document.getElementById("midground-debug-toggle") as HTMLButtonElement;
  const screenshotToggle = document.getElementById("screenshot-toggle") as HTMLButtonElement;
  const leaderboardToggle = document.getElementById("leaderboard-toggle") as HTMLButtonElement;
  const accountToggle = document.getElementById("account-toggle") as HTMLButtonElement;
  const playerSpecToggle = document.getElementById("player-spec-toggle") as HTMLButtonElement;
  const titleToggle = document.getElementById("title-toggle") as HTMLButtonElement;
  const optionsToggle = document.getElementById("options-toggle") as HTMLButtonElement;
  const optionsClose = document.getElementById("options-close") as HTMLButtonElement;
  const bgmVolumeSlider = document.getElementById("bgm-volume-slider") as HTMLInputElement;
  const seVolumeSlider = document.getElementById("se-volume-slider") as HTMLInputElement;
  const languageSelect = document.getElementById("language-select") as HTMLSelectElement;
  const danmakuModeSelect = document.getElementById("danmaku-mode-select") as HTMLSelectElement;
  const setGlobalMenuOpen = (open: boolean) => {
    document.body.classList.toggle("is-global-menu-open", open);
    globalMenuToggle.setAttribute("aria-expanded", String(open));
  };
  const closeGlobalMenu = () => setGlobalMenuOpen(false);

  let currentBgmVolumePercent = options.bgmVolumePercent;
  let currentSeVolumePercent = options.seVolumePercent;
  let currentMuted = options.soundMuted;
  const changeSound = (bgmVolumePercent: number, seVolumePercent: number, muted: boolean) => {
    currentBgmVolumePercent = bgmVolumePercent;
    currentSeVolumePercent = seVolumePercent;
    currentMuted = muted;
    options.onSoundChange(bgmVolumePercent, seVolumePercent, muted);
  };

  setGlobalSoundUI(currentBgmVolumePercent, currentSeVolumePercent, currentMuted);
  collisionDebugToggle.classList.toggle("is-active", options.collisionDebugEnabled);
  options.updateRearBackgroundToggle(rearDebugToggle);
  options.updateMidgroundBackgroundToggle(midgroundDebugToggle);

  globalMenuToggle.addEventListener("click", () => setGlobalMenuOpen(!document.body.classList.contains("is-global-menu-open")));
  collisionDebugToggle.addEventListener("click", () => {
    options.onCollisionToggle(collisionDebugToggle);
    closeGlobalMenu();
  });
  rearDebugToggle.addEventListener("click", () => {
    options.onRearBackgroundToggle(rearDebugToggle);
    closeGlobalMenu();
  });
  midgroundDebugToggle.addEventListener("click", () => {
    options.onMidgroundBackgroundToggle(midgroundDebugToggle);
    closeGlobalMenu();
  });
  screenshotToggle.addEventListener("click", () => {
    options.onScreenshotOpen();
    closeGlobalMenu();
  });
  leaderboardToggle.addEventListener("click", () => {
    options.onLeaderboardOpen();
    closeGlobalMenu();
  });
  accountToggle.addEventListener("click", () => {
    options.onAccountOpen();
    closeGlobalMenu();
  });
  playerSpecToggle.addEventListener("click", () => {
    window.open(getPlayerSpecUrl(options.locale), "_blank", "noopener");
    closeGlobalMenu();
  });
  titleToggle.addEventListener("click", () => {
    options.onReturnToTitle();
    closeGlobalMenu();
  });

  bgmToggle.addEventListener("click", () => {
    const currentBgmVolume = parseInt(bgmVolumeSlider.value, 10);
    const currentSeVolume = parseInt(seVolumeSlider.value, 10);
    if (currentBgmVolume === 0 && currentSeVolume === 0) {
      changeSound(50, 50, false);
    } else {
      changeSound(currentBgmVolume, currentSeVolume, !currentMuted);
    }
    closeGlobalMenu();
  });

  optionsToggle.addEventListener("click", () => {
    optionsModal.style.display = "grid";
    document.body.classList.add("is-options-modal-open");
    closeGlobalMenu();
  });

  optionsClose.addEventListener("click", () => {
    optionsModal.style.display = "none";
    document.body.classList.remove("is-options-modal-open");
  });

  bgmVolumeSlider.addEventListener("input", (event) => {
    event.stopPropagation();
    const bgmVolumePercent = parseInt(bgmVolumeSlider.value, 10);
    changeSound(bgmVolumePercent, currentSeVolumePercent, bgmVolumePercent <= 0 && currentSeVolumePercent <= 0);
  });

  seVolumeSlider.addEventListener("input", (event) => {
    event.stopPropagation();
    const seVolumePercent = parseInt(seVolumeSlider.value, 10);
    changeSound(currentBgmVolumePercent, seVolumePercent, currentBgmVolumePercent <= 0 && seVolumePercent <= 0);
  });

  languageSelect.addEventListener("change", (event) => {
    event.stopPropagation();
    const nextLocale = languageSelect.value;
    if (!isLocale(nextLocale)) {
      return;
    }
    options.onLocaleChange(nextLocale);
    const nextOptionsModal = document.getElementById("options-modal");
    if (nextOptionsModal) {
      nextOptionsModal.style.display = "grid";
      document.body.classList.add("is-options-modal-open");
    }
  });

  danmakuModeSelect.addEventListener("change", (event) => {
    event.stopPropagation();
    const mode = danmakuModeSelect.value === "none" ? "none" : danmakuModeSelect.value === "liveChat" ? "liveChat" : "classic";
    options.onDanmakuModeChange(mode);
  });

  optionsModal.addEventListener("keydown", (event) => event.stopPropagation());
  optionsModal.addEventListener("keyup", (event) => event.stopPropagation());
  optionsModal.addEventListener("keypress", (event) => event.stopPropagation());
  optionsModal.addEventListener("pointerdown", (event) => event.stopPropagation());
  uiContainer.addEventListener("pointerdown", (event) => event.stopPropagation());
};

export const removeGlobalUI = () => {
  document.getElementById("global-ui")?.remove();
  document.getElementById("options-modal")?.remove();
  document.getElementById("account-modal")?.remove();
  document.getElementById("screenshot-modal")?.remove();
  document.body.classList.remove(
    "is-options-modal-open",
    "is-account-modal-open",
    "is-leaderboard-modal-open",
    "is-screenshot-modal-open",
    "is-global-menu-open",
  );
};

export const setPlayerPositionDebugUI = (enabled: boolean, x: number, y: number) => {
  const positionLabel = document.getElementById("player-position-label") as HTMLSpanElement | null;
  if (!positionLabel) {
    return;
  }
  positionLabel.hidden = !enabled;
  if (enabled) {
    positionLabel.textContent = `POS ${Math.round(x)}, ${Math.round(y)}`;
  }
};

export const setGlobalSoundUI = (bgmVolumePercent: number, seVolumePercent: number, muted: boolean) => {
  const bgmToggle = document.getElementById("bgm-toggle") as HTMLButtonElement | null;
  const bgmVolumeSlider = document.getElementById("bgm-volume-slider") as HTMLInputElement | null;
  const seVolumeSlider = document.getElementById("se-volume-slider") as HTMLInputElement | null;
  if (bgmVolumeSlider) {
    bgmVolumeSlider.value = String(bgmVolumePercent);
  }
  if (seVolumeSlider) {
    seVolumeSlider.value = String(seVolumePercent);
  }
  if (bgmToggle) {
    bgmToggle.innerHTML = muted || (bgmVolumePercent === 0 && seVolumePercent === 0) ? "&#128263;" : "&#128266;";
  }
};
