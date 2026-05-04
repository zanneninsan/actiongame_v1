import Phaser from "phaser";
import { MIDGROUND_BACKGROUNDS, REAR_BACKGROUNDS } from "virtual:background-assets";

let selectedRearBackgroundIndex = 0;
let selectedMidgroundBackgroundIndex = 0;

export class BackgroundController {
  private rearBackground?: Phaser.GameObjects.Image;
  private rearBackgroundIndex = selectedRearBackgroundIndex;
  private midgroundBackground?: Phaser.GameObjects.TileSprite;
  private midgroundBackgroundIndex = selectedMidgroundBackgroundIndex;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly width: number,
    private readonly height: number,
  ) {}

  create() {
    this.createRearBackground();
    this.createMidgroundBackground();
  }

  update(scrollX: number, scrollY: number) {
    if (this.midgroundBackground) {
      this.midgroundBackground.tilePositionX = scrollX * 0.58;
      this.midgroundBackground.y = -scrollY;
    }
  }

  cycleRearBackground(toggleButton?: HTMLButtonElement) {
    this.rearBackgroundIndex = (this.rearBackgroundIndex + 1) % REAR_BACKGROUNDS.length;
    selectedRearBackgroundIndex = this.rearBackgroundIndex;
    const background = this.getCurrentRearBackground();
    this.rearBackground?.setTexture(background.key).setDisplaySize(this.width, this.height);
    this.updateRearDebugToggle(toggleButton);
  }

  updateRearDebugToggle(toggleButton?: HTMLButtonElement) {
    if (!toggleButton) {
      return;
    }
    const background = this.getCurrentRearBackground();
    toggleButton.textContent = `RB${this.rearBackgroundIndex + 1}`;
    toggleButton.title = background.path;
    toggleButton.setAttribute("aria-label", `Switch rear background. Current: ${background.label}`);
  }

  cycleMidgroundBackground(toggleButton?: HTMLButtonElement) {
    this.midgroundBackgroundIndex = (this.midgroundBackgroundIndex + 1) % MIDGROUND_BACKGROUNDS.length;
    selectedMidgroundBackgroundIndex = this.midgroundBackgroundIndex;
    const background = this.getCurrentMidgroundBackground();
    this.midgroundBackground?.setTexture(background.key);
    this.updateMidgroundDebugToggle(toggleButton);
  }

  updateMidgroundDebugToggle(toggleButton?: HTMLButtonElement) {
    if (!toggleButton) {
      return;
    }
    const background = this.getCurrentMidgroundBackground();
    toggleButton.textContent = `MG${this.midgroundBackgroundIndex + 1}`;
    toggleButton.title = background.path;
    toggleButton.setAttribute("aria-label", `Switch midground background. Current: ${background.label}`);
  }

  private createRearBackground() {
    this.rearBackground = this.scene.add
      .image(0, 0, this.getCurrentRearBackground().key)
      .setOrigin(0, 0)
      .setDisplaySize(this.width, this.height)
      .setScrollFactor(0)
      .setDepth(-40);

    this.scene.add
      .rectangle(0, 0, this.width, this.height, 0x070a12, 0.2)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-35);
  }

  private getCurrentRearBackground() {
    return REAR_BACKGROUNDS[this.rearBackgroundIndex];
  }

  private createMidgroundBackground() {
    this.midgroundBackground = this.scene.add
      .tileSprite(0, 0, this.width, this.height, this.getCurrentMidgroundBackground().key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-15);
  }

  private getCurrentMidgroundBackground() {
    return MIDGROUND_BACKGROUNDS[this.midgroundBackgroundIndex];
  }
}
