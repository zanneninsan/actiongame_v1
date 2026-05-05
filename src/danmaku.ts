import Phaser from "phaser";

const SCORE_MILESTONE_COMMENTS = [
  "ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!",
  "ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!",
  "スコア1000おめでとう！",
  "Score1000!!",
  "1000超えきた！１１１",
  "おめでとう！！",
  "1000点突破！",
  "888888888888",
  "888888888888",
  "いいペース",
  "スコア伸びてる",
  "ナイス回収",
  "これは熱い",
  "まだまだいける",
  "勢いある",
  "うまい",
  "ここから本番",
];

const CROUCH_HOLD_COMMENTS = [
  "え、見え・・・",
  "カメラ仕事した",
  "一時停止不可避",
  "スカート「解せぬ」",
  "今日も生きていける",
  "公式が病気",
  "ファンサありがとう",
  "今の見た？",
  "ありがとうございます",
  "神カメラ",
  "ここリプレイ",
  "助かる",
];

const JUMP_CHAIN_COMMENTS = [
  "カービィかよ？",
  "空飛んでません？",
  "滞空時間おかしい",
  "ジャンプしすぎｗ",
  "もう飛行タイプ",
  "地面いらない説",
  "ふわふわしてる",
  "落ちる気ある？",
  "空中散歩",
  "羽ついてる？",
  "無限ジャンプ助かる",
  "これは浮いてる",
];

const MISS_COMMENTS = [
  "あっ",
  "落ちたｗ",
  "これはミス",
  "足場さん！？",
  "そこ穴です",
  "今のは痛い",
  "リスタート不可避",
  "ドンマイ",
  "地面仕事して",
  "吸い込まれた",
  "次はいける",
  "見なかったことにしよう",
];

const TIME_UP_COMMENTS = [
  "TIME UP",
  "時間切れ",
  "0秒です",
  "タイマー見て",
  "延長戦なし",
  "ここで終了",
  "あと少しだった",
  "急いでー",
  "無情なカウント",
  "MISS扱いです",
  "リトライだ",
  "次は間に合う",
];

type ActiveComment = Phaser.GameObjects.Text & {
  destroyTimer?: Phaser.Time.TimerEvent;
};

export type DanmakuMode = "classic" | "liveChat";

export class DanmakuOverlay {
  private readonly scene: Phaser.Scene;
  private readonly width: number;
  private readonly height: number;
  private readonly activeComments = new Set<ActiveComment>();
  private readonly liveChatComments: ActiveComment[] = [];
  private readonly pendingTimers = new Set<Phaser.Time.TimerEvent>();
  private nextLane = 0;
  private mode: DanmakuMode = "classic";

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;
  }

  setMode(mode: DanmakuMode) {
    this.mode = mode;
  }

  emitScoreMilestone() {
    this.emitBurst(SCORE_MILESTONE_COMMENTS, 20, 75, {
      color: "#ffffff",
      stroke: "#0f766e",
      fontSize: 27,
      duration: 4400,
    });
  }

  emitCrouchHold() {
    this.emitBurst(CROUCH_HOLD_COMMENTS, 18, 80, {
      color: "#fff7ed",
      stroke: "#7c2d12",
      fontSize: 26,
      duration: 4200,
    });
  }

  emitJumpChain() {
    this.emitBurst(JUMP_CHAIN_COMMENTS, 18, 80, {
      color: "#e0f2fe",
      stroke: "#075985",
      fontSize: 26,
      duration: 4200,
    });
  }

  emitMiss() {
    this.emitBurst(MISS_COMMENTS, 16, 85, {
      color: "#fecdd3",
      stroke: "#881337",
      fontSize: 27,
      duration: 3800,
    });
  }

  emitTimeUp() {
    this.emitCenterBurst(TIME_UP_COMMENTS, 28, 58, {
      color: "#fef08a",
      stroke: "#7f1d1d",
      fontSize: 29,
      duration: 2400,
    });
  }

  clear() {
    this.pendingTimers.forEach((timer) => timer.remove(false));
    this.pendingTimers.clear();
    this.activeComments.forEach((comment) => {
      comment.destroyTimer?.remove(false);
      comment.destroy();
    });
    this.activeComments.clear();
    this.liveChatComments.length = 0;
  }

  destroy() {
    this.clear();
  }

  private emitBurst(
    comments: readonly string[],
    count: number,
    staggerMs: number,
    options: Partial<DanmakuStyle> = {},
  ) {
    for (let index = 0; index < count; index += 1) {
      const timer = this.scene.time.delayedCall(index * staggerMs, () => {
        this.pendingTimers.delete(timer);
        if (this.mode === "liveChat") {
          this.emitLiveChat(comments[index % comments.length], options);
        } else {
          this.emit(comments[index % comments.length], options);
        }
      });
      this.pendingTimers.add(timer);
    }
  }

  private emit(message: string, options: Partial<DanmakuStyle> = {}) {
    const style = {
      color: options.color ?? "#f8fafc",
      stroke: options.stroke ?? "#020617",
      fontSize: options.fontSize ?? 22,
      duration: options.duration ?? 4300,
    };
    const y = this.getLaneY();
    const comment = this.scene.add
      .text(this.width + 48, y, message, {
        fontFamily: "monospace",
        fontSize: `${style.fontSize}px`,
        color: style.color,
        stroke: style.stroke,
        strokeThickness: 5,
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(180)
      .setShadow(2, 2, "#000000", 2, true, true) as ActiveComment;

    this.activeComments.add(comment);
    const targetX = -comment.width - 72;
    this.scene.tweens.add({
      targets: comment,
      x: targetX,
      duration: style.duration + Phaser.Math.Between(-450, 450),
      ease: "Linear",
      onComplete: () => this.removeComment(comment),
    });
    comment.destroyTimer = this.scene.time.delayedCall(style.duration + 1200, () => this.removeComment(comment));
  }

  private emitCenterBurst(
    comments: readonly string[],
    count: number,
    staggerMs: number,
    options: Partial<DanmakuStyle> = {},
  ) {
    for (let index = 0; index < count; index += 1) {
      const timer = this.scene.time.delayedCall(index * staggerMs, () => {
        this.pendingTimers.delete(timer);
        if (this.mode === "liveChat") {
          this.emitLiveChat(comments[index % comments.length], options);
        } else {
          this.emitCenter(comments[index % comments.length], index, options);
        }
      });
      this.pendingTimers.add(timer);
    }
  }

  private emitLiveChat(message: string, options: Partial<DanmakuStyle> = {}) {
    const style = {
      color: options.color ?? "#f8fafc",
      stroke: options.stroke ?? "#020617",
      fontSize: Math.max(15, Math.round((options.fontSize ?? 22) * 0.72)),
      duration: Math.max(4200, options.duration ?? 5200),
    };
    const lineHeight = style.fontSize + 12;
    const x = 24;
    const bottomY = this.height - 86;
    const topY = 96;
    this.liveChatComments.forEach((comment) => {
      this.scene.tweens.add({
        targets: comment,
        y: comment.y - lineHeight,
        duration: 170,
        ease: "Sine.easeOut",
      });
    });

    const comment = this.scene.add
      .text(x, bottomY, message, {
        fontFamily: "monospace",
        fontSize: `${style.fontSize}px`,
        color: style.color,
        stroke: style.stroke,
        strokeThickness: 4,
        backgroundColor: "rgba(2, 6, 23, 0.58)",
        padding: { x: 8, y: 4 },
        wordWrap: { width: Math.min(380, this.width * 0.36), useAdvancedWrap: true },
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(182)
      .setAlpha(0)
      .setShadow(1, 1, "#000000", 2, true, true) as ActiveComment;

    this.activeComments.add(comment);
    this.liveChatComments.push(comment);
    this.scene.tweens.add({
      targets: comment,
      alpha: 0.96,
      x: x + 10,
      duration: 160,
      ease: "Sine.easeOut",
    });
    this.trimLiveChat(topY);
    comment.destroyTimer = this.scene.time.delayedCall(style.duration, () => this.fadeLiveChatComment(comment));
  }

  private trimLiveChat(topY: number) {
    while (this.liveChatComments.length > 0 && (this.liveChatComments[0].y < topY || this.liveChatComments.length > 15)) {
      const comment = this.liveChatComments[0];
      this.removeComment(comment);
    }
  }

  private fadeLiveChatComment(comment: ActiveComment) {
    if (!this.activeComments.has(comment)) {
      return;
    }

    this.scene.tweens.add({
      targets: comment,
      alpha: 0,
      x: comment.x - 16,
      duration: 240,
      ease: "Sine.easeIn",
      onComplete: () => this.removeComment(comment),
    });
  }

  private emitCenter(message: string, index: number, options: Partial<DanmakuStyle> = {}) {
    const style = {
      color: options.color ?? "#f8fafc",
      stroke: options.stroke ?? "#020617",
      fontSize: options.fontSize ?? 24,
      duration: options.duration ?? 2600,
    };
    const ring = Math.floor(index / 7);
    const angle = Phaser.Math.DegToRad(index * 137 + Phaser.Math.Between(-12, 12));
    const radius = Phaser.Math.Between(10 + ring * 20, 54 + ring * 34);
    const x = this.width / 2 + Math.cos(angle) * radius;
    const y = this.height / 2 + Math.sin(angle) * radius * 0.62;
    const comment = this.scene.add
      .text(x, y, message, {
        fontFamily: "monospace",
        fontSize: `${style.fontSize + Phaser.Math.Between(-3, 4)}px`,
        color: style.color,
        stroke: style.stroke,
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(181 + (index % 6))
      .setAlpha(0)
      .setScale(0.35)
      .setAngle(Phaser.Math.Between(-8, 8))
      .setShadow(2, 2, "#000000", 2, true, true) as ActiveComment;

    this.activeComments.add(comment);
    this.scene.tweens.add({
      targets: comment,
      alpha: { from: 0, to: 0.94 },
      scale: { from: 0.35, to: Phaser.Math.FloatBetween(0.96, 1.22) },
      duration: 180,
      ease: "Back.easeOut",
    });
    this.scene.tweens.add({
      targets: comment,
      alpha: 0,
      scale: "+=0.28",
      duration: 520,
      delay: style.duration + Phaser.Math.Between(-260, 260),
      ease: "Sine.easeIn",
      onComplete: () => this.removeComment(comment),
    });
    comment.destroyTimer = this.scene.time.delayedCall(style.duration + 1100, () => this.removeComment(comment));
  }

  private getLaneY() {
    const laneCount = 12;
    const top = 92;
    const bottom = this.height - 88;
    const laneHeight = (bottom - top) / Math.max(1, laneCount - 1);
    const lane = this.nextLane % laneCount;
    this.nextLane += Phaser.Math.Between(1, 3);
    return top + lane * laneHeight + Phaser.Math.Between(-8, 8);
  }

  private removeComment(comment: ActiveComment) {
    if (!this.activeComments.has(comment)) {
      return;
    }

    comment.destroyTimer?.remove(false);
    this.activeComments.delete(comment);
    const liveIndex = this.liveChatComments.indexOf(comment);
    if (liveIndex >= 0) {
      this.liveChatComments.splice(liveIndex, 1);
    }
    comment.destroy();
  }
}

type DanmakuStyle = {
  color: string;
  stroke: string;
  fontSize: number;
  duration: number;
};
