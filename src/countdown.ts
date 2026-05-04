import Phaser from "phaser";
import { t, type Locale } from "./i18n";

type StartCountdownOverlayOptions = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  locale: Locale;
  rainbowPipelineKey: string;
  onComplete: () => void;
};

const getCountdownSequence = (locale: Locale) => ["3", "2", "1", t(locale, "countdown.go")];
const COUNTDOWN_FONT = '"Arial Black", Impact, "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif';
const COUNTDOWN_DEPTH = 220;
const COUNTDOWN_TICK_SOUND_KEY = "countdown-tick";
const COUNTDOWN_GO_SOUND_KEY = "countdown-go";

export class StartCountdownOverlay {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly locale: Locale;
  private readonly rainbowPipelineKey: string;
  private readonly onComplete: () => void;
  private burst?: Phaser.GameObjects.Graphics;
  private scanLines?: Phaser.GameObjects.Graphics;
  private glowText?: Phaser.GameObjects.Text;
  private hotText?: Phaser.GameObjects.Text;
  private shadowText?: Phaser.GameObjects.Text;
  private text?: Phaser.GameObjects.Text;
  private timer?: Phaser.Time.TimerEvent;
  private releaseTimer?: Phaser.Time.TimerEvent;

  constructor(options: StartCountdownOverlayOptions) {
    this.scene = options.scene;
    this.x = options.x;
    this.y = options.y;
    this.locale = options.locale;
    this.rainbowPipelineKey = options.rainbowPipelineKey;
    this.onComplete = options.onComplete;
  }

  start() {
    this.clear();

    let index = 0;
    const sequence = getCountdownSequence(this.locale);
    this.burst = this.scene.add.graphics().setScrollFactor(0).setDepth(COUNTDOWN_DEPTH - 6);
    this.scanLines = this.scene.add.graphics().setScrollFactor(0).setDepth(COUNTDOWN_DEPTH - 5).setBlendMode(Phaser.BlendModes.ADD);
    this.drawBurst(sequence[index]);

    this.shadowText = this.createCountdownText(sequence[index], 150, "#0f0526", "#000000", 24, COUNTDOWN_DEPTH - 3)
      .setPosition(this.x + 8, this.y + 9)
      .setAlpha(0.9)
      .setAngle(-2);

    this.glowText = this.scene.add
      .text(this.x, this.y, sequence[index], {
        fontFamily: COUNTDOWN_FONT,
        fontSize: "154px",
        fontStyle: "900",
        color: "#ff2dff",
        stroke: "#3b0764",
        strokeThickness: 34,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(COUNTDOWN_DEPTH - 1)
      .setAlpha(0.46)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setShadow(0, 0, "#22d3ee", 24, true, true);

    this.hotText = this.createCountdownText(sequence[index], 139, "#ffd166", "#ff007a", 18, COUNTDOWN_DEPTH)
      .setPosition(this.x - 4, this.y - 5)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.text = this.createCountdownText(sequence[index], 132, "#ffffff", "#020617", 22, COUNTDOWN_DEPTH + 4)
      .setShadow(4, 5, "#000000", 0, true, false);
    this.playCountdownSound(index, sequence.length);

    if (this.scene.game.renderer.type === Phaser.WEBGL) {
      this.glowText.setPipeline(this.rainbowPipelineKey);
    } else {
      this.glowText.setTint(0xff66ff, 0x66ffff, 0xffff66, 0x66ff66);
    }

    this.timer = this.scene.time.addEvent({
      delay: 900,
      repeat: sequence.length - 1,
      callback: () => {
        index += 1;
        if (!this.glowText || !this.text) {
          return;
        }

        this.setCountdownText(sequence[index]);
        this.drawBurst(sequence[index]);
        this.playCountdownSound(index, sequence.length);
        this.scene.tweens.add({
          targets: [this.shadowText, this.glowText, this.hotText, this.text],
          scaleX: { from: 1.36, to: 1 },
          scaleY: { from: 0.78, to: 1 },
          alpha: { from: 0.58, to: 1 },
          angle: { from: -4, to: 0 },
          duration: 180,
          ease: "Back.easeOut",
        });
        this.scene.tweens.add({
          targets: [this.glowText, this.hotText],
          x: { from: this.x - 10, to: this.x },
          yoyo: true,
          repeat: 2,
          duration: 34,
          ease: "Stepped",
        });

        if (index === sequence.length - 1) {
          this.releaseTimer = this.scene.time.delayedCall(420, () => this.onComplete());
        }
      },
    });
  }

  private playCountdownSound(index: number, sequenceLength: number) {
    const key = index === sequenceLength - 1 ? COUNTDOWN_GO_SOUND_KEY : COUNTDOWN_TICK_SOUND_KEY;
    const volume = index === sequenceLength - 1 ? 0.72 : 0.48;
    if (!this.scene.cache.audio.exists(key)) {
      return;
    }
    this.scene.sound.play(key, { volume });
  }

  private createCountdownText(
    value: string,
    fontSize: number,
    color: string,
    stroke: string,
    strokeThickness: number,
    depth: number,
  ) {
    return this.scene.add
      .text(this.x, this.y, value, {
        fontFamily: COUNTDOWN_FONT,
        fontSize: `${fontSize}px`,
        fontStyle: "900",
        color,
        stroke,
        strokeThickness,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth);
  }

  private setCountdownText(value: string) {
    this.shadowText?.setText(value);
    this.glowText?.setText(value);
    this.hotText?.setText(value);
    this.text?.setText(value);
  }

  private drawBurst(value: string) {
    this.burst?.clear();
    this.scanLines?.clear();

    if (!this.burst || !this.scanLines) {
      return;
    }

    const width = value.length > 1 ? 420 : 280;
    const height = 206;
    this.burst.fillStyle(0x05051c, 0.54);
    this.burst.fillRoundedRect(this.x - width / 2, this.y - height / 2, width, height, 10);
    this.burst.lineStyle(4, 0x00f5ff, 0.95);
    this.burst.strokeRoundedRect(this.x - width / 2 + 8, this.y - height / 2 + 8, width - 16, height - 16, 8);
    this.burst.lineStyle(2, 0xff2dff, 0.95);
    this.burst.strokeRoundedRect(this.x - width / 2 - 8, this.y - height / 2 - 8, width + 16, height + 16, 12);

    for (let i = 0; i < 28; i += 1) {
      const angle = (Math.PI * 2 * i) / 28;
      const inner = i % 2 === 0 ? 128 : 104;
      const outer = i % 3 === 0 ? 248 : 198;
      const x1 = this.x + Math.cos(angle) * inner;
      const y1 = this.y + Math.sin(angle) * inner * 0.52;
      const x2 = this.x + Math.cos(angle) * outer;
      const y2 = this.y + Math.sin(angle) * outer * 0.52;
      this.burst.lineStyle(i % 2 === 0 ? 4 : 2, i % 2 === 0 ? 0x22d3ee : 0xff2dff, 0.78);
      this.burst.lineBetween(x1, y1, x2, y2);
    }

    this.burst.lineStyle(6, 0xfacc15, 0.9);
    this.burst.lineBetween(this.x - width * 0.42, this.y - 68, this.x + width * 0.3, this.y - 98);
    this.burst.lineStyle(5, 0xff2dff, 0.8);
    this.burst.lineBetween(this.x - width * 0.34, this.y + 76, this.x + width * 0.44, this.y + 52);

    this.scanLines.lineStyle(2, 0xffffff, 0.25);
    for (let y = this.y - 88; y <= this.y + 88; y += 18) {
      this.scanLines.lineBetween(this.x - width / 2 + 24, y, this.x + width / 2 - 24, y - 8);
    }
    this.scanLines.lineStyle(4, 0x67e8f9, 0.42);
    this.scanLines.lineBetween(this.x - width * 0.48, this.y - 18, this.x + width * 0.48, this.y - 38);
  }

  clear() {
    this.timer?.remove(false);
    this.timer = undefined;
    this.releaseTimer?.remove(false);
    this.releaseTimer = undefined;
    this.burst?.destroy();
    this.burst = undefined;
    this.scanLines?.destroy();
    this.scanLines = undefined;
    this.shadowText?.destroy();
    this.shadowText = undefined;
    this.glowText?.destroy();
    this.glowText = undefined;
    this.hotText?.destroy();
    this.hotText = undefined;
    this.text?.destroy();
    this.text = undefined;
  }
}
