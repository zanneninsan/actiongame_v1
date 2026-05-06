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
const MOBILE_CONTROLS_LAYOUT_STORAGE_KEY = "actiongame_mobile_controls_layout_v1";
const MOBILE_CONTROLS_HINT_MS = 4200;
const MOBILE_LAYOUT_EDGE_PADDING = 8;

type MobileControlLayoutId =
  | "pad-jump"
  | "pad-dash"
  | "pad-left"
  | "pad-down"
  | "pad-right"
  | "fullscreen"
  | "action-jump"
  | "action-dash"
  | "restart";

type MobileControlPosition = {
  x: number;
  y: number;
};

type MobileControlLayout = Partial<Record<MobileControlLayoutId, MobileControlPosition>>;

export const createMobileControls = (options: MobileControlsOptions) => {
  document.getElementById("mobile-controls")?.remove();

  const cleanup: Array<() => void> = [];
  const controls = document.createElement("div");
  controls.id = "mobile-controls";
  controls.innerHTML = `
    <div class="mobile-layout-toolbar" aria-live="polite">
      <span class="mobile-layout-status">${t(options.locale, "mobile.layoutReady")}</span>
      <button class="mobile-layout-button" data-layout-action="edit" type="button">${t(options.locale, "mobile.layoutEdit")}</button>
      <button class="mobile-layout-button" data-layout-action="reset" type="button">${t(options.locale, "mobile.layoutReset")}</button>
    </div>
    <div class="mobile-pad">
      <button class="mobile-button pad-up" data-layout-id="pad-jump" data-key="w" type="button" aria-label="${t(options.locale, "aria.jump")}">&uarr;</button>
      <button class="mobile-button dash-button pad-dash-left" data-layout-id="pad-dash" data-key="shift" type="button" aria-label="${t(options.locale, "aria.dash")}">${t(options.locale, "mobile.dashShort")}</button>
      <button class="mobile-button pad-left" data-layout-id="pad-left" data-key="a" type="button" aria-label="${t(options.locale, "aria.moveLeft")}">&larr;</button>
      <button class="mobile-button pad-down" data-layout-id="pad-down" data-key="s" type="button" aria-label="${t(options.locale, "aria.down")}">&darr;</button>
      <button class="mobile-button pad-right" data-layout-id="pad-right" data-key="d" type="button" aria-label="${t(options.locale, "aria.moveRight")}">&rarr;</button>
    </div>
    <div class="mobile-actions">
      <button class="mobile-button fullscreen-button" data-layout-id="fullscreen" data-action="fullscreen" type="button" aria-label="${t(options.locale, "aria.fullscreen")}">${t(options.locale, "mobile.fullscreenShort")}</button>
      <button class="mobile-button" data-layout-id="action-jump" data-key="w" type="button" aria-label="${t(options.locale, "aria.jump")}">&uarr;</button>
      <button class="mobile-button dash-button" data-layout-id="action-dash" data-key="shift" type="button" aria-label="${t(options.locale, "aria.dash")}">${t(options.locale, "mobile.dashShort")}</button>
      <button class="mobile-button restart-button" data-layout-id="restart" data-action="restart" type="button" aria-label="${t(options.locale, "aria.restart")}">R</button>
    </div>
  `;
  document.body.appendChild(controls);
  cleanup.push(bindMobileZoomGuards(controls));

  let isLayoutEditing = false;
  const status = controls.querySelector<HTMLSpanElement>(".mobile-layout-status");
  const editButton = controls.querySelector<HTMLButtonElement>("[data-layout-action='edit']");
  const resetButton = controls.querySelector<HTMLButtonElement>("[data-layout-action='reset']");
  const updateLayoutToolbar = () => {
    if (status) {
      status.textContent = isLayoutEditing ? t(options.locale, "mobile.layoutEditing") : t(options.locale, "mobile.layoutReady");
    }
    if (editButton) {
      editButton.textContent = isLayoutEditing ? t(options.locale, "mobile.layoutDone") : t(options.locale, "mobile.layoutEdit");
      editButton.classList.toggle("is-active", isLayoutEditing);
    }
  };
  const storedLayout = readMobileControlsLayout();
  if (storedLayout) {
    applyMobileControlsLayout(controls, storedLayout);
  }

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
        if (isLayoutEditing) {
          return;
        }
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
        if (pressed && !isLayoutEditing) {
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
        if (pressed && !isLayoutEditing) {
          options.onToggleFullscreen();
        }
      }),
      () => document.removeEventListener("fullscreenchange", updateFullscreenButton),
      () => document.removeEventListener("webkitfullscreenchange", updateFullscreenButton),
      () => document.removeEventListener("MSFullscreenChange", updateFullscreenButton),
    );
  }

  if (editButton) {
    const toggleLayoutEditing = () => {
      isLayoutEditing = !isLayoutEditing;
      controls.classList.toggle("is-layout-editing", isLayoutEditing);
      controls.classList.remove("is-first-run-highlight");
      if (isLayoutEditing) {
        applyMobileControlsLayout(controls, captureMobileControlsLayout(controls));
      } else {
        saveMobileControlsLayout(captureMobileControlsLayout(controls));
      }
      updateLayoutToolbar();
    };
    editButton.addEventListener("click", toggleLayoutEditing);
    cleanup.push(() => editButton.removeEventListener("click", toggleLayoutEditing));
  }

  if (resetButton) {
    const resetLayout = () => {
      isLayoutEditing = false;
      controls.classList.remove("is-layout-editing", "is-layout-customized");
      clearMobileControlsLayout();
      controls.querySelectorAll<HTMLElement>("[data-layout-id]").forEach((button) => {
        button.style.left = "";
        button.style.top = "";
      });
      updateLayoutToolbar();
    };
    resetButton.addEventListener("click", resetLayout);
    cleanup.push(() => resetButton.removeEventListener("click", resetLayout));
  }

  cleanup.push(bindMobileLayoutDragging(controls));
  updateLayoutToolbar();

  cleanup.push(() => document.getElementById("mobile-controls")?.remove());
  return cleanup;
};

const bindMobileLayoutDragging = (controls: HTMLDivElement) => {
  const cleanup: Array<() => void> = [];
  controls.querySelectorAll<HTMLButtonElement>("[data-layout-id]").forEach((button) => {
    let pointerId: number | undefined;
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;

    const moveButton = (clientX: number, clientY: number) => {
      const controlsRect = controls.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const minX = MOBILE_LAYOUT_EDGE_PADDING;
      const minY = MOBILE_LAYOUT_EDGE_PADDING;
      const maxX = Math.max(minX, controlsRect.width - buttonRect.width - MOBILE_LAYOUT_EDGE_PADDING);
      const maxY = Math.max(minY, controlsRect.height - buttonRect.height - MOBILE_LAYOUT_EDGE_PADDING);
      const nextX = Math.min(maxX, Math.max(minX, clientX - controlsRect.left - pointerOffsetX));
      const nextY = Math.min(maxY, Math.max(minY, clientY - controlsRect.top - pointerOffsetY));
      button.style.left = `${nextX}px`;
      button.style.top = `${nextY}px`;
    };

    const startDrag = (event: PointerEvent) => {
      if (!controls.classList.contains("is-layout-editing")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      applyMobileControlsLayout(controls, captureMobileControlsLayout(controls));
      pointerId = event.pointerId;
      const buttonRect = button.getBoundingClientRect();
      pointerOffsetX = event.clientX - buttonRect.left;
      pointerOffsetY = event.clientY - buttonRect.top;
      button.classList.add("is-layout-dragging");
      button.setPointerCapture(event.pointerId);
    };
    const drag = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      moveButton(event.clientX, event.clientY);
    };
    const endDrag = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
      pointerId = undefined;
      button.classList.remove("is-layout-dragging");
      saveMobileControlsLayout(captureMobileControlsLayout(controls));
    };

    button.addEventListener("pointerdown", startDrag);
    button.addEventListener("pointermove", drag);
    button.addEventListener("pointerup", endDrag);
    button.addEventListener("pointercancel", endDrag);
    cleanup.push(() => button.removeEventListener("pointerdown", startDrag));
    cleanup.push(() => button.removeEventListener("pointermove", drag));
    cleanup.push(() => button.removeEventListener("pointerup", endDrag));
    cleanup.push(() => button.removeEventListener("pointercancel", endDrag));
  });

  return () => cleanup.forEach((remove) => remove());
};

const captureMobileControlsLayout = (controls: HTMLDivElement): MobileControlLayout => {
  const controlsRect = controls.getBoundingClientRect();
  const layout: MobileControlLayout = {};
  controls.querySelectorAll<HTMLElement>("[data-layout-id]").forEach((button) => {
    const layoutId = button.dataset.layoutId as MobileControlLayoutId | undefined;
    if (!layoutId || controlsRect.width <= 0 || controlsRect.height <= 0) {
      return;
    }
    const rect = button.getBoundingClientRect();
    layout[layoutId] = {
      x: (rect.left - controlsRect.left) / controlsRect.width,
      y: (rect.top - controlsRect.top) / controlsRect.height,
    };
  });
  return layout;
};

const applyMobileControlsLayout = (controls: HTMLDivElement, layout: MobileControlLayout) => {
  const controlsRect = controls.getBoundingClientRect();
  if (controlsRect.width <= 0 || controlsRect.height <= 0) {
    return;
  }
  controls.classList.add("is-layout-customized");
  controls.querySelectorAll<HTMLElement>("[data-layout-id]").forEach((button) => {
    const layoutId = button.dataset.layoutId as MobileControlLayoutId | undefined;
    const position = layoutId ? layout[layoutId] : undefined;
    if (!position) {
      return;
    }
    const buttonRect = button.getBoundingClientRect();
    const maxX = Math.max(MOBILE_LAYOUT_EDGE_PADDING, controlsRect.width - buttonRect.width - MOBILE_LAYOUT_EDGE_PADDING);
    const maxY = Math.max(MOBILE_LAYOUT_EDGE_PADDING, controlsRect.height - buttonRect.height - MOBILE_LAYOUT_EDGE_PADDING);
    const nextX = Math.min(maxX, Math.max(MOBILE_LAYOUT_EDGE_PADDING, position.x * controlsRect.width));
    const nextY = Math.min(maxY, Math.max(MOBILE_LAYOUT_EDGE_PADDING, position.y * controlsRect.height));
    button.style.left = `${nextX}px`;
    button.style.top = `${nextY}px`;
  });
};

const readMobileControlsLayout = (): MobileControlLayout | undefined => {
  try {
    const rawLayout = window.localStorage.getItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY);
    if (!rawLayout) {
      return undefined;
    }
    const parsed = JSON.parse(rawLayout) as MobileControlLayout;
    if (!parsed || typeof parsed !== "object") {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
};

const saveMobileControlsLayout = (layout: MobileControlLayout) => {
  try {
    window.localStorage.setItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // The default fixed layout still works when storage is unavailable.
  }
};

const clearMobileControlsLayout = () => {
  try {
    window.localStorage.removeItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY);
  } catch {
    // Ignore storage failures; the current DOM reset already restored defaults.
  }
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
