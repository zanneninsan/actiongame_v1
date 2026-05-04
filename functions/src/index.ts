import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";

initializeApp();
setGlobalOptions({maxInstances: 10});

const MAX_NAME_LENGTH = 16;
const MAX_GAME_TIME_MS = 360_000;
const TIME_BONUS_PER_SECOND = 10;
const ALLOWED_STAGE_IDS = new Set(["neonCanal"]);
const MAX_ITEM_SCORE = 100_000;
const MAX_SCORE = MAX_ITEM_SCORE + (MAX_GAME_TIME_MS / 1000) * TIME_BONUS_PER_SECOND;

export const submitScore = onCall({region: "asia-northeast1", cors: true}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anonymous auth is required.");
  }

  const data = request.data ?? {};
  const stageId = cleanText(data.stageId, 40);
  if (!ALLOWED_STAGE_IDS.has(stageId)) {
    throw new HttpsError("invalid-argument", "Unknown stage.");
  }

  const itemScore = clampNumber(data.itemScore, 0, MAX_ITEM_SCORE);
  const remainingMs = clampNumber(data.remainingMs, 0, MAX_GAME_TIME_MS);
  const elapsedMs = clampNumber(data.elapsedMs, 0, MAX_GAME_TIME_MS);
  if (elapsedMs + remainingMs > MAX_GAME_TIME_MS + 1000) {
    throw new HttpsError("failed-precondition", "Timer payload is invalid.");
  }

  const expectedScore = roundScore(itemScore + (remainingMs / 1000) * TIME_BONUS_PER_SECOND);
  const submittedScore = roundScore(clampNumber(data.score, 0, MAX_SCORE));
  if (Math.abs(submittedScore - expectedScore) > 0.01) {
    throw new HttpsError("failed-precondition", "Score payload is invalid.");
  }

  await getFirestore().collection("leaderboardScores").add({
    uid: request.auth.uid,
    stageId,
    stageName: cleanText(data.stageName, 60),
    gameVersion: cleanText(data.gameVersion, 24),
    playerName: cleanText(data.playerName, MAX_NAME_LENGTH) || "PLAYER",
    score: expectedScore,
    itemScore,
    timeBonus: roundScore(expectedScore - itemScore),
    elapsedMs,
    remainingMs,
    status: "accepted",
    createdAt: FieldValue.serverTimestamp(),
  });

  return {ok: true, status: "accepted"};
});

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function clampNumber(value: unknown, min: number, max: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new HttpsError("invalid-argument", "Expected a finite number.");
  }
  return Math.min(max, Math.max(min, numberValue));
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}
