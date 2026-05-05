import {HttpsError} from "firebase-functions/v2/https";

export const MAX_NAME_LENGTH = 16;
export const MAX_GAME_TIME_MS = 360_000;
export const TIME_BONUS_PER_SECOND = 10;
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
