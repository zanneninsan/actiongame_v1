export type ControlMode = "pc" | "mobile";

type StartModalOptions = {
  playerName: string;
  controlMode: ControlMode;
  soundOn: boolean;
  onSoundOnChange: (soundOn: boolean) => void;
  onSubmit: (settings: { playerName: string; controlMode: ControlMode; soundOn: boolean }) => void;
};

export class StartModal {
  private readonly options: StartModalOptions;
  private overlay?: HTMLDivElement;

  constructor(options: StartModalOptions) {
    this.options = options;
  }

  show() {
    this.remove();

    const overlay = document.createElement("div");
    overlay.id = "start-modal";
    overlay.innerHTML = `
      <form class="start-dialog">
        <h1>SUPER ZANNENIN SISTERS</h1>
        <label>
          <span>Player Name</span>
          <input name="playerName" type="text" maxlength="16" autocomplete="off" value="${escapeHtml(this.options.playerName)}" />
        </label>
        <div class="mode-row" role="group" aria-label="Control mode">
          <button type="button" data-mode="pc" class="mode-button">PC</button>
          <button type="button" data-mode="mobile" class="mode-button">MOBILE</button>
        </div>
        <div class="sound-row" role="group" aria-label="Sound setting">
          <button type="button" data-sound="on" class="sound-button">&#128266; SOUND ON</button>
          <button type="button" data-sound="off" class="sound-button">&#128263; SOUND OFF</button>
        </div>
        <button type="submit" class="start-button">START</button>
      </form>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;

    const form = overlay.querySelector("form")!;
    const input = overlay.querySelector<HTMLInputElement>("input[name='playerName']")!;
    const modeButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-mode]"));
    const soundButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>("[data-sound]"));
    let selectedMode = this.options.controlMode;
    let soundOn = this.options.soundOn;

    input.addEventListener("keydown", (event) => event.stopPropagation());
    input.addEventListener("keyup", (event) => event.stopPropagation());
    input.addEventListener("keypress", (event) => event.stopPropagation());

    const refreshMode = () => {
      modeButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.mode === selectedMode);
      });
    };

    const refreshSound = () => {
      soundButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.sound === (soundOn ? "on" : "off"));
      });
    };

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedMode = button.dataset.mode === "mobile" ? "mobile" : "pc";
        refreshMode();
      });
    });

    soundButtons.forEach((button) => {
      button.addEventListener("click", () => {
        soundOn = button.dataset.sound === "on";
        this.options.onSoundOnChange(soundOn);
        refreshSound();
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.options.onSubmit({
        playerName: input.value.trim() || "PLAYER",
        controlMode: selectedMode,
        soundOn,
      });
    });

    refreshMode();
    refreshSound();
    input.focus();
    input.select();
  }

  remove() {
    this.overlay?.remove();
    this.overlay = undefined;
    document.getElementById("start-modal")?.remove();
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
