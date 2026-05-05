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

test("accepts enemy defeat bonus in the score before time bonus", () => {
  const payload = cleanLeaderboardPayload({
    ...basePayload,
    itemScore: 4350,
    score: 4350,
  });

  assert.equal(payload.itemScore, 4350);
  assert.equal(payload.expectedScore, 4350);
});

test("rejects unknown stages", () => {
  assertHttpsError(
    () => cleanLeaderboardPayload({...basePayload, stageId: "futureStage"}),
    "invalid-argument",
  );
});

test("accepts score before time bonus above the selected stage limit while anti-cheat is disabled", () => {
  const payload = cleanLeaderboardPayload({
    ...basePayload,
    stageId: "skyShaftClimb",
    itemScore: 1900.01,
    score: 1900.01,
  });

  assert.equal(payload.expectedScore, 1900.01);
});

test("accepts score values that do not match item score plus time bonus while anti-cheat is disabled", () => {
  const payload = cleanLeaderboardPayload({...basePayload, score: 4251});

  assert.equal(payload.expectedScore, 4251);
});

test("accepts impossible instant clears while anti-cheat is disabled", () => {
  const payload = cleanLeaderboardPayload({...basePayload, score: 7850, remainingMs: 360000, elapsedMs: 0});

  assert.equal(payload.expectedScore, 7850);
});

function assertHttpsError(fn: () => unknown, code: HttpsError["code"]) {
  assert.throws(fn, (error) => error instanceof HttpsError && error.code === code);
}
