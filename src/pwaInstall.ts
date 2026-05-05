type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | undefined;
let appInstalled = false;

export function initializePwaInstall() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent("actiongame:pwa-install-ready"));
  });

  window.addEventListener("appinstalled", () => {
    appInstalled = true;
    deferredInstallPrompt = undefined;
    window.dispatchEvent(new CustomEvent("actiongame:pwa-installed"));
  });
}

export async function promptPwaInstall() {
  if (!deferredInstallPrompt) {
    return "unavailable" as const;
  }

  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = undefined;
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  return choice.outcome;
}

export function canPromptPwaInstall() {
  return Boolean(deferredInstallPrompt);
}

export function isPwaInstalled() {
  return appInstalled || window.matchMedia("(display-mode: standalone)").matches || isNavigatorStandalone();
}

function isNavigatorStandalone() {
  return "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}
