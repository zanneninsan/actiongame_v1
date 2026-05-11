import type { Locale } from "./i18n";

export type PlayerCharacterId = "zannenin" | "mint_ribbon" | "soda_star" | "lilac_moon";
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
      zh: "残念院桑",
      ko: "잔넨인 씨",
    },
    tagline: {
      en: "Original",
      ja: "いつもの",
      zh: "原版",
      ko: "기본",
    },
    spriteSheets: {
      idle: sheet("assets/sprites/player_idle_8_320x260.webp", 8),
      longidle: sheet("assets/sprites/player_longidle_320x260.webp", 29),
      walk: sheet("assets/sprites/player_walk_13_320x260.webp", 13),
      dash: sheet("assets/sprites/player_dash_12_320x260.webp", 12),
      jump: sheet("assets/sprites/player_jump_15_320x260.webp", 15),
      crouch: sheet("assets/sprites/player_crouch_27_9x3_320x260.webp", 27),
      defeat: sheet("assets/sprites/player_defeat_8_320x260.webp", 8),
    },
  },
  {
    id: "mint_ribbon",
    label: {
      en: "Mint Ribbon",
      ja: "ミントリボン",
      zh: "薄荷缎带",
      ko: "민트 리본",
    },
    tagline: {
      en: "Bouncy ribbon idol",
      ja: "ぴょこぴょこリボン",
      zh: "轻快缎带偶像",
      ko: "통통 튀는 리본",
    },
    spriteSheets: {
      idle: sheet("assets/sprites/player_mint_ribbon_idle_8_320x260.webp", 8),
      longidle: sheet("assets/sprites/player_mint_ribbon_longidle_29_320x260.webp", 29),
      walk: sheet("assets/sprites/player_mint_ribbon_walk_13_320x260.webp", 13),
      jump: sheet("assets/sprites/player_mint_ribbon_jump_15_320x260.webp", 15),
      crouch: sheet("assets/sprites/player_mint_ribbon_crouch_27_320x260.webp", 27),
      defeat: sheet("assets/sprites/player_mint_ribbon_defeat_8_320x260.webp", 8),
    },
  },
  {
    id: "soda_star",
    label: {
      en: "Soda Star",
      ja: "ソーダスター",
      zh: "汽水星",
      ko: "소다 스타",
    },
    tagline: {
      en: "Sparkling park hero",
      ja: "きらめきパークヒーロー",
      zh: "闪亮乐园英雄",
      ko: "반짝이는 파크 히어로",
    },
    spriteSheets: {
      idle: sheet("assets/sprites/player_soda_star_idle_8_320x260.webp", 8),
      longidle: sheet("assets/sprites/player_soda_star_longidle_29_320x260.webp", 29),
      walk: sheet("assets/sprites/player_soda_star_walk_13_320x260.webp", 13),
      jump: sheet("assets/sprites/player_soda_star_jump_15_320x260.webp", 15),
      crouch: sheet("assets/sprites/player_soda_star_crouch_27_320x260.webp", 27),
      defeat: sheet("assets/sprites/player_soda_star_defeat_8_320x260.webp", 8),
    },
  },
  {
    id: "lilac_moon",
    label: {
      en: "Lilac Moon",
      ja: "ライラックムーン",
      zh: "丁香月",
      ko: "라일락 문",
    },
    tagline: {
      en: "Soft moonlight runner",
      ja: "やわらか月あかり",
      zh: "柔和月光跑者",
      ko: "부드러운 달빛 러너",
    },
    spriteSheets: {
      idle: sheet("assets/sprites/player_lilac_moon_idle_8_320x260.webp", 8),
      longidle: sheet("assets/sprites/player_lilac_moon_longidle_29_320x260.webp", 29),
      walk: sheet("assets/sprites/player_lilac_moon_walk_13_320x260.webp", 13),
      jump: sheet("assets/sprites/player_lilac_moon_jump_15_320x260.webp", 15),
      crouch: sheet("assets/sprites/player_lilac_moon_crouch_27_320x260.webp", 27),
      defeat: sheet("assets/sprites/player_lilac_moon_defeat_8_320x260.webp", 8),
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
