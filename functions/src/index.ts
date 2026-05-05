import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore, type Firestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";

initializeApp();
setGlobalOptions({maxInstances: 10});

const MAX_NAME_LENGTH = 16;
const MAX_GAME_TIME_MS = 360_000;
const TIME_BONUS_PER_SECOND = 10;
const MAX_ITEM_SCORE = 100_000;
const MAX_SCORE = MAX_ITEM_SCORE + (MAX_GAME_TIME_MS / 1000) * TIME_BONUS_PER_SECOND;

export const submitScore = onCall({region: "asia-northeast1", cors: true, invoker: "public"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anonymous auth is required.");
  }

  const data = request.data ?? {};
  const submissionId = cleanText(data.submissionId, 80);
  if (!submissionId) {
    throw new HttpsError("invalid-argument", "Submission id is required.");
  }

  const playerId = cleanPlayerId(data.playerId);
  if (!playerId) {
    throw new HttpsError("invalid-argument", "Player id is required.");
  }
  if (playerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Player id must match the authenticated user.");
  }

  const stageId = cleanStageId(data.stageId);
  if (!stageId) {
    throw new HttpsError("invalid-argument", "Stage id is invalid.");
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

  const firestore = getFirestore();
  const uid = request.auth.uid;
  const scoreRef = firestore.collection("leaderboardScores").doc(`${stageId}_${playerId}`);
  let scoreUpdated = false;
  await firestore.runTransaction(async (transaction) => {
    const currentScore = await transaction.get(scoreRef);
    const currentData = currentScore.data();
    const previousScore = typeof currentData?.score === "number" ? currentData.score : -Infinity;
    const shouldUpdateScore = !currentScore.exists || expectedScore >= previousScore;
    scoreUpdated = shouldUpdateScore;
    const sharedFields = {
      uid,
      playerId,
      stageId,
      stageName: cleanText(data.stageName, 60),
      gameVersion: cleanText(data.gameVersion, 24),
      playerName: cleanText(data.playerName, MAX_NAME_LENGTH) || "PLAYER",
      status: "accepted",
      lastSubmittedAt: FieldValue.serverTimestamp(),
    };

    if (!shouldUpdateScore) {
      transaction.set(scoreRef, sharedFields, {merge: true});
      return;
    }

    transaction.set(scoreRef, {
      ...sharedFields,
      submissionId,
      score: expectedScore,
      itemScore,
      timeBonus: roundScore(expectedScore - itemScore),
      elapsedMs,
      remainingMs,
      createdAt: FieldValue.serverTimestamp(),
    }, {merge: true});
  });

  const rank = scoreUpdated ? await getLeaderboardRank(firestore, stageId, expectedScore) : undefined;
  return {ok: true, status: "accepted", submissionId, scoreUpdated, rank};
});

async function getLeaderboardRank(firestore: Firestore, stageId: string, score: number) {
  const higherScores = await firestore
    .collection("leaderboardScores")
    .where("stageId", "==", stageId)
    .where("status", "==", "accepted")
    .where("score", ">", score)
    .count()
    .get();
  return higherScores.data().count + 1;
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
