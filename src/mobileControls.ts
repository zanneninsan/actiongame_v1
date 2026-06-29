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
const MOBILE_CONTROL_SCALE_CSS_VAR = "--mobile-control-scale";
const MOBILE_CONTROL_SCALE_MIN = 0.7;
const MOBILE_CONTROL_SCALE_MAX = 1.45;
const MOBILE_CONTROL_SCALE_STEP = 5;
const MOBILE_CONTROL_SCALE_DEFAULT = 1;
const MOBILE_CONTROLS_LAYOUT_STORAGE_VERSION = 3;
const GAME_CANVAS_WIDTH = 1280;
const GAME_CANVAS_HEIGHT = 720;
const CANVAS_GLOBAL_HUD_SAFE_MARGIN = 10;
const CANVAS_GLOBAL_HUD_RESERVED_RECT = {
  left: 1130,
  top: 14,
  right: 1251,
  bottom: 58,
} as const;

type MobileControlLayoutId =
  | "joystick"
  | "fullscreen"
  | "action-jump"
  | "action-dash"
  | "restart";

type MobileControlPosition = {
  x: number;
  y: number;
  scale: number;
};

type MobileControlLayout = Partial<Record<MobileControlLayoutId, MobileControlPosition>>;

type MobileControlLayoutStoragePayload = {
  v: number;
  layout: MobileControlLayout;
};

const clampMobileControlScale = (value: number) =>
  Math.min(MOBILE_CONTROL_SCALE_MAX, Math.max(MOBILE_CONTROL_SCALE_MIN, Number.isFinite(value) ? value : MOBILE_CONTROL_SCALE_DEFAULT));

const getMobileControlScaleFromElement = (button: HTMLElement | null) => {
  if (!button) {
    return MOBILE_CONTROL_SCALE_DEFAULT;
  }
  const rawScale = button.style.getPropertyValue(MOBILE_CONTROL_SCALE_CSS_VAR) || button.dataset.layoutScale || "";
  const numericScale = Number.parseFloat(rawScale);
  return clampMobileControlScale(Number.isFinite(numericScale) ? numericScale : MOBILE_CONTROL_SCALE_DEFAULT);
};

const setMobileControlScaleOnElement = (button: HTMLElement, value: number) => {
  const nextScale = clampMobileControlScale(value);
  button.style.setProperty(MOBILE_CONTROL_SCALE_CSS_VAR, `${nextScale}`);
  button.dataset.layoutScale = `${nextScale}`;
};

export const createMobileControls = (options: MobileControlsOptions) => {
  document.getElementById("mobile-controls")?.remove();

  const cleanup: Array<() => void> = [];
  const controls = document.createElement("div");
  controls.id = "mobile-controls";
  controls.innerHTML = `
    <div class="mobile-layout-panel" aria-live="polite">
      <strong>${t(options.locale, "mobile.layoutTitle")}</strong>
      <span class="mobile-layout-status">${t(options.locale, "mobile.layoutReady")}</span>
      <div class="mobile-layout-size-controls">
        <label class="mobile-layout-size-label" for="mobile-control-size-range">${t(options.locale, "mobile.layoutScale")}</label>
        <div class="mobile-layout-size-row">
          <button class="mobile-layout-size-button" data-layout-size-action="decrease" type="button">-</button>
          <input id="mobile-control-size-range" class="mobile-layout-size-slider" type="range" min="${Math.round(MOBILE_CONTROL_SCALE_MIN * 100)}" max="${Math.round(MOBILE_CONTROL_SCALE_MAX * 100)}" step="${MOBILE_CONTROL_SCALE_STEP}" value="${Math.round(MOBILE_CONTROL_SCALE_DEFAULT * 100)}" />
          <button class="mobile-layout-size-button" data-layout-size-action="increase" type="button">+</button>
        </div>
        <div class="mobile-layout-size-meta">
          <span class="mobile-layout-size-value" aria-live="polite">100%</span>
          <span class="mobile-layout-size-hint">${t(options.locale, "mobile.layoutScaleHint")}</span>
        </div>
      </div>
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
  const scaleRange = controls.querySelector<HTMLInputElement>("#mobile-control-size-range");
  const scaleDecreaseButton = controls.querySelector<HTMLButtonElement>("[data-layout-size-action='decrease']");
  const scaleIncreaseButton = controls.querySelector<HTMLButtonElement>("[data-layout-size-action='increase']");
  const scaleValue = controls.querySelector<HTMLSpanElement>(".mobile-layout-size-value");
  let selectedLayoutId: MobileControlLayoutId = "joystick";

  const getSelectedControlElement = (layoutId = selectedLayoutId): HTMLElement | null =>
    controls.querySelector<HTMLElement>(`[data-layout-id='${layoutId}']`);

  const updateScaleHint = () => {
    controls.querySelectorAll<HTMLElement>(".mobile-pad, .mobile-button").forEach((button) => {
      button.classList.toggle("is-layout-selected", button.dataset.layoutId === selectedLayoutId);
    });

    const selectedElement = getSelectedControlElement();
    const selectedScale = getMobileControlScaleFromElement(selectedElement);
    const percent = Math.round(selectedScale * 100);
    if (scaleRange) {
      scaleRange.value = String(percent);
      scaleRange.disabled = !isLayoutEditing;
    }
    if (scaleValue) {
      scaleValue.textContent = `${percent}%`;
    }
  };

  const setSelectedLayoutControl = (nextLayoutId: MobileControlLayoutId) => {
    if (!isMobileControlLayoutId(nextLayoutId)) {
      return;
    }
    selectedLayoutId = nextLayoutId;
    updateScaleHint();
  };

  const applyScaleToSelectedControl = (value: number) => {
    const selectedElement = getSelectedControlElement();
    if (!selectedElement || !isLayoutEditing) {
      return;
    }
    setMobileControlScaleOnElement(selectedElement, value);
    updateScaleHint();
    saveMobileControlsLayout(captureMobileControlsLayout(controls));
  };

  const onScaleAdjust = (delta: number) => {
    if (!scaleRange) {
      return;
    }
    const next = clampMobileControlScale((Number.parseFloat(scaleRange.value) + delta) / 100);
    applyScaleToSelectedControl(next);
  };

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
    setSelectedLayoutControl("joystick");
    applyMobileControlsLayout(controls, captureMobileControlsLayout(controls));
    if (scaleRange) {
      scaleRange.disabled = false;
    }
    updateLayoutToolbar();
  };
  let storedLayout = readMobileControlsLayout();
  const applyStoredLayoutIfConfigured = () => {
    const currentLayout = storedLayout;
    if (isLayoutEditing || !currentLayout) {
      return;
    }
    window.requestAnimationFrame(() => {
      applyMobileControlsLayout(controls, currentLayout);
      updateScaleHint();
    });
  };

  const finishLayoutEditing = () => {
    isLayoutEditing = false;
    touchInput.clearInput();
    clearPointerInput();
    controls.classList.remove("is-layout-editing", "is-layout-setup-open");
    storedLayout = captureMobileControlsLayout(controls);
    applyMobileControlsLayout(controls, storedLayout);
    storedLayout = captureMobileControlsLayout(controls);
    saveMobileControlsLayout(storedLayout);
    setMobileControlsLayoutSetupSeen();
    if (scaleRange) {
      scaleRange.disabled = true;
    }
    updateLayoutToolbar();
    options.onLayoutEditFinish?.();
  };

  if (storedLayout) {
    applyStoredLayoutIfConfigured();
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
      storedLayout = undefined;
      controls.querySelectorAll<HTMLElement>("[data-layout-id]").forEach((button) => {
        button.style.left = "";
        button.style.top = "";
        button.style.removeProperty(MOBILE_CONTROL_SCALE_CSS_VAR);
        delete button.dataset.layoutScale;
      });
      startLayoutEditing();
      updateLayoutToolbar();
    };
    resetButton.addEventListener("click", resetLayout);
    cleanup.push(() => resetButton.removeEventListener("click", resetLayout));
  }

  if (scaleRange) {
    const onScaleRangeInput = () => {
      applyScaleToSelectedControl(Number.parseFloat(scaleRange.value) / 100);
    };
    scaleRange.addEventListener("input", onScaleRangeInput);
    cleanup.push(() => scaleRange.removeEventListener("input", onScaleRangeInput));
  }

  if (scaleDecreaseButton) {
    const onScaleDecrease = () => onScaleAdjust(-MOBILE_CONTROL_SCALE_STEP);
    scaleDecreaseButton.addEventListener("click", onScaleDecrease);
    cleanup.push(() => scaleDecreaseButton.removeEventListener("click", onScaleDecrease));
  }

  if (scaleIncreaseButton) {
    const onScaleIncrease = () => onScaleAdjust(MOBILE_CONTROL_SCALE_STEP);
    scaleIncreaseButton.addEventListener("click", onScaleIncrease);
    cleanup.push(() => scaleIncreaseButton.removeEventListener("click", onScaleIncrease));
  }

  const openLayoutFromMenu = () => startLayoutEditing();
  window.addEventListener(MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT, openLayoutFromMenu);
  window.addEventListener("orientationchange", applyStoredLayoutIfConfigured);
  window.addEventListener("resize", applyStoredLayoutIfConfigured);
  cleanup.push(() => window.removeEventListener(MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT, openLayoutFromMenu));
  cleanup.push(() => window.removeEventListener("orientationchange", applyStoredLayoutIfConfigured));
  cleanup.push(() => window.removeEventListener("resize", applyStoredLayoutIfConfigured));
  cleanup.push(bindMobileLayoutDragging(controls, setSelectedLayoutControl));
  if (shouldShowMobileControlsLayoutSetup()) {
    window.setTimeout(startLayoutEditing, 0);
  }
  updateScaleHint();
  updateLayoutToolbar();

  cleanup.push(() => document.getElementById("mobile-controls")?.remove());
  return cleanup;
};

const bindMobileLayoutDragging = (
  controls: HTMLDivElement,
  onSelectControl: (layoutId: MobileControlLayoutId) => void,
) => {
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
      const layoutId = button.dataset.layoutId;
      if (layoutId) {
        onSelectControl(layoutId as MobileControlLayoutId);
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
  const activeJoystickTouchIds = new Set<number>();
  const activeJumpButtonTouches = new Set<number>();

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
    activeJoystickTouchIds.clear();
    activeJumpButtonTouches.clear();
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
      const isJoystickTouch = activeJoystickTouchIds.has(touch.identifier);
      if (isJoystickTouch) {
        joystickTouch ??= touch;
        return;
      }
      if (joystick && isPointInsideRect(touch.clientX, touch.clientY, joystick.getBoundingClientRect())) {
        joystickTouch ??= touch;
        activeJoystickTouchIds.add(touch.identifier);
        return;
      }
      const keyHit = findButtonAt(keyButtons, touch);
      if (keyHit) {
        nextKeys.add(keyHit.key);
        pressedButtons.add(keyHit.button);
        if (keyHit.key === "w" && !activeJumpButtonTouches.has(touch.identifier)) {
          activeJumpButtonTouches.add(touch.identifier);
          options.onJumpQueued();
        }
      } else {
        activeJumpButtonTouches.delete(touch.identifier);
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
    Array.from(activeJoystickTouchIds).forEach((touchId) => {
      if (!activeTouchIds.has(touchId)) {
        activeJoystickTouchIds.delete(touchId);
      }
    });
    Array.from(activeJumpButtonTouches).forEach((touchId) => {
      if (!activeTouchIds.has(touchId)) {
        activeJumpButtonTouches.delete(touchId);
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
    startedControlTouches.forEach((touch) => {
      activeControlTouchIds.add(touch.identifier);
      if (isJoystickTouch(touch)) {
        activeJoystickTouchIds.add(touch.identifier);
      }
    });
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
        activeJoystickTouchIds.delete(touchId);
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

const isJoystickTouch = (touch: Touch) =>
  touch.target instanceof Element && Boolean(touch.target.closest("#mobile-controls [data-joystick='movement']"));

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
      scale: getMobileControlScaleFromElement(button),
    };
  });
  return layout;
};

type ViewportRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const doRectsOverlap = (a: ViewportRect, b: ViewportRect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const getCanvasGlobalHudReservedRect = (controlsRect: DOMRect): ViewportRect | undefined => {
  const canvas = document.querySelector<HTMLCanvasElement>("#game canvas");
  const canvasRect = canvas?.getBoundingClientRect();
  if (!canvasRect || canvasRect.width <= 0 || canvasRect.height <= 0) {
    return undefined;
  }

  const left =
    canvasRect.left +
    (CANVAS_GLOBAL_HUD_RESERVED_RECT.left / GAME_CANVAS_WIDTH) * canvasRect.width -
    CANVAS_GLOBAL_HUD_SAFE_MARGIN;
  const top =
    canvasRect.top +
    (CANVAS_GLOBAL_HUD_RESERVED_RECT.top / GAME_CANVAS_HEIGHT) * canvasRect.height -
    CANVAS_GLOBAL_HUD_SAFE_MARGIN;
  const right =
    canvasRect.left +
    (CANVAS_GLOBAL_HUD_RESERVED_RECT.right / GAME_CANVAS_WIDTH) * canvasRect.width +
    CANVAS_GLOBAL_HUD_SAFE_MARGIN;
  const bottom =
    canvasRect.top +
    (CANVAS_GLOBAL_HUD_RESERVED_RECT.bottom / GAME_CANVAS_HEIGHT) * canvasRect.height +
    CANVAS_GLOBAL_HUD_SAFE_MARGIN;

  return {
    left: Math.max(controlsRect.left + MOBILE_LAYOUT_EDGE_PADDING, left),
    top: Math.max(controlsRect.top + MOBILE_LAYOUT_EDGE_PADDING, top),
    right: Math.min(controlsRect.right - MOBILE_LAYOUT_EDGE_PADDING, right),
    bottom: Math.min(controlsRect.bottom - MOBILE_LAYOUT_EDGE_PADDING, bottom),
  };
};

const avoidCanvasGlobalHud = (
  x: number,
  y: number,
  width: number,
  height: number,
  controlsRect: DOMRect,
): { x: number; y: number } => {
  if (controlsRect.width <= 0 || controlsRect.height <= 0) {
    return { x, y };
  }
  const reservedRect = getCanvasGlobalHudReservedRect(controlsRect);
  if (!reservedRect) {
    return { x, y };
  }

  const controlRect = {
    left: controlsRect.left + x,
    top: controlsRect.top + y,
    right: controlsRect.left + x + width,
    bottom: controlsRect.top + y + height,
  };
  if (!doRectsOverlap(controlRect, reservedRect)) {
    return { x, y };
  }

  const minX = MOBILE_LAYOUT_EDGE_PADDING;
  const minY = MOBILE_LAYOUT_EDGE_PADDING;
  const maxX = Math.max(minX, controlsRect.width - width - MOBILE_LAYOUT_EDGE_PADDING);
  const maxY = Math.max(minY, controlsRect.height - height - MOBILE_LAYOUT_EDGE_PADDING);
  const belowReservedY = reservedRect.bottom - controlsRect.top + MOBILE_LAYOUT_EDGE_PADDING;
  if (belowReservedY <= maxY) {
    return { x, y: Math.min(maxY, Math.max(minY, belowReservedY)) };
  }

  const leftOfReservedX = reservedRect.left - controlsRect.left - width - MOBILE_LAYOUT_EDGE_PADDING;
  return {
    x: Math.min(maxX, Math.max(minX, leftOfReservedX)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
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
    const nextScale = clampMobileControlScale(position.scale);
    button.style.setProperty(MOBILE_CONTROL_SCALE_CSS_VAR, `${nextScale}`);
    button.dataset.layoutScale = `${nextScale}`;
    const buttonRect = button.getBoundingClientRect();
    const maxX = Math.max(MOBILE_LAYOUT_EDGE_PADDING, controlsRect.width - buttonRect.width - MOBILE_LAYOUT_EDGE_PADDING);
    const maxY = Math.max(MOBILE_LAYOUT_EDGE_PADDING, controlsRect.height - buttonRect.height - MOBILE_LAYOUT_EDGE_PADDING);
    const nextX = Math.min(maxX, Math.max(MOBILE_LAYOUT_EDGE_PADDING, position.x * controlsRect.width));
    const nextY = Math.min(maxY, Math.max(MOBILE_LAYOUT_EDGE_PADDING, position.y * controlsRect.height));
    const adjustedPosition = controls.classList.contains("is-layout-editing")
      ? { x: nextX, y: nextY }
      : avoidCanvasGlobalHud(nextX, nextY, buttonRect.width, buttonRect.height, controlsRect);
    button.style.left = `${adjustedPosition.x}px`;
    button.style.top = `${adjustedPosition.y}px`;
  });
};

const isMobileControlLayoutId = (value: unknown): value is MobileControlLayoutId => {
  return value === "joystick" || value === "fullscreen" || value === "action-jump" || value === "action-dash" || value === "restart";
};

const normalizeMobileControlsPosition = (rawPosition: unknown): MobileControlPosition | undefined => {
  if (typeof rawPosition !== "object" || rawPosition === null) {
    return undefined;
  }
  const position = rawPosition as Partial<MobileControlPosition>;
  if (typeof position.x !== "number" || !Number.isFinite(position.x) || typeof position.y !== "number" || !Number.isFinite(position.y)) {
    return undefined;
  }
  const rawScale = typeof position.scale === "number" && Number.isFinite(position.scale) ? position.scale : MOBILE_CONTROL_SCALE_DEFAULT;
  const scale = Math.min(MOBILE_CONTROL_SCALE_MAX, Math.max(MOBILE_CONTROL_SCALE_MIN, rawScale));
  return {
    x: position.x,
    y: position.y,
    scale,
  };
};

const normalizeMobileControlsLayout = (rawLayout: unknown): MobileControlLayout | undefined => {
  const layout: MobileControlLayout = {};
  if (typeof rawLayout !== "object" || rawLayout === null) {
    return undefined;
  }

  for (const [rawId, rawPosition] of Object.entries(rawLayout as Partial<Record<string, unknown>>)) {
    if (!isMobileControlLayoutId(rawId)) {
      continue;
    }
    const nextPosition = normalizeMobileControlsPosition(rawPosition);
    if (!nextPosition) {
      continue;
    }
    layout[rawId] = {
      x: Math.min(1, Math.max(0, nextPosition.x)),
      y: Math.min(1, Math.max(0, nextPosition.y)),
      scale: nextPosition.scale,
    };
  }

  return Object.keys(layout).length > 0 ? layout : undefined;
};

const normalizeStoredMobileControlsLayout = (rawLayout: unknown): MobileControlLayout | undefined => {
  if (typeof rawLayout === "object" && rawLayout !== null && !Array.isArray(rawLayout)) {
    const candidate = rawLayout as Partial<MobileControlLayoutStoragePayload>;
    if (candidate.layout && typeof candidate.layout === "object") {
      return normalizeMobileControlsLayout(candidate.layout);
    }
  }
  return normalizeMobileControlsLayout(rawLayout);
};

const readMobileControlsLayout = (): MobileControlLayout | undefined => {
  try {
    const rawLayout = window.localStorage.getItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY);
    if (!rawLayout) {
      return undefined;
    }
    const parsed = JSON.parse(rawLayout) as unknown;
    const normalizedLayout = normalizeStoredMobileControlsLayout(parsed);
    if (!normalizedLayout) {
      window.localStorage.removeItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY);
      return undefined;
    }
    return normalizedLayout;
  } catch {
    window.localStorage.removeItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY);
    return undefined;
  }
};

const saveMobileControlsLayout = (layout: MobileControlLayout) => {
  try {
    const payload: MobileControlLayoutStoragePayload = {
      v: MOBILE_CONTROLS_LAYOUT_STORAGE_VERSION,
      layout,
    };
    window.localStorage.setItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY, JSON.stringify(payload));
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
    return (
      window.localStorage.getItem(MOBILE_CONTROLS_LAYOUT_SETUP_STORAGE_KEY) !== "1" ||
      !window.localStorage.getItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY)
    );
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
