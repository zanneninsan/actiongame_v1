import { t, type Locale } from "./i18n";

export type MobileInputKey = "w" | "a" | "s" | "d" | "shift";

type FullscreenDocument = Document & {
  msFullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
};

type MobileControlsOptions = {
  locale: Locale;
  onInputChange: (key: MobileInputKey, pressed: boolean) => void;
  onJumpQueued: () => void;
  onRestart: () => void;
  onToggleFullscreen: () => void;
};

const MOBILE_CONTROLS_HINT_STORAGE_KEY = "actiongame_mobile_controls_hint_seen";
const MOBILE_CONTROLS_HINT_MS = 4200;

export const createMobileControls = (options: MobileControlsOptions) => {
  document.getElementById("mobile-controls")?.remove();

  const cleanup: Array<() => void> = [];
  const controls = document.createElement("div");
  controls.id = "mobile-controls";
  controls.innerHTML = `
    <div class="mobile-pad">
      <button class="mobile-button pad-up" data-key="w" type="button" aria-label="${t(options.locale, "aria.jump")}">&uarr;</button>
      <button class="mobile-button dash-button pad-dash-left" data-key="shift" type="button" aria-label="${t(options.locale, "aria.dash")}">DASH</button>
      <button class="mobile-button pad-left" data-key="a" type="button" aria-label="${t(options.locale, "aria.moveLeft")}">&larr;</button>
      <button class="mobile-button pad-down" data-key="s" type="button" aria-label="${t(options.locale, "aria.down")}">&darr;</button>
      <button class="mobile-button pad-right" data-key="d" type="button" aria-label="${t(options.locale, "aria.moveRight")}">&rarr;</button>
    </div>
    <div class="mobile-actions">
      <button class="mobile-button fullscreen-button" data-action="fullscreen" type="button" aria-label="${options.locale === "ja" ? "全画面切り替え" : "Toggle fullscreen"}">FULL</button>
      <button class="mobile-button" data-key="w" type="button" aria-label="${t(options.locale, "aria.jump")}">&uarr;</button>
      <button class="mobile-button dash-button" data-key="shift" type="button" aria-label="${t(options.locale, "aria.dash")}">DASH</button>
      <button class="mobile-button restart-button" data-action="restart" type="button">R</button>
    </div>
  `;
  document.body.appendChild(controls);
  cleanup.push(bindMobileZoomGuards(controls));

  if (shouldShowMobileControlsHint()) {
    controls.classList.add("is-first-run-highlight");
    const clearFirstRunHighlight = () => {
      controls.classList.remove("is-first-run-highlight");
      setMobileControlsHintSeen();
    };
    const hintTimeoutId = window.setTimeout(clearFirstRunHighlight, MOBILE_CONTROLS_HINT_MS);
    controls.addEventListener("pointerdown", clearFirstRunHighlight, { once: true });
    cleanup.push(() => {
      window.clearTimeout(hintTimeoutId);
      controls.removeEventListener("pointerdown", clearFirstRunHighlight);
    });
  }

  const pressedCounts = new Map<MobileInputKey, number>();
  controls.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((button) => {
    const key = button.dataset.key as MobileInputKey;
    cleanup.push(
      bindMobileButton(button, (pressed) => {
        const nextCount = Math.max(0, (pressedCounts.get(key) ?? 0) + (pressed ? 1 : -1));
        pressedCounts.set(key, nextCount);
        options.onInputChange(key, nextCount > 0);
        if (key === "w" && pressed) {
          options.onJumpQueued();
        }
      }),
    );
  });

  const restartButton = controls.querySelector<HTMLButtonElement>("[data-action='restart']");
  if (restartButton) {
    cleanup.push(
      bindMobileButton(restartButton, (pressed) => {
        if (pressed) {
          options.onRestart();
        }
      }),
    );
  }

  const fullscreenButton = controls.querySelector<HTMLButtonElement>("[data-action='fullscreen']");
  if (fullscreenButton) {
    const updateFullscreenButton = () => {
      const fullscreenDocument = document as FullscreenDocument;
      fullscreenButton.classList.toggle(
        "is-active",
        Boolean(document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? fullscreenDocument.msFullscreenElement),
      );
    };
    updateFullscreenButton();
    document.addEventListener("fullscreenchange", updateFullscreenButton);
    document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
    document.addEventListener("MSFullscreenChange", updateFullscreenButton);
    cleanup.push(
      bindMobileButton(fullscreenButton, (pressed) => {
        if (pressed) {
          options.onToggleFullscreen();
        }
      }),
      () => document.removeEventListener("fullscreenchange", updateFullscreenButton),
      () => document.removeEventListener("webkitfullscreenchange", updateFullscreenButton),
      () => document.removeEventListener("MSFullscreenChange", updateFullscreenButton),
    );
  }

  cleanup.push(() => document.getElementById("mobile-controls")?.remove());
  return cleanup;
};

const bindMobileButton = (button: HTMLButtonElement, onPressedChange: (pressed: boolean) => void) => {
  const activePointers = new Set<number>();
  let wasPressed = false;
  const setPressed = (pressed: boolean) => {
    if (wasPressed === pressed) {
      return;
    }
    wasPressed = pressed;
    button.classList.toggle("is-pressed", pressed);
    onPressedChange(pressed);
  };
  const clearPressed = () => {
    activePointers.clear();
    setPressed(false);
  };
  const clearPressedOnVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      clearPressed();
    }
  };
  const press = (event: PointerEvent) => {
    event.preventDefault();
    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      // Some mobile browsers can drop pointer capture during fullscreen or OS gestures.
    }
    activePointers.add(event.pointerId);
    setPressed(true);
  };
  const release = (event: PointerEvent) => {
    const hasPointer = activePointers.has(event.pointerId) || button.hasPointerCapture(event.pointerId);
    if (!hasPointer) {
      return;
    }
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
  window.addEventListener("pointerup", release, { capture: true });
  window.addEventListener("pointercancel", release, { capture: true });
  window.addEventListener("blur", clearPressed);
  window.addEventListener("pagehide", clearPressed);
  window.addEventListener("contextmenu", clearPressed);
  document.addEventListener("visibilitychange", clearPressedOnVisibilityChange);

  return () => {
    clearPressed();
    button.removeEventListener("pointerdown", press);
    button.removeEventListener("pointerup", release);
    button.removeEventListener("pointercancel", release);
    button.removeEventListener("lostpointercapture", release);
    window.removeEventListener("pointerup", release, { capture: true });
    window.removeEventListener("pointercancel", release, { capture: true });
    window.removeEventListener("blur", clearPressed);
    window.removeEventListener("pagehide", clearPressed);
    window.removeEventListener("contextmenu", clearPressed);
    document.removeEventListener("visibilitychange", clearPressedOnVisibilityChange);
  };
};

const bindMobileZoomGuards = (controls: HTMLDivElement) => {
  let lastTouchEndAt = 0;
  const preventDefault = (event: Event) => {
    event.preventDefault();
  };
  const preventFastDoubleTapZoom = (event: TouchEvent) => {
    const now = window.performance.now();
    if (now - lastTouchEndAt < 380) {
      event.preventDefault();
    }
    lastTouchEndAt = now;
  };

  controls.addEventListener("touchend", preventFastDoubleTapZoom, { passive: false });
  document.addEventListener("gesturestart", preventDefault, { passive: false });
  document.addEventListener("gesturechange", preventDefault, { passive: false });
  document.addEventListener("gestureend", preventDefault, { passive: false });

  return () => {
    controls.removeEventListener("touchend", preventFastDoubleTapZoom);
    document.removeEventListener("gesturestart", preventDefault);
    document.removeEventListener("gesturechange", preventDefault);
    document.removeEventListener("gestureend", preventDefault);
  };
};

function shouldShowMobileControlsHint() {
  try {
    return window.localStorage.getItem(MOBILE_CONTROLS_HINT_STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

function setMobileControlsHintSeen() {
  try {
    window.localStorage.setItem(MOBILE_CONTROLS_HINT_STORAGE_KEY, "1");
  } catch {
    // If storage is blocked, the short highlight can safely appear again.
  }
}
