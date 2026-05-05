import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore, type Firestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {cleanLeaderboardPayload, roundScore} from "./leaderboardValidation.js";

initializeApp();
setGlobalOptions({maxInstances: 10});

const TOP_GHOST_RANK_LIMIT = 10;

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
  const ghostSaved = scoreUpdated ?
    await saveTopRankGhostSafely(firestore, payload, uid, rank) :
    false;
  return {ok: true, status: "accepted", submissionId: payload.submissionId, scoreUpdated, rank, ghostSaved};
});

async function saveTopRankGhostSafely(
  firestore: Firestore,
  payload: ReturnType<typeof cleanLeaderboardPayload>,
  uid: string,
  rank: number | undefined,
) {
  try {
    return await saveTopRankGhost(firestore, payload, uid, rank);
  } catch (error) {
    console.warn("Leaderboard ghost save failed.", {
      error,
      playerId: payload.playerId,
      stageId: payload.stageId,
      submissionId: payload.submissionId,
    });
    return false;
  }
}

async function saveTopRankGhost(
  firestore: Firestore,
  payload: ReturnType<typeof cleanLeaderboardPayload>,
  uid: string,
  rank: number | undefined,
) {
  const scoreRef = firestore.collection("leaderboardScores").doc(`${payload.stageId}_${payload.playerId}`);
  const ghostRef = firestore.collection("leaderboardGhosts").doc(`${payload.stageId}_${payload.playerId}`);
  const ghostReplay = payload.ghostReplay;
  const shouldSaveGhost = typeof rank === "number" && rank <= TOP_GHOST_RANK_LIMIT && Boolean(ghostReplay);

  if (!shouldSaveGhost || !ghostReplay) {
    await Promise.all([
      ghostRef.delete().catch(() => undefined),
      scoreRef.set({hasGhost: false, ghostUpdatedAt: FieldValue.serverTimestamp()}, {merge: true}),
    ]);
    return false;
  }

  await Promise.all([
    ghostRef.set({
      uid,
      playerId: payload.playerId,
      stageId: payload.stageId,
      stageName: payload.stageName,
      submissionId: payload.submissionId,
      gameVersion: payload.gameVersion,
      playerName: payload.playerName,
      score: payload.expectedScore,
      rank,
      ghostReplay: compactGhostReplay(ghostReplay),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }),
    scoreRef.set({hasGhost: true, ghostUpdatedAt: FieldValue.serverTimestamp()}, {merge: true}),
  ]);
  return true;
}

function compactGhostReplay(ghostReplay: NonNullable<ReturnType<typeof cleanLeaderboardPayload>["ghostReplay"]>) {
  const animations = Array.from(new Set(ghostReplay.frames.map((frame) => frame.anim ?? "")));
  return {
    schema: ghostReplay.schema,
    format: "compact-v1",
    gameVersion: ghostReplay.gameVersion,
    stageId: ghostReplay.stageId,
    playerName: ghostReplay.playerName,
    controlMode: ghostReplay.controlMode,
    createdAt: ghostReplay.createdAt,
    durationMs: ghostReplay.durationMs,
    animations,
    frames: ghostReplay.frames.map((frame) => [
      frame.t,
      frame.x,
      frame.y,
      (frame.left ? 1 : 0) |
        (frame.right ? 2 : 0) |
        (frame.up ? 4 : 0) |
        (frame.down ? 8 : 0) |
        (frame.dash ? 16 : 0) |
        (frame.flipX ? 32 : 0),
      Math.max(0, animations.indexOf(frame.anim ?? "")),
    ]),
  };
}

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
