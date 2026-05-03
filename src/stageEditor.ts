import Phaser from "phaser";
import {
  ENEMY_DEFINITIONS,
  PROP_ASSETS,
  STAGE_OBJECT_ASSETS,
  ITEM_DEFINITIONS,
  type EnemyPlacement,
  type ItemPlacement,
  type PlatformRunPlacement,
  type StageDecorationPlacement,
  type StageDefinition,
  type StreetLampPlacement,
} from "./assets";
import { cloneStage } from "./stages";
import { type ResolvedStageConstants } from "./stageConstants";
import { StageEditorPanel, type EditorTool } from "./stageEditorPanel";
import { t, type Locale } from "./i18n";

type EditorSelection =
  | { kind: "platform"; index: number }
  | { kind: "item"; index: number }
  | { kind: "enemy"; index: number }
  | { kind: "streetLamp"; index: number }
  | { kind: "decoration"; index: number }
  | { kind: "playerStart" }
  | { kind: "goal" };

type StageEditorOptions = {
  tile: number;
  platformUnitWidth: number;
  platformUnitHeight: number;
  getStage: () => StageDefinition;
  setStage: (stage: StageDefinition) => void;
  getLocale: () => Locale;
  getStageConstants: () => ResolvedStageConstants;
  rebuildStageObjects: () => void;
  moveGoalTo: (x: number, y: number) => void;
  onToggle?: (enabled: boolean) => void;
};

const EDITOR_HISTORY_LIMIT = 80;

export class StageEditor {
  private panel?: StageEditorPanel;
  private markers: Phaser.GameObjects.GameObject[] = [];
  private selected?: EditorSelection;
  private selectionMarker?: Phaser.GameObjects.Rectangle;
  private selectionLabel?: Phaser.GameObjects.Text;
  private draggingSelection = false;
  private lastDragX?: number;
  private lastDragY?: number;
  private dragHistorySnapshot?: StageDefinition;
  private undoStack: StageDefinition[] = [];
  private redoStack: StageDefinition[] = [];
  private enabled = false;
  private tool: EditorTool = "select";

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: StageEditorOptions,
  ) {}

  get isEnabled() {
    return this.enabled;
  }

  show() {
    this.remove();

    this.panel = new StageEditorPanel({
      initialTool: this.tool,
      locale: this.options.getLocale(),
      onToggle: (enabled) => {
        this.enabled = enabled;
        this.options.onToggle?.(enabled);
        this.refreshExport();
        this.refreshSelectionMarker();
      },
      onToolChange: (tool) => {
        this.tool = tool;
      },
      onUndo: () => this.undo(),
      onRedo: () => this.redo(),
      onExport: () => {
        this.refreshExport();
        this.panel?.copyExportToClipboard();
        this.panel?.downloadExport(this.getExportFilename());
        this.panel?.setImportStatus(t(this.options.getLocale(), "editor.status.exported"));
      },
      onImport: (json) => this.importStage(json),
    });
    this.panel.show();
    this.refreshExport();
    this.refreshHistoryControls();
    this.bindInput();
  }

  remove() {
    this.unbindInput();
    this.panel?.remove();
    this.panel = undefined;
    this.enabled = false;
    this.clearMarkers();
    this.selected = undefined;
    this.draggingSelection = false;
    this.lastDragX = undefined;
    this.lastDragY = undefined;
    this.dragHistorySnapshot = undefined;
    this.selectionMarker?.destroy();
    this.selectionMarker = undefined;
    this.selectionLabel?.destroy();
    this.selectionLabel = undefined;
  }

  deleteSelection(selection = this.selected) {
    if (!this.enabled || !selection) {
      return;
    }

    const historySnapshot = cloneStage(this.stage);
    if (selection.kind === "platform") {
      this.stage.platforms.splice(selection.index, 1);
    } else if (selection.kind === "item") {
      this.stage.items.splice(selection.index, 1);
    } else if (selection.kind === "enemy") {
      this.stage.enemies?.splice(selection.index, 1);
    } else if (selection.kind === "streetLamp") {
      this.stage.streetLamps.splice(selection.index, 1);
    } else if (selection.kind === "decoration") {
      this.stage.decorations.splice(selection.index, 1);
    } else {
      this.selected = selection;
      this.refreshSelectionMarker();
      return;
    }

    this.selected = undefined;
    this.draggingSelection = false;
    this.rebuildStageObjects();
    this.recordChange(historySnapshot);
    this.refreshExport();
  }

  private get stage() {
    return this.options.getStage();
  }

  private get stageConstants() {
    return this.options.getStageConstants();
  }

  private bindInput() {
    this.unbindInput();
    this.scene.input.keyboard?.on("keydown-DELETE", this.handleDeleteKey, this);
    this.scene.input.keyboard?.on("keydown-Z", this.handleUndoKey, this);
    this.scene.input.keyboard?.on("keydown-Y", this.handleRedoKey, this);
    this.scene.input.on("pointerdown", this.handlePointerDown, this);
    this.scene.input.on("pointermove", this.handlePointerMove, this);
    this.scene.input.on("pointerup", this.handlePointerUp, this);
    this.scene.input.on("pointerupoutside", this.handlePointerUp, this);
  }

  private unbindInput() {
    this.scene.input.keyboard?.off("keydown-DELETE", this.handleDeleteKey, this);
    this.scene.input.keyboard?.off("keydown-Z", this.handleUndoKey, this);
    this.scene.input.keyboard?.off("keydown-Y", this.handleRedoKey, this);
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.scene.input.off("pointerupoutside", this.handlePointerUp, this);
  }

  private handleDeleteKey() {
    this.deleteSelection();
  }

  private handleUndoKey(event: KeyboardEvent) {
    if (!this.enabled) {
      return;
    }

    event.preventDefault();
    this.undo();
  }

  private handleRedoKey(event: KeyboardEvent) {
    if (!this.enabled) {
      return;
    }

    event.preventDefault();
    this.redo();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.enabled || pointer.event?.target !== this.scene.game.canvas) {
      return;
    }

    const historySnapshot = cloneStage(this.stage);
    const point = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const x = Math.round(point.x / this.options.tile) * this.options.tile;
    const y = Math.round(point.y / this.options.tile) * this.options.tile;

    if (this.startSelectionDrag(point.x, point.y, x, y)) {
      return;
    }

    if (this.tool === "select") {
      this.selectObjectAt(point.x, point.y);
    } else if (this.tool === "move") {
      if (!this.selected) {
        this.selectObjectAt(point.x, point.y);
      } else {
        this.moveSelectionTo(x, y, historySnapshot);
      }
    } else if (this.tool === "delete") {
      this.deleteObjectAt(point.x, point.y);
    } else if (this.tool === "platform") {
      const units = Phaser.Math.Clamp(this.panel?.platformUnits ?? 3, 1, 16);
      const placement: PlatformRunPlacement = { x, y, units };
      this.stage.platforms.push(placement);
      this.selected = { kind: "platform", index: this.stage.platforms.length - 1 };
      this.rebuildStageObjects();
      this.recordChange(historySnapshot);
    } else if (this.tool === "item") {
      const type = this.panel?.itemType ?? "energyDrink";
      const placement: ItemPlacement = { type, x, y };
      this.stage.items.push(placement);
      this.selected = { kind: "item", index: this.stage.items.length - 1 };
      this.rebuildStageObjects();
      this.recordChange(historySnapshot);
    } else if (this.tool === "enemy") {
      const type = this.panel?.enemyType ?? "neonBouncer";
      const placement: EnemyPlacement = {
        type,
        x,
        y,
        patrolLeft: x - this.options.platformUnitWidth * 2,
        patrolRight: x + this.options.platformUnitWidth * 2,
      };
      this.stage.enemies = this.stage.enemies ?? [];
      this.stage.enemies.push(placement);
      this.selected = { kind: "enemy", index: this.stage.enemies.length - 1 };
      this.rebuildStageObjects();
      this.recordChange(historySnapshot);
    } else if (this.tool === "streetLamp") {
      const key = this.panel?.lampType ?? PROP_ASSETS.lampSingle;
      const placement: StreetLampPlacement = { x, key, scale: key === PROP_ASSETS.lampDouble ? 0.64 : 0.66 };
      this.stage.streetLamps.push(placement);
      this.selected = { kind: "streetLamp", index: this.stage.streetLamps.length - 1 };
      this.rebuildStageObjects();
      this.recordChange(historySnapshot);
    } else if (this.tool === "decoration") {
      const key = this.panel?.decorationKey ?? STAGE_OBJECT_ASSETS[0].key;
      const placement: StageDecorationPlacement = { x, y, key, scale: 0.68 };
      this.stage.decorations.push(placement);
      this.selected = { kind: "decoration", index: this.stage.decorations.length - 1 };
      this.rebuildStageObjects();
      this.recordChange(historySnapshot);
    } else if (this.tool === "playerStart") {
      this.stage.playerStart = { x, y };
      this.selected = { kind: "playerStart" };
      this.addMarker(x, y, 0x38bdf8, "START");
      this.refreshSelectionMarker();
      this.recordChange(historySnapshot);
    } else if (this.tool === "goal") {
      this.stage.goal = { x, y };
      this.selected = { kind: "goal" };
      this.options.moveGoalTo(x, y);
      this.addMarker(x, y, 0xfb7185, "GOAL");
      this.refreshSelectionMarker();
      this.recordChange(historySnapshot);
    }

    this.refreshExport();
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.enabled || !this.draggingSelection || pointer.event?.target !== this.scene.game.canvas) {
      return;
    }

    const point = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const x = Math.round(point.x / this.options.tile) * this.options.tile;
    const y = Math.round(point.y / this.options.tile) * this.options.tile;
    if (x === this.lastDragX && y === this.lastDragY) {
      return;
    }

    this.lastDragX = x;
    this.lastDragY = y;
    this.moveSelectionTo(x, y);
  }

  private handlePointerUp() {
    if (this.dragHistorySnapshot) {
      this.recordChange(this.dragHistorySnapshot);
    }

    this.draggingSelection = false;
    this.lastDragX = undefined;
    this.lastDragY = undefined;
    this.dragHistorySnapshot = undefined;
  }

  private startSelectionDrag(worldX: number, worldY: number, snappedX: number, snappedY: number) {
    if (this.tool === "delete" || !this.selected || !this.isPointInsideSelection(worldX, worldY)) {
      return false;
    }

    this.draggingSelection = true;
    this.lastDragX = snappedX;
    this.lastDragY = snappedY;
    this.dragHistorySnapshot = cloneStage(this.stage);
    return true;
  }

  private isPointInsideSelection(worldX: number, worldY: number) {
    if (!this.selected) {
      return false;
    }

    const bounds = this.getSelectionBounds(this.selected);
    if (!bounds) {
      return false;
    }

    return (
      worldX >= bounds.x - bounds.width / 2 &&
      worldX <= bounds.x + bounds.width / 2 &&
      worldY >= bounds.y - bounds.height / 2 &&
      worldY <= bounds.y + bounds.height / 2
    );
  }

  private selectObjectAt(worldX: number, worldY: number) {
    this.selected = this.findObjectAt(worldX, worldY);
    this.refreshSelectionMarker();
  }

  private deleteObjectAt(worldX: number, worldY: number) {
    const selection = this.findObjectAt(worldX, worldY);
    if (!selection) {
      this.selected = undefined;
      this.refreshSelectionMarker();
      return;
    }

    this.deleteSelection(selection);
  }

  private moveSelectionTo(x: number, y: number, historySnapshot?: StageDefinition) {
    if (!this.selected) {
      return;
    }

    const selection = this.selected;
    if (selection.kind === "platform") {
      const placement = this.stage.platforms[selection.index];
      if (placement) {
        placement.x = x;
        placement.y = y;
      }
    } else if (selection.kind === "item") {
      const placement = this.stage.items[selection.index];
      if (placement) {
        placement.x = x;
        placement.y = y;
      }
    } else if (selection.kind === "enemy") {
      const placement = this.stage.enemies?.[selection.index];
      if (placement) {
        const deltaX = x - placement.x;
        placement.x = x;
        placement.y = y;
        placement.patrolLeft += deltaX;
        placement.patrolRight += deltaX;
      }
    } else if (selection.kind === "streetLamp") {
      const placement = this.stage.streetLamps[selection.index];
      if (placement) {
        placement.x = x;
      }
    } else if (selection.kind === "decoration") {
      const placement = this.stage.decorations[selection.index];
      if (placement) {
        placement.x = x;
        placement.y = y;
      }
    } else if (selection.kind === "playerStart") {
      this.stage.playerStart = { x, y };
    } else if (selection.kind === "goal") {
      this.stage.goal = { x, y };
    }

    this.rebuildStageObjects();
    if (historySnapshot) {
      this.recordChange(historySnapshot);
    }
    this.refreshExport();
  }

  private findObjectAt(worldX: number, worldY: number): EditorSelection | undefined {
    let best: { selection: EditorSelection; distance: number } | undefined;
    const consider = (selection: EditorSelection, distance: number, threshold: number) => {
      if (distance > threshold) {
        return;
      }
      if (!best || distance < best.distance) {
        best = { selection, distance };
      }
    };

    this.stage.platforms.forEach((platform, index) => {
      consider(
        { kind: "platform", index },
        this.getDistanceToRect(
          worldX,
          worldY,
          platform.x,
          platform.y,
          platform.units * this.options.platformUnitWidth,
          this.options.platformUnitHeight,
        ),
        54,
      );
    });
    this.stage.items.forEach((item, index) => {
      consider({ kind: "item", index }, Phaser.Math.Distance.Between(worldX, worldY, item.x, item.y), 58);
    });
    (this.stage.enemies ?? []).forEach((enemy, index) => {
      consider({ kind: "enemy", index }, Phaser.Math.Distance.Between(worldX, worldY, enemy.x, enemy.y), 64);
    });
    this.stage.streetLamps.forEach((lamp, index) => {
      const scale = lamp.scale ?? 1;
      consider(
        { kind: "streetLamp", index },
        this.getDistanceToRect(worldX, worldY, lamp.x - 42, this.stageConstants.streetLampGroundY - 280 * scale, 84, 280 * scale),
        64,
      );
    });
    this.stage.decorations.forEach((decoration, index) => {
      const y = decoration.y ?? this.stageConstants.groundTopY;
      consider({ kind: "decoration", index }, Phaser.Math.Distance.Between(worldX, worldY, decoration.x, y), 84);
    });
    consider(
      { kind: "playerStart" },
      Phaser.Math.Distance.Between(worldX, worldY, this.stage.playerStart.x, this.stage.playerStart.y),
      70,
    );
    consider({ kind: "goal" }, Phaser.Math.Distance.Between(worldX, worldY, this.stage.goal.x, this.stage.goal.y), 70);

    return best?.selection;
  }

  private getDistanceToRect(x: number, y: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number) {
    const nearestX = Phaser.Math.Clamp(x, rectX, rectX + rectWidth);
    const nearestY = Phaser.Math.Clamp(y, rectY, rectY + rectHeight);
    return Phaser.Math.Distance.Between(x, y, nearestX, nearestY);
  }

  private refreshSelectionMarker() {
    this.selectionMarker?.destroy();
    this.selectionMarker = undefined;
    this.selectionLabel?.destroy();
    this.selectionLabel = undefined;
    if (!this.selected) {
      return;
    }

    const bounds = this.getSelectionBounds(this.selected);
    if (!bounds) {
      this.selected = undefined;
      return;
    }

    this.selectionMarker = this.scene.add
      .rectangle(bounds.x, bounds.y, bounds.width, bounds.height)
      .setStrokeStyle(3, 0x22d3ee, 0.96)
      .setFillStyle(0x22d3ee, 0.08)
      .setDepth(302);

    this.selectionLabel = this.scene.add
      .text(bounds.x, bounds.y - bounds.height / 2 - 14, this.getSelectionKeyName(this.selected), {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ecfeff",
        backgroundColor: "#083344",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(303);
  }

  private getSelectionKeyName(selection: EditorSelection) {
    if (selection.kind === "platform") {
      return "platform";
    }
    if (selection.kind === "item") {
      const item = this.stage.items[selection.index];
      return item ? ITEM_DEFINITIONS[item.type].key : "item";
    }
    if (selection.kind === "enemy") {
      const enemy = this.stage.enemies?.[selection.index];
      return enemy ? ENEMY_DEFINITIONS[enemy.type ?? "neonBouncer"].key : "enemy";
    }
    if (selection.kind === "streetLamp") {
      return this.stage.streetLamps[selection.index]?.key ?? "streetLamp";
    }
    if (selection.kind === "decoration") {
      return this.stage.decorations[selection.index]?.key ?? "decoration";
    }
    return selection.kind;
  }

  private getSelectionBounds(selection: EditorSelection) {
    if (selection.kind === "platform") {
      const platform = this.stage.platforms[selection.index];
      if (!platform) {
        return undefined;
      }
      return {
        x: platform.x + (platform.units * this.options.platformUnitWidth) / 2,
        y: platform.y + this.options.platformUnitHeight / 2,
        width: platform.units * this.options.platformUnitWidth + 10,
        height: this.options.platformUnitHeight + 10,
      };
    }
    if (selection.kind === "item") {
      const item = this.stage.items[selection.index];
      return item ? { x: item.x, y: item.y, width: 72, height: 72 } : undefined;
    }
    if (selection.kind === "enemy") {
      const enemy = this.stage.enemies?.[selection.index];
      if (!enemy) {
        return undefined;
      }

      const definition = ENEMY_DEFINITIONS[enemy.type ?? "neonBouncer"];
      return { x: enemy.x, y: enemy.y, width: definition.displayWidth + 10, height: definition.displayHeight + 10 };
    }
    if (selection.kind === "streetLamp") {
      const lamp = this.stage.streetLamps[selection.index];
      const scale = lamp?.scale ?? 1;
      return lamp ? { x: lamp.x, y: this.stageConstants.streetLampGroundY - 140 * scale, width: 110, height: 290 * scale } : undefined;
    }
    if (selection.kind === "decoration") {
      const decoration = this.stage.decorations[selection.index];
      return decoration
        ? { x: decoration.x, y: (decoration.y ?? this.stageConstants.groundTopY) - 36, width: 96, height: 96 }
        : undefined;
    }
    if (selection.kind === "playerStart") {
      return { x: this.stage.playerStart.x, y: this.stage.playerStart.y, width: 88, height: 40 };
    }
    return { x: this.stage.goal.x, y: this.stage.goal.y, width: 48, height: 112 };
  }

  private addMarker(x: number, y: number, color: number, label: string) {
    const marker = this.scene.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.markers.push(marker);
  }

  private recordChange(previousStage: StageDefinition) {
    if (this.areStagesEqual(previousStage, this.stage)) {
      this.refreshHistoryControls();
      return;
    }

    this.undoStack.push(cloneStage(previousStage));
    if (this.undoStack.length > EDITOR_HISTORY_LIMIT) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.refreshHistoryControls();
  }

  private undo() {
    if (!this.enabled || this.undoStack.length === 0) {
      return;
    }

    const previousStage = this.undoStack.pop();
    if (!previousStage) {
      return;
    }

    this.redoStack.push(cloneStage(this.stage));
    this.restoreStage(previousStage);
  }

  private redo() {
    if (!this.enabled || this.redoStack.length === 0) {
      return;
    }

    const nextStage = this.redoStack.pop();
    if (!nextStage) {
      return;
    }

    this.undoStack.push(cloneStage(this.stage));
    this.restoreStage(nextStage);
  }

  private importStage(json: string) {
    if (!this.enabled) {
      return;
    }

    if (!json.trim()) {
      this.panel?.setImportStatus(t(this.options.getLocale(), "editor.status.emptyJson"), true);
      return;
    }

    const previousStage = cloneStage(this.stage);
    try {
      const parsed = JSON.parse(json) as unknown;
      if (!this.isStageDefinition(parsed)) {
        throw new Error(t(this.options.getLocale(), "editor.status.invalidShape"));
      }

      this.options.setStage(cloneStage(parsed));
      this.selected = undefined;
      this.draggingSelection = false;
      this.lastDragX = undefined;
      this.lastDragY = undefined;
      this.dragHistorySnapshot = undefined;
      this.clearMarkers();
      this.rebuildStageObjects();
      this.recordChange(previousStage);
      this.refreshExport();
      this.panel?.setImportStatus(t(this.options.getLocale(), "editor.status.imported"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t(this.options.getLocale(), "editor.status.invalidJson");
      this.panel?.setImportStatus(message, true);
    }
  }

  private restoreStage(stage: StageDefinition) {
    this.options.setStage(cloneStage(stage));
    this.selected = undefined;
    this.draggingSelection = false;
    this.lastDragX = undefined;
    this.lastDragY = undefined;
    this.dragHistorySnapshot = undefined;
    this.clearMarkers();
    this.rebuildStageObjects();
    this.refreshExport();
    this.refreshHistoryControls();
  }

  private rebuildStageObjects() {
    this.options.rebuildStageObjects();
    this.refreshSelectionMarker();
  }

  private refreshHistoryControls() {
    this.panel?.setHistoryState(this.undoStack.length > 0, this.redoStack.length > 0);
  }

  private areStagesEqual(a: StageDefinition, b: StageDefinition) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private isStageDefinition(value: unknown): value is StageDefinition {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.name === "string" &&
      this.isNumber(value.worldWidth) &&
      this.isOptionalNumber(value.worldTop) &&
      this.isOptionalNumber(value.worldBottom) &&
      this.isOptionalNumber(value.groundTopY) &&
      this.isOptionalNumber(value.groundVisualY) &&
      this.isOptionalNumber(value.streetLampGroundY) &&
      this.isPoint(value.playerStart) &&
      this.isPoint(value.goal) &&
      Array.isArray(value.platforms) &&
      value.platforms.every((platform) => this.isPlatformPlacement(platform)) &&
      Array.isArray(value.streetLamps) &&
      value.streetLamps.every((lamp) => this.isStreetLampPlacement(lamp)) &&
      Array.isArray(value.decorations) &&
      value.decorations.every((decoration) => this.isDecorationPlacement(decoration)) &&
      Array.isArray(value.items) &&
      value.items.every((item) => this.isItemPlacement(item)) &&
      (value.enemies === undefined ||
        (Array.isArray(value.enemies) && value.enemies.every((enemy) => this.isEnemyPlacement(enemy))))
    );
  }

  private isPlatformPlacement(value: unknown): value is PlatformRunPlacement {
    return (
      this.isRecord(value) &&
      this.isNumber(value.x) &&
      this.isNumber(value.y) &&
      this.isNumber(value.units) &&
      (value.collides === undefined || typeof value.collides === "boolean")
    );
  }

  private isStreetLampPlacement(value: unknown): value is StreetLampPlacement {
    return (
      this.isRecord(value) &&
      this.isNumber(value.x) &&
      Object.values(PROP_ASSETS).includes(value.key as StreetLampPlacement["key"]) &&
      this.isOptionalNumber(value.scale)
    );
  }

  private isDecorationPlacement(value: unknown): value is StageDecorationPlacement {
    return (
      this.isRecord(value) &&
      this.isNumber(value.x) &&
      this.isOptionalNumber(value.y) &&
      typeof value.key === "string" &&
      STAGE_OBJECT_ASSETS.some((asset) => asset.key === value.key) &&
      this.isOptionalNumber(value.scale)
    );
  }

  private isItemPlacement(value: unknown): value is ItemPlacement {
    return (
      this.isRecord(value) &&
      this.isNumber(value.x) &&
      this.isNumber(value.y) &&
      typeof value.type === "string" &&
      value.type in ITEM_DEFINITIONS
    );
  }

  private isEnemyPlacement(value: unknown): value is EnemyPlacement {
    return (
      this.isRecord(value) &&
      this.isNumber(value.x) &&
      this.isNumber(value.y) &&
      this.isNumber(value.patrolLeft) &&
      this.isNumber(value.patrolRight) &&
      (value.type === undefined || (typeof value.type === "string" && value.type in ENEMY_DEFINITIONS)) &&
      this.isOptionalNumber(value.speed)
    );
  }

  private isPoint(value: unknown): value is { x: number; y: number } {
    return this.isRecord(value) && this.isNumber(value.x) && this.isNumber(value.y);
  }

  private isOptionalNumber(value: unknown) {
    return value === undefined || this.isNumber(value);
  }

  private isNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private clearMarkers() {
    this.markers.forEach((marker) => marker.destroy());
    this.markers = [];
  }

  private refreshExport() {
    this.panel?.setExport(JSON.stringify(this.stage, null, 2));
  }

  private getExportFilename() {
    const safeName = this.stage.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stage";
    return `${safeName}.stage.json`;
  }
}
