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

export const DEFAULT_STORY_DIALOGUE_LINES: StoryDialogueLine[] = [
  {
    characterName: "エリス",
    message: "人が多いですね……ここが渋谷。",
    portraitUrl: `${ASSET_BASE}assets/story/elis_portrait.png`,
  },
  {
    characterName: "エリス",
    message: "先へ進みましょう。何か手がかりが見つかるはずです。",
    portraitUrl: `${ASSET_BASE}assets/story/elis_portrait.png`,
  },
];

export function createStoryDialogue(options: StoryDialogueOptions): StoryDialogueController {
  const root = options.root ?? document.body;
  const lines = [...options.lines];
  let currentIndex = 0;

  document.getElementById("story-dialogue")?.remove();

  const width = options.width ?? 980;
  const wrapper = document.createElement("section");
  wrapper.id = "story-dialogue";
  wrapper.setAttribute("aria-live", "polite");
  applyStyle(wrapper, {
    position: "fixed",
    top: `${options.top ?? 18}px`,
    left: `${options.left ?? 12}px`,
    width: `min(${width}px, calc(100vw - 24px))`,
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
    fontSize: "22px",
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
    fontSize: "22px",
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
    wrapper.remove();
  };

  setLines(lines);

  return { setLine, setLines, next, remove };
}

function applyStyle(element: HTMLElement, style: Partial<CSSStyleDeclaration>) {
  Object.assign(element.style, style);
}
