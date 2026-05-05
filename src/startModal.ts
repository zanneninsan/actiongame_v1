import { LOCALE_OPTIONS, t, type Locale } from "./i18n";

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
  controlMode: ControlMode;
  stageId: string;
  stageOptions: StageOption[];
  soundOn: boolean;
  locale: Locale;
  accountStatus?: StartAccountStatus;
  onLocaleChange: (locale: Locale) => void;
  onSoundOnChange: (soundOn: boolean) => void;
  onGoogleLogin: () => Promise<StartAccountStatus | undefined>;
  onGhostReplayLoad: (jsonText: string) => StartGhostLoadResult;
  onFetchGhostOptions: (stageId: string) => Promise<StartGhostOption[]>;
  onGhostReplaySelect: (ghostId: string) => Promise<StartGhostLoadResult>;
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
        <label class="start-field">
          <span>${t(this.options.locale, "start.playerName")}</span>
          <input name="playerName" type="text" maxlength="16" autocomplete="off" value="${escapeHtml(this.options.playerName)}" />
        </label>
        <label class="start-field">
          <span>${t(this.options.locale, "start.language")}</span>
          <select name="locale">
            ${LOCALE_OPTIONS.map(
              (option) =>
                `<option value="${option.locale}"${option.locale === this.options.locale ? " selected" : ""}>${option.label}</option>`,
            ).join("")}
          </select>
        </label>
        <label class="start-field">
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
        <div class="start-ghost-panel">
          <input id="start-ghost-file" class="start-ghost-file" type="file" accept="application/json,.json" />
          <label for="start-ghost-file" class="start-ghost-load">${t(this.options.locale, "start.ghostLoad")}</label>
          <select name="leaderboardGhost" class="start-ghost-select">
            <option value="">${t(this.options.locale, "start.ghostRankingEmpty")}</option>
          </select>
          <span class="start-ghost-status">${t(this.options.locale, "start.ghostEmpty")}</span>
        </div>
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
    this.overlay = overlay;

    const form = overlay.querySelector("form")!;
    const input = overlay.querySelector<HTMLInputElement>("input[name='playerName']")!;
    const localeSelect = overlay.querySelector<HTMLSelectElement>("select[name='locale']")!;
    const stageSelect = overlay.querySelector<HTMLSelectElement>("select[name='stage']")!;
    const ghostSelect = overlay.querySelector<HTMLSelectElement>("select[name='leaderboardGhost']")!;
    const modeButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-mode]"));
    const soundButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-sound]"));
    const ghostFileInput = overlay.querySelector<HTMLInputElement>("#start-ghost-file")!;
    const ghostStatus = overlay.querySelector<HTMLSpanElement>(".start-ghost-status")!;
    const accountStatus = overlay.querySelector<HTMLSpanElement>(".start-account-status")!;
    const startButton = overlay.querySelector<HTMLButtonElement>(".start-button")!;
    const googleLoginButton = overlay.querySelector<HTMLButtonElement>(".start-google-login")!;
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
    ghostFileInput.addEventListener("keydown", (event) => event.stopPropagation());
    ghostFileInput.addEventListener("keyup", (event) => event.stopPropagation());
    ghostFileInput.addEventListener("keypress", (event) => event.stopPropagation());
    ghostSelect.addEventListener("keydown", (event) => event.stopPropagation());
    ghostSelect.addEventListener("keyup", (event) => event.stopPropagation());
    ghostSelect.addEventListener("keypress", (event) => event.stopPropagation());
    const loadGhostOptions = async () => {
      ghostSelect.innerHTML = `<option value="">${t(this.options.locale, "start.ghostRankingLoading")}</option>`;
      ghostSelect.disabled = true;
      try {
        const options = await this.options.onFetchGhostOptions(selectedStageId);
        ghostSelect.innerHTML = options.length
          ? [
              `<option value="" selected>${t(this.options.locale, "start.ghostRankingSelect")}</option>`,
              ...options.map((option) => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>`),
            ].join("")
          : `<option value="">${t(this.options.locale, "start.ghostRankingEmpty")}</option>`;
        ghostSelect.disabled = options.length === 0;
      } catch (error) {
        console.warn("Could not load leaderboard ghost options.", error);
        ghostSelect.innerHTML = `<option value="">${t(this.options.locale, "start.ghostRankingFailed")}</option>`;
        ghostSelect.disabled = true;
      }
    };
    stageSelect.addEventListener("change", () => {
      selectedStageId = stageSelect.value;
      this.options.stageId = selectedStageId;
      void loadGhostOptions();
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

    soundButtons.forEach((button) => {
      button.addEventListener("click", () => {
        soundOn = button.dataset.sound === "on";
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
          selectedStageId = result.stageId;
          stageSelect.value = result.stageId;
          this.options.stageId = result.stageId;
        }
      } catch (error) {
        console.warn("Could not load ghost replay.", error);
        ghostStatus.textContent = t(this.options.locale, "start.ghostLoadFailed");
        ghostFileInput.value = "";
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
          selectedStageId = result.stageId;
          stageSelect.value = result.stageId;
          this.options.stageId = result.stageId;
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
    refreshAccount();
    void loadGhostOptions();
    input.focus();
    input.select();
  }

  setAccountStatus(status: StartAccountStatus | undefined) {
    this.options.accountStatus = status;
    this.refreshAccountUi?.();
  }

  remove() {
    this.overlay?.remove();
    this.overlay = undefined;
    this.refreshAccountUi = undefined;
    document.getElementById("start-modal")?.remove();
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
