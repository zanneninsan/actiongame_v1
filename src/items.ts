import Phaser from "phaser";
import {
  ITEM_DEFINITIONS,
  ITEM_GLOW_COLORS,
  ITEM_GLOW_TEXTURE_KEY,
  type ItemPlacement,
  type ItemType,
} from "./assets";

type CreateItemsOptions = {
  scene: Phaser.Scene;
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  placements: readonly ItemPlacement[];
  canCollect: () => boolean;
  onCollect: (type: ItemType, points: number) => void;
  trackStageObject: <T extends Phaser.GameObjects.GameObject>(object: T) => T;
};

export const createItems = (options: CreateItemsOptions) => {
  const items = options.scene.physics.add.staticGroup();
  createItemGlowTexture(options.scene);
  populateItems({
    scene: options.scene,
    itemsGroup: items,
    placements: options.placements,
    trackStageObject: options.trackStageObject,
  });

  options.scene.physics.add.overlap(options.player, items, (_, itemObject) => {
    collectItem(options.scene, itemObject as Phaser.Physics.Arcade.Sprite, options.canCollect, options.onCollect);
  });

  return items;
};

export const populateItems = (options: {
  scene: Phaser.Scene;
  itemsGroup?: Phaser.Physics.Arcade.StaticGroup;
  placements: readonly ItemPlacement[];
  trackStageObject: <T extends Phaser.GameObjects.GameObject>(object: T) => T;
}) => {
  const itemsGroup = options.itemsGroup;
  if (!itemsGroup) {
    return;
  }

  options.placements.forEach((placement) => {
    createItemSprite(options.scene, itemsGroup, placement, options.trackStageObject);
  });
};

const createItemSprite = (
  scene: Phaser.Scene,
  itemsGroup: Phaser.Physics.Arcade.StaticGroup,
  placement: ItemPlacement,
  trackStageObject: <T extends Phaser.GameObjects.GameObject>(object: T) => T,
) => {
  const definition = ITEM_DEFINITIONS[placement.type];
  const glow = trackStageObject(
    scene.add
      .image(placement.x, placement.y, ITEM_GLOW_TEXTURE_KEY)
      .setDisplaySize(108, 108)
      .setTint(ITEM_GLOW_COLORS[placement.type])
      .setAlpha(0.48)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(0.1),
  );
  const item = itemsGroup.create(placement.x, placement.y, definition.key) as Phaser.Physics.Arcade.Sprite;
  item.setData("itemType", placement.type);
  item.setData("glow", glow);
  item.setDisplaySize(48, 48);
  item.setDepth(0.2);
  item.refreshBody();

  scene.tweens.add({
    targets: glow,
    alpha: 0.72,
    scale: 1.16,
    duration: 950,
    ease: "Sine.easeInOut",
    yoyo: true,
    repeat: -1,
    delay: (placement.x % 700) + (placement.y % 180),
  });
};

const createItemGlowTexture = (scene: Phaser.Scene) => {
  if (scene.textures.exists(ITEM_GLOW_TEXTURE_KEY)) {
    return;
  }

  const size = 96;
  const center = size / 2;
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let radius = center; radius > 0; radius -= 3) {
    const strength = 1 - radius / center;
    graphics.fillStyle(0xffffff, 0.018 + strength * 0.055);
    graphics.fillCircle(center, center, radius);
  }

  graphics.generateTexture(ITEM_GLOW_TEXTURE_KEY, size, size);
  graphics.destroy();
};

const collectItem = (
  scene: Phaser.Scene,
  item: Phaser.Physics.Arcade.Sprite,
  canCollect: () => boolean,
  onCollect: (type: ItemType, points: number) => void,
) => {
  if (!item.active || !canCollect()) {
    return;
  }

  const itemType = item.getData("itemType") as ItemType;
  const definition = ITEM_DEFINITIONS[itemType];
  onCollect(itemType, definition.points);
  scene.sound.play("item-pickup", { volume: 0.65 });
  const glow = item.getData("glow") as Phaser.GameObjects.Image | undefined;
  if (glow) {
    scene.tweens.killTweensOf(glow);
    glow.destroy();
  }
  item.disableBody(true, true);
};
