import { LOCALE_OPTIONS, t, type Locale } from "./i18n";
import { canPromptPwaInstall, isPwaInstalled, promptPwaInstall } from "./pwaInstall";

const GAME_LAYOUT_REFRESH_EVENT = "actiongame:refresh-layout";
const PWA_INSTALL_DISMISSED_KEY = "actiongame_pwa_install_dismissed";

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

type StartSettings = { playerName: string; controlMode: ControlMode; stageId: string; soundOn: boolean; locale: Locale };
type OrientationPromptMode = "initial" | "startConfirm";

export class StartModal {
  private readonly options: StartModalOptions;
  private overlay?: HTMLDivElement;
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
    overlay.innerHTML = `
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
      <form class="start-dialog">
        <h1>${t(this.options.locale, "start.title")}</h1>
        <div class="start-primary-panel">
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
        </div>
        <div class="start-choice-panel">
          <div class="mode-row" role="group" aria-label="${t(this.options.locale, "start.controlMode")}">
            <button type="button" data-mode="pc" class="mode-button">${t(this.options.locale, "start.modePc")}</button>
            <button type="button" data-mode="mobile" class="mode-button">${t(this.options.locale, "start.modeMobile")}</button>
          </div>
          <div class="sound-row" role="group" aria-label="${t(this.options.locale, "start.soundSetting")}">
            <button type="button" data-sound="on" class="sound-button">&#128266; ${t(this.options.locale, "start.soundOn")}</button>
            <button type="button" data-sound="off" class="sound-button">&#128263; ${t(this.options.locale, "start.soundOff")}</button>
          </div>
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
    let localGhostFileLoaded = false;
    let orientationPromptMode: OrientationPromptMode = "initial";
    let pendingStartSettings: StartSettings | undefined;

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
      const shouldShow = isProbablySmartphone() && !isPwaInstalled() && getStorageValue(PWA_INSTALL_DISMISSED_KEY) !== "1";
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
      input.focus();
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
    };
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
      const settings = {
        playerName: input.value.trim() || "PLAYER",
        controlMode: selectedMode,
        stageId: selectedStageId,
        soundOn,
        locale: selectedLocale,
      };
      if (shouldSuggestMobileFullscreen() && !this.orientationPromptSatisfied) {
        pendingStartSettings = settings;
        showOrientationPrompt(false, "startConfirm");
        return;
      }
      this.options.onSubmit(settings);
    });

    refreshMode();
    refreshSound();
    refreshAccount();
    refreshInstallPanel();
    void loadGhostOptions();
    showOrientationPrompt();
    if (orientationPrompt.hidden) {
      input.focus();
      input.select();
    }
  }

  setAccountStatus(status: StartAccountStatus | undefined) {
    this.options.accountStatus = status;
    this.refreshAccountUi?.();
  }

  remove() {
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
  if (!isProbablySmartphone()) {
    return false;
  }
  return !isLandscapeViewport() || !document.fullscreenElement;
}

function isProbablySmartphone() {
  const userAgent = navigator.userAgent || "";
  const uaLooksMobile = /Android|iPhone|iPod|Windows Phone|Mobile/i.test(userAgent);
  const hasTouch = navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const longSide = Math.max(window.innerWidth, window.innerHeight);
  return uaLooksMobile || (hasTouch && shortSide <= 560 && longSide <= 980);
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

function isLandscapeViewport() {
  return window.innerWidth > window.innerHeight;
}

async function requestFullscreenAndLandscape() {
  let fullscreenSucceeded = Boolean(document.fullscreenElement);
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
