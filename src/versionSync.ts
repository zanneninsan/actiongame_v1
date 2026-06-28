const VERSION_CHECK_RELOAD_KEY = "actiongame_version_reload_target";

type LatestVersionPayload = {
  version?: string;
};

export type ClientVersionStatus = {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
};

function parseVersion(version: string): number[] | null {
  const match = version.trim().match(/^v?(\d+(?:\.\d+)*)$/i);
  if (!match) {
    return null;
  }
  return match[1].split(".").map((part) => Number(part));
}

function isNewerVersion(candidate: string, current: string): boolean {
  const candidateParts = parseVersion(candidate);
  const currentParts = parseVersion(current);
  if (!candidateParts || !currentParts) {
    return false;
  }

  const length = Math.max(candidateParts.length, currentParts.length);
  for (let index = 0; index < length; index += 1) {
    const candidatePart = candidateParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;
    if (candidatePart > currentPart) {
      return true;
    }
    if (candidatePart < currentPart) {
      return false;
    }
  }
  return false;
}

export async function checkLatestClientVersion(currentVersion: string): Promise<ClientVersionStatus | undefined> {
  const response = await fetch(`${import.meta.env.BASE_URL}version.json?ts=${Date.now()}`, {
    cache: "no-store",
    headers: {
      "cache-control": "no-cache",
    },
  });
  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as LatestVersionPayload;
  const latestVersion = typeof payload.version === "string" ? payload.version.trim() : "";
  if (!latestVersion) {
    return undefined;
  }

  return {
    currentVersion,
    latestVersion,
    updateAvailable: isNewerVersion(latestVersion, currentVersion),
  };
}

export function reloadToLatestClientVersion(latestVersion: string) {
  sessionStorage.setItem(VERSION_CHECK_RELOAD_KEY, latestVersion);
  window.location.reload();
}

export async function ensureLatestClientVersion(currentVersion: string): Promise<boolean> {
  try {
    const status = await checkLatestClientVersion(currentVersion);
    if (!status?.updateAvailable) {
      sessionStorage.removeItem(VERSION_CHECK_RELOAD_KEY);
      return false;
    }

    const lastReloadTarget = sessionStorage.getItem(VERSION_CHECK_RELOAD_KEY) ?? "";
    if (lastReloadTarget === status.latestVersion) {
      return false;
    }

    reloadToLatestClientVersion(status.latestVersion);
    return true;
  } catch (error) {
    console.warn("Latest version check failed.", error);
    return false;
  }
}
