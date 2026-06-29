import type { Locale } from "./i18n";

export type PlayerCharacterId = "zannenin";
export type PlayerCharacterBaseMotion = "idle" | "longidle" | "walk" | "jump" | "crouch" | "defeat";
export type PlayerCharacterMotion = PlayerCharacterBaseMotion | "dash";
export type PlayerAnimationName = "idle" | "longidle" | "walk" | "dash" | "jump-start" | "air" | "land" | "crouch" | "defeat";

type LocalizedText = Record<Locale, string>;

export type PlayerSpriteSheetDefinition = {
  path: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
};

export type PlayerCharacterDefinition = {
  id: PlayerCharacterId;
  label: LocalizedText;
  tagline: LocalizedText;
  spriteSheets: Record<PlayerCharacterBaseMotion, PlayerSpriteSheetDefinition> & {
    dash?: PlayerSpriteSheetDefinition;
  };
};

const PLAYER_FRAME_WIDTH = 320;
const PLAYER_FRAME_HEIGHT = 260;

const sheet = (path: string, frameCount: number): PlayerSpriteSheetDefinition => ({
  path,
  frameCount,
  frameWidth: PLAYER_FRAME_WIDTH,
  frameHeight: PLAYER_FRAME_HEIGHT,
});

export const DEFAULT_PLAYER_CHARACTER_ID: PlayerCharacterId = "zannenin";

export const PLAYER_CHARACTERS: PlayerCharacterDefinition[] = [
  {
    id: "zannenin",
    label: {
      en: "Zannenin-san",
      ja: "残念院さん",
      zh: "Zannenin-san",
      ko: "Zannenin-san",
    },
    tagline: {
      en: "Original",
      ja: "いつもの",
      zh: "Original",
      ko: "Original",
    },
    spriteSheets: {
      idle: sheet("assets/sprites/player_idle_8_320x260.webp", 8),
      longidle: sheet("assets/sprites/player_longidle_320x260.webp", 29),
      walk: sheet("assets/sprites/player_walk_13_320x260.webp", 13),
      dash: sheet("assets/sprites/player_dash_video_selected_14_320x260.webp", 14),
      jump: sheet("assets/sprites/player_jump_15_320x260.webp", 15),
      crouch: sheet("assets/sprites/player_crouch_27_9x3_320x260.webp", 27),
      defeat: sheet("assets/sprites/player_defeat_8_320x260.webp", 8),
    },
  },
];

export const normalizePlayerCharacterId = (value: string | undefined | null): PlayerCharacterId => {
  return PLAYER_CHARACTERS.some((character) => character.id === value) ? (value as PlayerCharacterId) : DEFAULT_PLAYER_CHARACTER_ID;
};

export const getPlayerCharacterDefinition = (id: string | undefined | null): PlayerCharacterDefinition => {
  const normalizedId = normalizePlayerCharacterId(id);
  return PLAYER_CHARACTERS.find((character) => character.id === normalizedId) ?? PLAYER_CHARACTERS[0];
};

export const getPlayerTextureKey = (characterId: PlayerCharacterId, motion: PlayerCharacterMotion) =>
  `player-${characterId}-${motion}`;

export const getPlayerAnimationKey = (characterId: PlayerCharacterId, animation: PlayerAnimationName) =>
  `player-${characterId}-${animation}`;
