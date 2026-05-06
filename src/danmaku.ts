import Phaser from "phaser";
import type { Locale } from "./i18n";

type DanmakuCommentSet = {
  scoreMilestone: readonly string[];
  crouchHold: readonly string[];
  jumpChain: readonly string[];
  afkIdle: readonly string[];
  miss: readonly string[];
  timeUp: readonly string[];
};

type LiveChatUser = {
  icon: string;
  name: string;
};

const DANMAKU_COMMENTS: Record<Locale, DanmakuCommentSet> = {
  en: {
    scoreMilestone: ["Nice 1000!", "Score 1000!!", "Big score energy", "888888888888", "Clean pace", "The run is heating up", "Keep it rolling", "Bonus route spotted", "That was sharp", "Still going strong"],
    crouchHold: ["Camera, please behave", "Pause frame detected", "The crouch tech", "Respectful camera angle", "Replay that moment", "Officially suspicious", "Fans are watching", "Careful there", "That was close", "Saving clip..."],
    jumpChain: ["Air time!", "Is this a platformer or flight sim?", "Too many jumps!", "Floating nicely", "Please land eventually", "Sky route unlocked", "Jump chain continues", "Gravity is optional", "Feather feet", "That rhythm is good"],
    afkIdle: ["BRB moment?", "Did the stream freeze?", "Standing very still", "Tactical thinking time", "Controller disconnected?", "Snack break?", "We wait together", "Still there?", "The suspense", "AFK but stylish"],
    miss: ["Ah!", "Down she goes", "That was painful", "Footing betrayed her", "Reset magic time", "Next one is the run", "Nobody saw that", "Ground check failed", "So close", "One more try!"],
    timeUp: ["Time is gone", "The clock was watching", "0.00 seconds...", "No overtime today", "So close to the bell", "Time attack is cruel", "Run it back", "The clock wins", "Almost made it", "TIME UP", "Next run will be cleaner", "One more attempt"],
  },
  ja: {
    scoreMilestone: ["???1000??????", "1000????", "888888888888", "?????", "???????", "?????", "???????", "????", "?????", "??????"],
    crouchHold: ["???????", "???????", "???????", "????????", "?????????", "?????", "?????????", "?????", "??????????", "????"],
    jumpChain: ["???????", "????????", "????????", "????????", "???????", "???????", "???????", "???????", "????", "??????"],
    afkIdle: ["?????????", "??????????", "??????????", "?????", "????????", "??????????", "???????", "?????", "?????????", "????????"],
    miss: ["??", "?????", "?????", "??????", "?????", "?????", "????????", "????", "??????", "?????"],
    timeUp: ["??????", "????????", "0.00???", "????????", "?????????", "???????", "??????", "???????", "????????", "????????", "???????", "TIME UP"],
  },
  zh: {
    scoreMilestone: ["1000????", "???", "888888888", "????", "??????", "?????", "???", "????"],
    crouchHold: ["??????", "??????", "??????", "?????", "????", "????", "???", "????"],
    jumpChain: ["?????", "???????", "?????", "????", "??????", "????", "????", "????"],
    afkIdle: ["???", "??????", "?????", "?????", "?????", "?????", "????", "?????"],
    miss: ["??", "????", "????", "????", "??", "?????", "????", "???"],
    timeUp: ["?????", "????????", "0.00?", "????", "?????", "????", "????", "TIME UP"],
  },
  ko: {
    scoreMilestone: ["1000? ??!", "??!", "888888888", "??? ???", "?? ??? ?", "??? ??", "?? ??", "?? ???"],
    crouchHold: ["??? ???", "?? ??", "?? crouch tech", "??? ??", "???? ?????", "????", "???? ?", "??? ??"],
    jumpChain: ["?? ??!", "??? ?? ??", "?? ?? ???", "?? ??", "?? ?? ??", "?? ??", "?? ?? ??", "?? ??"],
    afkIdle: ["?? ???", "?? ?? ??", "?? ????", "?? ?? ?", "???? ????", "???? ?", "?? ???", "?? ?? ???"],
    miss: ["?!", "????", "?? ??", "??? ????", "???", "?? ??", "??? ??", "????"],
    timeUp: ["??? ??!", "??? ???", "0.00?", "??? ????", "???? ???", "? ?? ??", "?? ???", "TIME UP"],
  },
};

const LIVE_CHAT_USERS: Record<Locale, readonly LiveChatUser[]> = {
  en: [{ icon: "?", name: "zannen_fan" }, { icon: "?", name: "SisterWatcher" }, { icon: "?", name: "stage_maker" }, { icon: "?", name: "neon_runner" }, { icon: "?", name: "first_timer" }],
  ja: [{ icon: "?", name: "?????" }, { icon: "?", name: "????????" }, { icon: "?", name: "??????" }, { icon: "?", name: "?????" }, { icon: "?", name: "????" }],
  zh: [{ icon: "?", name: "?????" }, { icon: "?", name: "?????" }, { icon: "?", name: "????" }, { icon: "?", name: "????" }, { icon: "?", name: "????" }],
  ko: [{ icon: "?", name: "????" }, { icon: "?", name: "??????" }, { icon: "?", name: "??????" }, { icon: "?", name: "????" }, { icon: "?", name: "????" }],
};

const LIVE_CHAT_EMOJI_BOMBS: Record<Locale, readonly string[]> = {
  en: ["??????????", "??????????", "?????", "??????????", "8888888888 ????", "NICE!! ???"],
  ja: ["??????????", "??????????", "?????", "??????????", "8888888888 ????", "???????"],
  zh: ["??????????", "??????????", "?????", "??????????", "8888888888 ????", "??????"],
  ko: ["??????????", "??????????", "?????", "??????????", "8888888888 ????", "??! ???"],
};

type ActiveComment = Phaser.GameObjects.Text & {
  destroyTimer?: Phaser.Time.TimerEvent;
};

export type DanmakuMode = "classic" | "liveChat" | "none";

export class DanmakuOverlay {
  private readonly scene: Phaser.Scene;
  private readonly width: number;
  private readonly height: number;
  private readonly activeComments = new Set<ActiveComment>();
  private readonly deathStackComments: ActiveComment[] = [];
  private readonly liveChatComments: ActiveComment[] = [];
  private readonly pendingTimers = new Set<Phaser.Time.TimerEvent>();
  private nextLane = 0;
  private nextLiveChatUser = 0;
  private mode: DanmakuMode = "classic";

  constructor(scene: Phaser.Scene, width: number, height: number, private readonly getLocale: () => Locale = () => "en") {
    this.scene = scene;
    this.width = width;
    this.height = height;
  }

  setMode(mode: DanmakuMode) {
    this.mode = mode;
    if (mode === "none") {
      this.clear();
    }
  }

  emitScoreMilestone() {
    this.emitBurst(this.getComments().scoreMilestone, 20, 75, {
      color: "#ffffff",
      stroke: "#0f766e",
      fontSize: 27,
      duration: 4400,
    });
  }

  emitCrouchHold() {
    this.emitBurst(this.getComments().crouchHold, 18, 80, {
      color: "#fff7ed",
      stroke: "#7c2d12",
      fontSize: 26,
      duration: 4200,
    });
  }

  emitJumpChain() {
    this.emitBurst(this.getComments().jumpChain, 18, 80, {
      color: "#e0f2fe",
      stroke: "#075985",
      fontSize: 26,
      duration: 4200,
    });
  }

  emitAfkIdle() {
    this.emitBurst(this.getComments().afkIdle, 16, 92, {
      color: "#fef3c7",
      stroke: "#713f12",
      fontSize: 25,
      duration: 4300,
    });
  }

  emitMiss() {
    const style = {
      color: "#fecdd3",
      stroke: "#881337",
      fontSize: 27,
      duration: 3800,
    };
    if (this.mode === "liveChat") {
      this.emitBurst(this.getComments().miss, 16, 85, style);
      return;
    }

    this.emitDeathReaction(this.getComments().miss);
  }

  emitTimeUp() {
    const style = {
      color: "#fef08a",
      stroke: "#7f1d1d",
      fontSize: 29,
      duration: 3800,
    };
    if (this.mode === "liveChat") {
      this.emitBurst(this.getComments().timeUp, 16, 85, style);
      return;
    }

    this.emitDeathReaction(this.getComments().timeUp);
  }

  clear() {
    this.pendingTimers.forEach((timer) => timer.remove(false));
    this.pendingTimers.clear();
    this.activeComments.forEach((comment) => {
      comment.destroyTimer?.remove(false);
      comment.destroy();
    });
    this.activeComments.clear();
    this.deathStackComments.length = 0;
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
    if (this.mode === "none") {
      return;
    }

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

  private emitDeathReaction(comments: readonly string[]) {
    const waves = [
      { delay: 0, rows: [0] },
      { delay: 430, rows: [-2.25, 2.25, 0.9] },
      { delay: 850, rows: [-4.2, -3.15, 3.1, 4.2] },
      { delay: 1260, rows: [-1.25, 0.25, 1.65, 3.75, -3.75] },
    ];
    waves.forEach((wave) => {
      wave.rows.forEach((row, rowIndex) => {
        const timer = this.scene.time.delayedCall(wave.delay + rowIndex * 58, () => {
          this.pendingTimers.delete(timer);
          this.emitDeathReactionComment(comments[Phaser.Math.Between(0, comments.length - 1)], row);
        });
        this.pendingTimers.add(timer);
      });
    });
  }

  private emitDeathReactionComment(message: string, row: number) {
    const comment = this.scene.add
      .text(this.width / 2 + Phaser.Math.Between(-18, 18), this.height / 2 + row * 72, message, {
        fontFamily: "monospace",
        fontSize: `${Phaser.Math.Between(38, 48)}px`,
        fontStyle: "bold",
        color: "#ff1744",
        stroke: "#000000",
        strokeThickness: 9,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(184 + Phaser.Math.Between(0, 5))
      .setAlpha(0.96)
      .setShadow(2, 2, "#000000", 2, true, true) as ActiveComment;

    this.activeComments.add(comment);
    this.deathStackComments.push(comment);
    while (this.deathStackComments.length > 10) {
      this.removeComment(this.deathStackComments[0]);
    }
    comment.destroyTimer = this.scene.time.delayedCall(5200, () => this.removeComment(comment));
  }

  private emitCenterBurst(
    comments: readonly string[],
    count: number,
    staggerMs: number,
    options: Partial<DanmakuStyle> = {},
  ) {
    if (this.mode === "none") {
      return;
    }

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
    const displayMessage = this.resolveLiveChatMessage(message);
    const style = {
      color: options.color ?? "#f8fafc",
      stroke: options.stroke ?? "#020617",
      fontSize: Math.max(15, Math.round((options.fontSize ?? 22) * 0.72)),
      duration: Math.max(4200, options.duration ?? 5200),
    };
    const x = 24;
    const bottomY = this.height - 86;
    const topY = 96;
    const user = this.getNextLiveChatUser();

    const comment = this.scene.add
      .text(x, bottomY, `${user.icon} ${user.name}：${displayMessage}`, {
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
    this.layoutLiveChatComments(bottomY, topY, false);
    this.scene.tweens.add({
      targets: comment,
      alpha: 0.96,
      x: x + 10,
      duration: 160,
      ease: "Sine.easeOut",
    });
    comment.destroyTimer = this.scene.time.delayedCall(style.duration, () => this.fadeLiveChatComment(comment));
  }

  private resolveLiveChatMessage(message: string) {
    const emojiBombs = this.getEmojiBombs();
    if (Phaser.Math.Between(1, 100) <= 24) {
      return emojiBombs[Phaser.Math.Between(0, emojiBombs.length - 1)];
    }
    if (Phaser.Math.Between(1, 100) <= 18) {
      return `${message} ${emojiBombs[Phaser.Math.Between(0, emojiBombs.length - 1)]}`;
    }
    return message;
  }

  private getNextLiveChatUser() {
    const users = this.getLiveChatUsers();
    const user = users[this.nextLiveChatUser % users.length];
    this.nextLiveChatUser += Phaser.Math.Between(1, 2);
    return user;
  }

  private getComments() {
    return DANMAKU_COMMENTS[this.getLocale()] ?? DANMAKU_COMMENTS.en;
  }

  private getLiveChatUsers() {
    return LIVE_CHAT_USERS[this.getLocale()] ?? LIVE_CHAT_USERS.en;
  }

  private getEmojiBombs() {
    return LIVE_CHAT_EMOJI_BOMBS[this.getLocale()] ?? LIVE_CHAT_EMOJI_BOMBS.en;
  }

  private layoutLiveChatComments(bottomY = this.height - 86, topY = 96, animate = true) {
    let cursorY = bottomY;
    for (let index = this.liveChatComments.length - 1; index >= 0; index -= 1) {
      const comment = this.liveChatComments[index];
      const targetY = cursorY;
      if (animate) {
        this.scene.tweens.add({
          targets: comment,
          y: targetY,
          duration: 170,
          ease: "Sine.easeOut",
        });
      } else {
        comment.setY(targetY);
      }
      cursorY -= comment.height + 8;
    }

    while (
      this.liveChatComments.length > 0 &&
      (this.liveChatComments[0].y - this.liveChatComments[0].height < topY || this.liveChatComments.length > 12)
    ) {
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
    const deathStackIndex = this.deathStackComments.indexOf(comment);
    if (deathStackIndex >= 0) {
      this.deathStackComments.splice(deathStackIndex, 1);
    }
    comment.destroy();
    if (liveIndex >= 0) {
      this.layoutLiveChatComments();
    }
  }
}

type DanmakuStyle = {
  color: string;
  stroke: string;
  fontSize: number;
  duration: number;
};
