import { t, type Locale } from "./i18n";

export type CapturedGameScreenshot = {
  dataUrl: string;
  capturedAt: number;
  stageId: string;
};

type ScreenshotPreviewOptions = {
  screenshot: CapturedGameScreenshot;
  locale: Locale;
};

const MODAL_ID = "screenshot-modal";

const formatTimestamp = (timestamp: number, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));

const downloadScreenshot = (screenshot: CapturedGameScreenshot) => {
  const link = document.createElement("a");
  link.href = screenshot.dataUrl;
  link.download = `screenshot-${screenshot.stageId}-${screenshot.capturedAt}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const removeScreenshotPreview = () => {
  document.getElementById(MODAL_ID)?.remove();
  document.body.classList.remove("is-screenshot-modal-open");
};

export const showScreenshotPreview = ({ screenshot, locale }: ScreenshotPreviewOptions) => {
  removeScreenshotPreview();

  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.innerHTML = `
    <div class="screenshot-dialog" role="dialog" aria-modal="true" aria-labelledby="screenshot-title">
      <div class="screenshot-dialog-header">
        <h2 id="screenshot-title">${t(locale, "screenshot.title")}</h2>
        <button id="screenshot-close" class="ui-button screenshot-close" type="button" aria-label="${t(locale, "screenshot.close")}">×</button>
      </div>
      <div class="screenshot-meta">${formatTimestamp(screenshot.capturedAt, locale)}</div>
      <img class="screenshot-image" src="${screenshot.dataUrl}" alt="${t(locale, "screenshot.alt")}" />
      <div class="screenshot-actions">
        <button id="screenshot-download" type="button">${t(locale, "screenshot.download")}</button>
        <button id="screenshot-dismiss" type="button">${t(locale, "screenshot.close")}</button>
      </div>
    </div>
  `;

  const close = () => removeScreenshotPreview();
  const dialog = modal.querySelector(".screenshot-dialog") as HTMLDivElement;
  const closeButton = modal.querySelector("#screenshot-close") as HTMLButtonElement;
  const dismissButton = modal.querySelector("#screenshot-dismiss") as HTMLButtonElement;
  const downloadButton = modal.querySelector("#screenshot-download") as HTMLButtonElement;

  closeButton.addEventListener("click", close);
  dismissButton.addEventListener("click", close);
  downloadButton.addEventListener("click", () => downloadScreenshot(screenshot));
  modal.addEventListener("pointerdown", (event) => {
    if (event.target === modal) {
      close();
    }
  });
  modal.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      close();
    }
  });
  modal.addEventListener("keyup", (event) => event.stopPropagation());
  modal.addEventListener("keypress", (event) => event.stopPropagation());
  dialog.addEventListener("pointerdown", (event) => event.stopPropagation());

  document.body.appendChild(modal);
  document.body.classList.add("is-screenshot-modal-open");
  closeButton.focus();
};
