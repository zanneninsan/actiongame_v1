import { t, type Locale } from "./i18n";

export type MobileInputKey = "w" | "a" | "s" | "d" | "shift";
export const MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT = "actiongame:mobile-controls-layout-request";

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
  onLayoutEditStart?: () => void;
  onLayoutEditFinish?: () => void;
};

const MOBILE_CONTROLS_HINT_STORAGE_KEY = "actiongame_mobile_controls_hint_seen";
const MOBILE_CONTROLS_LAYOUT_STORAGE_KEY = "actiongame_mobile_controls_layout_v1";
const MOBILE_CONTROLS_LAYOUT_SETUP_STORAGE_KEY = "actiongame_mobile_controls_layout_setup_seen";
const MOBILE_CONTROLS_HINT_MS = 4200;
const MOBILE_LAYOUT_EDGE_PADDING = 8;
const MOBILE_JOYSTICK_ACTIVATION_RATIO = 0.28;
const MOBILE_JOYSTICK_DIAGONAL_RATIO = 0.38;
const MOBILE_INPUT_KEYS: MobileInputKey[] = ["w", "a", "s", "d", "shift"];

type MobileControlLayoutId =
  | "joystick"
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
    <div class="mobile-layout-panel" aria-live="polite">
      <strong>${t(options.locale, "mobile.layoutTitle")}</strong>
      <span class="mobile-layout-status">${t(options.locale, "mobile.layoutReady")}</span>
      <div class="mobile-layout-actions">
        <button class="mobile-layout-button is-active" data-layout-action="done" type="button">${t(options.locale, "mobile.layoutDone")}</button>
        <button class="mobile-layout-button" data-layout-action="reset" type="button">${t(options.locale, "mobile.layoutReset")}</button>
      </div>
    </div>
    <div class="mobile-pad" data-layout-id="joystick" data-joystick="movement" role="group" aria-label="${t(options.locale, "aria.mobileJoystick")}">
      <div class="mobile-joystick-ring">
        <div class="mobile-joystick-cross" aria-hidden="true"></div>
        <div class="mobile-joystick-knob" aria-hidden="true"></div>
      </div>
    </div>
    <div class="mobile-actions">
      <button class="mobile-button fullscreen-button" data-layout-id="fullscreen" data-action="fullscreen" type="button" aria-label="${t(options.locale, "aria.fullscreen")}">${t(options.locale, "mobile.fullscreenShort")}</button>
      <button class="mobile-button action-jump-button" data-layout-id="action-jump" data-key="w" type="button" aria-label="${t(options.locale, "aria.jump")}">&uarr;</button>
      <button class="mobile-button dash-button" data-layout-id="action-dash" data-key="shift" type="button" aria-label="${t(options.locale, "aria.dash")}">${t(options.locale, "mobile.dashShort")}</button>
      <button class="mobile-button restart-button" data-layout-id="restart" data-action="restart" type="button" aria-label="${t(options.locale, "aria.restart")}">R</button>
    </div>
  `;
  document.body.appendChild(controls);
  cleanup.push(bindMobileZoomGuards(controls));

  let isLayoutEditing = false;
  const status = controls.querySelector<HTMLSpanElement>(".mobile-layout-status");
  const doneButton = controls.querySelector<HTMLButtonElement>("[data-layout-action='done']");
  const resetButton = controls.querySelector<HTMLButtonElement>("[data-layout-action='reset']");
  const updateLayoutToolbar = () => {
    if (status) {
      status.textContent = isLayoutEditing ? t(options.locale, "mobile.layoutEditing") : t(options.locale, "mobile.layoutReady");
    }
  };
  const startLayoutEditing = () => {
    if (!isLayoutEditing) {
      options.onLayoutEditStart?.();
    }
    isLayoutEditing = true;
    touchInput.clearInput();
    clearPointerInput();
    controls.classList.add("is-layout-editing", "is-layout-setup-open");
    controls.classList.remove("is-first-run-highlight");
    applyMobileControlsLayout(controls, captureMobileControlsLayout(controls));
    updateLayoutToolbar();
  };
  const finishLayoutEditing = () => {
    isLayoutEditing = false;
    touchInput.clearInput();
    clearPointerInput();
    controls.classList.remove("is-layout-editing", "is-layout-setup-open");
    saveMobileControlsLayout(captureMobileControlsLayout(controls));
    setMobileControlsLayoutSetupSeen();
    updateLayoutToolbar();
    options.onLayoutEditFinish?.();
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

  const touchInput = bindTouchDrivenMobileControls(controls, options, () => isLayoutEditing);
  cleanup.push(touchInput.cleanup);

  const pointerPressedCounts = new Map<MobileInputKey, number>();
  const clearPointerInput = () => {
    pointerPressedCounts.clear();
    MOBILE_INPUT_KEYS.forEach((key) => options.onInputChange(key, false));
  };
  controls.querySelectorAll<HTMLButtonElement>(".mobile-button[data-key]").forEach((button) => {
    const key = button.dataset.key as MobileInputKey;
    cleanup.push(
      bindMobileButton(button, (pressed) => {
        if (isLayoutEditing) {
          return;
        }
        const nextCount = Math.max(0, (pointerPressedCounts.get(key) ?? 0) + (pressed ? 1 : -1));
        pointerPressedCounts.set(key, nextCount);
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

  if (doneButton) {
    doneButton.addEventListener("click", finishLayoutEditing);
    cleanup.push(() => doneButton.removeEventListener("click", finishLayoutEditing));
  }

  if (resetButton) {
    const resetLayout = () => {
      isLayoutEditing = true;
      controls.classList.remove("is-layout-editing", "is-layout-customized");
      clearMobileControlsLayout();
      controls.querySelectorAll<HTMLElement>("[data-layout-id]").forEach((button) => {
        button.style.left = "";
        button.style.top = "";
      });
      startLayoutEditing();
      updateLayoutToolbar();
    };
    resetButton.addEventListener("click", resetLayout);
    cleanup.push(() => resetButton.removeEventListener("click", resetLayout));
  }

  const openLayoutFromMenu = () => startLayoutEditing();
  window.addEventListener(MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT, openLayoutFromMenu);
  cleanup.push(() => window.removeEventListener(MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT, openLayoutFromMenu));
  cleanup.push(bindMobileLayoutDragging(controls));
  if (shouldShowMobileControlsLayoutSetup()) {
    window.setTimeout(startLayoutEditing, 0);
  }
  updateLayoutToolbar();

  cleanup.push(() => document.getElementById("mobile-controls")?.remove());
  return cleanup;
};

const bindMobileLayoutDragging = (controls: HTMLDivElement) => {
  const cleanup: Array<() => void> = [];
  controls.querySelectorAll<HTMLElement>("[data-layout-id]").forEach((button) => {
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

const bindTouchDrivenMobileControls = (
  controls: HTMLDivElement,
  options: MobileControlsOptions,
  isLayoutEditing: () => boolean,
) => {
  const joystick = controls.querySelector<HTMLElement>("[data-joystick='movement']");
  const joystickKnob = joystick?.querySelector<HTMLElement>(".mobile-joystick-knob");
  const keyButtons = Array.from(controls.querySelectorAll<HTMLButtonElement>(".mobile-button[data-key]")).map((button) => ({
    button,
    key: button.dataset.key as MobileInputKey,
  }));
  const actionButtons = Array.from(controls.querySelectorAll<HTMLButtonElement>("[data-action]")).map((button) => ({
    action: button.dataset.action,
    button,
  }));
  const pressedKeys = new Set<MobileInputKey>();
  const activeActionTouches = new Map<number, string>();
  const activeControlTouchIds = new Set<number>();

  const setKeyPressed = (key: MobileInputKey, pressed: boolean) => {
    const wasPressed = pressedKeys.has(key);
    if (wasPressed === pressed) {
      return;
    }
    if (pressed) {
      pressedKeys.add(key);
      if (key === "w") {
        options.onJumpQueued();
      }
    } else {
      pressedKeys.delete(key);
    }
    options.onInputChange(key, pressed);
  };

  const clearInput = () => {
    keyButtons.forEach(({ button }) => button.classList.remove("is-pressed"));
    actionButtons.forEach(({ button }) => button.classList.remove("is-pressed"));
    joystick?.classList.remove("is-pressed");
    joystickKnob?.style.removeProperty("--joystick-x");
    joystickKnob?.style.removeProperty("--joystick-y");
    MOBILE_INPUT_KEYS.forEach((key) => setKeyPressed(key, false));
    activeActionTouches.clear();
    activeControlTouchIds.clear();
  };

  const findButtonAt = <T extends { button: HTMLButtonElement }>(buttons: T[], touch: Touch) =>
    buttons.find(({ button }) => isPointInsideRect(touch.clientX, touch.clientY, button.getBoundingClientRect()));

  const rebuildFromTouches = (touches: Touch[]) => {
    if (isLayoutEditing()) {
      clearInput();
      return;
    }

    const nextKeys = new Set<MobileInputKey>();
    const pressedButtons = new Set<HTMLButtonElement>();
    const activeTouchIds = new Set<number>();
    let joystickTouch: Touch | undefined;

    touches.forEach((touch) => {
      activeTouchIds.add(touch.identifier);
      if (joystick && isPointInsideRect(touch.clientX, touch.clientY, joystick.getBoundingClientRect())) {
        joystickTouch ??= touch;
      }
      const keyHit = findButtonAt(keyButtons, touch);
      if (keyHit) {
        nextKeys.add(keyHit.key);
        pressedButtons.add(keyHit.button);
      }

      const actionHit = findButtonAt(actionButtons, touch);
      if (!actionHit?.action) {
        activeActionTouches.delete(touch.identifier);
        return;
      }

      pressedButtons.add(actionHit.button);
      if (activeActionTouches.get(touch.identifier) === actionHit.action) {
        return;
      }

      activeActionTouches.set(touch.identifier, actionHit.action);
      if (actionHit.action === "restart") {
        options.onRestart();
      } else if (actionHit.action === "fullscreen") {
        options.onToggleFullscreen();
      }
    });

    Array.from(activeActionTouches.keys()).forEach((touchId) => {
      if (!activeTouchIds.has(touchId)) {
        activeActionTouches.delete(touchId);
      }
    });

    if (joystick && joystickTouch) {
      applyJoystickTouch(joystick, joystickKnob, joystickTouch, nextKeys);
    } else {
      joystick?.classList.remove("is-pressed");
      joystickKnob?.style.removeProperty("--joystick-x");
      joystickKnob?.style.removeProperty("--joystick-y");
    }

    keyButtons.forEach(({ button }) => button.classList.toggle("is-pressed", pressedButtons.has(button)));
    actionButtons.forEach(({ button }) => button.classList.toggle("is-pressed", pressedButtons.has(button)));
    MOBILE_INPUT_KEYS.forEach((key) => setKeyPressed(key, nextKeys.has(key)));
  };

  const handleTouchStart = (event: TouchEvent) => {
    if (isToolbarTouchEvent(event)) {
      return;
    }
    const startedControlTouches = Array.from(event.changedTouches).filter(isControlButtonTouch);
    if (startedControlTouches.length <= 0) {
      return;
    }
    startedControlTouches.forEach((touch) => activeControlTouchIds.add(touch.identifier));
    controls.classList.remove("is-first-run-highlight");
    event.preventDefault();
    rebuildFromTouches(getActiveControlTouches(event.touches, activeControlTouchIds));
  };
  const handleTouchChange = (event: TouchEvent) => {
    const hadActiveControlTouch = Array.from(event.changedTouches).some((touch) => activeControlTouchIds.has(touch.identifier));
    const activeTouches = getActiveControlTouches(event.touches, activeControlTouchIds);
    if (!hadActiveControlTouch && activeTouches.length <= 0) {
      return;
    }

    event.preventDefault();
    rebuildFromTouches(activeTouches);
    Array.from(activeControlTouchIds).forEach((touchId) => {
      if (!activeTouches.some((touch) => touch.identifier === touchId)) {
        activeControlTouchIds.delete(touchId);
      }
    });
  };
  const clearOnVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      clearInput();
    }
  };

  controls.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("touchmove", handleTouchChange, { passive: false, capture: true });
  document.addEventListener("touchend", handleTouchChange, { passive: false, capture: true });
  document.addEventListener("touchcancel", handleTouchChange, { passive: false, capture: true });
  window.addEventListener("blur", clearInput);
  window.addEventListener("pagehide", clearInput);
  window.addEventListener("orientationchange", clearInput);
  window.addEventListener("resize", clearInput);
  window.addEventListener("fullscreenchange", clearInput);
  window.addEventListener("webkitfullscreenchange", clearInput);
  window.addEventListener("MSFullscreenChange", clearInput);
  window.addEventListener("contextmenu", clearInput);
  document.addEventListener("visibilitychange", clearOnVisibilityChange);

  return {
    cleanup: () => {
      clearInput();
      controls.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchChange, { capture: true });
      document.removeEventListener("touchend", handleTouchChange, { capture: true });
      document.removeEventListener("touchcancel", handleTouchChange, { capture: true });
      window.removeEventListener("blur", clearInput);
      window.removeEventListener("pagehide", clearInput);
      window.removeEventListener("orientationchange", clearInput);
      window.removeEventListener("resize", clearInput);
      window.removeEventListener("fullscreenchange", clearInput);
      window.removeEventListener("webkitfullscreenchange", clearInput);
      window.removeEventListener("MSFullscreenChange", clearInput);
      window.removeEventListener("contextmenu", clearInput);
      document.removeEventListener("visibilitychange", clearOnVisibilityChange);
    },
    clearInput,
  };
};

const isPointInsideRect = (x: number, y: number, rect: DOMRect) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

const isToolbarTouchEvent = (event: TouchEvent) => {
  const touches = Array.from(event.changedTouches);
  return touches.length > 0 && touches.every((touch) => touch.target instanceof Element && Boolean(touch.target.closest(".mobile-layout-panel")));
};

const isControlButtonTouch = (touch: Touch) =>
  touch.target instanceof Element &&
  Boolean(touch.target.closest("#mobile-controls .mobile-button") || touch.target.closest("#mobile-controls [data-joystick='movement']"));

const getActiveControlTouches = (touches: TouchList, activeControlTouchIds: Set<number>) =>
  Array.from(touches).filter((touch) => activeControlTouchIds.has(touch.identifier));

const applyJoystickTouch = (
  joystick: HTMLElement,
  joystickKnob: HTMLElement | null | undefined,
  touch: Touch,
  nextKeys: Set<MobileInputKey>,
) => {
  const rect = joystick.getBoundingClientRect();
  const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const rawX = (touch.clientX - centerX) / radius;
  const rawY = (touch.clientY - centerY) / radius;
  const distance = Math.hypot(rawX, rawY);
  const clamp = distance > 1 ? 1 / distance : 1;
  const x = rawX * clamp;
  const y = rawY * clamp;
  joystick.classList.add("is-pressed");
  joystickKnob?.style.setProperty("--joystick-x", `${x * 46}%`);
  joystickKnob?.style.setProperty("--joystick-y", `${y * 46}%`);

  if (Math.abs(x) >= MOBILE_JOYSTICK_ACTIVATION_RATIO && Math.abs(x) >= Math.abs(y) * MOBILE_JOYSTICK_DIAGONAL_RATIO) {
    nextKeys.add(x < 0 ? "a" : "d");
  }
  if (Math.abs(y) >= MOBILE_JOYSTICK_ACTIVATION_RATIO && Math.abs(y) >= Math.abs(x) * MOBILE_JOYSTICK_DIAGONAL_RATIO) {
    nextKeys.add(y < 0 ? "w" : "s");
  }
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
    if (event.pointerType === "touch") {
      return;
    }
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
    if (event.pointerType === "touch") {
      return;
    }
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

export function shouldShowMobileControlsLayoutSetup() {
  try {
    return window.localStorage.getItem(MOBILE_CONTROLS_LAYOUT_SETUP_STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

function setMobileControlsLayoutSetupSeen() {
  try {
    window.localStorage.setItem(MOBILE_CONTROLS_LAYOUT_SETUP_STORAGE_KEY, "1");
  } catch {
    // If storage is blocked, the layout setup can safely appear again.
  }
}
