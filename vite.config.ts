import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIRTUAL_BACKGROUND_ASSETS_ID = "virtual:background-assets";
const RESOLVED_BACKGROUND_ASSETS_ID = `\0${VIRTUAL_BACKGROUND_ASSETS_ID}`;
const BACKGROUND_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const REAR_ORDER = ["IMG_4202.webp", "starry_sky.webp", "ED96A78D-7F78-4486-8F37-8004120CB7FC.png"];
const MIDGROUND_ORDER = ["city_loop_strip.webp"];

type BackgroundKind = "rear" | "midground";

function getExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function getStem(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
}

function getAssetLabel(fileName: string) {
  const stem = getStem(fileName);
  if (stem === "city_loop_strip") {
    return "CITY";
  }
  if (stem === "starry_sky") {
    return "STAR";
  }
  if (stem.startsWith("IMG_")) {
    return stem.slice(4) || "IMG";
  }
  return stem.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "BG";
}

function getAssetKey(kind: BackgroundKind, fileName: string) {
  return `${kind}-${getStem(fileName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function sortBackgrounds(fileNames: string[], preferredOrder: string[]) {
  const preferredIndex = new Map(preferredOrder.map((fileName, index) => [fileName, index]));
  return fileNames.sort((a, b) => {
    const indexA = preferredIndex.get(a) ?? Number.MAX_SAFE_INTEGER;
    const indexB = preferredIndex.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.localeCompare(b);
  });
}

function listBackgrounds(kind: BackgroundKind) {
  const folder = join(__dirname, "public", "assets", "backgrounds", kind);
  const preferredOrder = kind === "rear" ? REAR_ORDER : MIDGROUND_ORDER;
  const fileNames = readdirSync(folder).filter((fileName) => {
    const filePath = join(folder, fileName);
    return statSync(filePath).isFile() && BACKGROUND_EXTENSIONS.has(getExtension(fileName));
  });

  return sortBackgrounds(fileNames, preferredOrder).map((fileName) => ({
    key: getAssetKey(kind, fileName),
    path: `assets/backgrounds/${kind}/${fileName}`,
    label: getAssetLabel(fileName),
  }));
}

function isBackgroundAssetPath(filePath: string) {
  const backgroundRoot = join(__dirname, "public", "assets", "backgrounds");
  return filePath.startsWith(backgroundRoot) && BACKGROUND_EXTENSIONS.has(getExtension(filePath));
}

function backgroundAssetsPlugin(): Plugin {
  return {
    name: "background-assets",
    resolveId(id) {
      return id === VIRTUAL_BACKGROUND_ASSETS_ID ? RESOLVED_BACKGROUND_ASSETS_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_BACKGROUND_ASSETS_ID) {
        return null;
      }

      return [
        `export const REAR_BACKGROUNDS = ${JSON.stringify(listBackgrounds("rear"), null, 2)};`,
        `export const MIDGROUND_BACKGROUNDS = ${JSON.stringify(listBackgrounds("midground"), null, 2)};`,
      ].join("\n");
    },
    configureServer(server) {
      server.watcher.add([
        join(__dirname, "public", "assets", "backgrounds", "rear"),
        join(__dirname, "public", "assets", "backgrounds", "midground"),
      ]);

      const reloadBackgroundAssets = (filePath: string) => {
        if (!isBackgroundAssetPath(filePath)) {
          return;
        }
        const module = server.moduleGraph.getModuleById(RESOLVED_BACKGROUND_ASSETS_ID);
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: "full-reload" });
      };

      server.watcher.on("add", reloadBackgroundAssets);
      server.watcher.on("unlink", reloadBackgroundAssets);
    },
  };
}

const githubPagesBasePath = process.env.GITHUB_PAGES_BASE_PATH;

export default defineConfig({
  base:
    process.env.GITHUB_PAGES === "true"
      ? githubPagesBasePath && githubPagesBasePath.length > 0
        ? githubPagesBasePath
        : "/actiongame_v1/"
      : "/",
  plugins: [backgroundAssetsPlugin()],
  build: {
    chunkSizeWarningLimit: 1800,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (normalizedId.includes("/node_modules/phaser/")) {
            return "vendor-phaser";
          }
          if (normalizedId.includes("/node_modules/@firebase/") || normalizedId.includes("/node_modules/firebase/")) {
            return "vendor-firebase";
          }
          if (normalizedId.includes("/node_modules/")) {
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
