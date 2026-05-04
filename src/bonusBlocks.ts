import Phaser from "phaser";
import { type BonusBlockPlacement, type ItemType } from "./assets";

const BLOCK_SIZE = 64;
const HIT_TOLERANCE = 18;

type BonusBlockOptions = {
  scene: Phaser.Scene;
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  placements: readonly BonusBlockPlacement[];
  onReward: (type: ItemType, x: number, y: number) => void;
};

export const createBonusBlocks = (options: BonusBlockOptions) => {
  const blocks = options.scene.physics.add.staticGroup();
  populateBonusBlocks({ scene: options.scene, blocksGroup: blocks, placements: options.placements });
  options.scene.physics.add.collider(options.player, blocks, (_, blockObject) => {
    hitBonusBlock(options.scene, options.player, blockObject as Phaser.Physics.Arcade.Image, options.onReward);
  });
  return blocks;
};

export const populateBonusBlocks = (options: {
  scene: Phaser.Scene;
  blocksGroup?: Phaser.Physics.Arcade.StaticGroup;
  placements: readonly BonusBlockPlacement[];
}) => {
  if (!options.blocksGroup) {
    return;
  }

  options.placements.forEach((placement) => {
    const key = placement.type === "hidden" ? "stage-hidden-block" : "stage-question-block";
    const block = options.blocksGroup!.create(placement.x, placement.y, key) as Phaser.Physics.Arcade.Image;
    block.setDisplaySize(BLOCK_SIZE, BLOCK_SIZE);
    block.setDepth(0.05);
    block.setData("blockType", placement.type);
    block.setData("reward", placement.reward);
    block.setData("used", false);
    if (placement.type === "hidden") {
      block.setVisible(false);
      block.setAlpha(0);
    }
    block.refreshBody();
  });
};

const hitBonusBlock = (
  scene: Phaser.Scene,
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  block: Phaser.Physics.Arcade.Image,
  onReward: (type: ItemType, x: number, y: number) => void,
) => {
  const playerBody = player.body;
  const blockBody = block.body as Phaser.Physics.Arcade.StaticBody | undefined;
  if (!playerBody || !blockBody || block.getData("used")) {
    return;
  }

  const previousTop = playerBody.prev.y;
  const blockBottom = blockBody.y + blockBody.height;
  const hitFromBelow = playerBody.velocity.y <= 0 && previousTop >= blockBottom - HIT_TOLERANCE;
  if (!hitFromBelow) {
    return;
  }

  block.setData("used", true);
  block.setVisible(true).setAlpha(1).setTexture("stage-hidden-block").setTint(0xb6a58b);
  player.setVelocityY(120);
  const reward = block.getData("reward") as ItemType;
  onReward(reward, block.x, block.y - BLOCK_SIZE);
  scene.tweens.add({
    targets: block,
    y: block.y - 8,
    duration: 70,
    yoyo: true,
    ease: "Quad.easeOut",
    onComplete: () => block.refreshBody(),
  });
};
