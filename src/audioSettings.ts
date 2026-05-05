import type Phaser from "phaser";

export const SE_VOLUME_REGISTRY_KEY = "actiongame.seVolumePercent";

export function getScaledSeVolume(scene: Phaser.Scene, baseVolume: number) {
  const storedPercent = scene.registry.get(SE_VOLUME_REGISTRY_KEY);
  const percent = typeof storedPercent === "number" && Number.isFinite(storedPercent) ? storedPercent : 50;
  return Math.max(0, Math.min(1, baseVolume * (Math.max(0, Math.min(100, percent)) / 100)));
}
