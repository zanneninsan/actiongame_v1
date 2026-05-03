import { t, type Locale } from "./i18n";

export type MobileInputKey = "w" | "a" | "s" | "d";

type MobileControlsOptions = {
  locale: Locale;
  onInputChange: (key: MobileInputKey, pressed: boolean) => void;
  onJumpQueued: () => void;
  onRestart: () => void;
};

export const createMobileControls = (options: MobileControlsOptions) => {
  document.getElementById("mobile-controls")?.remove();

  const cleanup: Array<() => void> = [];
  const controls = document.createElement("div");
  controls.id = "mobile-controls";
  controls.innerHTML = `
    <div class="mobile-pad">
      <button class="mobile-button pad-up" data-key="w" type="button" aria-label="${t(options.locale, "aria.jump")}">&uarr;</button>
      <button class="mobile-button pad-left" data-key="a" type="button" aria-label="${t(options.locale, "aria.moveLeft")}">&larr;</button>
      <button class="mobile-button pad-down" data-key="s" type="button" aria-label="${t(options.locale, "aria.down")}">&darr;</button>
      <button class="mobile-button pad-right" data-key="d" type="button" aria-label="${t(options.locale, "aria.moveRight")}">&rarr;</button>
    </div>
    <div class="mobile-actions">
      <button class="mobile-button" data-key="w" type="button" aria-label="${t(options.locale, "aria.jump")}">&uarr;</button>
      <button class="mobile-button restart-button" data-action="restart" type="button">R</button>
    </div>
  `;
  document.body.appendChild(controls);

  controls.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((button) => {
    const key = button.dataset.key as MobileInputKey;
    cleanup.push(
      bindMobileButton(button, (pressed) => {
        options.onInputChange(key, pressed);
        if (key === "w" && pressed) {
          options.onJumpQueued();
        }
      }),
    );
  });

  const restartButton = controls.querySelector<HTMLButtonElement>("[data-action='restart']");
  if (restartButton) {
    cleanup.push(
      bindMobileButton(restartButton, (pressed) => {
        if (pressed) {
          options.onRestart();
        }
      }),
    );
  }

  cleanup.push(() => document.getElementById("mobile-controls")?.remove());
  return cleanup;
};

const bindMobileButton = (button: HTMLButtonElement, onPressedChange: (pressed: boolean) => void) => {
  const activePointers = new Set<number>();
  const setPressed = (pressed: boolean) => {
    button.classList.toggle("is-pressed", pressed);
    onPressedChange(pressed);
  };
  const clearPressed = () => {
    activePointers.clear();
    setPressed(false);
  };
  const press = (event: PointerEvent) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    activePointers.add(event.pointerId);
    setPressed(true);
  };
  const release = (event: PointerEvent) => {
    event.preventDefault();
    if (button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
    activePointers.delete(event.pointerId);
    setPressed(activePointers.size > 0);
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  window.addEventListener("blur", clearPressed);
  document.addEventListener("visibilitychange", clearPressed);

  return () => {
    button.removeEventListener("pointerdown", press);
    button.removeEventListener("pointerup", release);
    button.removeEventListener("pointercancel", release);
    button.removeEventListener("lostpointercapture", release);
    window.removeEventListener("blur", clearPressed);
    document.removeEventListener("visibilitychange", clearPressed);
  };
};
