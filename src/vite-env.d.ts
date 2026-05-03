/// <reference types="vite/client" />

declare module "virtual:background-assets" {
  export type BackgroundAsset = {
    key: string;
    path: string;
    label: string;
  };

  export const REAR_BACKGROUNDS: BackgroundAsset[];
  export const MIDGROUND_BACKGROUNDS: BackgroundAsset[];
}
