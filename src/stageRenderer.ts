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
const MOVING_PLATFORM_VERTICAL_CARRY_TOLERANCE = 64;

export type MovingPlatformInstance = {
  body: Phaser.Physics.Arcade.Image;
  visuals: Phaser.GameObjects.Image[];
  startX: number;
  startY: number;
  previousX: number;
  previousY: number;
  deltaX: number;
  deltaY: number;
  width: number;
  height: number;
  axis: "x" | "y" | "xy";
  distance: number;
  distanceY: number;
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
  const textureKey = getMovingPlatformHitboxTextureKey(options.scene, width, PLATFORM_UNIT_HEIGHT);
  const body = options.movingPlatforms.create(platform.x + width / 2, platform.y + PLATFORM_UNIT_HEIGHT / 2, textureKey) as Phaser.Physics.Arcade.Image;
  const arcadeBody = body.body as Phaser.Physics.Arcade.Body;
  body.setVisible(false);
  body.setImmovable(true);
  body.setPushable(false);
  arcadeBody.setAllowGravity(false);
  arcadeBody.setFriction(1, 0);
  arcadeBody.friction.set(1, 0);
  arcadeBody.setDirectControl(true);

  const rawDistance = platform.moving?.distance ?? 0;
  const distance = Number.isFinite(rawDistance) ? rawDistance : 0;
  const rawDistanceY = platform.moving?.distanceY ?? distance;
  const distanceY = moving.axis === "xy" && Number.isFinite(rawDistanceY) ? rawDistanceY : 0;
  const rawSpeed = platform.moving?.speed ?? 0;
  const speed = Math.max(0, Number.isFinite(rawSpeed) ? rawSpeed : 0);
  const primaryDistance = moving.axis === "xy" && distance === 0 ? distanceY : distance;
  const direction: 1 | -1 = primaryDistance >= 0 ? 1 : -1;
  options.movingPlatformInstances.push({
    body,
    visuals,
    startX: platform.x,
    startY: platform.y,
    previousX: body.x,
    previousY: body.y,
    deltaX: 0,
    deltaY: 0,
    width,
    height: PLATFORM_UNIT_HEIGHT,
    axis: moving.axis,
    distance,
    distanceY,
    speed,
    direction,
  });
};

const getMovingPlatformHitboxTextureKey = (scene: Phaser.Scene, width: number, height: number) => {
  const key = `platform-hitbox-${width}x${height}`;
  if (!scene.textures.exists(key)) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
  return key;
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

export const updateMovingPlatforms = (instances: MovingPlatformInstance[], isActive: boolean, deltaMs: number) => {
  instances.forEach((platform) => {
    if (!platform.body.active) {
      return;
    }

    if (!isActive || platform.speed <= 0 || (platform.distance === 0 && platform.distanceY === 0)) {
      platform.body.setVelocity(0, 0);
      platform.deltaX = 0;
      platform.deltaY = 0;
      platform.previousX = platform.body.x;
      platform.previousY = platform.body.y;
      syncMovingPlatformVisuals(platform);
      return;
    }

    const endX = platform.startX + getMovingPlatformDistanceX(platform);
    const endY = platform.startY + getMovingPlatformDistanceY(platform);
    const currentX = platform.body.x - platform.width / 2;
    const currentY = platform.body.y - platform.height / 2;
    const nextPosition = getNextMovingPlatformPosition(platform, currentX, currentY, endX, endY, deltaMs);
    platform.body.setPosition(nextPosition.x + platform.width / 2, nextPosition.y + platform.height / 2);
    platform.deltaX = nextPosition.x - currentX;
    platform.deltaY = nextPosition.y - currentY;
    platform.previousX = platform.body.x;
    platform.previousY = platform.body.y;
    syncMovingPlatformVisuals(platform);
  });
};

const getNextMovingPlatformPosition = (
  platform: MovingPlatformInstance,
  currentX: number,
  currentY: number,
  endX: number,
  endY: number,
  deltaMs: number,
) => {
  const targetX = platform.direction > 0 ? endX : platform.startX;
  const targetY = platform.direction > 0 ? endY : platform.startY;
  const remainingX = targetX - currentX;
  const remainingY = targetY - currentY;
  const remainingLength = Math.hypot(remainingX, remainingY);

  if (remainingLength <= 0.001) {
    platform.direction = -platform.direction as 1 | -1;
    return { x: currentX, y: currentY };
  }

  const stepLength = Math.min(platform.speed * Math.min(deltaMs, 50) / 1000, remainingLength);
  const nextX = currentX + (remainingX / remainingLength) * stepLength;
  const nextY = currentY + (remainingY / remainingLength) * stepLength;
  const reachedTarget = stepLength >= remainingLength - 0.001;
  if (reachedTarget) {
    platform.direction = -platform.direction as 1 | -1;
    return { x: targetX, y: targetY };
  }

  return { x: nextX, y: nextY };
};

export const carryPlayerOnDescendingMovingPlatforms = (
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  instances: MovingPlatformInstance[],
  isActive: boolean,
) => {
  if (!isActive || !player.body) {
    return;
  }

  const playerBody = player.body;
  const platform = findDescendingMovingPlatformUnderPlayer(playerBody, instances);

  if (!platform) {
    return;
  }

  const platformTop = platform.body.y - platform.height / 2;
  const bodyBottom = playerBody.y + playerBody.height;
  const targetDeltaY = Math.max(platform.deltaY, platformTop - bodyBottom);
  if (targetDeltaY <= 0) {
    return;
  }

  const currentBodyY = playerBody.y;
  player.setY(player.y + targetDeltaY);
  if (playerBody.velocity.y > 0) {
    player.setVelocityY(0);
  }
  player.body.updateFromGameObject();
  playerBody.prev.y += playerBody.y - currentBodyY;
  playerBody.prevFrame.y += playerBody.y - currentBodyY;
};

export const isPlayerSupportedByDescendingMovingPlatform = (
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  instances: MovingPlatformInstance[],
  isActive: boolean,
) => {
  return Boolean(isActive && player.body && findDescendingMovingPlatformUnderPlayer(player.body, instances));
};

const findDescendingMovingPlatformUnderPlayer = (
  playerBody: Phaser.Physics.Arcade.Body,
  instances: MovingPlatformInstance[],
) => {
  return instances.find((candidate) => {
    if (candidate.deltaY <= 0 || !candidate.body.active) {
      return false;
    }

    const platformLeft = candidate.body.x - candidate.width / 2;
    const platformRight = platformLeft + candidate.width;
    const platformTop = candidate.body.y - candidate.height / 2;
    const playerLeft = playerBody.x;
    const playerRight = playerBody.x + playerBody.width;
    const playerBottom = playerBody.y + playerBody.height;
    const horizontalOverlap = playerRight > platformLeft + 4 && playerLeft < platformRight - 4;
    const verticalGap = platformTop - playerBottom;
    const isOnOrJustAbovePlatform =
      verticalGap >= -MOVING_PLATFORM_VERTICAL_CARRY_TOLERANCE &&
      verticalGap <= Math.max(MOVING_PLATFORM_VERTICAL_CARRY_TOLERANCE, candidate.deltaY + MOVING_PLATFORM_VERTICAL_CARRY_TOLERANCE);
    return horizontalOverlap && isOnOrJustAbovePlatform;
  });
};

const getMovingPlatformDistanceX = (platform: MovingPlatformInstance) => {
  return platform.axis === "x" || platform.axis === "xy" ? platform.distance : 0;
};

const getMovingPlatformDistanceY = (platform: MovingPlatformInstance) => {
  return platform.axis === "y" ? platform.distance : platform.axis === "xy" ? platform.distanceY : 0;
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
