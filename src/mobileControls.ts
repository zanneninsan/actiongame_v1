import Phaser from "phaser";
import { t, type Locale } from "./i18n";

export type MobileInputKey = "w" | "a" | "s" | "d" | "shift";
export const MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT = "actiongame:mobile-controls-layout-request";

type MobileControlsOptions = {
  locale: Locale;
  onInputChange: (key: MobileInputKey, pressed: boolean) => void;
  onJumpQueued: () => void;
  onRestart: () => void;
  onToggleFullscreen: () => void;
  onLayoutEditStart?: () => void;
  onLayoutEditFinish?: () => void;
};

type MobileControlLayoutId = "joystick" | "fullscreen" | "action-jump" | "action-dash" | "restart";

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

type ControlModel = {
  id: MobileControlLayoutId;
  container: Phaser.GameObjects.Container;
  hit: Phaser.GameObjects.Zone;
  back?: Phaser.GameObjects.Graphics;
  text?: Phaser.GameObjects.Text;
  ring?: Phaser.GameObjects.Graphics;
  knob?: Phaser.GameObjects.Graphics;
  baseWidth: number;
  baseHeight: number;
  width: number;
  height: number;
  scale: number;
  left: number;
  top: number;
  pressedPointers: Set<number>;
};

const MOBILE_CONTROLS_HINT_STORAGE_KEY = "actiongame_mobile_controls_hint_seen";
const MOBILE_CONTROLS_LAYOUT_STORAGE_KEY = "actiongame_mobile_controls_layout_v1";
const MOBILE_CONTROLS_LAYOUT_SETUP_STORAGE_KEY = "actiongame_mobile_controls_layout_setup_seen";
const MOBILE_CONTROLS_HINT_MS = 4200;
const MOBILE_LAYOUT_EDGE_PADDING = 8;
const MOBILE_JOYSTICK_ACTIVATION_RATIO = 0.28;
const MOBILE_JOYSTICK_DIAGONAL_RATIO = 0.38;
const MOBILE_INPUT_KEYS: MobileInputKey[] = ["w", "a", "s", "d", "shift"];
const MOBILE_CONTROL_SCALE_MIN = 0.7;
const MOBILE_CONTROL_SCALE_MAX = 1.45;
const MOBILE_CONTROL_SCALE_STEP = 0.05;
const MOBILE_CONTROL_SCALE_DEFAULT = 1;
const MOBILE_CONTROLS_LAYOUT_STORAGE_VERSION = 3;
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const UI_FONT = 'Meiryo, "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif';
const CONTROL_DEPTH = 542;
const PANEL_DEPTH = 544;
const HUD_SAFE_RECT = { left: 1130, top: 14, right: 1251, bottom: 58 } as const;
const HUD_SAFE_MARGIN = 18;

const CONTROL_BASE: Record<MobileControlLayoutId, { width: number; height: number; label?: string; key?: MobileInputKey }> = {
  joystick: { width: 170, height: 170 },
  fullscreen: { width: 78, height: 78, label: "FS" },
  "action-jump": { width: 88, height: 88, label: "^", key: "w" },
  "action-dash": { width: 88, height: 88, label: "DASH", key: "shift" },
  restart: { width: 72, height: 72, label: "R" },
};

const DEFAULT_LAYOUT: Required<MobileControlLayout> = {
  joystick: { x: 0.035, y: 0.735, scale: 1 },
  fullscreen: { x: 0.86, y: 0.56, scale: 1 },
  "action-jump": { x: 0.86, y: 0.66, scale: 1 },
  "action-dash": { x: 0.86, y: 0.79, scale: 1 },
  restart: { x: 0.9, y: 0.9, scale: 1 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const clampMobileControlScale = (value: number) =>
  clamp(Number.isFinite(value) ? value : MOBILE_CONTROL_SCALE_DEFAULT, MOBILE_CONTROL_SCALE_MIN, MOBILE_CONTROL_SCALE_MAX);

const isMobileControlLayoutId = (value: unknown): value is MobileControlLayoutId =>
  value === "joystick" || value === "fullscreen" || value === "action-jump" || value === "action-dash" || value === "restart";

const normalizeMobileControlsPosition = (rawPosition: unknown): MobileControlPosition | undefined => {
  if (typeof rawPosition !== "object" || rawPosition === null) {
    return undefined;
  }
  const position = rawPosition as Partial<MobileControlPosition>;
  if (typeof position.x !== "number" || !Number.isFinite(position.x) || typeof position.y !== "number" || !Number.isFinite(position.y)) {
    return undefined;
  }
  return {
    x: clamp(position.x, 0, 1),
    y: clamp(position.y, 0, 1),
    scale: clampMobileControlScale(typeof position.scale === "number" ? position.scale : MOBILE_CONTROL_SCALE_DEFAULT),
  };
};

const normalizeMobileControlsLayout = (rawLayout: unknown): MobileControlLayout | undefined => {
  if (typeof rawLayout !== "object" || rawLayout === null || Array.isArray(rawLayout)) {
    return undefined;
  }

  const layout: MobileControlLayout = {};
  for (const [rawId, rawPosition] of Object.entries(rawLayout as Partial<Record<string, unknown>>)) {
    if (!isMobileControlLayoutId(rawId)) {
      continue;
    }
    const position = normalizeMobileControlsPosition(rawPosition);
    if (position) {
      layout[rawId] = position;
    }
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
    const normalizedLayout = normalizeStoredMobileControlsLayout(JSON.parse(rawLayout) as unknown);
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
    // The default in-canvas layout still works when storage is unavailable.
  }
};

const clearMobileControlsLayout = () => {
  try {
    window.localStorage.removeItem(MOBILE_CONTROLS_LAYOUT_STORAGE_KEY);
  } catch {
    // Ignore storage failures; the current runtime layout is already reset.
  }
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

const hasFullscreenElement = () => {
  const fullscreenDocument = document as Document & {
    webkitFullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return Boolean(document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? fullscreenDocument.msFullscreenElement);
};

const mergeLayoutWithDefaults = (layout?: MobileControlLayout): Required<MobileControlLayout> => ({
  joystick: layout?.joystick ?? DEFAULT_LAYOUT.joystick,
  fullscreen: layout?.fullscreen ?? DEFAULT_LAYOUT.fullscreen,
  "action-jump": layout?.["action-jump"] ?? DEFAULT_LAYOUT["action-jump"],
  "action-dash": layout?.["action-dash"] ?? DEFAULT_LAYOUT["action-dash"],
  restart: layout?.restart ?? DEFAULT_LAYOUT.restart,
});

export const createMobileControls = (scene: Phaser.Scene, options: MobileControlsOptions) => {
  const controller = new PhaserMobileControls(scene, options);
  return [() => controller.destroy()];
};

class PhaserMobileControls {
  private readonly controls = new Map<MobileControlLayoutId, ControlModel>();
  private readonly root: Phaser.GameObjects.Container;
  private panel?: Phaser.GameObjects.Container;
  private selectedControlId: MobileControlLayoutId = "joystick";
  private editing = false;
  private dragging:
    | {
        pointerId: number;
        controlId: MobileControlLayoutId;
        offsetX: number;
        offsetY: number;
      }
    | undefined;
  private joystickPointerId: number | undefined;
  private keySources = new Map<MobileInputKey, Set<string>>();
  private hintTween?: Phaser.Tweens.Tween;
  private hintTimer?: Phaser.Time.TimerEvent;

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer) => this.onPointerMove(pointer);
  private readonly handlePointerUp = (pointer: Phaser.Input.Pointer) => this.onPointerUp(pointer);
  private readonly handleLayoutRequest = () => this.startLayoutEditing();
  private readonly handleFullscreenChange = () => this.refreshButtonVisuals();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: MobileControlsOptions,
  ) {
    this.scene.input.addPointer(4);
    this.root = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(CONTROL_DEPTH);
    this.createControls();
    this.applyLayout(readMobileControlsLayout());
    this.bindSceneInput();
    window.addEventListener(MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT, this.handleLayoutRequest);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", this.handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", this.handleFullscreenChange);

    if (shouldShowMobileControlsHint()) {
      this.startFirstRunHint();
    }
    if (shouldShowMobileControlsLayoutSetup()) {
      this.scene.time.delayedCall(0, () => this.startLayoutEditing());
    }
  }

  destroy() {
    this.clearInput();
    this.hintTween?.stop();
    this.hintTimer?.remove(false);
    this.scene.input.off("pointermove", this.handlePointerMove);
    this.scene.input.off("pointerup", this.handlePointerUp);
    this.scene.input.off("pointerupoutside", this.handlePointerUp);
    window.removeEventListener(MOBILE_CONTROLS_LAYOUT_REQUEST_EVENT, this.handleLayoutRequest);
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", this.handleFullscreenChange);
    document.removeEventListener("MSFullscreenChange", this.handleFullscreenChange);
    this.panel?.destroy(true);
    this.root.destroy(true);
  }

  private bindSceneInput() {
    this.scene.input.on("pointermove", this.handlePointerMove);
    this.scene.input.on("pointerup", this.handlePointerUp);
    this.scene.input.on("pointerupoutside", this.handlePointerUp);
  }

  private createControls() {
    this.createJoystickControl();
    this.createButtonControl("fullscreen");
    this.createButtonControl("action-jump");
    this.createButtonControl("action-dash");
    this.createButtonControl("restart");
  }

  private createJoystickControl() {
    const base = CONTROL_BASE.joystick;
    const container = this.scene.add.container(0, 0).setScrollFactor(0);
    const hit = this.scene.add.zone(0, 0, base.width, base.height).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const ring = this.scene.add.graphics();
    const knob = this.scene.add.graphics();
    container.add([hit, ring, knob]);
    this.root.add(container);

    const model: ControlModel = {
      id: "joystick",
      container,
      hit,
      ring,
      knob,
      baseWidth: base.width,
      baseHeight: base.height,
      width: base.width,
      height: base.height,
      scale: 1,
      left: 0,
      top: 0,
      pressedPointers: new Set(),
    };
    this.controls.set("joystick", model);
    hit.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.onControlPointerDown(model, pointer));
    this.drawJoystick(model, 0, 0);
  }

  private createButtonControl(id: Exclude<MobileControlLayoutId, "joystick">) {
    const base = CONTROL_BASE[id];
    const container = this.scene.add.container(0, 0).setScrollFactor(0);
    const hit = this.scene.add.zone(0, 0, base.width, base.height).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const back = this.scene.add.graphics();
    const text = this.scene.add
      .text(0, 0, base.label ?? "", {
        fontFamily: UI_FONT,
        fontSize: id === "action-dash" || id === "fullscreen" ? "16px" : "34px",
        fontStyle: "900",
        color: "#f8fafc",
        stroke: "#020617",
        strokeThickness: 5,
        align: "center",
        resolution: 2,
      })
      .setOrigin(0.5);
    container.add([hit, back, text]);
    this.root.add(container);

    const model: ControlModel = {
      id,
      container,
      hit,
      back,
      text,
      baseWidth: base.width,
      baseHeight: base.height,
      width: base.width,
      height: base.height,
      scale: 1,
      left: 0,
      top: 0,
      pressedPointers: new Set(),
    };
    this.controls.set(id, model);
    hit.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.onControlPointerDown(model, pointer));
    this.drawButton(model);
  }

  private onControlPointerDown(model: ControlModel, pointer: Phaser.Input.Pointer) {
    this.dismissHint();
    if (this.editing) {
      this.selectControl(model.id);
      this.dragging = {
        pointerId: pointer.id,
        controlId: model.id,
        offsetX: pointer.x - model.left,
        offsetY: pointer.y - model.top,
      };
      return;
    }

    if (model.id === "joystick") {
      this.joystickPointerId = pointer.id;
      this.applyJoystickPointer(pointer);
      return;
    }

    model.pressedPointers.add(pointer.id);
    this.refreshButtonVisual(model);
    const key = CONTROL_BASE[model.id].key;
    if (key) {
      const activated = this.setKeySource(key, this.getButtonKeySource(model, pointer.id), true);
      if (key === "w" && activated) {
        this.options.onJumpQueued();
      }
      return;
    }
    if (model.id === "restart") {
      this.options.onRestart();
    } else if (model.id === "fullscreen") {
      this.options.onToggleFullscreen();
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.dragging?.pointerId === pointer.id) {
      const model = this.controls.get(this.dragging.controlId);
      if (!model) {
        return;
      }
      this.setControlTopLeft(model, pointer.x - this.dragging.offsetX, pointer.y - this.dragging.offsetY, true);
      return;
    }
    if (this.joystickPointerId === pointer.id) {
      this.applyJoystickPointer(pointer);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.dragging?.pointerId === pointer.id) {
      this.dragging = undefined;
      this.saveCurrentLayout();
      return;
    }

    if (this.joystickPointerId === pointer.id) {
      this.joystickPointerId = undefined;
      this.releaseJoystick();
    }

    this.controls.forEach((model) => {
      if (!model.pressedPointers.delete(pointer.id)) {
        return;
      }
      this.refreshButtonVisual(model);
      const key = CONTROL_BASE[model.id].key;
      if (key) {
        this.setKeySource(key, this.getButtonKeySource(model, pointer.id), false);
      }
    });
  }

  private applyJoystickPointer(pointer: Phaser.Input.Pointer) {
    const model = this.controls.get("joystick");
    if (!model) {
      return;
    }
    const centerX = model.left + model.width / 2;
    const centerY = model.top + model.height / 2;
    const radius = Math.max(1, Math.min(model.width, model.height) / 2);
    const rawX = (pointer.x - centerX) / radius;
    const rawY = (pointer.y - centerY) / radius;
    const distance = Math.hypot(rawX, rawY);
    const ratio = distance > 1 ? 1 / distance : 1;
    const x = rawX * ratio;
    const y = rawY * ratio;
    const nextKeys = new Set<MobileInputKey>();
    if (Math.abs(x) >= MOBILE_JOYSTICK_ACTIVATION_RATIO && Math.abs(x) >= Math.abs(y) * MOBILE_JOYSTICK_DIAGONAL_RATIO) {
      nextKeys.add(x < 0 ? "a" : "d");
    }
    if (Math.abs(y) >= MOBILE_JOYSTICK_ACTIVATION_RATIO && Math.abs(y) >= Math.abs(x) * MOBILE_JOYSTICK_DIAGONAL_RATIO) {
      nextKeys.add(y < 0 ? "w" : "s");
    }
    let joystickJumpActivated = false;
    MOBILE_INPUT_KEYS.filter((key) => key !== "shift").forEach((key) => {
      const activated = this.setKeySource(key, "joystick", nextKeys.has(key));
      joystickJumpActivated ||= key === "w" && activated;
    });
    if (joystickJumpActivated) {
      this.options.onJumpQueued();
    }
    this.drawJoystick(model, x, y);
  }

  private releaseJoystick() {
    MOBILE_INPUT_KEYS.filter((key) => key !== "shift").forEach((key) => this.setKeySource(key, "joystick", false));
    const model = this.controls.get("joystick");
    if (model) {
      this.drawJoystick(model, 0, 0);
    }
  }

  private getButtonKeySource(model: ControlModel, pointerId: number) {
    return `button:${model.id}:${pointerId}`;
  }

  private setKeySource(key: MobileInputKey, source: string, pressed: boolean) {
    const sources = this.keySources.get(key) ?? new Set<string>();
    const wasPressed = sources.size > 0;
    if (pressed) {
      sources.add(source);
    } else {
      sources.delete(source);
    }
    if (sources.size > 0) {
      this.keySources.set(key, sources);
    } else {
      this.keySources.delete(key);
    }
    const isPressed = sources.size > 0;
    if (wasPressed !== isPressed) {
      this.options.onInputChange(key, isPressed);
      return isPressed;
    }
    return false;
  }

  private clearInput() {
    this.joystickPointerId = undefined;
    this.dragging = undefined;
    this.controls.forEach((model) => {
      model.pressedPointers.clear();
      this.refreshButtonVisual(model);
    });
    const activeKeys = new Set(this.keySources.keys());
    this.keySources.clear();
    activeKeys.forEach((key) => this.options.onInputChange(key, false));
    const joystick = this.controls.get("joystick");
    if (joystick) {
      this.drawJoystick(joystick, 0, 0);
    }
  }

  private applyLayout(layout?: MobileControlLayout) {
    const merged = mergeLayoutWithDefaults(layout);
    (Object.keys(merged) as MobileControlLayoutId[]).forEach((id) => {
      const model = this.controls.get(id);
      const position = merged[id];
      if (!model) {
        return;
      }
      this.setControlScale(model, position.scale);
      const left = position.x * GAME_WIDTH;
      const top = position.y * GAME_HEIGHT;
      const adjusted = this.editing ? { x: left, y: top } : this.avoidCanvasHud(model, left, top);
      this.setControlTopLeft(model, adjusted.x, adjusted.y, false);
    });
    this.refreshButtonVisuals();
  }

  private captureLayout(): MobileControlLayout {
    const layout: MobileControlLayout = {};
    this.controls.forEach((model) => {
      layout[model.id] = {
        x: clamp(model.left / GAME_WIDTH, 0, 1),
        y: clamp(model.top / GAME_HEIGHT, 0, 1),
        scale: model.scale,
      };
    });
    return layout;
  }

  private saveCurrentLayout() {
    saveMobileControlsLayout(this.captureLayout());
  }

  private setControlScale(model: ControlModel, scale: number) {
    model.scale = clampMobileControlScale(scale);
    model.width = model.baseWidth * model.scale;
    model.height = model.baseHeight * model.scale;
    model.hit.setSize(model.width, model.height);
    this.refreshControlDrawing(model);
  }

  private setControlTopLeft(model: ControlModel, left: number, top: number, shouldClamp: boolean) {
    const maxX = Math.max(MOBILE_LAYOUT_EDGE_PADDING, GAME_WIDTH - model.width - MOBILE_LAYOUT_EDGE_PADDING);
    const maxY = Math.max(MOBILE_LAYOUT_EDGE_PADDING, GAME_HEIGHT - model.height - MOBILE_LAYOUT_EDGE_PADDING);
    model.left = shouldClamp ? clamp(left, MOBILE_LAYOUT_EDGE_PADDING, maxX) : clamp(left, MOBILE_LAYOUT_EDGE_PADDING, maxX);
    model.top = shouldClamp ? clamp(top, MOBILE_LAYOUT_EDGE_PADDING, maxY) : clamp(top, MOBILE_LAYOUT_EDGE_PADDING, maxY);
    model.container.setPosition(model.left + model.width / 2, model.top + model.height / 2);
  }

  private avoidCanvasHud(model: ControlModel, left: number, top: number): { x: number; y: number } {
    const rect = {
      left,
      top,
      right: left + model.width,
      bottom: top + model.height,
    };
    const safe = {
      left: HUD_SAFE_RECT.left - HUD_SAFE_MARGIN,
      top: HUD_SAFE_RECT.top - HUD_SAFE_MARGIN,
      right: HUD_SAFE_RECT.right + HUD_SAFE_MARGIN,
      bottom: HUD_SAFE_RECT.bottom + HUD_SAFE_MARGIN,
    };
    if (rect.left >= safe.right || rect.right <= safe.left || rect.top >= safe.bottom || rect.bottom <= safe.top) {
      return { x: left, y: top };
    }
    const belowY = safe.bottom + MOBILE_LAYOUT_EDGE_PADDING;
    if (belowY <= GAME_HEIGHT - model.height - MOBILE_LAYOUT_EDGE_PADDING) {
      return { x: left, y: belowY };
    }
    return {
      x: safe.left - model.width - MOBILE_LAYOUT_EDGE_PADDING,
      y: top,
    };
  }

  private refreshControlDrawing(model: ControlModel) {
    if (model.id === "joystick") {
      this.drawJoystick(model, 0, 0);
    } else {
      this.drawButton(model);
    }
  }

  private refreshButtonVisuals() {
    this.controls.forEach((model) => this.refreshButtonVisual(model));
  }

  private refreshButtonVisual(model: ControlModel) {
    if (model.id === "joystick") {
      return;
    }
    this.drawButton(model);
  }

  private drawJoystick(model: ControlModel, x: number, y: number) {
    const ring = model.ring;
    const knob = model.knob;
    if (!ring || !knob) {
      return;
    }
    const radius = Math.min(model.width, model.height) / 2;
    ring.clear();
    ring.fillStyle(0x0f172a, this.editing && model.id === this.selectedControlId ? 0.82 : 0.62);
    ring.fillCircle(0, 0, radius);
    ring.lineStyle(this.editing && model.id === this.selectedControlId ? 5 : 3, 0xfde68a, this.editing ? 0.92 : 0.66);
    ring.strokeCircle(0, 0, radius - 3);
    ring.lineStyle(2, 0xe5e7eb, 0.34);
    ring.beginPath();
    ring.moveTo(-radius * 0.72, 0);
    ring.lineTo(radius * 0.72, 0);
    ring.moveTo(0, -radius * 0.72);
    ring.lineTo(0, radius * 0.72);
    ring.strokePath();

    knob.clear();
    knob.fillStyle(0x0f172a, 0.86);
    knob.lineStyle(3, 0xfde68a, 0.78);
    knob.fillCircle(x * radius * 0.46, y * radius * 0.46, radius * 0.31);
    knob.strokeCircle(x * radius * 0.46, y * radius * 0.46, radius * 0.31);
  }

  private drawButton(model: ControlModel) {
    const back = model.back;
    const text = model.text;
    if (!back || !text) {
      return;
    }
    const isPressed = model.pressedPointers.size > 0;
    const isSelected = this.editing && model.id === this.selectedControlId;
    const isActive = model.id === "fullscreen" && hasFullscreenElement();
    const width = model.width;
    const height = model.height;
    const radius = Math.min(14, height * 0.22);
    back.clear();
    back.fillStyle(0x020617, 0.38);
    back.fillRoundedRect(-width / 2 + 5, -height / 2 + 7, width, height, radius);
    back.fillStyle(isPressed || isActive ? 0x0e7490 : 0x0f172a, isPressed ? 0.86 : 0.72);
    back.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    back.lineStyle(isSelected ? 5 : 3, isSelected ? 0xfde68a : 0xe5e7eb, isSelected ? 0.98 : 0.62);
    back.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, radius);
    text.setFontSize(Math.max(12, Math.round(height * (model.id === "action-dash" || model.id === "fullscreen" ? 0.22 : 0.43))));
    text.setFixedSize(width - 8, 0);
    text.setText(model.id === "fullscreen" ? t(this.options.locale, "mobile.fullscreenShort") : CONTROL_BASE[model.id].label ?? "");
    text.setColor(isSelected ? "#fff7d6" : "#f8fafc");
  }

  private startFirstRunHint() {
    const targets = Array.from(this.controls.values()).map((control) => control.container);
    this.hintTween = this.scene.tweens.add({
      targets,
      alpha: { from: 0.72, to: 1 },
      duration: 480,
      yoyo: true,
      repeat: -1,
    });
    this.hintTimer = this.scene.time.delayedCall(MOBILE_CONTROLS_HINT_MS, () => this.dismissHint());
  }

  private dismissHint() {
    this.hintTween?.stop();
    this.hintTween = undefined;
    this.hintTimer?.remove(false);
    this.hintTimer = undefined;
    this.controls.forEach((control) => control.container.setAlpha(1));
    setMobileControlsHintSeen();
  }

  private startLayoutEditing() {
    if (this.editing) {
      return;
    }
    this.editing = true;
    this.clearInput();
    this.dismissHint();
    this.options.onLayoutEditStart?.();
    this.selectControl("joystick");
    this.applyLayout(this.captureLayout());
    this.createLayoutPanel();
  }

  private finishLayoutEditing() {
    if (!this.editing) {
      return;
    }
    this.editing = false;
    this.dragging = undefined;
    this.panel?.destroy(true);
    this.panel = undefined;
    this.applyLayout(this.captureLayout());
    this.saveCurrentLayout();
    setMobileControlsLayoutSetupSeen();
    this.options.onLayoutEditFinish?.();
  }

  private resetLayout() {
    clearMobileControlsLayout();
    this.applyLayout(DEFAULT_LAYOUT);
    this.saveCurrentLayout();
    this.selectControl("joystick");
  }

  private selectControl(id: MobileControlLayoutId) {
    this.selectedControlId = id;
    this.refreshControlSelection();
    this.refreshLayoutPanel();
  }

  private refreshControlSelection() {
    this.controls.forEach((model) => this.refreshControlDrawing(model));
  }

  private adjustSelectedScale(delta: number) {
    const model = this.controls.get(this.selectedControlId);
    if (!model) {
      return;
    }
    this.setControlScale(model, model.scale + delta);
    this.setControlTopLeft(model, model.left, model.top, true);
    this.saveCurrentLayout();
    this.refreshLayoutPanel();
  }

  private createLayoutPanel() {
    this.panel?.destroy(true);
    const panel = this.scene.add.container(GAME_WIDTH / 2, 16).setScrollFactor(0).setDepth(PANEL_DEPTH);
    const back = this.scene.add.graphics();
    back.fillStyle(0x020617, 0.86);
    back.fillRoundedRect(-280, 0, 560, 132, 10);
    back.lineStyle(3, 0xfde68a, 0.72);
    back.strokeRoundedRect(-280, 0, 560, 132, 10);
    const title = this.scene.add
      .text(0, 20, t(this.options.locale, "mobile.layoutTitle"), {
        fontFamily: UI_FONT,
        fontSize: "22px",
        fontStyle: "900",
        color: "#fde68a",
        stroke: "#020617",
        strokeThickness: 4,
        resolution: 2,
      })
      .setOrigin(0.5);
    const status = this.scene.add
      .text(0, 46, t(this.options.locale, "mobile.layoutEditing"), {
        fontFamily: UI_FONT,
        fontSize: "15px",
        fontStyle: "800",
        color: "#dbeafe",
        stroke: "#020617",
        strokeThickness: 3,
        resolution: 2,
      })
      .setName("status")
      .setOrigin(0.5);
    panel.add([back, title, status]);

    this.addPanelButton(panel, -198, 92, 54, "-", () => this.adjustSelectedScale(-MOBILE_CONTROL_SCALE_STEP));
    this.addPanelButton(panel, -128, 92, 84, "100%", () => undefined, "scale");
    this.addPanelButton(panel, -48, 92, 54, "+", () => this.adjustSelectedScale(MOBILE_CONTROL_SCALE_STEP));
    this.addPanelButton(panel, 72, 92, 96, t(this.options.locale, "mobile.layoutDone"), () => this.finishLayoutEditing(), "done");
    this.addPanelButton(panel, 192, 92, 104, t(this.options.locale, "mobile.layoutReset"), () => this.resetLayout(), "reset");
    this.panel = panel;
    this.refreshLayoutPanel();
  }

  private addPanelButton(
    panel: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    label: string,
    onPress: () => void,
    name?: string,
  ) {
    const height = 42;
    const container = this.scene.add.container(x, y).setName(name ?? "");
    const hit = this.scene.add.zone(0, 0, width, height).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const back = this.scene.add.graphics();
    back.fillStyle(name === "done" ? 0x166534 : 0x0f172a, 0.84);
    back.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    back.lineStyle(2, name === "done" ? 0x86efac : 0xfde68a, 0.72);
    back.strokeRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 8);
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: UI_FONT,
        fontSize: "15px",
        fontStyle: "900",
        color: "#f8fafc",
        stroke: "#020617",
        strokeThickness: 3,
        align: "center",
        fixedWidth: width - 8,
        resolution: 2,
      })
      .setName("label")
      .setOrigin(0.5);
    container.add([hit, back, text]);
    hit.on("pointerdown", () => onPress());
    panel.add(container);
  }

  private refreshLayoutPanel() {
    if (!this.panel) {
      return;
    }
    const model = this.controls.get(this.selectedControlId);
    const status = this.panel.getByName("status") as Phaser.GameObjects.Text | undefined;
    const scale = this.panel.getByName("scale") as Phaser.GameObjects.Container | undefined;
    const scaleLabel = scale?.getByName("label") as Phaser.GameObjects.Text | undefined;
    if (status) {
      status.setText(t(this.options.locale, "mobile.layoutEditing"));
    }
    if (scaleLabel && model) {
      scaleLabel.setText(`${Math.round(model.scale * 100)}%`);
    }
  }
}
