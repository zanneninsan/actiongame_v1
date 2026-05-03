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
export type ItemType = "energyDrink" | "shoppingBag" | "bubbleTea";
export type EnemyType = "neonBouncer";
export const ITEM_GLOW_TEXTURE_KEY = "item-soft-glow";
export const ITEM_GLOW_COLORS: Record<ItemType, number> = {
  energyDrink: 0x8cffd2,
  shoppingBag: 0xffd166,
  bubbleTea: 0xf9a8ff,
};
export type ScoreState = Record<ItemType, number>;
export type PlatformAsset = (typeof PLATFORM_ASSETS)[keyof typeof PLATFORM_ASSETS];
export type StageObjectAsset = { key: string; path: string };
export type PlatformRunPlacement = { x: number; y: number; units: number; collides?: boolean };
export type StreetLampPlacement = { x: number; key: StreetLampKey; scale?: number };
export type StageDecorationPlacement = { x: number; y?: number; key: string; scale?: number };
export type ItemPlacement = { type: ItemType; x: number; y: number };
export type EnemyPlacement = { type?: EnemyType; x: number; y: number; patrolLeft: number; patrolRight: number; speed?: number };
export type StageDefinition = {
  name: string;
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
  enemies?: EnemyPlacement[];
};

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
] as const satisfies readonly StageObjectAsset[];

export const ITEM_DEFINITIONS: Record<ItemType, { key: string; label: string; points: number; assetPath: string }> = {
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

export const ENEMY_DEFINITIONS: Record<EnemyType, { key: string; label: string }> = {
  neonBouncer: {
    key: "enemy-neon-bouncer",
    label: "Neon Bouncer",
  },
};
