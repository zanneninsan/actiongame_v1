import { LOCALE_OPTIONS, t, type Locale } from "./i18n";

export type ControlMode = "pc" | "mobile";
export type StageOption = { id: string; label: Record<Locale, string> };

type StartModalOptions = {
  playerName: string;
  controlMode: ControlMode;
  stageId: string;
  stageOptions: StageOption[];
  soundOn: boolean;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onSoundOnChange: (soundOn: boolean) => void;
  onSubmit: (settings: { playerName: string; controlMode: ControlMode; stageId: string; soundOn: boolean; locale: Locale }) => void;
};

export class StartModal {
  private readonly options: StartModalOptions;
  private overlay?: HTMLDivElement;

  constructor(options: StartModalOptions) {
    this.options = options;
  }

  show() {
    this.remove();

    const overlay = document.createElement("div");
    overlay.id = "start-modal";
    overlay.innerHTML = `
      <form class="start-dialog">
        <h1>SUPER ZANNENIN SISTERS</h1>
        <label>
          <span>${t(this.options.locale, "start.playerName")}</span>
          <input name="playerName" type="text" maxlength="16" autocomplete="off" value="${escapeHtml(this.options.playerName)}" />
        </label>
        <label>
          <span>${t(this.options.locale, "start.language")}</span>
          <select name="locale">
            ${LOCALE_OPTIONS.map(
              (option) =>
                `<option value="${option.locale}"${option.locale === this.options.locale ? " selected" : ""}>${option.label}</option>`,
            ).join("")}
          </select>
        </label>
        <label>
          <span>${t(this.options.locale, "start.stage")}</span>
          <select name="stage">
            ${this.options.stageOptions
              .map(
                (option) =>
                  `<option value="${escapeHtml(option.id)}"${option.id === this.options.stageId ? " selected" : ""}>${escapeHtml(
                    option.label[this.options.locale],
                  )}</option>`,
              )
              .join("")}
          </select>
        </label>
        <div class="mode-row" role="group" aria-label="${t(this.options.locale, "start.controlMode")}">
          <button type="button" data-mode="pc" class="mode-button">${t(this.options.locale, "start.modePc")}</button>
          <button type="button" data-mode="mobile" class="mode-button">${t(this.options.locale, "start.modeMobile")}</button>
        </div>
        <div class="sound-row" role="group" aria-label="${t(this.options.locale, "start.soundSetting")}">
          <button type="button" data-sound="on" class="sound-button">&#128266; ${t(this.options.locale, "start.soundOn")}</button>
          <button type="button" data-sound="off" class="sound-button">&#128263; ${t(this.options.locale, "start.soundOff")}</button>
        </div>
        <button type="submit" class="start-button">${t(this.options.locale, "start.start")}</button>
      </form>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;

    const form = overlay.querySelector("form")!;
    const input = overlay.querySelector<HTMLInputElement>("input[name='playerName']")!;
    const localeSelect = overlay.querySelector<HTMLSelectElement>("select[name='locale']")!;
    const stageSelect = overlay.querySelector<HTMLSelectElement>("select[name='stage']")!;
    const modeButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-mode]"));
    const soundButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-sound]"));
    let selectedMode = this.options.controlMode;
    let selectedStageId = this.options.stageId;
    let soundOn = this.options.soundOn;
    let selectedLocale = this.options.locale;

    input.addEventListener("keydown", (event) => event.stopPropagation());
    input.addEventListener("keyup", (event) => event.stopPropagation());
    input.addEventListener("keypress", (event) => event.stopPropagation());
    localeSelect.addEventListener("keydown", (event) => event.stopPropagation());
    localeSelect.addEventListener("keyup", (event) => event.stopPropagation());
    localeSelect.addEventListener("keypress", (event) => event.stopPropagation());
    stageSelect.addEventListener("keydown", (event) => event.stopPropagation());
    stageSelect.addEventListener("keyup", (event) => event.stopPropagation());
    stageSelect.addEventListener("keypress", (event) => event.stopPropagation());
    stageSelect.addEventListener("change", () => {
      selectedStageId = stageSelect.value;
      this.options.stageId = selectedStageId;
    });
    localeSelect.addEventListener("change", () => {
      selectedLocale = localeSelect.value as Locale;
      this.options.onLocaleChange(selectedLocale);
      this.options.playerName = input.value;
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

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedMode = button.dataset.mode === "mobile" ? "mobile" : "pc";
        refreshMode();
      });
    });

    soundButtons.forEach((button) => {
      button.addEventListener("click", () => {
        soundOn = button.dataset.sound === "on";
        this.options.onSoundOnChange(soundOn);
        refreshSound();
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.options.onSubmit({
        playerName: input.value.trim() || "PLAYER",
        controlMode: selectedMode,
        stageId: selectedStageId,
        soundOn,
        locale: selectedLocale,
      });
    });

    refreshMode();
    refreshSound();
    input.focus();
    input.select();
  }

  remove() {
    this.overlay?.remove();
    this.overlay = undefined;
    document.getElementById("start-modal")?.remove();
  }
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
