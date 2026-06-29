import Phaser from "phaser";
import type { StageDefinition } from "./assets";

const PLATFORM_UNIT_WIDTH = 64;
const MAP_WIDTH = 330;
const MAP_HEIGHT = 116;
const MAP_PADDING = 10;
const MAP_X = 926;
const MAP_Y = 74;
const MAP_VIEW_MULTIPLIER = 5;
const MAP_UPDATE_INTERVAL_MS = 250;

type PlayerSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export class MinimapOverlay {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly collectedItemIndexes = new Set<number>();
  private readonly defeatedEnemyIndexes = new Set<number>();
  private nextUpdateAt = 0;
  private wasVisible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getStage: () => StageDefinition,
    private readonly getPlayer: () => PlayerSprite,
    private readonly getCamera: () => Phaser.Cameras.Scene2D.Camera,
  ) {
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(108);
  }

  update(now: number, visible: boolean) {
    const shouldShow = visible && !document.body.classList.contains("is-global-menu-open");
    if (!shouldShow) {
      if (this.wasVisible) {
        this.graphics.clear();
        this.wasVisible = false;
      }
      return;
    }

    if (now < this.nextUpdateAt && this.wasVisible) {
      return;
    }

    this.wasVisible = true;
    this.nextUpdateAt = now + MAP_UPDATE_INTERVAL_MS;
    this.draw();
  }

  resetProgress() {
    if (this.collectedItemIndexes.size === 0 && this.defeatedEnemyIndexes.size === 0) {
      return;
    }
    this.collectedItemIndexes.clear();
    this.defeatedEnemyIndexes.clear();
    this.requestRedraw();
  }

  markItemCollected(placementIndex: number | undefined) {
    if (placementIndex === undefined || this.collectedItemIndexes.has(placementIndex)) {
      return;
    }
    this.collectedItemIndexes.add(placementIndex);
    this.requestRedraw();
  }

  markEnemyDefeated(placementIndex: number | undefined) {
    if (placementIndex === undefined || this.defeatedEnemyIndexes.has(placementIndex)) {
      return;
    }
    this.defeatedEnemyIndexes.add(placementIndex);
    this.requestRedraw();
  }

  private requestRedraw() {
    this.nextUpdateAt = 0;
    if (this.wasVisible) {
      this.draw();
    }
  }

  private draw() {
    const stage = this.getStage();
    const player = this.getPlayer();
    const camera = this.getCamera();
    const worldTop = stage.worldTop ?? 0;
    const worldBottom = stage.worldBottom ?? 720;
    const worldHeight = Math.max(1, worldBottom - worldTop);
    const viewWidth = camera.width * MAP_VIEW_MULTIPLIER;
    const viewLeft = Phaser.Math.Clamp(player.x - viewWidth / 2, 0, Math.max(0, stage.worldWidth - viewWidth));
    const viewRight = viewLeft + viewWidth;
    const innerX = MAP_X + MAP_PADDING;
    const innerY = MAP_Y + MAP_PADDING;
    const innerWidth = MAP_WIDTH - MAP_PADDING * 2;
    const innerHeight = MAP_HEIGHT - MAP_PADDING * 2;
    const scaleX = innerWidth / viewWidth;
    const scaleY = innerHeight / worldHeight;
    const toMapX = (x: number) => innerX + (x - viewLeft) * scaleX;
    const toMapY = (y: number) => innerY + (y - worldTop) * scaleY;

    this.graphics.clear();
    this.graphics.fillStyle(0x020617, 0.58);
    this.graphics.fillRoundedRect(MAP_X, MAP_Y, MAP_WIDTH, MAP_HEIGHT, 8);
    this.graphics.lineStyle(1, 0x67e8f9, 0.42);
    this.graphics.strokeRoundedRect(MAP_X + 0.5, MAP_Y + 0.5, MAP_WIDTH - 1, MAP_HEIGHT - 1, 8);

    this.graphics.lineStyle(1, 0x94a3b8, 0.24);
    this.graphics.strokeRect(innerX, innerY, innerWidth, innerHeight);

    this.graphics.fillStyle(0x38bdf8, 0.78);
    stage.platforms.forEach((platform) => {
      const x = platform.x;
      const width = platform.units * PLATFORM_UNIT_WIDTH;
      if (x + width < viewLeft || x > viewRight) {
        return;
      }
      const drawX = Phaser.Math.Clamp(toMapX(x), innerX, innerX + innerWidth);
      const drawRight = Phaser.Math.Clamp(toMapX(x + width), innerX, innerX + innerWidth);
      const drawY = Phaser.Math.Clamp(toMapY(platform.y), innerY, innerY + innerHeight - 3);
      this.graphics.fillRect(drawX, drawY, Math.max(1.5, drawRight - drawX), 3);
    });

    this.drawDots(
      stage.items.filter((_, index) => !this.collectedItemIndexes.has(index)),
      viewLeft,
      viewRight,
      toMapX,
      toMapY,
      0xfde68a,
      1.8,
    );
    this.drawDots(stage.bonusBlocks ?? [], viewLeft, viewRight, toMapX, toMapY, 0xc084fc, 2);
    this.drawDots(
      (stage.enemies ?? []).filter((_, index) => !this.defeatedEnemyIndexes.has(index)),
      viewLeft,
      viewRight,
      toMapX,
      toMapY,
      0xfb7185,
      2.2,
    );

    if (stage.goal.x >= viewLeft && stage.goal.x <= viewRight) {
      this.graphics.fillStyle(0x22c55e, 0.95);
      this.graphics.fillRect(toMapX(stage.goal.x) - 2, toMapY(stage.goal.y) - 8, 4, 16);
    }

    const cameraLeft = Phaser.Math.Clamp(toMapX(camera.worldView.x), innerX, innerX + innerWidth);
    const cameraRight = Phaser.Math.Clamp(toMapX(camera.worldView.x + camera.worldView.width), innerX, innerX + innerWidth);
    this.graphics.lineStyle(1, 0xe0f2fe, 0.5);
    this.graphics.strokeRect(cameraLeft, innerY + 2, Math.max(2, cameraRight - cameraLeft), innerHeight - 4);

    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(toMapX(player.x), toMapY(player.y), 3.8);
    this.graphics.lineStyle(1, 0x0f172a, 0.95);
    this.graphics.strokeCircle(toMapX(player.x), toMapY(player.y), 4.6);
  }

  private drawDots(
    placements: readonly { x: number; y: number }[],
    viewLeft: number,
    viewRight: number,
    toMapX: (x: number) => number,
    toMapY: (y: number) => number,
    color: number,
    radius: number,
  ) {
    this.graphics.fillStyle(color, 0.82);
    placements.forEach((placement) => {
      if (placement.x < viewLeft || placement.x > viewRight) {
        return;
      }
      this.graphics.fillCircle(toMapX(placement.x), toMapY(placement.y), radius);
    });
  }
}
