import Phaser from "phaser";
import {
  PLATFORM_ASSETS,
  PROP_ASSETS,
  type PlatformAsset,
  type StageDefinition,
  type StageDecorationPlacement,
  type StreetLampKey,
  type StreetLampPlacement,
} from "./assets";
import type { ResolvedStageConstants } from "./stageConstants";
import { STAGE_OBJECT_TOP_PLATFORMS } from "./stageObjectPlatforms";

const TILE = 32;
const PLATFORM_UNIT_WIDTH = 64;
const PLATFORM_UNIT_HEIGHT = 32;
const PLATFORM_DEPTH = -0.55;
const DECORATION_DEPTH = -1.2;
const STREET_LAMP_LIGHT_DEPTH = DECORATION_DEPTH - 0.08;
const STREET_LAMP_GROUND_LIGHT_DEPTH = PLATFORM_DEPTH + 0.02;

type StageRenderOptions = {
  scene: Phaser.Scene;
  stage: StageDefinition;
  stageConstants: ResolvedStageConstants;
  platforms: Phaser.Physics.Arcade.StaticGroup;
  decorationPlatforms: Phaser.Physics.Arcade.StaticGroup;
  trackStageObject: <T extends Phaser.GameObjects.GameObject>(object: T) => T;
};

export const renderStageObjects = (options: StageRenderOptions) => {
  buildStage(options);
  createStreetLamps(options);
  createStageObjects(options);
};

const buildStage = (options: StageRenderOptions) => {
  for (let x = 0; x < options.stage.worldWidth; x += TILE) {
    addBlock(options.platforms, x, options.stageConstants.groundTopY, "ground", false);
  }

  addPlatformRun(
    options,
    options.platforms,
    0,
    options.stageConstants.groundVisualY,
    Math.ceil(options.stage.worldWidth / PLATFORM_UNIT_WIDTH) + 1,
    false,
  );
  options.stage.platforms.forEach((platform) => {
    addPlatformRun(options, options.platforms, platform.x, platform.y, platform.units, platform.collides ?? true);
  });
};

const addBlock = (
  platforms: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  texture: string,
  visible = true,
) => {
  const block = platforms.create(x + TILE / 2, y + TILE / 2, texture);
  block.setVisible(visible);
  block.refreshBody();
};

const addPlatformRun = (
  options: StageRenderOptions,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  units: number,
  collides = true,
) => {
  for (let i = 0; i < units; i += 1) {
    let texture: PlatformAsset = PLATFORM_ASSETS.middle;
    if (units === 1) {
      texture = PLATFORM_ASSETS.single;
    } else if (i === 0) {
      texture = PLATFORM_ASSETS.left;
    } else if (i === units - 1) {
      texture = PLATFORM_ASSETS.right;
    }

    const unitX = x + i * PLATFORM_UNIT_WIDTH;
    options.trackStageObject(options.scene.add.image(unitX, y, texture).setOrigin(0, 0).setDepth(PLATFORM_DEPTH));
    if (collides) {
      addPlatformHitbox(platforms, unitX, y, PLATFORM_UNIT_WIDTH, PLATFORM_UNIT_HEIGHT);
    }
  }
};

const createStreetLamps = (options: StageRenderOptions) => {
  options.stage.streetLamps.forEach((lamp) => {
    createStreetLamp(options, lamp);
  });
};

const createStreetLamp = (options: StageRenderOptions, lamp: StreetLampPlacement) => {
  const scale = lamp.scale ?? 1;
  createStreetLampLight(options, lamp.x, lamp.key, scale);
  options.trackStageObject(
    options.scene.add
      .image(lamp.x, options.stageConstants.streetLampGroundY, lamp.key)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setDepth(DECORATION_DEPTH),
  );
  addDecorationTopPlatform(options, lamp.x, options.stageConstants.streetLampGroundY, lamp.key, scale);
};

const createStreetLampLight = (options: StageRenderOptions, x: number, key: StreetLampKey, scale: number) => {
  const isDoubleLamp = key === PROP_ASSETS.lampDouble;
  const sourceY = options.stageConstants.streetLampGroundY - 420 * scale;
  const groundY = options.stageConstants.streetLampGroundY - 5;
  const sources = isDoubleLamp ? [-92 * scale, 92 * scale] : [32 * scale];

  sources.forEach((offsetX) => {
    const sourceX = x + offsetX;
    const beamHalfWidth = (isDoubleLamp ? 150 : 190) * scale;
    const poolWidth = (isDoubleLamp ? 210 : 250) * scale;
    const light = options.trackStageObject(options.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD));

    light.fillStyle(0xffefad, 0.12);
    light.fillTriangle(sourceX, sourceY, sourceX - beamHalfWidth, groundY, sourceX + beamHalfWidth, groundY);
    light.fillStyle(0xfff4c7, 0.07);
    light.fillTriangle(
      sourceX,
      sourceY - 8 * scale,
      sourceX - beamHalfWidth * 0.72,
      groundY,
      sourceX + beamHalfWidth * 0.72,
      groundY,
    );
    light.setDepth(STREET_LAMP_LIGHT_DEPTH);

    const groundLight = options.trackStageObject(options.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD));
    groundLight.fillStyle(0xffe7a3, 0.17);
    groundLight.fillEllipse(sourceX, groundY + 2, poolWidth, 26 * scale);
    groundLight.fillStyle(0xfff8d2, 0.1);
    groundLight.fillEllipse(sourceX, groundY + 1, poolWidth * 0.58, 12 * scale);
    groundLight.setDepth(STREET_LAMP_GROUND_LIGHT_DEPTH);
  });
};

const createStageObjects = (options: StageRenderOptions) => {
  options.stage.decorations.forEach((object) => {
    createStageDecoration(options, object);
  });
};

const createStageDecoration = (options: StageRenderOptions, object: StageDecorationPlacement) => {
  const scale = object.scale ?? 1;
  const y = object.y ?? options.stageConstants.groundTopY;
  options.trackStageObject(
    options.scene.add.image(object.x, y, object.key).setOrigin(0.5, 1).setScale(scale).setDepth(DECORATION_DEPTH),
  );
  addDecorationTopPlatform(options, object.x, y, object.key, scale);
};

const addDecorationTopPlatform = (options: StageRenderOptions, x: number, y: number, key: string, scale: number) => {
  const platforms = STAGE_OBJECT_TOP_PLATFORMS[key];
  if (!platforms) {
    return;
  }

  const source = options.scene.textures.get(key).getSourceImage() as { width: number; height: number };
  platforms.forEach((platform) => {
    const platformX = x - (source.width * scale) / 2 + platform.x * scale;
    const platformY = y - source.height * scale + platform.y * scale;
    addPlatformHitbox(
      options.decorationPlatforms,
      platformX,
      platformY,
      platform.width * scale,
      platform.height * scale,
    );
  });
};

const addPlatformHitbox = (
  platforms: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const block = platforms.create(x + width / 2, y + height / 2, "platform-hitbox");
  block.setDisplaySize(width, height);
  block.setVisible(false);
  block.refreshBody();
};
