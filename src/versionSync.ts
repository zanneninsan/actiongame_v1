const VERSION_CHECK_RELOAD_KEY = "actiongame_version_reload_target";

type LatestVersionPayload = {
  version?: string;
};

export async function ensureLatestClientVersion(currentVersion: string): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json?ts=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "cache-control": "no-cache",
      },
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as LatestVersionPayload;
    const latestVersion = typeof payload.version === "string" ? payload.version.trim() : "";
    if (!latestVersion || latestVersion === currentVersion) {
      sessionStorage.removeItem(VERSION_CHECK_RELOAD_KEY);
      return;
    }

    const lastReloadTarget = sessionStorage.getItem(VERSION_CHECK_RELOAD_KEY) ?? "";
    if (lastReloadTarget === latestVersion) {
      return;
    }

    sessionStorage.setItem(VERSION_CHECK_RELOAD_KEY, latestVersion);
    window.location.reload();
  } catch (error) {
    console.warn("Latest version check failed.", error);
  }
}
