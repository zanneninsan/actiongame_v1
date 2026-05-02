import Phaser from "phaser";
import "./styles.css";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const TILE = 32;
const WORLD_TOP = -360;
const WORLD_BOTTOM = 720;
const WORLD_HEIGHT = WORLD_BOTTOM - WORLD_TOP;
const ASSET_BASE = import.meta.env.BASE_URL;
const DEBUG_VERSION = "v0.1.21";
const RAINBOW_PIPELINE_KEY = "RainbowWinPipeline";
const HUD_PANEL_TEXTURE_KEY = "hud-panel";
const GAME_TIME_SECONDS = 360;
const TIME_BONUS_PER_SECOND = 10;
const PLATFORM_UNIT_WIDTH = 64;
const PLATFORM_UNIT_HEIGHT = 32;
const GROUND_TOP_Y = 672;
const GROUND_VISUAL_Y = GROUND_TOP_Y;
const STREET_LAMP_GROUND_Y = 672;
const PLATFORM_DEPTH = -0.55;
const DECORATION_DEPTH = -1.2;
const STREET_LAMP_LIGHT_DEPTH = DECORATION_DEPTH - 0.08;
const STREET_LAMP_GROUND_LIGHT_DEPTH = PLATFORM_DEPTH + 0.02;
const PLAYER_DISPLAY_WIDTH = 320;
const PLAYER_DISPLAY_HEIGHT = 260;
const PLAYER_BODY_WIDTH = 52;
const PLAYER_BODY_HEIGHT = 164;
const PLAYER_BODY_OFFSET_X = 134;
const PLAYER_BODY_OFFSET_Y = 86;
const PLAYER_IDLE_FRAME_COUNT = 8;
const PLAYER_FRAME_COUNT = 13;
const GROUND_ACCELERATION = 2400;
const AIR_ACCELERATION = 720;
const GROUND_DRAG = 2400;
const AIR_DRAG = 120;
const MAX_RUN_SPEED = 380;
const MAX_FALL_SPEED = 680;
const JUMP_VELOCITY = -560;
const BOOSTED_JUMP_VELOCITY = -635;
const BOOST_JUMP_SPEED_THRESHOLD = 285;
const PLATFORM_ASSETS = {
  left: "platform-unit-left",
  middle: "platform-unit-middle",
  right: "platform-unit-right",
  single: "platform-unit-single",
} as const;
const PROP_ASSETS = {
  lampSingle: "street-lamp-single",
  lampDouble: "street-lamp-double",
} as const;
type StreetLampKey = (typeof PROP_ASSETS)[keyof typeof PROP_ASSETS];
type ItemType = "energyDrink" | "shoppingBag" | "bubbleTea";
const ITEM_GLOW_TEXTURE_KEY = "item-soft-glow";
const ITEM_GLOW_COLORS: Record<ItemType, number> = {
  energyDrink: 0x8cffd2,
  shoppingBag: 0xffd166,
  bubbleTea: 0xf9a8ff,
};
type ScoreState = Record<ItemType, number>;
type PlatformAsset = (typeof PLATFORM_ASSETS)[keyof typeof PLATFORM_ASSETS];
type StageObjectAsset = { key: string; path: string };
type MobileInputKey = "w" | "a" | "s" | "d";
type PlatformRunPlacement = { x: number; y: number; units: number; collides?: boolean };
type StreetLampPlacement = { x: number; key: StreetLampKey; scale: number };
type StageDecorationPlacement = { x: number; y: number; key: string; scale: number };
type ItemPlacement = { type: ItemType; x: number; y: number };
type ControlMode = "pc" | "mobile";
type FullscreenTarget = HTMLElement & {
  msRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type StageDefinition = {
  name: string;
  worldWidth: number;
  playerStart: { x: number; y: number };
  goal: { x: number; y: number };
  platforms: PlatformRunPlacement[];
  streetLamps: StreetLampPlacement[];
  decorations: StageDecorationPlacement[];
  items: ItemPlacement[];
};

const RAINBOW_FRAGMENT_SHADER = `
#define SHADER_NAME RAINBOW_WIN_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform float uTime;
varying vec2 outTexCoord;
varying vec4 outTint;

vec3 rainbow(float t) {
  vec3 phase = vec3(0.0, 0.33, 0.67);
  return 0.55 + 0.45 * cos(6.28318 * (t + phase));
}

void main () {
  vec4 texture = texture2D(uMainSampler, outTexCoord);
  if (texture.a < 0.08) {
    discard;
  }

  float band = fract(outTexCoord.x * 1.85 + uTime * 1.6);
  float shine = smoothstep(0.18, 0.0, abs(fract(band * 3.0) - 0.5));
  float luminance = dot(texture.rgb, vec3(0.299, 0.587, 0.114));
  vec3 rainbowColor = rainbow(band) * (0.58 + luminance * 0.9 + shine * 0.35);
  vec3 color = mix(texture.rgb, rainbowColor, 0.82);
  float alpha = smoothstep(0.08, 0.42, texture.a) * texture.a * outTint.a;
  gl_FragColor = vec4(color * outTint.rgb, alpha);
}
`;

class RainbowWinPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader: RAINBOW_FRAGMENT_SHADER,
    });
  }

  onPreRender() {
    this.set1f("uTime", this.game.loop.time / 1000);
  }
}

const STAGE_OBJECT_ASSETS = [
  { key: "stage-props-traffic-cone", path: "assets/stage_objects/props_traffic_cone.webp" },
  { key: "stage-props-construction-barricade", path: "assets/stage_objects/props_construction_barricade.webp" },
  { key: "stage-props-roadwork-sign", path: "assets/stage_objects/props_roadwork_sign.webp" },
  { key: "stage-props-sidewalk-sign", path: "assets/stage_objects/props_sidewalk_sign.webp" },
  { key: "stage-props-park-bench", path: "assets/stage_objects/props_park_bench.webp" },
  { key: "stage-props-trash-bin", path: "assets/stage_objects/props_trash_bin.webp" },
  { key: "stage-props-planter-box", path: "assets/stage_objects/props_planter_box.webp" },
  { key: "stage-props-bike-rack", path: "assets/stage_objects/props_bike_rack.webp" },
  { key: "stage-props-bus-stop-sign", path: "assets/stage_objects/props_bus_stop_sign.webp" },
  { key: "stage-props-vending-machine", path: "assets/stage_objects/props_vending_machine.webp" },
  { key: "stage-props-utility-box", path: "assets/stage_objects/props_utility_box.webp" },
  { key: "stage-props-guard-rail", path: "assets/stage_objects/props_guard_rail.webp" },
  { key: "stage-structures-bus-shelter", path: "assets/stage_objects/structures_bus_shelter.webp" },
  { key: "stage-structures-phone-booth", path: "assets/stage_objects/structures_phone_booth.webp" },
  { key: "stage-structures-street-kiosk", path: "assets/stage_objects/structures_street_kiosk.webp" },
  { key: "stage-structures-shutter-storefront", path: "assets/stage_objects/structures_shutter_storefront.webp" },
  { key: "stage-structures-subway-stairs", path: "assets/stage_objects/structures_subway_stairs.webp" },
  { key: "stage-structures-concrete-pillar", path: "assets/stage_objects/structures_concrete_pillar.webp" },
  { key: "stage-structures-construction-fence", path: "assets/stage_objects/structures_construction_fence.webp" },
  { key: "stage-structures-chainlink-fence", path: "assets/stage_objects/structures_chainlink_fence.webp" },
  { key: "stage-structures-vending-kiosk", path: "assets/stage_objects/structures_vending_kiosk.webp" },
  { key: "stage-structures-station-wall-railing", path: "assets/stage_objects/structures_station_wall_railing.webp" },
  { key: "stage-structures-station-entrance", path: "assets/stage_objects/structures_station_entrance.webp" },
] as const satisfies readonly StageObjectAsset[];

const ITEM_DEFINITIONS: Record<ItemType, { key: string; label: string; points: number; assetPath: string }> = {
  energyDrink: {
    key: "item-energy-drink",
    label: "ENERGY",
    points: 100,
    assetPath: "assets/items/energy_drink.png",
  },
  shoppingBag: {
    key: "item-shopping-bag",
    label: "BAG",
    points: 250,
    assetPath: "assets/items/shopping_bag.png",
  },
  bubbleTea: {
    key: "item-bubble-tea",
    label: "TEA",
    points: 150,
    assetPath: "assets/items/bubble_tea.png",
  },
};

const ORIGINAL_DOWNTOWN_STAGE: StageDefinition = {
  name: "Original Downtown",
  worldWidth: 16800,
  playerStart: { x: 120, y: 552 },
  goal: { x: 16620, y: 568 },
  platforms: [
    { x: 360, y: 548, units: 4 },
    { x: 744, y: 488, units: 7 },
    { x: 1160, y: 548, units: 3 },
    { x: 1288, y: 500, units: 3 },
    { x: 1580, y: 456, units: 6 },
    { x: 1980, y: 548, units: 10 },
    { x: 2200, y: 420, units: 3 },
    { x: 2392, y: 372, units: 3 },
    { x: 2584, y: 324, units: 4 },
    { x: 2920, y: 292, units: 3 },
    { x: 3112, y: 244, units: 3 },
    { x: 3304, y: 196, units: 4 },
    { x: 3540, y: 300, units: 1 },
    { x: 3720, y: 560, units: 7 },
    { x: 4280, y: 520, units: 5 },
    { x: 4700, y: 460, units: 4 },
    { x: 5000, y: 560, units: 7 },
    { x: 5380, y: 420, units: 3 },
    { x: 5600, y: 360, units: 3 },
    { x: 5880, y: 300, units: 4 },
    { x: 6260, y: 500, units: 5 },
    { x: 6620, y: 420, units: 4 },
    { x: 6960, y: 548, units: 8 },
    { x: 7350, y: 480, units: 3 },
    { x: 7600, y: 400, units: 4 },
    { x: 7900, y: 560, units: 6 },
    { x: 8380, y: 520, units: 5 },
    { x: 8740, y: 440, units: 4 },
    { x: 9060, y: 332, units: 3 },
    { x: 9360, y: 212, units: 4 },
    { x: 9720, y: 112, units: 3 },
    { x: 10080, y: 260, units: 5 },
    { x: 10480, y: 420, units: 4 },
    { x: 10820, y: 560, units: 8 },
    { x: 11380, y: 468, units: 4 },
    { x: 11720, y: 340, units: 3 },
    { x: 12020, y: 188, units: 4 },
    { x: 12460, y: 308, units: 3 },
    { x: 12860, y: 512, units: 7 },
    { x: 13380, y: 420, units: 3 },
    { x: 13680, y: 268, units: 4 },
    { x: 14040, y: 128, units: 3 },
    { x: 14460, y: 360, units: 5 },
    { x: 14920, y: 548, units: 9 },
    { x: 15480, y: 460, units: 4 },
    { x: 15840, y: 340, units: 3 },
    { x: 16240, y: 560, units: 6 },
  ],
  streetLamps: [
    { x: 260, key: PROP_ASSETS.lampSingle, scale: 0.68 },
    { x: 910, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 1500, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 2140, key: PROP_ASSETS.lampDouble, scale: 0.66 },
    { x: 2860, key: PROP_ASSETS.lampSingle, scale: 0.68 },
    { x: 3440, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 4040, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 4540, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 5200, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 5850, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 6480, key: PROP_ASSETS.lampSingle, scale: 0.68 },
    { x: 7160, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 7820, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 8460, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 9180, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 9840, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 10560, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 11280, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 11960, key: PROP_ASSETS.lampSingle, scale: 0.68 },
    { x: 12640, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 13320, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 14020, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 14740, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 15460, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 16220, key: PROP_ASSETS.lampSingle, scale: 0.68 },
  ],
  decorations: [
    { x: 540, y: GROUND_TOP_Y, key: "stage-props-park-bench", scale: 0.9 },
    { x: 705, y: GROUND_TOP_Y, key: "stage-props-trash-bin", scale: 0.9 },
    { x: 1050, y: GROUND_TOP_Y, key: "stage-props-guard-rail", scale: 0.9 },
    { x: 1320, y: 548, key: "stage-props-traffic-cone", scale: 0.72 },
    { x: 1710, y: 456, key: "stage-props-planter-box", scale: 0.72 },
    { x: 2065, y: GROUND_TOP_Y, key: "stage-structures-bus-shelter", scale: 0.72 },
    { x: 2460, y: GROUND_TOP_Y, key: "stage-props-bus-stop-sign", scale: 0.85 },
    { x: 2705, y: 324, key: "stage-props-construction-barricade", scale: 0.64 },
    { x: 3020, y: GROUND_TOP_Y, key: "stage-props-vending-machine", scale: 0.8 },
    { x: 3360, y: GROUND_TOP_Y, key: "stage-structures-phone-booth", scale: 0.78 },
    { x: 3860, y: GROUND_TOP_Y, key: "stage-structures-subway-stairs", scale: 0.68 },
    { x: 4380, y: GROUND_TOP_Y, key: "stage-props-bike-rack", scale: 0.82 },
    { x: 4740, y: GROUND_TOP_Y, key: "stage-structures-vending-kiosk", scale: 0.78 },
    { x: 5140, y: 560, key: "stage-props-utility-box", scale: 0.58 },
    { x: 5520, y: 420, key: "stage-props-roadwork-sign", scale: 0.58 },
    { x: 5910, y: GROUND_TOP_Y, key: "stage-structures-station-wall-railing", scale: 0.72 },
    { x: 6360, y: GROUND_TOP_Y, key: "stage-structures-construction-fence", scale: 0.62 },
    { x: 6800, y: 420, key: "stage-props-sidewalk-sign", scale: 0.58 },
    { x: 7160, y: GROUND_TOP_Y, key: "stage-structures-street-kiosk", scale: 0.62 },
    { x: 7540, y: 480, key: "stage-props-planter-box", scale: 0.62 },
    { x: 7960, y: GROUND_TOP_Y, key: "stage-structures-station-entrance", scale: 0.64 },
    { x: 8520, y: GROUND_TOP_Y, key: "stage-props-guard-rail", scale: 0.84 },
    { x: 8820, y: 440, key: "stage-props-trash-bin", scale: 0.58 },
    { x: 9320, y: 212, key: "stage-props-planter-box", scale: 0.56 },
    { x: 9800, y: 112, key: "stage-props-sidewalk-sign", scale: 0.52 },
    { x: 10180, y: GROUND_TOP_Y, key: "stage-structures-chainlink-fence", scale: 0.62 },
    { x: 10620, y: 420, key: "stage-props-utility-box", scale: 0.54 },
    { x: 11080, y: GROUND_TOP_Y, key: "stage-structures-bus-shelter", scale: 0.68 },
    { x: 11520, y: 468, key: "stage-props-bike-rack", scale: 0.58 },
    { x: 12080, y: 188, key: "stage-props-roadwork-sign", scale: 0.5 },
    { x: 12490, y: GROUND_TOP_Y, key: "stage-structures-shutter-storefront", scale: 0.64 },
    { x: 13080, y: 512, key: "stage-props-construction-barricade", scale: 0.56 },
    { x: 13680, y: 268, key: "stage-props-planter-box", scale: 0.54 },
    { x: 14110, y: 128, key: "stage-props-bus-stop-sign", scale: 0.58 },
    { x: 14580, y: GROUND_TOP_Y, key: "stage-structures-concrete-pillar", scale: 0.62 },
    { x: 15120, y: 548, key: "stage-props-vending-machine", scale: 0.62 },
    { x: 15560, y: GROUND_TOP_Y, key: "stage-structures-vending-kiosk", scale: 0.72 },
    { x: 15920, y: 340, key: "stage-props-traffic-cone", scale: 0.54 },
    { x: 16420, y: GROUND_TOP_Y, key: "stage-structures-station-wall-railing", scale: 0.68 },
  ],
  items: [
    { type: "energyDrink", x: 475, y: 492 },
    { type: "bubbleTea", x: 915, y: 432 },
    { type: "shoppingBag", x: 1285, y: 492 },
    { type: "energyDrink", x: 1750, y: 400 },
    { type: "bubbleTea", x: 2345, y: 288 },
    { type: "shoppingBag", x: 2720, y: 204 },
    { type: "energyDrink", x: 3185, y: 132 },
    { type: "bubbleTea", x: 3575, y: 236 },
    { type: "shoppingBag", x: 3925, y: 504 },
    { type: "energyDrink", x: 4385, y: 464 },
    { type: "bubbleTea", x: 4825, y: 404 },
    { type: "shoppingBag", x: 5085, y: 504 },
    { type: "energyDrink", x: 5485, y: 364 },
    { type: "bubbleTea", x: 5975, y: 244 },
    { type: "shoppingBag", x: 6425, y: 444 },
    { type: "energyDrink", x: 6745, y: 364 },
    { type: "bubbleTea", x: 7125, y: 492 },
    { type: "shoppingBag", x: 7465, y: 424 },
    { type: "energyDrink", x: 7775, y: 344 },
    { type: "bubbleTea", x: 8125, y: 504 },
    { type: "shoppingBag", x: 8460, y: 464 },
    { type: "energyDrink", x: 8830, y: 384 },
    { type: "bubbleTea", x: 9140, y: 276 },
    { type: "shoppingBag", x: 9460, y: 156 },
    { type: "energyDrink", x: 9810, y: 56 },
    { type: "bubbleTea", x: 10180, y: 204 },
    { type: "shoppingBag", x: 10570, y: 364 },
    { type: "energyDrink", x: 10980, y: 504 },
    { type: "bubbleTea", x: 11460, y: 412 },
    { type: "shoppingBag", x: 11820, y: 284 },
    { type: "energyDrink", x: 12120, y: 132 },
    { type: "bubbleTea", x: 12540, y: 252 },
    { type: "shoppingBag", x: 13020, y: 456 },
    { type: "energyDrink", x: 13440, y: 364 },
    { type: "bubbleTea", x: 13770, y: 212 },
    { type: "shoppingBag", x: 14120, y: 72 },
    { type: "energyDrink", x: 14540, y: 304 },
    { type: "bubbleTea", x: 15080, y: 492 },
    { type: "shoppingBag", x: 15560, y: 404 },
    { type: "energyDrink", x: 15920, y: 284 },
    { type: "bubbleTea", x: 16320, y: 504 },
  ],
};

const NEON_CANAL_STAGE: StageDefinition = {
  name: "Neon Canal",
  worldWidth: 12800,
  playerStart: { x: 120, y: 552 },
  goal: { x: 12580, y: 568 },
  platforms: [
    { x: 340, y: 548, units: 5 },
    { x: 760, y: 500, units: 4 },
    { x: 1100, y: 452, units: 3 },
    { x: 1430, y: 388, units: 4 },
    { x: 1880, y: 548, units: 6 },
    { x: 2320, y: 472, units: 3 },
    { x: 2620, y: 392, units: 5 },
    { x: 3120, y: 304, units: 4 },
    { x: 3580, y: 548, units: 8 },
    { x: 4300, y: 480, units: 4 },
    { x: 4700, y: 404, units: 3 },
    { x: 5020, y: 328, units: 3 },
    { x: 5380, y: 252, units: 4 },
    { x: 5900, y: 548, units: 7 },
    { x: 6480, y: 456, units: 5 },
    { x: 7040, y: 356, units: 4 },
    { x: 7480, y: 548, units: 5 },
    { x: 7960, y: 484, units: 3 },
    { x: 8320, y: 420, units: 3 },
    { x: 8700, y: 356, units: 4 },
    { x: 9240, y: 548, units: 8 },
    { x: 10040, y: 468, units: 4 },
    { x: 10480, y: 388, units: 3 },
    { x: 10880, y: 292, units: 5 },
    { x: 11580, y: 548, units: 10 },
  ],
  streetLamps: [
    { x: 260, key: PROP_ASSETS.lampSingle, scale: 0.68 },
    { x: 980, key: PROP_ASSETS.lampDouble, scale: 0.66 },
    { x: 1760, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 2780, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 3740, key: PROP_ASSETS.lampSingle, scale: 0.68 },
    { x: 4780, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 6060, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 7180, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 8200, key: PROP_ASSETS.lampSingle, scale: 0.68 },
    { x: 9440, key: PROP_ASSETS.lampDouble, scale: 0.64 },
    { x: 10880, key: PROP_ASSETS.lampSingle, scale: 0.66 },
    { x: 12100, key: PROP_ASSETS.lampDouble, scale: 0.66 },
  ],
  decorations: [
    { x: 560, y: GROUND_TOP_Y, key: "stage-props-bike-rack", scale: 0.82 },
    { x: 900, y: GROUND_TOP_Y, key: "stage-structures-bus-shelter", scale: 0.72 },
    { x: 1320, y: 452, key: "stage-props-planter-box", scale: 0.62 },
    { x: 1710, y: 388, key: "stage-props-sidewalk-sign", scale: 0.58 },
    { x: 2200, y: GROUND_TOP_Y, key: "stage-props-vending-machine", scale: 0.78 },
    { x: 2980, y: 392, key: "stage-props-roadwork-sign", scale: 0.56 },
    { x: 3440, y: 304, key: "stage-props-construction-barricade", scale: 0.62 },
    { x: 3950, y: GROUND_TOP_Y, key: "stage-structures-phone-booth", scale: 0.76 },
    { x: 4520, y: GROUND_TOP_Y, key: "stage-structures-vending-kiosk", scale: 0.76 },
    { x: 5200, y: 328, key: "stage-props-utility-box", scale: 0.56 },
    { x: 5680, y: 252, key: "stage-props-trash-bin", scale: 0.54 },
    { x: 6260, y: GROUND_TOP_Y, key: "stage-structures-chainlink-fence", scale: 0.64 },
    { x: 6800, y: 456, key: "stage-props-park-bench", scale: 0.68 },
    { x: 7340, y: 356, key: "stage-props-bus-stop-sign", scale: 0.62 },
    { x: 7740, y: GROUND_TOP_Y, key: "stage-structures-station-entrance", scale: 0.62 },
    { x: 8480, y: 420, key: "stage-props-planter-box", scale: 0.58 },
    { x: 9000, y: 356, key: "stage-props-traffic-cone", scale: 0.56 },
    { x: 9620, y: GROUND_TOP_Y, key: "stage-structures-street-kiosk", scale: 0.64 },
    { x: 10240, y: 468, key: "stage-props-guard-rail", scale: 0.72 },
    { x: 10680, y: 388, key: "stage-props-roadwork-sign", scale: 0.52 },
    { x: 11240, y: 292, key: "stage-structures-concrete-pillar", scale: 0.58 },
    { x: 11860, y: GROUND_TOP_Y, key: "stage-structures-station-wall-railing", scale: 0.68 },
    { x: 12320, y: GROUND_TOP_Y, key: "stage-structures-shutter-storefront", scale: 0.64 },
  ],
  items: [
    { type: "energyDrink", x: 480, y: 492 },
    { type: "bubbleTea", x: 900, y: 444 },
    { type: "shoppingBag", x: 1230, y: 396 },
    { type: "energyDrink", x: 1580, y: 332 },
    { type: "bubbleTea", x: 2140, y: 492 },
    { type: "shoppingBag", x: 2460, y: 416 },
    { type: "energyDrink", x: 2860, y: 336 },
    { type: "bubbleTea", x: 3260, y: 248 },
    { type: "shoppingBag", x: 3860, y: 492 },
    { type: "energyDrink", x: 4480, y: 424 },
    { type: "bubbleTea", x: 4840, y: 348 },
    { type: "shoppingBag", x: 5160, y: 272 },
    { type: "energyDrink", x: 5580, y: 196 },
    { type: "bubbleTea", x: 6120, y: 492 },
    { type: "shoppingBag", x: 6680, y: 400 },
    { type: "energyDrink", x: 7180, y: 300 },
    { type: "bubbleTea", x: 7640, y: 492 },
    { type: "shoppingBag", x: 8080, y: 428 },
    { type: "energyDrink", x: 8420, y: 364 },
    { type: "bubbleTea", x: 8860, y: 300 },
    { type: "shoppingBag", x: 9460, y: 492 },
    { type: "energyDrink", x: 10180, y: 412 },
    { type: "bubbleTea", x: 10600, y: 332 },
    { type: "shoppingBag", x: 11020, y: 236 },
    { type: "energyDrink", x: 11720, y: 492 },
    { type: "bubbleTea", x: 12240, y: 492 },
  ],
};

const STAGES = {
  originalDowntown: ORIGINAL_DOWNTOWN_STAGE,
  neonCanal: NEON_CANAL_STAGE,
};
const ACTIVE_STAGE = STAGES.neonCanal;
let extraTouchPointersAdded = false;

class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;
  private cityLoopBackground?: Phaser.GameObjects.TileSprite;
  private playerNameText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private countdownText?: Phaser.GameObjects.Text;
  private finalScoreText?: Phaser.GameObjects.Text;
  private mobileInput: Record<MobileInputKey, boolean> = { w: false, a: false, s: false, d: false };
  private mobileJumpQueued = false;
  private mobileControlCleanup: Array<() => void> = [];
  private score: ScoreState = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0 };
  private countdownTimer?: Phaser.Time.TimerEvent;
  private countdownReleaseTimer?: Phaser.Time.TimerEvent;
  private startTime = 0;
  private isRunActive = false;
  private setupComplete = false;
  private playerName = "PLAYER";
  private controlMode: ControlMode = "pc";
  private hasWon = false;
  private wasOnFloor = false;
  private isLanding = false;

  constructor() {
    super("prototype");
  }

  preload() {
    this.load.image(HUD_PANEL_TEXTURE_KEY, `${ASSET_BASE}assets/ui/hud_panel.png`);
    this.load.image("background-stars", `${ASSET_BASE}assets/backgrounds/starry_sky.webp`);
    this.load.image("background-city-loop", `${ASSET_BASE}assets/backgrounds/city_loop_strip.webp`);
    this.load.image(PLATFORM_ASSETS.left, `${ASSET_BASE}assets/platforms/platform_unit_left.webp`);
    this.load.image(PLATFORM_ASSETS.middle, `${ASSET_BASE}assets/platforms/platform_unit_middle.webp`);
    this.load.image(PLATFORM_ASSETS.right, `${ASSET_BASE}assets/platforms/platform_unit_right.webp`);
    this.load.image(PLATFORM_ASSETS.single, `${ASSET_BASE}assets/platforms/platform_unit_single.webp`);
    this.load.image(PROP_ASSETS.lampSingle, `${ASSET_BASE}assets/props/street_lamp_single.webp`);
    this.load.image(PROP_ASSETS.lampDouble, `${ASSET_BASE}assets/props/street_lamp_double.webp`);
    STAGE_OBJECT_ASSETS.forEach((asset) => {
      this.load.image(asset.key, `${ASSET_BASE}${asset.path}`);
    });
    Object.values(ITEM_DEFINITIONS).forEach((item) => {
      this.load.image(item.key, `${ASSET_BASE}${item.assetPath}`);
    });
    this.load.spritesheet("player-idle", `${ASSET_BASE}assets/sprites/player_idle_8_320x260.png`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-walk", `${ASSET_BASE}assets/sprites/player_walk_13_320x260.png`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.load.spritesheet("player-jump", `${ASSET_BASE}assets/sprites/player_jump_15_320x260.png`, {
      frameWidth: PLAYER_DISPLAY_WIDTH,
      frameHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.createPixelTexture("ground", TILE, TILE, 0x263244, 0x8bd3ff);
    this.createPixelTexture("platform", TILE, TILE, 0x384257, 0xf6c453);
    this.createPixelTexture("platform-hitbox", 1, 1, 0xffffff, 0xffffff);
    this.createPixelTexture("goal", 12, 48, 0xfb7185, 0x881337);
  }

  create() {
    this.registerRainbowPipeline();
    this.resetRunState();
    if (!extraTouchPointersAdded) {
      this.input.addPointer(4);
      extraTouchPointersAdded = true;
    }
    this.physics.world.setBounds(0, WORLD_TOP, ACTIVE_STAGE.worldWidth, WORLD_HEIGHT);
    this.createBackground();

    const platforms = this.physics.add.staticGroup();
    this.buildStage(platforms);
    this.createStreetLamps();
    this.createStageObjects();

    const goal = this.physics.add.staticImage(ACTIVE_STAGE.goal.x, ACTIVE_STAGE.goal.y, "goal");
    goal.setDisplaySize(24, 96);
    goal.setSize(24, 96);

    this.createPlayerAnimations();

    this.player = this.physics.add.sprite(ACTIVE_STAGE.playerStart.x, ACTIVE_STAGE.playerStart.y, "player-idle");
    this.player.setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
    this.player.setCollideWorldBounds(true);
    this.applyPlayerBody();
    this.player.setMaxVelocity(MAX_RUN_SPEED, MAX_FALL_SPEED);
    this.player.play("player-idle");
    this.wasOnFloor = true;
    this.player.on(`${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}player-land`, () => {
      this.isLanding = false;
    });

    this.physics.add.collider(this.player, platforms);
    this.physics.add.overlap(this.player, goal, () => this.win());
    this.createItems();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.cameras.main.setBounds(0, WORLD_TOP, ACTIVE_STAGE.worldWidth, WORLD_HEIGHT);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(260, 140);
    this.cameras.main.setBackgroundColor("#080b16");

    this.add
      .image(10, 8, HUD_PANEL_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setDisplaySize(560, 164)
      .setScrollFactor(0)
      .setDepth(96);

    this.playerNameText = this.add
      .text(34, 28, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#e0f2fe",
      })
      .setDepth(100)
      .setShadow(0, 0, "#22d3ee", 8, true, true)
      .setScrollFactor(0);

    this.statusText = this.add
      .text(34, 112, "A/D: move  W/Space: jump  R: restart", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#e5e7eb",
      })
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(34, 56, "", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#f8fafc",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateScoreText();

    this.timerText = this.add
      .text(34, 82, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fde68a",
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);
    this.updateTimerText();

    this.add
      .text(GAME_WIDTH - 8, 8, DEBUG_VERSION, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#cbd5e1",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setShadow(1, 1, "#020617", 2, true, true);

    this.input.keyboard!.off("keydown-R");
    this.input.keyboard!.on("keydown-R", () => this.restartStage());

    if (this.setupComplete) {
      this.startRun();
    } else {
      this.physics.pause();
      this.showStartModal();
    }
  }

  update() {
    this.applyPlayerBody();
    this.updateBackground();
    this.updateTimerText();
    if (!this.isRunActive) {
      this.player.setAcceleration(0, 0);
      this.player.setVelocity(0, 0);
      return;
    }

    const onFloor = this.player.body.blocked.down || this.player.body.touching.down;
    const left = this.keys.a.isDown || this.cursors.left.isDown || this.mobileInput.a;
    const right = this.keys.d.isDown || this.cursors.right.isDown || this.mobileInput.d;
    const debugJump = Phaser.Input.Keyboard.JustDown(this.keys.w) || this.mobileJumpQueued;
    this.mobileJumpQueued = false;
    const normalJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);
    const jump = debugJump || normalJump;
    const canJump = onFloor || debugJump;
    let startedJump = false;
    const horizontalAcceleration = onFloor ? GROUND_ACCELERATION : AIR_ACCELERATION;
    this.player.setDragX(onFloor ? GROUND_DRAG : AIR_DRAG);

    if (left) {
      this.player.setAccelerationX(-horizontalAcceleration);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setAccelerationX(horizontalAcceleration);
      this.player.setFlipX(false);
    } else {
      this.player.setAccelerationX(0);
    }

    if (jump && canJump) {
      const jumpVelocity =
        Math.abs(this.player.body.velocity.x) >= BOOST_JUMP_SPEED_THRESHOLD ? BOOSTED_JUMP_VELOCITY : JUMP_VELOCITY;
      this.player.setVelocityY(jumpVelocity);
      this.isLanding = false;
      startedJump = true;
      this.player.anims.play("player-jump-start", true);
    }

    const isMovingHorizontally = Math.abs(this.player.body.velocity.x) > 8;
    const landedThisFrame = !this.wasOnFloor && onFloor && !startedJump;

    if (landedThisFrame) {
      this.isLanding = true;
      this.player.anims.play("player-land", true);
    } else if (this.isLanding) {
      if (!this.player.anims.isPlaying) {
        this.isLanding = false;
      }
    } else if (startedJump) {
      this.player.anims.play("player-jump-start", true);
    } else if (!onFloor) {
      const currentAnimation = this.player.anims.currentAnim?.key;
      if (currentAnimation !== "player-jump-start" || !this.player.anims.isPlaying) {
        this.player.anims.play("player-air", true);
      }
    } else if (isMovingHorizontally) {
      this.player.anims.play("player-walk", true);
    } else {
      this.player.anims.play("player-idle", true);
    }

    this.wasOnFloor = onFloor;

    if (this.player.y > WORLD_BOTTOM + 32) {
      this.restartStage();
    }
  }

  private resetRunState() {
    this.removeStartModal();
    this.removeMobileControls();
    this.countdownTimer?.remove(false);
    this.countdownTimer = undefined;
    this.countdownReleaseTimer?.remove(false);
    this.countdownReleaseTimer = undefined;
    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.mobileInput = { w: false, a: false, s: false, d: false };
    this.mobileJumpQueued = false;
    this.score = { energyDrink: 0, shoppingBag: 0, bubbleTea: 0 };
    this.startTime = 0;
    this.isRunActive = false;
    this.hasWon = false;
    this.wasOnFloor = false;
    this.isLanding = false;
    this.finalScoreText = undefined;
  }

  private restartStage() {
    this.resetRunState();
    this.scene.restart();
  }

  private startRun() {
    this.removeStartModal();
    this.playerNameText.setText(`PLAYER:${this.playerName}`);
    this.statusText.setText(
      this.controlMode === "mobile" ? "TOUCH: move/jump  R: restart" : "A/D: move  W/Space: jump  R: restart",
    );
    if (this.controlMode === "mobile") {
      this.createMobileControls();
    }
    this.startCountdown();
  }

  private startCountdown() {
    this.physics.pause();
    this.isRunActive = false;
    this.startTime = 0;
    this.updateTimerText();

    const sequence = ["3", "2", "1", "GO!!"];
    let index = 0;
    this.countdownText?.destroy();
    this.countdownText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, sequence[index], {
        fontFamily: "monospace",
        fontSize: "96px",
        color: "#fef3c7",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(220)
      .setShadow(0, 0, "#22d3ee", 16, true, true);

    this.countdownTimer?.remove(false);
    this.countdownTimer = this.time.addEvent({
      delay: 900,
      repeat: sequence.length - 1,
      callback: () => {
        index += 1;
        if (!this.countdownText) {
          return;
        }

        this.countdownText.setText(sequence[index]);
        this.tweens.add({
          targets: this.countdownText,
          scale: { from: 1.18, to: 1 },
          alpha: { from: 0.72, to: 1 },
          duration: 180,
          ease: "Sine.easeOut",
        });

        if (index === sequence.length - 1) {
          this.countdownReleaseTimer = this.time.delayedCall(420, () => this.activateRun());
        }
      },
    });
  }

  private activateRun() {
    this.countdownTimer = undefined;
    this.countdownReleaseTimer = undefined;
    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.startTime = this.time.now;
    this.isRunActive = true;
    this.physics.resume();
    this.updateTimerText();
  }

  private showStartModal() {
    this.removeStartModal();

    const overlay = document.createElement("div");
    overlay.id = "start-modal";
    overlay.innerHTML = `
      <form class="start-dialog">
        <h1>Action Game</h1>
        <label>
          <span>Player Name</span>
          <input name="playerName" type="text" maxlength="16" autocomplete="off" value="${this.escapeHtml(this.playerName)}" />
        </label>
        <div class="mode-row" role="group" aria-label="Control mode">
          <button type="button" data-mode="pc" class="mode-button is-selected">PC</button>
          <button type="button" data-mode="mobile" class="mode-button">スマホ</button>
        </div>
        <button type="submit" class="start-button">START</button>
      </form>
    `;

    document.body.appendChild(overlay);
    const form = overlay.querySelector("form")!;
    const input = overlay.querySelector<HTMLInputElement>("input[name='playerName']")!;
    const modeButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-mode]"));
    overlay.querySelector<HTMLButtonElement>("[data-mode='mobile']")!.textContent = "MOBILE";
    let selectedMode: ControlMode = "pc";

    const selectMode = (mode: ControlMode) => {
      selectedMode = mode;
      modeButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.mode === mode);
      });
    };

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectMode(button.dataset.mode === "mobile" ? "mobile" : "pc");
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = input.value.trim();
      this.playerName = name || "PLAYER";
      this.controlMode = selectedMode;
      this.setupComplete = true;
      if (this.controlMode === "mobile") {
        this.requestMobileFullscreen();
      }
      this.startRun();
    });

    input.focus();
    input.select();
  }

  private requestMobileFullscreen() {
    if (document.fullscreenElement) {
      return;
    }

    const target = document.documentElement as FullscreenTarget;
    const requestFullscreen =
      target.requestFullscreen ?? target.webkitRequestFullscreen ?? target.msRequestFullscreen;

    if (!requestFullscreen) {
      return;
    }

    void Promise.resolve(requestFullscreen.call(target)).catch(() => undefined);
  }

  private removeStartModal() {
    document.getElementById("start-modal")?.remove();
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });
  }

  private buildStage(platforms: Phaser.Physics.Arcade.StaticGroup) {
    for (let x = 0; x < ACTIVE_STAGE.worldWidth; x += TILE) {
      this.addBlock(platforms, x, GROUND_TOP_Y, "ground", false);
    }

    this.addPlatformRun(platforms, 0, GROUND_VISUAL_Y, Math.ceil(ACTIVE_STAGE.worldWidth / PLATFORM_UNIT_WIDTH) + 1, false);
    ACTIVE_STAGE.platforms.forEach((platform) => {
      this.addPlatformRun(platforms, platform.x, platform.y, platform.units, platform.collides ?? true);
    });
  }

  private createBackground() {
    this.add
      .image(0, 0, "background-stars")
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScrollFactor(0)
      .setDepth(-40);

    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x070a12, 0.2)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-35);

    this.cityLoopBackground = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "background-city-loop")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-15);
  }

  private updateBackground() {
    if (this.cityLoopBackground) {
      this.cityLoopBackground.tilePositionX = this.cameras.main.scrollX * 0.58;
      this.cityLoopBackground.y = -this.cameras.main.scrollY;
    }

  }

  private addBlock(platforms: Phaser.Physics.Arcade.StaticGroup, x: number, y: number, texture: string, visible = true) {
    const block = platforms.create(x + TILE / 2, y + TILE / 2, texture);
    block.setVisible(visible);
    block.refreshBody();
  }

  private addPlatformRun(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
    units: number,
    collides = true,
  ) {
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
      this.add.image(unitX, y, texture).setOrigin(0, 0).setDepth(PLATFORM_DEPTH);
      if (collides) {
        this.addPlatformHitbox(platforms, unitX, y, PLATFORM_UNIT_WIDTH, PLATFORM_UNIT_HEIGHT);
      }
    }
  }

  private createStreetLamps() {
    ACTIVE_STAGE.streetLamps.forEach((lamp) => {
      this.createStreetLampLight(lamp.x, lamp.key, lamp.scale);
      this.add
        .image(lamp.x, STREET_LAMP_GROUND_Y, lamp.key)
        .setOrigin(0.5, 1)
        .setScale(lamp.scale)
        .setDepth(DECORATION_DEPTH);
    });
  }

  private createStreetLampLight(x: number, key: StreetLampKey, scale: number) {
    const isDoubleLamp = key === PROP_ASSETS.lampDouble;
    const sourceY = STREET_LAMP_GROUND_Y - 420 * scale;
    const groundY = STREET_LAMP_GROUND_Y - 5;
    const sources = isDoubleLamp ? [-92 * scale, 92 * scale] : [32 * scale];

    sources.forEach((offsetX) => {
      const sourceX = x + offsetX;
      const beamHalfWidth = (isDoubleLamp ? 150 : 190) * scale;
      const poolWidth = (isDoubleLamp ? 210 : 250) * scale;
      const light = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);

      light.fillStyle(0xffefad, 0.12);
      light.fillTriangle(sourceX, sourceY, sourceX - beamHalfWidth, groundY, sourceX + beamHalfWidth, groundY);
      light.fillStyle(0xfff4c7, 0.07);
      light.fillTriangle(sourceX, sourceY - 8 * scale, sourceX - beamHalfWidth * 0.72, groundY, sourceX + beamHalfWidth * 0.72, groundY);
      light.setDepth(STREET_LAMP_LIGHT_DEPTH);

      const groundLight = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
      groundLight.fillStyle(0xffe7a3, 0.17);
      groundLight.fillEllipse(sourceX, groundY + 2, poolWidth, 26 * scale);
      groundLight.fillStyle(0xfff8d2, 0.1);
      groundLight.fillEllipse(sourceX, groundY + 1, poolWidth * 0.58, 12 * scale);
      groundLight.setDepth(STREET_LAMP_GROUND_LIGHT_DEPTH);

      this.add
        .circle(sourceX, sourceY, 12 * scale, 0xfff3bd, 0.36)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(DECORATION_DEPTH + 0.02);
    });
  }

  private createStageObjects() {
    ACTIVE_STAGE.decorations.forEach((object) => {
      this.add
        .image(object.x, object.y, object.key)
        .setOrigin(0.5, 1)
        .setScale(object.scale)
        .setDepth(DECORATION_DEPTH);
    });
  }

  private addPlatformHitbox(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const block = platforms.create(x + width / 2, y + height / 2, "platform-hitbox");
    block.setDisplaySize(width, height);
    block.setVisible(false);
    block.refreshBody();
  }

  private createMobileControls() {
    this.removeMobileControls();

    const controls = document.createElement("div");
    controls.id = "mobile-controls";
    controls.innerHTML = `
      <div class="mobile-pad">
        <button class="mobile-button pad-up" data-key="w" type="button" aria-label="Jump">↑</button>
        <button class="mobile-button pad-left" data-key="a" type="button" aria-label="Move left">←</button>
        <button class="mobile-button pad-down" data-key="s" type="button" aria-label="Down">↓</button>
        <button class="mobile-button pad-right" data-key="d" type="button" aria-label="Move right">→</button>
      </div>
      <div class="mobile-actions">
        <button class="mobile-button" data-key="w" type="button" aria-label="Jump">↑</button>
        <button class="mobile-button restart-button" data-action="restart" type="button">R</button>
      </div>
    `;
    document.body.appendChild(controls);

    controls.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((button) => {
      const key = button.dataset.key as MobileInputKey;
      this.bindMobileButton(button, (pressed) => {
        this.mobileInput[key] = pressed;
        if (key === "w" && pressed) {
          this.mobileJumpQueued = true;
        }
      });
    });

    const restartButton = controls.querySelector<HTMLButtonElement>("[data-action='restart']");
    if (restartButton) {
      this.bindMobileButton(restartButton, (pressed) => {
        if (pressed) {
          this.restartStage();
        }
      });
    }
  }

  private bindMobileButton(button: HTMLButtonElement, onPressedChange: (pressed: boolean) => void) {
    const activePointers = new Set<number>();
    const setPressed = (pressed: boolean) => {
      button.classList.toggle("is-pressed", pressed);
      onPressedChange(pressed);
    };
    const clearPressed = () => {
      activePointers.clear();
      setPressed(false);
    };
    const press = (event: PointerEvent) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      activePointers.add(event.pointerId);
      setPressed(true);
    };
    const release = (event: PointerEvent) => {
      event.preventDefault();
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
      activePointers.delete(event.pointerId);
      setPressed(activePointers.size > 0);
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    window.addEventListener("blur", clearPressed);
    document.addEventListener("visibilitychange", clearPressed);
    this.mobileControlCleanup.push(() => {
      button.removeEventListener("pointerdown", press);
      button.removeEventListener("pointerup", release);
      button.removeEventListener("pointercancel", release);
      button.removeEventListener("lostpointercapture", release);
      window.removeEventListener("blur", clearPressed);
      document.removeEventListener("visibilitychange", clearPressed);
    });
  }

  private removeMobileControls() {
    this.mobileControlCleanup.forEach((cleanup) => cleanup());
    this.mobileControlCleanup = [];
    document.getElementById("mobile-controls")?.remove();
  }

  private createItems() {
    const items = this.physics.add.staticGroup();
    this.createItemGlowTexture();

    ACTIVE_STAGE.items.forEach((placement) => {
      const definition = ITEM_DEFINITIONS[placement.type];
      const glow = this.add
        .image(placement.x, placement.y, ITEM_GLOW_TEXTURE_KEY)
        .setDisplaySize(108, 108)
        .setTint(ITEM_GLOW_COLORS[placement.type])
        .setAlpha(0.48)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(0.1);
      const item = items.create(placement.x, placement.y, definition.key) as Phaser.Physics.Arcade.Sprite;
      item.setData("itemType", placement.type);
      item.setData("glow", glow);
      item.setDisplaySize(48, 48);
      item.setDepth(0.2);
      item.refreshBody();

      this.tweens.add({
        targets: glow,
        alpha: 0.72,
        scale: 1.16,
        duration: 950,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: (placement.x % 700) + (placement.y % 180),
      });
    });

    this.physics.add.overlap(this.player, items, (_, itemObject) => {
      this.collectItem(itemObject as Phaser.Physics.Arcade.Sprite);
    });
  }

  private createItemGlowTexture() {
    if (this.textures.exists(ITEM_GLOW_TEXTURE_KEY)) {
      return;
    }

    const size = 96;
    const center = size / 2;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);

    for (let radius = center; radius > 0; radius -= 3) {
      const strength = 1 - radius / center;
      graphics.fillStyle(0xffffff, 0.018 + strength * 0.055);
      graphics.fillCircle(center, center, radius);
    }

    graphics.generateTexture(ITEM_GLOW_TEXTURE_KEY, size, size);
    graphics.destroy();
  }

  private collectItem(item: Phaser.Physics.Arcade.Sprite) {
    if (!item.active) {
      return;
    }

    const itemType = item.getData("itemType") as ItemType;
    const definition = ITEM_DEFINITIONS[itemType];
    this.score[itemType] += definition.points;
    this.updateScoreText();
    const glow = item.getData("glow") as Phaser.GameObjects.Image | undefined;
    if (glow) {
      this.tweens.killTweensOf(glow);
      glow.destroy();
    }
    item.disableBody(true, true);
  }

  private updateScoreText() {
    const total = this.getItemScore();
    const itemScores = (Object.keys(ITEM_DEFINITIONS) as ItemType[])
      .map((itemType) => `${ITEM_DEFINITIONS[itemType].label}:${this.score[itemType]}`)
      .join("  ");
    this.scoreText.setText(`SCORE:${total}  ${itemScores}`);
  }

  private updateTimerText() {
    if (!this.timerText || this.hasWon) {
      return;
    }

    this.timerText.setText(`TIME:${this.getRemainingSeconds()}`);
  }

  private getItemScore() {
    return Object.values(this.score).reduce((sum, value) => sum + value, 0);
  }

  private getRemainingSeconds() {
    if (!this.isRunActive || this.startTime === 0) {
      return GAME_TIME_SECONDS;
    }

    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
    return Math.max(0, GAME_TIME_SECONDS - elapsed);
  }

  private createPixelTexture(key: string, width: number, height: number, fill: number, stroke: number) {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(fill);
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(1, stroke);
    graphics.strokeRect(0.5, 0.5, width - 1, height - 1);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private createPlayerAnimations() {
    this.anims.create({
      key: "player-idle",
      frames: this.anims.generateFrameNumbers("player-idle", {
        start: 0,
        end: PLAYER_IDLE_FRAME_COUNT - 1,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "player-walk",
      frames: this.anims.generateFrameNumbers("player-walk", {
        start: 0,
        end: PLAYER_FRAME_COUNT - 1,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "player-jump-start",
      frames: this.anims.generateFrameNumbers("player-jump", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });

    this.anims.create({
      key: "player-air",
      frames: this.anims.generateFrameNumbers("player-jump", {
        start: 3,
        end: 6,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "player-land",
      frames: this.anims.generateFrameNumbers("player-jump", {
        start: 7,
        end: 14,
      }),
      frameRate: 14,
      repeat: 0,
    });
  }

  private applyPlayerBody() {
    this.player.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT);
    this.player.setOffset(PLAYER_BODY_OFFSET_X, PLAYER_BODY_OFFSET_Y);
  }

  private win() {
    if (this.hasWon) {
      return;
    }

    this.hasWon = true;
    const remaining = this.getRemainingSeconds();
    const timeBonus = remaining * TIME_BONUS_PER_SECOND;
    const itemScore = this.getItemScore();
    const finalScore = itemScore + timeBonus;
    this.statusText.setText("GOAL!");
    this.timerText.setText(`TIME:${remaining}  BONUS:${timeBonus}`);
    this.scoreText.setText(`ITEM SCORE:${itemScore}`);
    this.startRainbowWinEffect();
    this.finalScoreText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        `CLEAR!\nSCORE ${finalScore}\nTIME BONUS ${timeBonus}`,
        {
          fontFamily: "monospace",
          fontSize: "48px",
          color: "#f8fafc",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setShadow(3, 3, "#020617", 4, true, true);
  }

  private registerRainbowPipeline() {
    if (this.game.renderer.type !== Phaser.WEBGL) {
      return;
    }

    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (renderer.pipelines.get(RAINBOW_PIPELINE_KEY)) {
      return;
    }

    renderer.pipelines.add(RAINBOW_PIPELINE_KEY, new RainbowWinPipeline(this.game));
  }

  private startRainbowWinEffect() {
    if (this.game.renderer.type === Phaser.WEBGL) {
      this.player.setPipeline(RAINBOW_PIPELINE_KEY);
    } else {
      this.player.setTint(0xff66ff, 0x66ffff, 0xffff66, 0x66ff66);
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: "#172033",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false,
    },
  },
  scene: PrototypeScene,
});
