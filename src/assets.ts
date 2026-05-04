export const PLATFORM_ASSETS = {
  left: "platform-unit-left",
  middle: "platform-unit-middle",
  right: "platform-unit-right",
  single: "platform-unit-single",
} as const;
export const PROP_ASSETS = {
  lampSingle: "street-lamp-single",
  lampDouble: "street-lamp-double",
} as const;
export type StreetLampKey = (typeof PROP_ASSETS)[keyof typeof PROP_ASSETS];
export type ItemType =
  | "energyDrink"
  | "shoppingBag"
  | "bubbleTea"
  | "coin"
  | "powerSpeed"
  | "powerJump"
  | "star"
  | "dashRing";
export type EnemyType =
  | "knifePunk"
  | "aquaMascot"
  | "hornedCyborg"
  | "coneGolem"
  | "rabbitTraveler"
  | "neonIdolShooter";
export type EnemyAiType = "patrol" | "flyingPatrol" | "hoppingPatrol" | "chase" | "shooter" | "projectile";
export const ITEM_GLOW_TEXTURE_KEY = "item-soft-glow";
export const ITEM_GLOW_COLORS: Record<ItemType, number> = {
  energyDrink: 0x8cffd2,
  shoppingBag: 0xffd166,
  bubbleTea: 0xf9a8ff,
  coin: 0xffd166,
  powerSpeed: 0x60a5fa,
  powerJump: 0x86efac,
  star: 0xfbbf24,
  dashRing: 0xc084fc,
};
export type ScoreState = Partial<Record<ItemType, number>>;
export type PlatformAsset = (typeof PLATFORM_ASSETS)[keyof typeof PLATFORM_ASSETS];
export type StageObjectAsset = { key: string; path: string };
export type MovingPlatformAxis = "x" | "y" | "xy";
export type MovingPlatformConfig = { axis: MovingPlatformAxis; distance: number; speed: number; distanceY?: number };
export type SpringPlatformConfig = { velocity?: number };
export type FragilePlatformConfig = { delayMs?: number; respawnMs?: number };
export type PlatformRunPlacement = {
  x: number;
  y: number;
  units: number;
  collides?: boolean;
  moving?: MovingPlatformConfig;
  spring?: SpringPlatformConfig;
  fragile?: FragilePlatformConfig;
};
export type StreetLampPlacement = { x: number; key: StreetLampKey; scale?: number };
export type StageDecorationPlacement = { x: number; y?: number; key: string; scale?: number };
export type ItemPlacement = { type: ItemType; x: number; y: number };
export type EnemyPlacement = { type?: EnemyType; x: number; y: number; patrolLeft: number; patrolRight: number; speed?: number };
export type BonusBlockPlacement = { type: "hidden" | "question"; x: number; y: number; reward: ItemType };
export type CheckpointPlacement = { x: number; y: number };
export type StageLocalizedName = { jp: string; en: string };
export type StageName = string | StageLocalizedName;
export type StageBackgroundSelection = { rearKey?: string; midgroundKey?: string };
export type StageDefinition = {
  name: StageName;
  backgrounds?: StageBackgroundSelection;
  worldWidth: number;
  worldTop?: number;
  worldBottom?: number;
  groundTopY?: number;
  groundVisualY?: number;
  streetLampGroundY?: number;
  playerStart: { x: number; y: number };
  goal: { x: number; y: number };
  platforms: PlatformRunPlacement[];
  streetLamps: StreetLampPlacement[];
  decorations: StageDecorationPlacement[];
  items: ItemPlacement[];
  bonusBlocks?: BonusBlockPlacement[];
  checkpoints?: CheckpointPlacement[];
  enemies?: EnemyPlacement[];
};

export function resolveStageName(name: StageName, locale: "ja" | "en") {
  if (typeof name === "string") {
    return name;
  }

  return locale === "ja" ? name.jp : name.en;
}

export const STAGE_OBJECT_ASSETS = [
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
  { key: "stage-question-block", path: "assets/stage_objects/question_block.png" },
  { key: "stage-hidden-block", path: "assets/stage_objects/hidden_block.png" },
  { key: "stage-checkpoint-flag", path: "assets/stage_objects/checkpoint_flag.png" },
] as const satisfies readonly StageObjectAsset[];

export const ITEM_DEFINITIONS: Record<ItemType, { key: string; label: string; points: number; assetPath: string }> = {
  energyDrink: {
    key: "item-energy-drink",
    label: "ENERGY",
    points: 100,
    assetPath: "assets/items/energy_drink.webp",
  },
  shoppingBag: {
    key: "item-shopping-bag",
    label: "BAG",
    points: 250,
    assetPath: "assets/items/shopping_bag.webp",
  },
  bubbleTea: {
    key: "item-bubble-tea",
    label: "TEA",
    points: 150,
    assetPath: "assets/items/bubble_tea.webp",
  },
  coin: {
    key: "item-coin",
    label: "COIN",
    points: 25,
    assetPath: "assets/items/coin.png",
  },
  powerSpeed: {
    key: "item-power-speed",
    label: "SPEED",
    points: 0,
    assetPath: "assets/items/power_speed_blue.png",
  },
  powerJump: {
    key: "item-power-jump",
    label: "JUMP",
    points: 0,
    assetPath: "assets/items/power_jump_green.png",
  },
  star: {
    key: "item-star",
    label: "STAR",
    points: 0,
    assetPath: "assets/items/power_star_orange.png",
  },
  dashRing: {
    key: "item-dash-ring",
    label: "DASH",
    points: 0,
    assetPath: "assets/items/power_dash_purple.png",
  },
};

export const ENEMY_DEFINITIONS: Record<
  EnemyType,
  {
    key: string;
    label: string;
    assetPath?: string;
    displayWidth: number;
    displayHeight: number;
    bodyWidth: number;
    bodyHeight: number;
    bodyOffsetX: number;
    bodyOffsetY: number;
    aiType: EnemyAiType;
    animation?: {
      key: string;
      assetPath: string;
      frameWidth: number;
      frameHeight: number;
      frameCount: number;
      frameRate: number;
    };
  }
> = {
  knifePunk: {
    key: "enemy-knife-punk",
    label: "Knife Punk",
    assetPath: "assets/enemies/knife_punk.webp",
    displayWidth: 86,
    displayHeight: 72,
    bodyWidth: 48,
    bodyHeight: 46,
    bodyOffsetX: 20,
    bodyOffsetY: 22,
    aiType: "patrol",
    animation: {
      key: "enemy-knife-punk-walk",
      assetPath: "assets/enemies/knife_punk_walk.webp",
      frameWidth: 280,
      frameHeight: 250,
      frameCount: 4,
      frameRate: 7,
    },
  },
  aquaMascot: {
    key: "enemy-aqua-mascot",
    label: "Aqua Mascot",
    displayWidth: 86,
    displayHeight: 72,
    bodyWidth: 58,
    bodyHeight: 44,
    bodyOffsetX: 14,
    bodyOffsetY: 24,
    aiType: "patrol",
    animation: {
      key: "enemy-aqua-mascot-walk",
      assetPath: "assets/enemies/aqua_mascot_walk.webp",
      frameWidth: 280,
      frameHeight: 250,
      frameCount: 30,
      frameRate: 8,
    },
  },
  hornedCyborg: {
    key: "enemy-horned-cyborg",
    label: "Horned Cyborg",
    displayWidth: 98,
    displayHeight: 118,
    bodyWidth: 42,
    bodyHeight: 86,
    bodyOffsetX: 28,
    bodyOffsetY: 32,
    aiType: "flyingPatrol",
    animation: {
      key: "enemy-horned-cyborg-walk",
      assetPath: "assets/enemies/horned_cyborg_walk.png",
      frameWidth: 280,
      frameHeight: 250,
      frameCount: 4,
      frameRate: 7,
    },
  },
  coneGolem: {
    key: "enemy-cone-golem",
    label: "Cone Golem",
    displayWidth: 84,
    displayHeight: 86,
    bodyWidth: 56,
    bodyHeight: 54,
    bodyOffsetX: 14,
    bodyOffsetY: 30,
    aiType: "hoppingPatrol",
    animation: {
      key: "enemy-cone-golem-walk",
      assetPath: "assets/enemies/cone_golem_walk.png",
      frameWidth: 220,
      frameHeight: 220,
      frameCount: 4,
      frameRate: 7,
    },
  },
  rabbitTraveler: {
    key: "enemy-rabbit-traveler",
    label: "Rabbit Traveler",
    displayWidth: 68,
    displayHeight: 92,
    bodyWidth: 34,
    bodyHeight: 58,
    bodyOffsetX: 18,
    bodyOffsetY: 30,
    aiType: "chase",
    animation: {
      key: "enemy-rabbit-traveler-walk",
      assetPath: "assets/enemies/rabbit_traveler_walk.png",
      frameWidth: 160,
      frameHeight: 190,
      frameCount: 5,
      frameRate: 8,
    },
  },
  neonIdolShooter: {
    key: "enemy-neon-idol-shooter",
    label: "Neon Idol",
    assetPath: "assets/enemies/neon_idol_shooter.png",
    displayWidth: 78,
    displayHeight: 104,
    bodyWidth: 40,
    bodyHeight: 72,
    bodyOffsetX: 20,
    bodyOffsetY: 28,
    aiType: "shooter",
  },
};
