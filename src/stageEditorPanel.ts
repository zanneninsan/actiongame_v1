import { PROP_ASSETS, STAGE_OBJECT_ASSETS, type ItemType, type StreetLampKey } from "./assets";

export type EditorTool =
  | "select"
  | "move"
  | "delete"
  | "platform"
  | "item"
  | "streetLamp"
  | "decoration"
  | "playerStart"
  | "goal";

type StageEditorPanelOptions = {
  initialTool: EditorTool;
  onToggle: (enabled: boolean) => void;
  onToolChange: (tool: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
};

export class StageEditorPanel {
  private readonly options: StageEditorPanelOptions;
  private panel?: HTMLDivElement;
  private exportTextarea?: HTMLTextAreaElement;
  private platformUnitsInput?: HTMLInputElement;
  private itemTypeSelect?: HTMLSelectElement;
  private lampTypeSelect?: HTMLSelectElement;
  private decorationSelect?: HTMLSelectElement;
  private undoButton?: HTMLButtonElement;
  private redoButton?: HTMLButtonElement;
  private importFileInput?: HTMLInputElement;
  private importStatus?: HTMLParagraphElement;
  private cleanup: Array<() => void> = [];
  private enabled = false;

  constructor(options: StageEditorPanelOptions) {
    this.options = options;
  }

  get platformUnits() {
    return Number(this.platformUnitsInput?.value) || 3;
  }

  get itemType() {
    return (this.itemTypeSelect?.value ?? "energyDrink") as ItemType;
  }

  get lampType() {
    return (this.lampTypeSelect?.value ?? PROP_ASSETS.lampSingle) as StreetLampKey;
  }

  get decorationKey() {
    return this.decorationSelect?.value ?? STAGE_OBJECT_ASSETS[0].key;
  }

  show() {
    this.remove();

    const panel = document.createElement("div");
    panel.id = "stage-editor";
    panel.innerHTML = `
      <div class="editor-header">
        <button class="editor-toggle" type="button">EDITOR</button>
      </div>
      <div class="editor-body">
        <button class="editor-drag-handle" type="button" aria-label="Move editor panel">MOVE PANEL</button>
        <div class="editor-row">
          <label>Tool</label>
          <select data-editor-tool>
            <option value="select">Select</option>
            <option value="move">Move Selected</option>
            <option value="delete">Delete</option>
            <option value="platform">Platform</option>
            <option value="item">Item</option>
            <option value="streetLamp">Street Lamp</option>
            <option value="decoration">Decoration</option>
            <option value="playerStart">Player Start</option>
            <option value="goal">Goal</option>
          </select>
        </div>
        <div class="editor-row">
          <label>Units</label>
          <input data-platform-units type="number" min="1" max="16" value="3" />
        </div>
        <div class="editor-row">
          <label>Item</label>
          <select data-item-type>
            <option value="energyDrink">Energy</option>
            <option value="bubbleTea">Tea</option>
            <option value="shoppingBag">Bag</option>
          </select>
        </div>
        <div class="editor-row">
          <label>Lamp</label>
          <select data-lamp-type>
            <option value="${PROP_ASSETS.lampSingle}">Single</option>
            <option value="${PROP_ASSETS.lampDouble}">Double</option>
          </select>
        </div>
        <div class="editor-row">
          <label>Object</label>
          <select data-decoration-key>
            ${STAGE_OBJECT_ASSETS.map((asset) => `<option value="${asset.key}">${asset.key.replace("stage-", "")}</option>`).join("")}
          </select>
        </div>
        <div class="editor-history-row">
          <button data-editor-undo type="button" disabled>UNDO</button>
          <button data-editor-redo type="button" disabled>REDO</button>
        </div>
        <p class="editor-help">Select picks the nearest object. Move relocates the selected object. Delete removes clicked objects.</p>
        <p class="editor-help">Keys: Z undo. Y redo. Delete removes the selected object.</p>
        <div class="editor-io-row">
          <button class="editor-export-button" type="button">EXPORT JSON</button>
          <button data-editor-import type="button">APPLY JSON</button>
          <button data-editor-load-file type="button">LOAD FILE</button>
        </div>
        <textarea data-editor-export spellcheck="false"></textarea>
        <input data-editor-import-file type="file" accept="application/json,.json" />
        <p data-editor-import-status class="editor-import-status" aria-live="polite"></p>
      </div>
    `;

    document.body.appendChild(panel);
    this.panel = panel;
    this.exportTextarea = panel.querySelector<HTMLTextAreaElement>("[data-editor-export]")!;
    this.platformUnitsInput = panel.querySelector<HTMLInputElement>("[data-platform-units]")!;
    this.itemTypeSelect = panel.querySelector<HTMLSelectElement>("[data-item-type]")!;
    this.lampTypeSelect = panel.querySelector<HTMLSelectElement>("[data-lamp-type]")!;
    this.decorationSelect = panel.querySelector<HTMLSelectElement>("[data-decoration-key]")!;
    this.undoButton = panel.querySelector<HTMLButtonElement>("[data-editor-undo]")!;
    this.redoButton = panel.querySelector<HTMLButtonElement>("[data-editor-redo]")!;
    this.importFileInput = panel.querySelector<HTMLInputElement>("[data-editor-import-file]")!;
    this.importStatus = panel.querySelector<HTMLParagraphElement>("[data-editor-import-status]")!;

    const toggleButton = panel.querySelector<HTMLButtonElement>(".editor-toggle")!;
    const toolSelect = panel.querySelector<HTMLSelectElement>("[data-editor-tool]")!;
    const exportButton = panel.querySelector<HTMLButtonElement>(".editor-export-button")!;
    const importButton = panel.querySelector<HTMLButtonElement>("[data-editor-import]")!;
    const loadFileButton = panel.querySelector<HTMLButtonElement>("[data-editor-load-file]")!;
    toolSelect.value = this.options.initialTool;

    const toggleEditor = () => {
      this.enabled = !this.enabled;
      panel.classList.toggle("is-open", this.enabled);
      toggleButton.textContent = this.enabled ? "EDITOR ON" : "EDITOR";
      this.options.onToggle(this.enabled);
    };
    const setTool = () => {
      this.options.onToolChange(toolSelect.value as EditorTool);
    };
    const importFromTextarea = () => {
      this.options.onImport(this.exportTextarea?.value ?? "");
    };
    const openImportFile = () => {
      this.importFileInput?.click();
    };
    const importSelectedFile = () => {
      const file = this.importFileInput?.files?.[0];
      if (!file) {
        return;
      }

      void file
        .text()
        .then((json) => this.options.onImport(json))
        .catch(() => this.setImportStatus("Could not read JSON file.", true))
        .finally(() => {
          if (this.importFileInput) {
            this.importFileInput.value = "";
          }
        });
    };

    toggleButton.addEventListener("click", toggleEditor);
    toolSelect.addEventListener("change", setTool);
    this.undoButton.addEventListener("click", this.options.onUndo);
    this.redoButton.addEventListener("click", this.options.onRedo);
    exportButton.addEventListener("click", this.options.onExport);
    importButton.addEventListener("click", importFromTextarea);
    loadFileButton.addEventListener("click", openImportFile);
    this.importFileInput.addEventListener("change", importSelectedFile);
    this.cleanup.push(() => {
      toggleButton.removeEventListener("click", toggleEditor);
      toolSelect.removeEventListener("change", setTool);
      this.undoButton?.removeEventListener("click", this.options.onUndo);
      this.redoButton?.removeEventListener("click", this.options.onRedo);
      exportButton.removeEventListener("click", this.options.onExport);
      importButton.removeEventListener("click", importFromTextarea);
      loadFileButton.removeEventListener("click", openImportFile);
      this.importFileInput?.removeEventListener("change", importSelectedFile);
    });
    this.bindDrag(panel);
  }

  setExport(value: string) {
    if (this.exportTextarea) {
      this.exportTextarea.value = value;
    }
  }

  setHistoryState(canUndo: boolean, canRedo: boolean) {
    if (this.undoButton) {
      this.undoButton.disabled = !canUndo;
    }
    if (this.redoButton) {
      this.redoButton.disabled = !canRedo;
    }
  }

  copyExportToClipboard() {
    this.exportTextarea?.select();
    void navigator.clipboard?.writeText(this.exportTextarea?.value ?? "").catch(() => undefined);
  }

  downloadExport(filename: string) {
    const json = this.exportTextarea?.value ?? "";
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  setImportStatus(message: string, isError = false) {
    if (!this.importStatus) {
      return;
    }

    this.importStatus.textContent = message;
    this.importStatus.classList.toggle("is-error", isError);
  }

  remove() {
    this.cleanup.forEach((cleanup) => cleanup());
    this.cleanup = [];
    this.panel?.remove();
    this.panel = undefined;
    this.exportTextarea = undefined;
    this.platformUnitsInput = undefined;
    this.itemTypeSelect = undefined;
    this.lampTypeSelect = undefined;
    this.decorationSelect = undefined;
    this.undoButton = undefined;
    this.redoButton = undefined;
    this.importFileInput = undefined;
    this.importStatus = undefined;
    this.enabled = false;
    document.getElementById("stage-editor")?.remove();
  }

  private bindDrag(panel: HTMLDivElement) {
    const handle = panel.querySelector<HTMLButtonElement>(".editor-drag-handle");
    const body = panel.querySelector<HTMLDivElement>(".editor-body");
    if (!handle || !body) {
      return;
    }

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const movePanel = (clientX: number, clientY: number) => {
      const width = body.offsetWidth;
      const height = body.offsetHeight;
      const left = Math.min(Math.max(8, clientX - offsetX), window.innerWidth - width - 8);
      const top = Math.min(Math.max(8, clientY - offsetY), window.innerHeight - height - 8);
      body.style.position = "fixed";
      body.style.left = `${left}px`;
      body.style.top = `${top}px`;
      body.style.marginTop = "0";
    };

    const startDrag = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = body.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      dragging = true;
      handle.setPointerCapture(event.pointerId);
      panel.classList.add("is-dragging");
    };
    const drag = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      event.preventDefault();
      movePanel(event.clientX, event.clientY);
    };
    const stopDrag = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      dragging = false;
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      panel.classList.remove("is-dragging");
    };

    handle.addEventListener("pointerdown", startDrag);
    handle.addEventListener("pointermove", drag);
    handle.addEventListener("pointerup", stopDrag);
    handle.addEventListener("pointercancel", stopDrag);
    this.cleanup.push(() => {
      handle.removeEventListener("pointerdown", startDrag);
      handle.removeEventListener("pointermove", drag);
      handle.removeEventListener("pointerup", stopDrag);
      handle.removeEventListener("pointercancel", stopDrag);
    });
  }
}
