import {createHash} from "node:crypto";
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore, type Firestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {cleanLeaderboardPayload, roundScore} from "./leaderboardValidation.js";

initializeApp();
setGlobalOptions({maxInstances: 10});

const TOP_GHOST_RANK_LIMIT = 10;
const STAGE_PROPOSAL_COLLECTION = "stageProposals";
const MAX_STAGE_NAME_LENGTH = 40;
const MAX_STAGE_PROPOSAL_JSON_BYTES = 650_000;

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

export const submitStageProposal = onCall({region: "asia-northeast1", cors: true, invoker: "public"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Anonymous auth is required.");
  }

  const payload = cleanStageProposalPayload(request.data);
  const firestore = getFirestore();
  const uid = request.auth.uid;
  const proposalId = createStageNameKey(payload.stageNameJa);
  const proposalRef = firestore.collection(STAGE_PROPOSAL_COLLECTION).doc(proposalId);

  try {
    let duplicateName = false;
    await firestore.runTransaction(async (transaction) => {
      const currentProposal = await transaction.get(proposalRef);
      if (currentProposal.exists) {
        duplicateName = true;
        return;
      }

      transaction.set(proposalRef, {
        uid,
        stageNameJa: payload.stageNameJa,
        stageNameKey: proposalId,
        stage: payload.stage,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    if (duplicateName) {
      return {ok: false, reason: "duplicate-name"};
    }
  } catch (error) {
    console.error("Stage proposal transaction failed.", {error, uid, stageNameJa: payload.stageNameJa});
    throw new HttpsError("unavailable", "Stage proposal could not be saved.");
  }

  return {ok: true, status: "pending", proposalId};
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
    const batch = firestore.batch();
    batch.delete(ghostRef);
    batch.set(scoreRef, {hasGhost: false, ghostUpdatedAt: FieldValue.serverTimestamp()}, {merge: true});
    await batch.commit();
    return false;
  }

  const batch = firestore.batch();
  batch.set(ghostRef, {
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
  });
  batch.set(scoreRef, {hasGhost: true, ghostUpdatedAt: FieldValue.serverTimestamp()}, {merge: true});
  await batch.commit();
  return true;
}

function compactGhostReplay(ghostReplay: NonNullable<ReturnType<typeof cleanLeaderboardPayload>["ghostReplay"]>) {
  const animations = Array.from(new Set(ghostReplay.frames.map((frame) => frame.anim ?? "")));
  return {
    schema: ghostReplay.schema,
    format: "compact-v2",
    gameVersion: ghostReplay.gameVersion,
    stageId: ghostReplay.stageId,
    playerName: ghostReplay.playerName,
    controlMode: ghostReplay.controlMode,
    createdAt: ghostReplay.createdAt,
    durationMs: ghostReplay.durationMs,
    animations,
    frames: ghostReplay.frames.map((frame) => ({
      t: frame.t,
      x: frame.x,
      y: frame.y,
      f:
        (frame.left ? 1 : 0) |
        (frame.right ? 2 : 0) |
        (frame.up ? 4 : 0) |
        (frame.down ? 8 : 0) |
        (frame.dash ? 16 : 0) |
        (frame.flipX ? 32 : 0),
      a: Math.max(0, animations.indexOf(frame.anim ?? "")),
    })),
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

function cleanStageProposalPayload(data: unknown) {
  if (!isRecord(data)) {
    throw new HttpsError("invalid-argument", "Stage proposal payload is invalid.");
  }

  const stageNameJa = cleanStageProposalName(data.stageNameJa);
  if (!stageNameJa) {
    throw new HttpsError("invalid-argument", "Stage name is required.");
  }
  if (!isRecord(data.stage)) {
    throw new HttpsError("invalid-argument", "Stage JSON is invalid.");
  }

  const stageJson = JSON.stringify(data.stage);
  if (Buffer.byteLength(stageJson, "utf8") > MAX_STAGE_PROPOSAL_JSON_BYTES) {
    throw new HttpsError("resource-exhausted", "Stage JSON is too large.");
  }

  const stage = JSON.parse(stageJson) as Record<string, unknown>;
  stage.name = {
    jp: stageNameJa,
    en: stageNameJa,
    zh: stageNameJa,
    ko: stageNameJa,
  };
  return {stageNameJa, stage};
}

function cleanStageProposalName(value: unknown) {
  return typeof value === "string" ? value.normalize("NFKC").trim().slice(0, MAX_STAGE_NAME_LENGTH) : "";
}

function createStageNameKey(stageNameJa: string) {
  return createHash("sha256").update(stageNameJa, "utf8").digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
