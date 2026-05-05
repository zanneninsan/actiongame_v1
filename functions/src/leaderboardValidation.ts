import {HttpsError} from "firebase-functions/v2/https";

export const MAX_NAME_LENGTH = 16;
export const MAX_GAME_TIME_MS = 360_000;
export const TIME_BONUS_PER_SECOND = 10;
export const GHOST_REPLAY_SCHEMA = "zannenin-ghost-v1";
export const MAX_GHOST_FRAMES = 9_000;
const MAX_SCORE_DRIFT = 0.01;
const TIMER_DRIFT_MS = 1000;
const LEADERBOARD_ANTI_CHEAT_ENABLED = false;

type StageScoreLimit = {
  maxScoreBeforeTimeBonus: number;
  minElapsedMs: number;
};

const STAGE_SCORE_LIMITS: Record<string, StageScoreLimit> = {
  neonCanal: {maxScoreBeforeTimeBonus: 4350, minElapsedMs: 1000},
  neoShibuyaCity: {maxScoreBeforeTimeBonus: 5000, minElapsedMs: 1000},
  skybridgeSprint: {maxScoreBeforeTimeBonus: 3700, minElapsedMs: 1000},
  skyShaftClimb: {maxScoreBeforeTimeBonus: 1900, minElapsedMs: 1000},
  rankingCheck: {maxScoreBeforeTimeBonus: 1500, minElapsedMs: 0},
};

export type CleanLeaderboardPayload = {
  submissionId: string;
  playerId: string;
  stageId: string;
  stageName: string;
  gameVersion: string;
  playerName: string;
  expectedScore: number;
  itemScore: number;
  elapsedMs: number;
  remainingMs: number;
  ghostReplay?: CleanGhostReplay;
};

export type CleanGhostReplayFrame = {
  t: number;
  x: number;
  y: number;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  dash: boolean;
  flipX: boolean;
  anim?: string;
};

export type CleanGhostReplay = {
  schema: typeof GHOST_REPLAY_SCHEMA;
  gameVersion: string;
  stageId: string;
  playerName: string;
  controlMode: "pc" | "mobile";
  createdAt: string;
  durationMs: number;
  frames: CleanGhostReplayFrame[];
};

export function cleanLeaderboardPayload(data: unknown): CleanLeaderboardPayload {
  const payload = isRecord(data) ? data : {};
  const submissionId = cleanText(payload.submissionId, 80);
  if (!submissionId) {
    throw new HttpsError("invalid-argument", "Submission id is required.");
  }

  const playerId = cleanPlayerId(payload.playerId);
  if (!playerId) {
    throw new HttpsError("invalid-argument", "Player id is required.");
  }

  const stageId = cleanStageId(payload.stageId);
  const stageLimit = stageId ? STAGE_SCORE_LIMITS[stageId] : undefined;
  if (!stageId || !stageLimit) {
    throw new HttpsError("invalid-argument", "Stage id is invalid.");
  }

  const itemScore = readFiniteNumber(payload.itemScore);
  const remainingMs = readFiniteNumber(payload.remainingMs);
  const elapsedMs = readFiniteNumber(payload.elapsedMs);
  const submittedScoreValue = readFiniteNumber(payload.score);
  const expectedScore = LEADERBOARD_ANTI_CHEAT_ENABLED ?
    validateScorePayload({itemScore, remainingMs, elapsedMs, submittedScoreValue, stageLimit}) :
    roundScore(submittedScoreValue);

  return {
    submissionId,
    playerId,
    stageId,
    stageName: cleanText(payload.stageName, 60),
    gameVersion: cleanText(payload.gameVersion, 24),
    playerName: cleanText(payload.playerName, MAX_NAME_LENGTH) || "PLAYER",
    expectedScore,
    itemScore,
    elapsedMs,
    remainingMs,
    ghostReplay: cleanGhostReplay(payload.ghostReplay, {stageId, playerName: cleanText(payload.playerName, MAX_NAME_LENGTH) || "PLAYER"}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanPlayerId(value: unknown) {
  const playerId = cleanText(value, 80);
  return /^[a-zA-Z0-9_-]{8,80}$/.test(playerId) ? playerId : "";
}

function cleanStageId(value: unknown) {
  const stageId = cleanText(value, 40);
  return /^[a-zA-Z0-9_-]{1,40}$/.test(stageId) ? stageId : "";
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function readFiniteNumber(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new HttpsError("invalid-argument", "Expected a finite number.");
  }
  return numberValue;
}

export function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function cleanGhostReplay(value: unknown, context: {stageId: string; playerName: string}): CleanGhostReplay | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new HttpsError("invalid-argument", "Ghost replay payload is invalid.");
  }
  if (value.schema !== GHOST_REPLAY_SCHEMA) {
    throw new HttpsError("invalid-argument", "Ghost replay schema is invalid.");
  }
  const stageId = cleanStageId(value.stageId);
  if (stageId !== context.stageId) {
    throw new HttpsError("invalid-argument", "Ghost replay stage does not match the score stage.");
  }
  const framesValue = Array.isArray(value.frames) ? value.frames : undefined;
  if (!framesValue || framesValue.length < 2 || framesValue.length > MAX_GHOST_FRAMES) {
    throw new HttpsError("invalid-argument", "Ghost replay frame count is invalid.");
  }

  let previousTime = -1;
  const frames = framesValue.map((frameValue) => {
    if (!isRecord(frameValue)) {
      throw new HttpsError("invalid-argument", "Ghost replay frame is invalid.");
    }
    const t = Math.round(readFiniteNumber(frameValue.t));
    const x = Math.round(readFiniteNumber(frameValue.x) * 10) / 10;
    const y = Math.round(readFiniteNumber(frameValue.y) * 10) / 10;
    if (t < 0 || t > MAX_GAME_TIME_MS || t < previousTime) {
      throw new HttpsError("invalid-argument", "Ghost replay frame time is invalid.");
    }
    previousTime = t;
    return {
      t,
      x,
      y,
      left: Boolean(frameValue.left),
      right: Boolean(frameValue.right),
      up: Boolean(frameValue.up),
      down: Boolean(frameValue.down),
      dash: Boolean(frameValue.dash),
      flipX: Boolean(frameValue.flipX),
      anim: cleanText(frameValue.anim, 40) || undefined,
    };
  });

  return {
    schema: GHOST_REPLAY_SCHEMA,
    gameVersion: cleanText(value.gameVersion, 24),
    stageId,
    playerName: cleanText(value.playerName, MAX_NAME_LENGTH) || context.playerName,
    controlMode: value.controlMode === "mobile" ? "mobile" : "pc",
    createdAt: cleanText(value.createdAt, 40),
    durationMs: clamp(Math.round(readFiniteNumber(value.durationMs)), 0, MAX_GAME_TIME_MS),
    frames,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function validateScorePayload({
  itemScore,
  remainingMs,
  elapsedMs,
  submittedScoreValue,
  stageLimit,
}: {
  itemScore: number;
  remainingMs: number;
  elapsedMs: number;
  submittedScoreValue: number;
  stageLimit: StageScoreLimit;
}) {
  if (itemScore < 0 || itemScore > stageLimit.maxScoreBeforeTimeBonus) {
    throw new HttpsError("failed-precondition", "Score before time bonus exceeds the stage limit.");
  }

  if (remainingMs < 0 || remainingMs > MAX_GAME_TIME_MS || elapsedMs < 0 || elapsedMs > MAX_GAME_TIME_MS) {
    throw new HttpsError("failed-precondition", "Timer payload is invalid.");
  }
  if (elapsedMs + remainingMs > MAX_GAME_TIME_MS + TIMER_DRIFT_MS) {
    throw new HttpsError("failed-precondition", "Timer payload is invalid.");
  }
  if (elapsedMs < stageLimit.minElapsedMs || remainingMs > MAX_GAME_TIME_MS - stageLimit.minElapsedMs + TIMER_DRIFT_MS) {
    throw new HttpsError("failed-precondition", "Clear time is too short for leaderboard submission.");
  }

  const expectedScore = roundScore(itemScore + (remainingMs / 1000) * TIME_BONUS_PER_SECOND);
  const maxScore = stageLimit.maxScoreBeforeTimeBonus + (MAX_GAME_TIME_MS / 1000) * TIME_BONUS_PER_SECOND;
  if (submittedScoreValue < 0 || submittedScoreValue > maxScore) {
    throw new HttpsError("failed-precondition", "Score payload is invalid.");
  }
  const submittedScore = roundScore(submittedScoreValue);
  if (Math.abs(submittedScore - expectedScore) > MAX_SCORE_DRIFT) {
    throw new HttpsError("failed-precondition", "Score payload is invalid.");
  }

  return expectedScore;
}
