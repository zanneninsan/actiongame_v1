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

export class StartCountdownOverlay {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly locale: Locale;
  private readonly rainbowPipelineKey: string;
  private readonly onComplete: () => void;
  private glowText?: Phaser.GameObjects.Text;
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
    this.glowText = this.scene.add
      .text(this.x, this.y, sequence[index], {
        fontFamily: "monospace",
        fontSize: "142px",
        color: "#ffffff",
        stroke: "#ffffff",
        strokeThickness: 28,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(219)
      .setAlpha(0.95)
      .setShadow(0, 0, "#22d3ee", 30, true, true);

    this.text = this.scene.add
      .text(this.x, this.y, sequence[index], {
        fontFamily: "monospace",
        fontSize: "132px",
        color: "#ffffff",
        stroke: "#020617",
        strokeThickness: 18,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(220)
      .setShadow(0, 0, "#22d3ee", 22, true, true);

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

        this.glowText.setText(sequence[index]);
        this.text.setText(sequence[index]);
        this.scene.tweens.add({
          targets: [this.glowText, this.text],
          scale: { from: 1.28, to: 1 },
          alpha: { from: 0.72, to: 1 },
          duration: 220,
          ease: "Sine.easeOut",
        });

        if (index === sequence.length - 1) {
          this.releaseTimer = this.scene.time.delayedCall(420, () => this.onComplete());
        }
      },
    });
  }

  clear() {
    this.timer?.remove(false);
    this.timer = undefined;
    this.releaseTimer?.remove(false);
    this.releaseTimer = undefined;
    this.glowText?.destroy();
    this.glowText = undefined;
    this.text?.destroy();
    this.text = undefined;
  }
}
