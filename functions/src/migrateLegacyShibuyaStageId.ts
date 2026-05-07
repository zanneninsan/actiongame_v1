import {execFileSync} from "node:child_process";

const LEGACY_STAGE_ID = "neonCanal";
const TARGET_STAGE_ID = "originalDowntown";
const FIREBASE_PROJECT_ID = "zannenin-sisters-leaderboard";
const DATABASE_ID = "(default)";
const SCORE_COLLECTION = "leaderboardScores";
const GHOST_COLLECTION = "leaderboardGhosts";
const RESOURCE_ROOT = `projects/${FIREBASE_PROJECT_ID}/databases/${DATABASE_ID}`;
const API_ROOT = `https://firestore.googleapis.com/v1/${RESOURCE_ROOT}`;

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  mapValue?: {fields?: Record<string, FirestoreValue>};
  arrayValue?: {values?: FirestoreValue[]};
  nullValue?: null;
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

type RunQueryResult = {
  document?: FirestoreDocument;
};

type BatchGetResult = {
  found?: FirestoreDocument;
  missing?: string;
};

type ScoreCandidate = {
  source: "legacy" | "target";
  score: number;
  scoreDocument: FirestoreDocument;
  ghostDocument?: FirestoreDocument;
};

type MigrationStats = {
  legacyScoresFound: number;
  mergedScores: number;
  movedGhosts: number;
  deletedLegacyGhosts: number;
  legacyGhostsFoundAfterScoreMerge: number;
  orphanGhostsMoved: number;
  orphanGhostsDeleted: number;
  settingsUpdated: number;
  settingsSkipped: boolean;
};

let cachedToken = "";
let tokenExpiresAt = 0;

async function main() {
  const stats: MigrationStats = {
    legacyScoresFound: 0,
    mergedScores: 0,
    movedGhosts: 0,
    deletedLegacyGhosts: 0,
    legacyGhostsFoundAfterScoreMerge: 0,
    orphanGhostsMoved: 0,
    orphanGhostsDeleted: 0,
    settingsUpdated: 0,
    settingsSkipped: false,
  };

  const legacyScores = await queryDocuments(SCORE_COLLECTION, "stageId", LEGACY_STAGE_ID);
  stats.legacyScoresFound = legacyScores.length;

  for (const legacyScore of legacyScores) {
    const result = await migrateScorePair(legacyScore);
    stats.mergedScores += result.mergedScore ? 1 : 0;
    stats.movedGhosts += result.movedGhost ? 1 : 0;
    stats.deletedLegacyGhosts += result.deletedLegacyGhost ? 1 : 0;
  }

  const legacyGhosts = await queryDocuments(GHOST_COLLECTION, "stageId", LEGACY_STAGE_ID);
  stats.legacyGhostsFoundAfterScoreMerge = legacyGhosts.length;
  for (const legacyGhost of legacyGhosts) {
    const result = await migrateOrDeleteOrphanGhost(legacyGhost);
    stats.orphanGhostsMoved += result.movedGhost ? 1 : 0;
    stats.orphanGhostsDeleted += result.deletedGhost ? 1 : 0;
  }

  try {
    stats.settingsUpdated = await migrateSavedStageSettings();
  } catch (error) {
    stats.settingsSkipped = true;
    console.warn("Skipped saved stage settings migration. The score and ghost migration has already completed.", error);
  }

  console.log(JSON.stringify(stats, null, 2));
}

async function migrateScorePair(legacyScore: FirestoreDocument) {
  const legacyFields = legacyScore.fields ?? {};
  const playerId = readPlayerId(legacyFields.playerId, documentIdFromName(legacyScore.name));
  if (!playerId) {
    throw new Error(`Could not resolve playerId for ${legacyScore.name}`);
  }

  const legacyScoreName = documentName(SCORE_COLLECTION, `${LEGACY_STAGE_ID}_${playerId}`);
  const targetScoreName = documentName(SCORE_COLLECTION, `${TARGET_STAGE_ID}_${playerId}`);
  const legacyGhostName = documentName(GHOST_COLLECTION, `${LEGACY_STAGE_ID}_${playerId}`);
  const targetGhostName = documentName(GHOST_COLLECTION, `${TARGET_STAGE_ID}_${playerId}`);
  const documents = await batchGetDocuments([legacyScoreName, targetScoreName, legacyGhostName, targetGhostName]);
  const freshLegacyScore = documents.get(legacyScoreName);
  const targetScore = documents.get(targetScoreName);
  const legacyGhost = documents.get(legacyGhostName);
  const targetGhost = documents.get(targetGhostName);

  if (!freshLegacyScore) {
    return {mergedScore: false, movedGhost: false, deletedLegacyGhost: false};
  }

  const winner = chooseWinner([
    createCandidate("legacy", freshLegacyScore, legacyGhost),
    targetScore ? createCandidate("target", targetScore, targetGhost) : undefined,
  ]);
  const migratedAt = new Date().toISOString();
  const winnerGhostExists = Boolean(winner.ghostDocument);
  const writes = [
    updateWrite(targetScoreName, {
      ...(winner.scoreDocument.fields ?? {}),
      playerId: {stringValue: playerId},
      stageId: {stringValue: TARGET_STAGE_ID},
      hasGhost: {booleanValue: winnerGhostExists},
      migratedFromStageId: {stringValue: LEGACY_STAGE_ID},
      migratedAt: {timestampValue: migratedAt},
    }),
    winner.ghostDocument
      ? updateWrite(targetGhostName, {
          ...(winner.ghostDocument.fields ?? {}),
          playerId: {stringValue: playerId},
          stageId: {stringValue: TARGET_STAGE_ID},
          migratedFromStageId: {stringValue: LEGACY_STAGE_ID},
          migratedAt: {timestampValue: migratedAt},
        })
      : deleteWrite(targetGhostName),
    deleteWrite(legacyScoreName),
    deleteWrite(legacyGhostName),
  ];

  await commitWrites(writes);

  return {
    mergedScore: true,
    movedGhost: winner.source === "legacy" && winnerGhostExists,
    deletedLegacyGhost: Boolean(legacyGhost),
  };
}

async function migrateOrDeleteOrphanGhost(legacyGhost: FirestoreDocument) {
  const legacyFields = legacyGhost.fields ?? {};
  const playerId = readPlayerId(legacyFields.playerId, documentIdFromName(legacyGhost.name));
  if (!playerId) {
    throw new Error(`Could not resolve playerId for ${legacyGhost.name}`);
  }

  const targetScoreName = documentName(SCORE_COLLECTION, `${TARGET_STAGE_ID}_${playerId}`);
  const targetGhostName = documentName(GHOST_COLLECTION, `${TARGET_STAGE_ID}_${playerId}`);
  const documents = await batchGetDocuments([targetScoreName, targetGhostName]);
  const targetScore = documents.get(targetScoreName);
  const targetScoreValue = targetScore ? readNumber(targetScore.fields?.score) : -Infinity;
  const legacyGhostScore = readNumber(legacyFields.score);
  const migratedAt = new Date().toISOString();

  if (targetScoreValue > legacyGhostScore) {
    await commitWrites([deleteWrite(legacyGhost.name)]);
    return {movedGhost: false, deletedGhost: true};
  }

  await commitWrites([
    updateWrite(targetScoreName, {
      ...(targetScore?.fields ?? legacyFields),
      playerId: {stringValue: playerId},
      stageId: {stringValue: TARGET_STAGE_ID},
      score: legacyFields.score ?? {doubleValue: 0},
      hasGhost: {booleanValue: true},
      status: {stringValue: readString(targetScore?.fields?.status) || "accepted"},
      migratedFromStageId: {stringValue: LEGACY_STAGE_ID},
      migratedAt: {timestampValue: migratedAt},
    }),
    updateWrite(targetGhostName, {
      ...legacyFields,
      playerId: {stringValue: playerId},
      stageId: {stringValue: TARGET_STAGE_ID},
      migratedFromStageId: {stringValue: LEGACY_STAGE_ID},
      migratedAt: {timestampValue: migratedAt},
    }),
    deleteWrite(legacyGhost.name),
  ]);

  return {movedGhost: true, deletedGhost: true};
}

async function migrateSavedStageSettings() {
  const settings = await queryDocuments("settings", "stageId", LEGACY_STAGE_ID, true);
  const migratedAt = new Date().toISOString();
  for (const setting of settings) {
    await commitWrites([
      updateWrite(setting.name, {
        ...(setting.fields ?? {}),
        stageId: {stringValue: TARGET_STAGE_ID},
        migratedFromStageId: {stringValue: LEGACY_STAGE_ID},
        migratedAt: {timestampValue: migratedAt},
      }),
    ]);
  }
  return settings.length;
}

async function queryDocuments(collectionId: string, fieldPath: string, value: string, allDescendants = false) {
  const result = await firestoreFetch<RunQueryResult[]>(`${API_ROOT}/documents:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{collectionId, allDescendants}],
        where: {
          fieldFilter: {
            field: {fieldPath},
            op: "EQUAL",
            value: {stringValue: value},
          },
        },
      },
    }),
  });
  return result.map((entry) => entry.document).filter((document): document is FirestoreDocument => Boolean(document));
}

async function batchGetDocuments(names: string[]) {
  const result = await firestoreFetch<BatchGetResult[]>(`${API_ROOT}/documents:batchGet`, {
    method: "POST",
    body: JSON.stringify({documents: names}),
  });
  const documents = new Map<string, FirestoreDocument>();
  for (const entry of result) {
    if (entry.found) {
      documents.set(entry.found.name, entry.found);
    }
  }
  return documents;
}

async function commitWrites(writes: unknown[]) {
  await firestoreFetch(`${API_ROOT}/documents:commit`, {
    method: "POST",
    body: JSON.stringify({writes}),
  });
}

async function firestoreFetch<T = unknown>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Authorization": `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

function createCandidate(
  source: ScoreCandidate["source"],
  scoreDocument: FirestoreDocument,
  ghostDocument: FirestoreDocument | undefined,
): ScoreCandidate {
  return {
    source,
    score: readNumber(scoreDocument.fields?.score),
    scoreDocument,
    ghostDocument,
  };
}

function chooseWinner(candidates: Array<ScoreCandidate | undefined>) {
  const availableCandidates = candidates.filter((candidate): candidate is ScoreCandidate => Boolean(candidate));
  const winner = availableCandidates.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    if (Boolean(a.ghostDocument) !== Boolean(b.ghostDocument)) {
      return a.ghostDocument ? -1 : 1;
    }
    return a.source === "target" ? -1 : 1;
  })[0];
  if (!winner) {
    throw new Error("No score candidate was available.");
  }
  return winner;
}

function updateWrite(name: string, fields: Record<string, FirestoreValue>) {
  return {
    update: {
      name,
      fields,
    },
  };
}

function deleteWrite(name: string) {
  return {delete: name};
}

function getAccessToken() {
  const now = Date.now();
  if (!cachedToken || now > tokenExpiresAt - 60_000) {
    cachedToken =
      process.platform === "win32"
        ? execFileSync("powershell", ["-NoProfile", "-Command", "gcloud auth print-access-token"], {encoding: "utf8"}).trim()
        : execFileSync("gcloud", ["auth", "print-access-token"], {encoding: "utf8"}).trim();
    tokenExpiresAt = now + 55 * 60_000;
  }
  return cachedToken;
}

function readNumber(value: FirestoreValue | undefined) {
  if (typeof value?.doubleValue === "number") {
    return value.doubleValue;
  }
  if (typeof value?.integerValue === "string") {
    return Number(value.integerValue);
  }
  return -Infinity;
}

function readString(value: FirestoreValue | undefined) {
  return typeof value?.stringValue === "string" ? value.stringValue : "";
}

function readPlayerId(value: FirestoreValue | undefined, documentId: string) {
  if (typeof value?.stringValue === "string" && value.stringValue.trim()) {
    return value.stringValue.trim();
  }
  const prefix = `${LEGACY_STAGE_ID}_`;
  return documentId.startsWith(prefix) ? documentId.slice(prefix.length) : "";
}

function documentName(collectionId: string, id: string) {
  return `${RESOURCE_ROOT}/documents/${collectionId}/${id}`;
}

function documentIdFromName(name: string) {
  return name.slice(name.lastIndexOf("/") + 1);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
