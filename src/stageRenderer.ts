import Phaser from "phaser";
import {
  PLATFORM_ASSETS,
  PROP_ASSETS,
  type PlatformAsset,
  type PlatformRunPlacement,
  type StageDefinition,
  type StageDecorationPlacement,
  type StreetLampKey,
  type StreetLampPlacement,
} from "./assets";
import type { ResolvedStageConstants } from "./stageConstants";
import { STAGE_OBJECT_TOP_PLATFORMS } from "./stageObjectPlatforms";

const PLATFORM_UNIT_WIDTH = 64;
const PLATFORM_UNIT_HEIGHT = 32;
const PLATFORM_DEPTH = -0.55;
const DECORATION_DEPTH = -1.2;
const STREET_LAMP_LIGHT_DEPTH = DECORATION_DEPTH - 0.08;
const STREET_LAMP_GROUND_LIGHT_DEPTH = PLATFORM_DEPTH + 0.02;

export type MovingPlatformInstance = {
  body: Phaser.Physics.Arcade.Image;
  visuals: Phaser.GameObjects.Image[];
  startX: number;
  startY: number;
  width: number;
  height: number;
  axis: "x" | "y";
  distance: number;
  speed: number;
  direction: 1 | -1;
};

type StageRenderOptions = {
  scene: Phaser.Scene;
  stage: StageDefinition;
  stageConstants: ResolvedStageConstants;
  platforms: Phaser.Physics.Arcade.StaticGroup;
  movingPlatforms: Phaser.Physics.Arcade.Group;
  movingPlatformInstances: MovingPlatformInstance[];
  decorationPlatforms: Phaser.Physics.Arcade.StaticGroup;
  trackStageObject: <T extends Phaser.GameObjects.GameObject>(object: T) => T;
};

export const renderStageObjects = (options: StageRenderOptions) => {
  buildStage(options);
  createStreetLamps(options);
  createStageObjects(options);
};

const buildStage = (options: StageRenderOptions) => {
  options.stage.platforms.forEach((platform) => {
    if (platform.moving && platform.collides !== false) {
      addMovingPlatformRun(options, platform);
      return;
    }

    addPlatformRun(options, options.platforms, platform.x, platform.y, platform.units, platform.collides ?? true);
  });
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

const addMovingPlatformRun = (options: StageRenderOptions, platform: PlatformRunPlacement) => {
  const moving = platform.moving;
  if (!moving) {
    return;
  }

  const width = platform.units * PLATFORM_UNIT_WIDTH;
  const visuals = createPlatformVisuals(options, platform.x, platform.y, platform.units);
  const body = options.movingPlatforms.create(platform.x + width / 2, platform.y + PLATFORM_UNIT_HEIGHT / 2, "platform-hitbox") as Phaser.Physics.Arcade.Image;
  const arcadeBody = body.body as Phaser.Physics.Arcade.Body;
  body.setScale(width, PLATFORM_UNIT_HEIGHT);
  body.setVisible(false);
  body.setImmovable(true);
  body.setPushable(false);
  arcadeBody.setAllowGravity(false);

  const rawDistance = platform.moving?.distance ?? 0;
  const distance = Number.isFinite(rawDistance) ? rawDistance : 0;
  const rawSpeed = platform.moving?.speed ?? 0;
  const speed = Math.max(0, Number.isFinite(rawSpeed) ? rawSpeed : 0);
  const direction: 1 | -1 = distance >= 0 ? 1 : -1;
  if (speed > 0 && distance !== 0) {
    body.setVelocity(
      moving.axis === "x" ? speed * direction : 0,
      moving.axis === "y" ? speed * direction : 0,
    );
  }

  options.movingPlatformInstances.push({
    body,
    visuals,
    startX: platform.x,
    startY: platform.y,
    width,
    height: PLATFORM_UNIT_HEIGHT,
    axis: moving.axis,
    distance,
    speed,
    direction,
  });
};

const createPlatformVisuals = (options: StageRenderOptions, x: number, y: number, units: number) => {
  const visuals: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < units; i += 1) {
    let texture: PlatformAsset = PLATFORM_ASSETS.middle;
    if (units === 1) {
      texture = PLATFORM_ASSETS.single;
    } else if (i === 0) {
      texture = PLATFORM_ASSETS.left;
    } else if (i === units - 1) {
      texture = PLATFORM_ASSETS.right;
    }

    const image = options.trackStageObject(
      options.scene.add.image(x + i * PLATFORM_UNIT_WIDTH, y, texture).setOrigin(0, 0).setDepth(PLATFORM_DEPTH),
    );
    visuals.push(image);
  }
  return visuals;
};

export const updateMovingPlatforms = (instances: MovingPlatformInstance[], isActive: boolean) => {
  instances.forEach((platform) => {
    if (!platform.body.active) {
      return;
    }

    if (!isActive || platform.speed <= 0 || platform.distance === 0) {
      platform.body.setVelocity(0, 0);
      syncMovingPlatformVisuals(platform);
      return;
    }

    const endX = platform.startX + (platform.axis === "x" ? platform.distance : 0);
    const endY = platform.startY + (platform.axis === "y" ? platform.distance : 0);
    const currentX = platform.body.x - platform.width / 2;
    const currentY = platform.body.y - platform.height / 2;
    const axisStart = platform.axis === "x" ? platform.startX : platform.startY;
    const axisEnd = platform.axis === "x" ? endX : endY;
    const axisCurrent = platform.axis === "x" ? currentX : currentY;
    const min = Math.min(axisStart, axisEnd);
    const max = Math.max(axisStart, axisEnd);

    if (platform.direction > 0 && axisCurrent >= max) {
      platform.direction = -platform.direction as 1 | -1;
      const clampedX = platform.axis === "x" ? max : currentX;
      const clampedY = platform.axis === "y" ? max : currentY;
      platform.body.setPosition(clampedX + platform.width / 2, clampedY + platform.height / 2);
    } else if (platform.direction < 0 && axisCurrent <= min) {
      platform.direction = -platform.direction as 1 | -1;
      const clampedX = platform.axis === "x" ? min : currentX;
      const clampedY = platform.axis === "y" ? min : currentY;
      platform.body.setPosition(clampedX + platform.width / 2, clampedY + platform.height / 2);
    }

    platform.body.setVelocity(
      platform.axis === "x" ? platform.speed * platform.direction : 0,
      platform.axis === "y" ? platform.speed * platform.direction : 0,
    );
    syncMovingPlatformVisuals(platform);
  });
};

const syncMovingPlatformVisuals = (platform: MovingPlatformInstance) => {
  const x = platform.body.x - platform.width / 2;
  const y = platform.body.y - platform.height / 2;
  platform.visuals.forEach((visual, index) => {
    visual.setPosition(x + index * PLATFORM_UNIT_WIDTH, y);
  });
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
