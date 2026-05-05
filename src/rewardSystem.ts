import Phaser from "phaser";
import { ENEMY_DEFINITIONS, ITEM_DEFINITIONS, type EnemyType, type ItemType, type ScoreState } from "./assets";

const POWERUP_DURATION_MS = 9000;
const POWER_SPEED_MULTIPLIER = 1.28;
const POWER_JUMP_MULTIPLIER = 1.18;
const DASH_RING_VELOCITY_X = 720;
const DASH_RING_BOOST_MS = 900;
const ENEMY_STOMP_COMBO_MS = 1400;
const DEFAULT_ENEMY_STOMP_SCORE = 10;

export class RewardSystem {
  private score: ScoreState = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0, coin: 0 };
  private bonusScore = 0;
  private speedPowerUntil = 0;
  private jumpPowerUntil = 0;
  private starPowerUntil = 0;
  private dashRingBoostUntil = 0;
  private damageTaken = 0;
  private collectedCoins = 0;
  private enemyStompCombo = 0;
  private lastEnemyStompAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getPlayer: () => Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    private readonly onScoreChanged: () => void,
    private readonly onScoreMilestone: () => void,
  ) {}

  reset() {
    this.score = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0, coin: 0 };
    this.bonusScore = 0;
    this.speedPowerUntil = 0;
    this.jumpPowerUntil = 0;
    this.starPowerUntil = 0;
    this.dashRingBoostUntil = 0;
    this.damageTaken = 0;
    this.collectedCoins = 0;
    this.enemyStompCombo = 0;
    this.lastEnemyStompAt = 0;
  }

  resetStompComboOnLanding() {
    this.enemyStompCombo = 0;
  }

  noteDamage() {
    this.damageTaken += 1;
  }

  isStarActive(now = this.scene.time.now) {
    return now < this.starPowerUntil;
  }

  getInvulnerableUntil() {
    return this.starPowerUntil;
  }

  getSpeedMultiplier(now = this.scene.time.now) {
    return (now < this.speedPowerUntil ? POWER_SPEED_MULTIPLIER : 1) * (now < this.dashRingBoostUntil ? POWER_SPEED_MULTIPLIER : 1);
  }

  getJumpMultiplier(now = this.scene.time.now) {
    return now < this.jumpPowerUntil ? POWER_JUMP_MULTIPLIER : 1;
  }

  collectItem(itemType: ItemType, points: number) {
    if (points > 0) {
      this.score[itemType] = (this.score[itemType] ?? 0) + points;
    }
    if (itemType === "coin") {
      this.collectedCoins += 1;
    }
    this.applyPowerup(itemType);
    this.onScoreChanged();
    this.onScoreMilestone();
  }

  applyBonusBlockReward(itemType: ItemType, x: number, y: number) {
    const definition = ITEM_DEFINITIONS[itemType];
    this.collectItem(itemType, definition.points);
    const rewardSprite = this.scene.add.image(x, y, definition.key).setDisplaySize(46, 46).setDepth(0.4);
    this.scene.tweens.add({
      targets: rewardSprite,
      y: y - 38,
      alpha: 0,
      duration: 720,
      ease: "Sine.easeOut",
      onComplete: () => rewardSprite.destroy(),
    });
  }

  addEnemyDefeatScore(enemy: Phaser.Physics.Arcade.Sprite) {
    this.enemyStompCombo = this.scene.time.now - this.lastEnemyStompAt <= ENEMY_STOMP_COMBO_MS ? this.enemyStompCombo + 1 : 1;
    this.lastEnemyStompAt = this.scene.time.now;
    const points = this.getEnemyStompScore(enemy) * this.enemyStompCombo;
    this.bonusScore += points;
    this.onScoreChanged();
    this.onScoreMilestone();
    this.showFloatingText(enemy.x, enemy.y - 48, `+${points}${this.enemyStompCombo > 1 ? ` x${this.enemyStompCombo}` : ""}`);
  }

  private getEnemyStompScore(enemy: Phaser.Physics.Arcade.Sprite) {
    const enemyType = enemy.getData("enemyType") as EnemyType | undefined;
    if (!enemyType || !(enemyType in ENEMY_DEFINITIONS)) {
      return DEFAULT_ENEMY_STOMP_SCORE;
    }

    const configuredScore = ENEMY_DEFINITIONS[enemyType].stompScore;
    return configuredScore ?? DEFAULT_ENEMY_STOMP_SCORE;
  }

  showFloatingText(x: number, y: number, text: string) {
    const popup = this.scene.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fde68a",
      })
      .setOrigin(0.5)
      .setDepth(120)
      .setShadow(1, 1, "#020617", 3, true, true);

    this.scene.tweens.add({
      targets: popup,
      y: y - 34,
      alpha: 0,
      duration: 720,
      ease: "Sine.easeOut",
      onComplete: () => popup.destroy(),
    });
  }

  getItemScore() {
    return Object.values(this.score).reduce((sum, value) => sum + (value ?? 0), this.bonusScore);
  }

  getClearRank(finalScore: number, remainingMs: number, gameTimeMs: number) {
    const noDamageBonus = this.damageTaken === 0 ? 1 : 0;
    const speedBonus = remainingMs >= gameTimeMs * 0.55 ? 1 : 0;
    const scoreBonus = finalScore >= 4200 ? 1 : finalScore >= 2600 ? 0.5 : 0;
    const rankScore = noDamageBonus + speedBonus + scoreBonus;
    if (rankScore >= 2.5) {
      return "S";
    }
    if (rankScore >= 1.5) {
      return "A";
    }
    if (rankScore >= 0.5) {
      return "B";
    }
    return "C";
  }

  getMissionSummary(remainingMs: number, gameTimeMs: number) {
    const noDamage = this.damageTaken === 0 ? "NO DMG OK" : `DMG ${this.damageTaken}`;
    const coins = `COIN ${this.collectedCoins}`;
    const speed = remainingMs >= gameTimeMs * 0.55 ? "FAST OK" : "FAST --";
    return `${noDamage}  ${coins}  ${speed}`;
  }

  private applyPowerup(itemType: ItemType) {
    const player = this.getPlayer();
    if (itemType === "powerSpeed") {
      this.speedPowerUntil = this.scene.time.now + POWERUP_DURATION_MS;
      this.showFloatingText(player.x, player.y - 110, "SPEED UP");
    } else if (itemType === "powerJump") {
      this.jumpPowerUntil = this.scene.time.now + POWERUP_DURATION_MS;
      this.showFloatingText(player.x, player.y - 110, "JUMP UP");
    } else if (itemType === "star") {
      this.starPowerUntil = this.scene.time.now + POWERUP_DURATION_MS;
      this.scene.cameras.main.flash(180, 255, 226, 90);
      this.showFloatingText(player.x, player.y - 110, "STAR");
    } else if (itemType === "dashRing") {
      this.dashRingBoostUntil = this.scene.time.now + DASH_RING_BOOST_MS;
      const direction = player.flipX ? -1 : 1;
      player.setVelocityX(direction * DASH_RING_VELOCITY_X);
      this.showFloatingText(player.x, player.y - 110, "DASH");
    }
  }
}
