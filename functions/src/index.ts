import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore, type Firestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {cleanLeaderboardPayload, roundScore} from "./leaderboardValidation.js";

initializeApp();
setGlobalOptions({maxInstances: 10});

export const submitScore = onCall({region: "asia-northeast1", cors: true, invoker: "public"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anonymous auth is required.");
  }

  const payload = cleanLeaderboardPayload(request.data);
  if (payload.playerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Player id must match the authenticated user.");
  }

  const firestore = getFirestore();
  const uid = request.auth.uid;
  const scoreRef = firestore.collection("leaderboardScores").doc(`${payload.stageId}_${payload.playerId}`);
  let scoreUpdated = false;
  try {
    await firestore.runTransaction(async (transaction) => {
      const currentScore = await transaction.get(scoreRef);
      const currentData = currentScore.data();
      const previousScore = typeof currentData?.score === "number" ? currentData.score : -Infinity;
      const shouldUpdateScore = !currentScore.exists || payload.expectedScore >= previousScore;
      scoreUpdated = shouldUpdateScore;
      const sharedFields = {
        uid,
        playerId: payload.playerId,
        stageId: payload.stageId,
        stageName: payload.stageName,
        gameVersion: payload.gameVersion,
        playerName: payload.playerName,
        status: "accepted",
        lastSubmittedAt: FieldValue.serverTimestamp(),
      };

      if (!shouldUpdateScore) {
        transaction.set(scoreRef, sharedFields, {merge: true});
        return;
      }

      transaction.set(scoreRef, {
        ...sharedFields,
        submissionId: payload.submissionId,
        score: payload.expectedScore,
        itemScore: payload.itemScore,
        timeBonus: roundScore(payload.expectedScore - payload.itemScore),
        elapsedMs: payload.elapsedMs,
        remainingMs: payload.remainingMs,
        createdAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    });
  } catch (error) {
    console.error("Leaderboard score transaction failed.", {
      error,
      playerId: payload.playerId,
      stageId: payload.stageId,
      submissionId: payload.submissionId,
    });
    throw new HttpsError("unavailable", "Leaderboard score could not be saved.");
  }

  const rank = scoreUpdated ? await getLeaderboardRankSafely(firestore, payload.stageId, payload.expectedScore) : undefined;
  return {ok: true, status: "accepted", submissionId: payload.submissionId, scoreUpdated, rank};
});

async function getLeaderboardRankSafely(firestore: Firestore, stageId: string, score: number) {
  try {
    return await getLeaderboardRank(firestore, stageId, score);
  } catch (error) {
    console.warn("Leaderboard rank calculation failed.", error);
    return undefined;
  }
}

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
