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

  const wrapper = document.createElement("section");
  wrapper.id = "story-dialogue";
  wrapper.setAttribute("aria-live", "polite");
  applyStyle(wrapper, {
    position: "fixed",
    top: `${options.top ?? 18}px`,
    left: `${options.left ?? 18}px`,
    width: `min(${options.width ?? 760}px, calc(100vw - 36px))`,
    minHeight: "132px",
    zIndex: "11",
    display: "grid",
    gridTemplateColumns: "132px 1fr",
    columnGap: "10px",
    color: "#f8fafc",
    fontFamily: `"Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, system-ui, sans-serif`,
    pointerEvents: "auto",
    userSelect: "none",
    filter: "drop-shadow(0 14px 22px rgba(0, 0, 0, 0.54))",
  });

  const portraitFrame = document.createElement("div");
  applyStyle(portraitFrame, {
    position: "relative",
    height: "132px",
    border: "2px solid #c7a76b",
    background: "linear-gradient(180deg, rgba(13, 18, 27, 0.95), rgba(2, 6, 23, 0.92))",
    boxSizing: "border-box",
    overflow: "hidden",
  });

  const portrait = document.createElement("img");
  portrait.alt = "";
  applyStyle(portrait, {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  });

  const textPanel = document.createElement("div");
  applyStyle(textPanel, {
    position: "relative",
    minHeight: "132px",
    border: "2px solid #c7a76b",
    background: "rgba(2, 8, 18, 0.68)",
    boxSizing: "border-box",
    padding: "50px 64px 28px 28px",
    boxShadow: "inset 0 0 0 1px rgba(255, 237, 176, 0.18), inset 0 18px 32px rgba(15, 23, 42, 0.46)",
  });

  const namePlate = document.createElement("div");
  applyStyle(namePlate, {
    position: "absolute",
    top: "-2px",
    left: "-2px",
    minWidth: "260px",
    maxWidth: "calc(100% - 28px)",
    height: "34px",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    border: "2px solid #c7a76b",
    background: "linear-gradient(180deg, rgba(11, 22, 34, 0.98), rgba(2, 8, 18, 0.94))",
    color: "#f7c96c",
    fontSize: "22px",
    fontWeight: "800",
    letterSpacing: "0",
    textShadow: "0 2px 0 rgba(0, 0, 0, 0.8)",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });

  const message = document.createElement("p");
  applyStyle(message, {
    margin: "0",
    color: "#f8fafc",
    fontSize: "22px",
    fontWeight: "800",
    lineHeight: "1.55",
    letterSpacing: "0",
    textShadow: "0 2px 2px rgba(0, 0, 0, 0.85)",
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.ariaLabel = "次のメッセージ";
  applyStyle(nextButton, {
    position: "absolute",
    right: "24px",
    bottom: "18px",
    width: "0",
    height: "0",
    padding: "0",
    borderTop: "13px solid #ffd579",
    borderRight: "17px solid transparent",
    borderBottom: "0",
    borderLeft: "17px solid transparent",
    background: "transparent",
    cursor: "pointer",
    filter: "drop-shadow(0 2px 0 rgba(0, 0, 0, 0.82))",
  });

  portraitFrame.appendChild(portrait);
  textPanel.append(namePlate, message, nextButton);
  wrapper.append(portraitFrame, textPanel);
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
