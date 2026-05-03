import { PROP_ASSETS } from "./assets";

export type StageObjectTopPlatform = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const STAGE_OBJECT_TOP_PLATFORMS: Record<string, StageObjectTopPlatform[]> = {
  "stage-structures-bus-shelter": [{ x: 76, y: 6, width: 462, height: 12 }],
  [PROP_ASSETS.lampSingle]: [{ x: 90, y: 2, width: 58, height: 10 }],
  [PROP_ASSETS.lampDouble]: [
    { x: 0, y: 2, width: 58, height: 10 },
    { x: 171, y: 2, width: 56, height: 10 },
  ],
  "stage-structures-street-kiosk": [{ x: 10, y: 4, width: 370, height: 14 }],
  "stage-props-guard-rail": [{ x: 48, y: 4, width: 235, height: 8 }],
  "stage-structures-concrete-pillar": [{ x: 24, y: 1, width: 193, height: 10 }],
  "stage-structures-station-wall-railing": [{ x: 18, y: 1, width: 464, height: 10 }],
  "stage-structures-shutter-storefront": [{ x: 5, y: 2, width: 610, height: 12 }],
};
