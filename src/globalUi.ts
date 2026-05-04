import { isLocale, LOCALE_OPTIONS, t, type Locale } from "./i18n";

type GlobalUiOptions = {
  version: string;
  locale: Locale;
  soundVolumePercent: number;
  soundMuted: boolean;
  collisionDebugEnabled: boolean;
  onCollisionToggle: (button: HTMLButtonElement) => void;
  onRearBackgroundToggle: (button: HTMLButtonElement) => void;
  onMidgroundBackgroundToggle: (button: HTMLButtonElement) => void;
  updateRearBackgroundToggle: (button: HTMLButtonElement) => void;
  updateMidgroundBackgroundToggle: (button: HTMLButtonElement) => void;
  onSoundChange: (volumePercent: number, muted: boolean) => void;
  onLocaleChange: (locale: Locale) => void;
  onLeaderboardOpen: () => void;
};

export const createGlobalUI = (options: GlobalUiOptions) => {
  removeGlobalUI();

  const uiContainer = document.createElement("div");
  uiContainer.id = "global-ui";
  uiContainer.innerHTML = `
    <span id="version-label">${options.version}</span>
    <button id="collision-debug-toggle" class="ui-button debug-toggle" type="button" aria-label="${t(options.locale, "aria.toggleCollision")}">HIT</button>
    <button id="rear-debug-toggle" class="ui-button debug-toggle" type="button" aria-label="Switch rear background">RB1</button>
    <button id="midground-debug-toggle" class="ui-button debug-toggle" type="button" aria-label="Switch midground background">MG1</button>
    <button id="leaderboard-toggle" class="ui-button" type="button" aria-label="Open leaderboard">&#127942;</button>
    <button id="bgm-toggle" class="ui-button" type="button" aria-label="${t(options.locale, "aria.toggleSound")}">&#128266;</button>
    <button id="options-toggle" class="ui-button" type="button" aria-label="${t(options.locale, "aria.options")}">&#9881;&#65039;</button>
  `;
  document.body.appendChild(uiContainer);

  const optionsModal = document.createElement("div");
  optionsModal.id = "options-modal";
  optionsModal.innerHTML = `
    <div class="options-dialog">
      <h2>${t(options.locale, "options.title")}</h2>
      <label>
        <span>${t(options.locale, "options.volume")}</span>
        <input id="volume-slider" type="range" min="0" max="100" />
      </label>
      <label>
        <span>${t(options.locale, "options.language")}</span>
        <select id="language-select">
          ${LOCALE_OPTIONS.map(
            (option) => `<option value="${option.locale}"${option.locale === options.locale ? " selected" : ""}>${option.label}</option>`,
          ).join("")}
        </select>
      </label>
      <button id="options-close" class="ui-button" type="button">${t(options.locale, "options.close")}</button>
    </div>
  `;
  document.body.appendChild(optionsModal);

  const bgmToggle = document.getElementById("bgm-toggle") as HTMLButtonElement;
  const collisionDebugToggle = document.getElementById("collision-debug-toggle") as HTMLButtonElement;
  const rearDebugToggle = document.getElementById("rear-debug-toggle") as HTMLButtonElement;
  const midgroundDebugToggle = document.getElementById("midground-debug-toggle") as HTMLButtonElement;
  const leaderboardToggle = document.getElementById("leaderboard-toggle") as HTMLButtonElement;
  const optionsToggle = document.getElementById("options-toggle") as HTMLButtonElement;
  const optionsClose = document.getElementById("options-close") as HTMLButtonElement;
  const volumeSlider = document.getElementById("volume-slider") as HTMLInputElement;
  const languageSelect = document.getElementById("language-select") as HTMLSelectElement;

  let currentVolumePercent = options.soundVolumePercent;
  let currentMuted = options.soundMuted;
  const changeSound = (volumePercent: number, muted: boolean) => {
    currentVolumePercent = volumePercent;
    currentMuted = muted;
    options.onSoundChange(volumePercent, muted);
  };

  setGlobalSoundUI(currentVolumePercent, currentMuted);
  collisionDebugToggle.classList.toggle("is-active", options.collisionDebugEnabled);
  options.updateRearBackgroundToggle(rearDebugToggle);
  options.updateMidgroundBackgroundToggle(midgroundDebugToggle);

  collisionDebugToggle.addEventListener("click", () => options.onCollisionToggle(collisionDebugToggle));
  rearDebugToggle.addEventListener("click", () => options.onRearBackgroundToggle(rearDebugToggle));
  midgroundDebugToggle.addEventListener("click", () => options.onMidgroundBackgroundToggle(midgroundDebugToggle));
  leaderboardToggle.addEventListener("click", () => options.onLeaderboardOpen());

  bgmToggle.addEventListener("click", () => {
    const currentVolume = parseInt(volumeSlider.value, 10);
    if (currentVolume === 0) {
      changeSound(50, false);
    } else {
      changeSound(currentVolume, !currentMuted);
    }
  });

  optionsToggle.addEventListener("click", () => {
    optionsModal.style.display = "grid";
  });

  optionsClose.addEventListener("click", () => {
    optionsModal.style.display = "none";
  });

  volumeSlider.addEventListener("input", (event) => {
    event.stopPropagation();
    const volumePercent = parseInt(volumeSlider.value, 10);
    changeSound(volumePercent, volumePercent <= 0);
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
    }
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
};

export const setGlobalSoundUI = (volumePercent: number, muted: boolean) => {
  const bgmToggle = document.getElementById("bgm-toggle") as HTMLButtonElement | null;
  const volumeSlider = document.getElementById("volume-slider") as HTMLInputElement | null;
  if (volumeSlider) {
    volumeSlider.value = String(volumePercent);
  }
  if (bgmToggle) {
    bgmToggle.innerHTML = muted || volumePercent === 0 ? "&#128263;" : "&#128266;";
  }
};
