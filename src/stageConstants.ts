import type { StageDefinition } from "./assets";

export const DEFAULT_WORLD_TOP = -720;
export const DEFAULT_WORLD_BOTTOM = 720;
export const DEFAULT_GROUND_TOP_Y = 672;
export const DEFAULT_GROUND_VISUAL_Y = DEFAULT_GROUND_TOP_Y;
export const DEFAULT_STREET_LAMP_GROUND_Y = DEFAULT_GROUND_TOP_Y;

export type ResolvedStageConstants = {
  worldTop: number;
  worldBottom: number;
  worldHeight: number;
  groundTopY: number;
  groundVisualY: number;
  streetLampGroundY: number;
};

export const resolveStageConstants = (stage: StageDefinition): ResolvedStageConstants => {
  const worldTop = stage.worldTop ?? DEFAULT_WORLD_TOP;
  const worldBottom = stage.worldBottom ?? DEFAULT_WORLD_BOTTOM;
  const groundTopY = stage.groundTopY ?? DEFAULT_GROUND_TOP_Y;
  return {
    worldTop,
    worldBottom,
    worldHeight: worldBottom - worldTop,
    groundTopY,
    groundVisualY: stage.groundVisualY ?? groundTopY,
    streetLampGroundY: stage.streetLampGroundY ?? groundTopY,
  };
};
