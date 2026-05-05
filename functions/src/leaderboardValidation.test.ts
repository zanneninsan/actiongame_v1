import assert from "node:assert/strict";
import test from "node:test";
import {HttpsError} from "firebase-functions/v2/https";
import {cleanLeaderboardPayload} from "./leaderboardValidation.js";

const basePayload = {
  submissionId: "11111111-2222-4333-8444-555555555555",
  playerId: "player-12345678",
  stageId: "neonCanal",
  stageName: "Shibu-ya city",
  gameVersion: "v0.1.201",
  playerName: "PLAYER",
  score: 4250,
  itemScore: 4250,
  elapsedMs: 360000,
  remainingMs: 0,
};

test("accepts a valid leaderboard payload", () => {
  const payload = cleanLeaderboardPayload(basePayload);

  assert.equal(payload.stageId, "neonCanal");
  assert.equal(payload.itemScore, 4250);
  assert.equal(payload.expectedScore, 4250);
});

test("rejects unknown stages", () => {
  assertHttpsError(
    () => cleanLeaderboardPayload({...basePayload, stageId: "futureStage"}),
    "invalid-argument",
  );
});

test("rejects item scores above the selected stage limit", () => {
  assertHttpsError(
    () => cleanLeaderboardPayload({...basePayload, stageId: "skyShaftClimb", itemScore: 1600.01, score: 1600.01}),
    "failed-precondition",
  );
});

test("rejects score values that do not match item score plus time bonus", () => {
  assertHttpsError(
    () => cleanLeaderboardPayload({...basePayload, score: 4251}),
    "failed-precondition",
  );
});

test("rejects impossible instant clears", () => {
  assertHttpsError(
    () => cleanLeaderboardPayload({...basePayload, score: 7850, remainingMs: 360000, elapsedMs: 0}),
    "failed-precondition",
  );
});

function assertHttpsError(fn: () => unknown, code: HttpsError["code"]) {
  assert.throws(fn, (error) => error instanceof HttpsError && error.code === code);
}
