import { isLocale, LOCALE_OPTIONS, t, type Locale } from "./i18n";
import type { DanmakuMode } from "./danmaku";
import type { ControlMode } from "./startModal";

type GlobalUiOptions = {
  locale: Locale;
  bgmVolumePercent: number;
  seVolumePercent: number;
  soundMuted: boolean;
  controlMode: ControlMode;
  danmakuEnabled: boolean;
  danmakuMode: DanmakuMode;
  onSoundChange: (bgmVolumePercent: number, seVolumePercent: number, muted: boolean) => void;
  onControlModeChange: (mode: ControlMode) => void;
  onDanmakuModeChange: (mode: DanmakuMode) => void;
  onLocaleChange: (locale: Locale) => void;
};

export const createGlobalUI = (options: GlobalUiOptions) => {
  removeGlobalUI();

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
      <div class="options-mode-control">
        <span>${t(options.locale, "start.controlMode")}</span>
        <div class="options-mode-row" role="group" aria-label="${t(options.locale, "start.controlMode")}">
          <button type="button" data-options-mode="pc" class="options-mode-button">${t(options.locale, "start.modePc")}</button>
          <button type="button" data-options-mode="mobile" class="options-mode-button">${t(options.locale, "start.modeMobile")}</button>
        </div>
      </div>
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

  const optionsClose = document.getElementById("options-close") as HTMLButtonElement;
  const bgmVolumeSlider = document.getElementById("bgm-volume-slider") as HTMLInputElement;
  const seVolumeSlider = document.getElementById("se-volume-slider") as HTMLInputElement;
  const languageSelect = document.getElementById("language-select") as HTMLSelectElement;
  const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-options-mode]"));
  const danmakuModeSelect = document.getElementById("danmaku-mode-select") as HTMLSelectElement;

  let currentBgmVolumePercent = options.bgmVolumePercent;
  let currentSeVolumePercent = options.seVolumePercent;
  let currentMuted = options.soundMuted;
  let currentControlMode = options.controlMode;
  const changeSound = (bgmVolumePercent: number, seVolumePercent: number, muted: boolean) => {
    currentBgmVolumePercent = bgmVolumePercent;
    currentSeVolumePercent = seVolumePercent;
    currentMuted = muted;
    options.onSoundChange(bgmVolumePercent, seVolumePercent, muted);
  };
  const updateControlModeUI = () => {
    modeButtons.forEach((button) => {
      const mode = button.dataset.optionsMode === "mobile" ? "mobile" : "pc";
      const selected = mode === currentControlMode;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };

  setGlobalSoundUI(currentBgmVolumePercent, currentSeVolumePercent, currentMuted);
  updateControlModeUI();

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

  modeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const nextMode: ControlMode = button.dataset.optionsMode === "mobile" ? "mobile" : "pc";
      if (nextMode === currentControlMode) {
        return;
      }
      currentControlMode = nextMode;
      options.onControlModeChange(nextMode);
      updateControlModeUI();
    });
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
};

export const removeGlobalUI = () => {
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

export const openGlobalOptionsModal = () => {
  const optionsModal = document.getElementById("options-modal");
  if (!optionsModal) {
    return;
  }
  optionsModal.style.display = "grid";
  document.body.classList.add("is-options-modal-open");
};

export const setGlobalSoundUI = (bgmVolumePercent: number, seVolumePercent: number, muted: boolean) => {
  const bgmVolumeSlider = document.getElementById("bgm-volume-slider") as HTMLInputElement | null;
  const seVolumeSlider = document.getElementById("se-volume-slider") as HTMLInputElement | null;
  if (bgmVolumeSlider) {
    bgmVolumeSlider.value = String(bgmVolumePercent);
  }
  if (seVolumeSlider) {
    seVolumeSlider.value = String(seVolumePercent);
  }
};
