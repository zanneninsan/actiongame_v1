export type StoryDialogueLine = {
  characterName: string;
  message: string;
  portraitUrl: string;
};

export type StoryDialogueOptions = {
  lines: StoryDialogueLine[];
  root?: HTMLElement;
  width?: number;
  top?: number;
  left?: number;
};

export type StoryDialogueController = {
  setLine: (line: StoryDialogueLine) => void;
  setLines: (lines: StoryDialogueLine[], startIndex?: number) => void;
  next: () => boolean;
  remove: () => void;
};

const ASSET_BASE = import.meta.env.BASE_URL;
const FRAME_ASPECT_RATIO = 417 / 1931;
const GAME_DESIGN_WIDTH = 1280;
const GAME_DESIGN_HEIGHT = 720;
const DEFAULT_DIALOGUE_LEFT = 12;
const DEFAULT_DIALOGUE_TOP = 96;
const DEFAULT_DIALOGUE_WIDTH = 656;
const MIN_DIALOGUE_WIDTH = 176;
const DEFAULT_DIALOGUE_FONT_SIZE = 18;
const MIN_DIALOGUE_FONT_SIZE = 10;

export const DEFAULT_STORY_DIALOGUE_LINES: StoryDialogueLine[] = [
  {
    characterName: "残念院さん",
    message: "人が多いですね……ここが渋谷。",
    portraitUrl: `${ASSET_BASE}assets/ui/message_faces/message_face_head_icon_05_shy.png`,
  },
  {
    characterName: "残念院さん",
    message: "先へ進みましょう。何か手がかりが見つかるはずです。",
    portraitUrl: `${ASSET_BASE}assets/story/elis_portrait.png`,
  },
];

export function createStoryDialogue(options: StoryDialogueOptions): StoryDialogueController {
  const root = options.root ?? document.body;
  const lines = [...options.lines];
  let currentIndex = 0;

  document.getElementById("story-dialogue")?.remove();

  const wrapper = document.createElement("section");
  wrapper.id = "story-dialogue";
  wrapper.className = "story-dialogue";
  wrapper.setAttribute("aria-live", "polite");
  applyStyle(wrapper, {
    position: "fixed",
    top: "96px",
    left: "12px",
    width: "656px",
    aspectRatio: `${1 / FRAME_ASPECT_RATIO}`,
    zIndex: "11",
    color: "#f8fafc",
    fontFamily: `"Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, system-ui, sans-serif`,
    pointerEvents: "auto",
    userSelect: "none",
    filter: "drop-shadow(0 16px 22px rgba(0, 0, 0, 0.58))",
  });

  const frame = document.createElement("img");
  frame.src = `${ASSET_BASE}assets/story/dialogue_frame.png`;
  frame.alt = "";
  applyStyle(frame, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    pointerEvents: "none",
  });

  const portrait = document.createElement("img");
  portrait.alt = "";
  applyStyle(portrait, {
    position: "absolute",
    left: "3.2%",
    top: "14.5%",
    width: "15.2%",
    height: "67.5%",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
  });

  const namePlate = document.createElement("div");
  applyStyle(namePlate, {
    position: "absolute",
    left: "23.2%",
    top: "10.5%",
    width: "25.8%",
    height: "13.5%",
    display: "flex",
    alignItems: "center",
    paddingLeft: "2.1%",
    paddingRight: "1.4%",
    boxSizing: "border-box",
    color: "#f5c76a",
    fontSize: "var(--story-dialogue-font-size, 22px)",
    fontWeight: "900",
    lineHeight: "1",
    letterSpacing: "0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textShadow: "0 2px 0 rgba(0, 0, 0, 0.86), 0 0 8px rgba(247, 201, 106, 0.18)",
  });

  const message = document.createElement("p");
  applyStyle(message, {
    position: "absolute",
    left: "23.8%",
    top: "34%",
    width: "66.5%",
    margin: "0",
    color: "#f8fafc",
    fontSize: "var(--story-dialogue-font-size, 22px)",
    fontWeight: "900",
    lineHeight: "1.55",
    letterSpacing: "0",
    textShadow: "0 2px 2px rgba(0, 0, 0, 0.9), 0 0 8px rgba(255, 255, 255, 0.12)",
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.ariaLabel = "次のメッセージ";
  applyStyle(nextButton, {
    position: "absolute",
    right: "4.8%",
    bottom: "18.5%",
    width: "8%",
    height: "22%",
    border: "0",
    padding: "0",
    background: "transparent",
    cursor: "pointer",
  });

  wrapper.append(frame, portrait, namePlate, message, nextButton);
  root.appendChild(wrapper);

  const syncToGameFrame = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#game canvas") ?? document.querySelector<HTMLCanvasElement>("canvas");
    const rect = canvas?.getBoundingClientRect();
    const frameLeft = rect?.left ?? 0;
    const frameTop = rect?.top ?? 0;
    const frameWidth = rect?.width ?? window.innerWidth;
    const scale = rect ? Math.min(rect.width / GAME_DESIGN_WIDTH, rect.height / GAME_DESIGN_HEIGHT) : 1;
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const logicalLeft = options.left ?? DEFAULT_DIALOGUE_LEFT;
    const logicalTop = options.top ?? DEFAULT_DIALOGUE_TOP;
    const logicalWidth = options.width ?? DEFAULT_DIALOGUE_WIDTH;
    const left = frameLeft + logicalLeft * safeScale;
    const top = frameTop + logicalTop * safeScale;
    const maxWidth = Math.max(MIN_DIALOGUE_WIDTH, frameWidth - logicalLeft * safeScale - DEFAULT_DIALOGUE_LEFT * safeScale);
    const width = Math.max(MIN_DIALOGUE_WIDTH, Math.min(logicalWidth * safeScale, maxWidth));
    const fontSize = Math.min(
      DEFAULT_DIALOGUE_FONT_SIZE,
      Math.max(MIN_DIALOGUE_FONT_SIZE, DEFAULT_DIALOGUE_FONT_SIZE * safeScale),
    );

    wrapper.style.left = `${Math.round(left)}px`;
    wrapper.style.top = `${Math.round(top)}px`;
    wrapper.style.width = `${Math.round(width)}px`;
    wrapper.style.setProperty("--story-dialogue-font-size", `${fontSize.toFixed(1)}px`);
  };

  syncToGameFrame();
  window.addEventListener("resize", syncToGameFrame);
  window.visualViewport?.addEventListener("resize", syncToGameFrame);
  const canvas = document.querySelector<HTMLCanvasElement>("#game canvas") ?? document.querySelector<HTMLCanvasElement>("canvas");
  const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(syncToGameFrame);
  if (canvas && resizeObserver) {
    resizeObserver.observe(canvas);
  }

  const stopPropagation = (event: Event) => event.stopPropagation();
  wrapper.addEventListener("pointerdown", stopPropagation);
  wrapper.addEventListener("keydown", stopPropagation);
  nextButton.addEventListener("click", () => {
    next();
  });

  const setLine = (line: StoryDialogueLine) => {
    portrait.src = line.portraitUrl;
    namePlate.textContent = line.characterName;
    message.textContent = line.message;
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

  const remove = () => {
    wrapper.removeEventListener("pointerdown", stopPropagation);
    wrapper.removeEventListener("keydown", stopPropagation);
    window.removeEventListener("resize", syncToGameFrame);
    window.visualViewport?.removeEventListener("resize", syncToGameFrame);
    resizeObserver?.disconnect();
    wrapper.remove();
  };

  setLines(lines);

  return { setLine, setLines, next, remove };
}

function applyStyle(element: HTMLElement, style: Partial<CSSStyleDeclaration>) {
  Object.assign(element.style, style);
}
