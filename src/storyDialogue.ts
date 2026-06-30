import Phaser from "phaser";
import type { Locale } from "./i18n";
import { resolveStageText, type StageStoryDialogue } from "./assets";

export type StoryDialogueLine = {
  characterName: string;
  message: string;
  portraitUrl: string;
};

export type StoryDialogueOptions = {
  scene: Phaser.Scene;
  lines: StoryDialogueLine[];
  width?: number;
  top?: number;
  left?: number;
  locale?: Locale;
};

export type StoryDialogueController = {
  setLine: (line: StoryDialogueLine) => void;
  setLines: (lines: StoryDialogueLine[], startIndex?: number) => void;
  next: () => boolean;
  remove: (options?: { animate?: boolean }) => void;
};

const ASSET_BASE = import.meta.env.BASE_URL;
export const STORY_DIALOGUE_FRAME_TEXTURE_KEY = "story-dialogue-frame";
const FRAME_ASPECT_RATIO = 417 / 1931;
const GAME_DESIGN_WIDTH = 1280;
const DEFAULT_DIALOGUE_LEFT = 12;
const DEFAULT_DIALOGUE_TOP = 96;
const DEFAULT_DIALOGUE_WIDTH = 656;
const MIN_DIALOGUE_WIDTH = 176;
const DEFAULT_DIALOGUE_FONT_SIZE = 18;
const MIN_DIALOGUE_FONT_SIZE = 10;
const TV_SWITCH_IN_MS = 520;
const TV_SWITCH_OUT_MS = 420;
const STORY_DIALOGUE_DEPTH = 240;
const HUD_GUARD_LEFT = 12;
const HUD_GUARD_TOP = 12;
const HUD_GUARD_WIDTH = 430;
const HUD_GUARD_HEIGHT = 156;
const HUD_GUARD_MARGIN = 10;

export const resolveStoryDialoguePortraitUrl = (path: string) =>
  /^https?:\/\//.test(path) || path.startsWith("/") ? path : `${ASSET_BASE}${path}`;

export const getStoryDialogueTextureKey = (url: string) => `story-dialogue-portrait-${url.replace(/[^a-zA-Z0-9]/g, "_")}`;

export const resolveStoryDialogueLines = (storyDialogue: StageStoryDialogue, locale: Locale): StoryDialogueLine[] =>
  storyDialogue.lines.map((line) => ({
    characterName: resolveStageText(line.characterName, locale),
    message: resolveStageText(line.message, locale),
    portraitUrl: resolveStoryDialoguePortraitUrl(line.portraitPath),
  }));

export function createStoryDialogue(options: StoryDialogueOptions): StoryDialogueController {
  const scene = options.scene;
  const lines = [...options.lines];
  let currentIndex = 0;
  let isRemoving = false;

  document.getElementById("story-dialogue")?.remove();

  const layout = resolveLayout(options);
  const container = scene.add.container(layout.left, layout.top).setScrollFactor(0).setDepth(STORY_DIALOGUE_DEPTH);

  const frame = scene.add.image(0, 0, STORY_DIALOGUE_FRAME_TEXTURE_KEY).setOrigin(0, 0);
  frame.setDisplaySize(layout.width, layout.height);

  const portrait = scene.add.image(0, 0, STORY_DIALOGUE_FRAME_TEXTURE_KEY).setOrigin(0, 0);
  const namePlate = scene.add
    .text(0, 0, "", {
      fontFamily:
        '"Microsoft YaHei", "Microsoft JhengHei", SimHei, SimSun, "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC", "Noto Sans CJK KR", "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", "Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, system-ui, sans-serif',
      fontSize: `${layout.fontSize}px`,
      fontStyle: "900",
      color: "#f5c76a",
      align: "left",
      fixedWidth: layout.width * 0.25,
      resolution: 2,
    })
    .setOrigin(0, 0.5);
  namePlate.setLineSpacing(0);
  namePlate.setShadow(0, 2, "rgba(0, 0, 0, 0.86)", 0, true, true);

  const message = scene.add
    .text(0, 0, "", {
      fontFamily:
        '"Microsoft YaHei", "Microsoft JhengHei", SimHei, SimSun, "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC", "Noto Sans CJK KR", "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", "Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, system-ui, sans-serif',
      fontSize: `${layout.fontSize}px`,
      fontStyle: "900",
      color: "#f8fafc",
      align: "left",
      fixedWidth: layout.width * 0.665,
      wordWrap: { width: layout.width * 0.665, useAdvancedWrap: true },
      resolution: 2,
    })
    .setOrigin(0, 0);
  message.setLineSpacing(Math.round(layout.fontSize * 0.45));
  message.setShadow(0, 2, "rgba(0, 0, 0, 0.9)", 2, true, true);

  const nextZone = scene.add
    .zone(layout.width * 0.872, layout.height * 0.595, layout.width * 0.08, layout.height * 0.22)
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true });
  nextZone.on("pointerup", () => {
    next();
  });

  container.add([frame, portrait, namePlate, message, nextZone]);
  placeElements(layout, portrait, namePlate, message, nextZone);
  playTvSwitchIn(scene, container);

  const setLine = (line: StoryDialogueLine) => {
    const portraitKey = getStoryDialogueTextureKey(line.portraitUrl);
    portrait.setTexture(scene.textures.exists(portraitKey) ? portraitKey : STORY_DIALOGUE_FRAME_TEXTURE_KEY);
    portrait.setDisplaySize(layout.width * 0.152, layout.height * 0.675);
    namePlate.setText(line.characterName);
    message.setText(line.message);
  };

  const setLines = (nextLines: StoryDialogueLine[], startIndex = 0) => {
    lines.splice(0, lines.length, ...nextLines);
    currentIndex = Math.max(0, Math.min(startIndex, Math.max(lines.length - 1, 0)));
    if (lines[currentIndex]) {
      setLine(lines[currentIndex]);
    }
  };

  const next = () => {
    if (currentIndex >= lines.length - 1) {
      return false;
    }
    currentIndex += 1;
    setLine(lines[currentIndex]);
    return true;
  };

  const remove = (removeOptions: { animate?: boolean } = {}) => {
    if (isRemoving) {
      return;
    }
    isRemoving = true;
    nextZone.disableInteractive();
    if (removeOptions.animate) {
      playTvSwitchOut(scene, container, () => container.destroy(true));
      return;
    }
    container.destroy(true);
  };

  setLines(lines);

  return { setLine, setLines, next, remove };
}

function resolveLayout(options: StoryDialogueOptions) {
  const left = options.left ?? DEFAULT_DIALOGUE_LEFT;
  let top = options.top ?? DEFAULT_DIALOGUE_TOP;
  const maxWidth = Math.max(MIN_DIALOGUE_WIDTH, GAME_DESIGN_WIDTH - left - DEFAULT_DIALOGUE_LEFT);
  const width = Math.max(MIN_DIALOGUE_WIDTH, Math.min(options.width ?? DEFAULT_DIALOGUE_WIDTH, maxWidth));
  const height = Math.round(width * FRAME_ASPECT_RATIO);
  const fontSize = Math.min(DEFAULT_DIALOGUE_FONT_SIZE, Math.max(MIN_DIALOGUE_FONT_SIZE, DEFAULT_DIALOGUE_FONT_SIZE));

  const guardRight = HUD_GUARD_LEFT + HUD_GUARD_WIDTH;
  const guardBottom = HUD_GUARD_TOP + HUD_GUARD_HEIGHT;
  const dialogueRight = left + width;
  const dialogueBottom = top + height;
  const overlapsHud = left < guardRight && dialogueRight > HUD_GUARD_LEFT && top < guardBottom && dialogueBottom > HUD_GUARD_TOP;
  if (overlapsHud) {
    top = guardBottom + HUD_GUARD_MARGIN;
  }

  return { left, top, width, height, fontSize };
}

function placeElements(
  layout: { width: number; height: number; fontSize: number },
  portrait: Phaser.GameObjects.Image,
  namePlate: Phaser.GameObjects.Text,
  message: Phaser.GameObjects.Text,
  nextZone: Phaser.GameObjects.Zone,
) {
  portrait.setPosition(layout.width * 0.032, layout.height * 0.145);
  portrait.setDisplaySize(layout.width * 0.152, layout.height * 0.675);

  namePlate.setPosition(layout.width * 0.253, layout.height * 0.172);
  namePlate.setFontSize(layout.fontSize);
  namePlate.setFixedSize(layout.width * 0.24, layout.height * 0.135);

  message.setPosition(layout.width * 0.238, layout.height * 0.34);
  message.setFontSize(layout.fontSize);
  message.setFixedSize(layout.width * 0.665, 0);
  message.setWordWrapWidth(layout.width * 0.665, true);

  nextZone.setPosition(layout.width * 0.872, layout.height * 0.595);
  nextZone.setSize(layout.width * 0.08, layout.height * 0.22);
}

function playTvSwitchIn(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
  container.setAlpha(0);
  container.setScale(0.02, 0.006);
  scene.tweens.add({
    targets: container,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    duration: TV_SWITCH_IN_MS,
    ease: "Cubic.Out",
  });
}

function playTvSwitchOut(scene: Phaser.Scene, container: Phaser.GameObjects.Container, onFinish: () => void) {
  scene.tweens.add({
    targets: container,
    alpha: 0,
    scaleX: 0.02,
    scaleY: 0.004,
    duration: TV_SWITCH_OUT_MS,
    ease: "Cubic.In",
    onComplete: onFinish,
  });
}
