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

test("normalizes the legacy Shibu-ya city stage id", () => {
  const payload = cleanLeaderboardPayload(basePayload);

  assert.equal(payload.stageId, "originalDowntown");
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

test("accepts safe future stage ids without a Functions allowlist update", () => {
  const payload = cleanLeaderboardPayload({...basePayload, stageId: "futureStage_01"});

  assert.equal(payload.stageId, "futureStage_01");
});

test("rejects malformed stage ids", () => {
  assertHttpsError(
    () => cleanLeaderboardPayload({...basePayload, stageId: "../future stage"}),
    "invalid-argument",
  );
});

test("accepts current playable stage ids", () => {
  for (const stageId of ["originalDowntown", "neoShibuyaCity", "mobileTouchTutorial", "skybridgeSprint", "skyShaftClimb", "rankingCheck"]) {
    const payload = cleanLeaderboardPayload({...basePayload, stageId});

    assert.equal(payload.stageId, stageId);
  }
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

test("accepts a matching ghost replay payload", () => {
  const payload = cleanLeaderboardPayload({
    ...basePayload,
    ghostReplay: {
      schema: "zannenin-ghost-v1",
      gameVersion: "v0.1.240",
      stageId: "neonCanal",
      playerName: "PLAYER",
      controlMode: "pc",
      createdAt: "2026-05-06T00:00:00.000Z",
      durationMs: 100,
      frames: [
        {t: 0, x: 100, y: 200, left: false, right: false, up: false, down: false, dash: false, flipX: false, anim: "player-idle"},
        {t: 50, x: 102, y: 198, left: false, right: true, up: true, down: false, dash: false, flipX: false, anim: "player-air"},
      ],
    },
  });

  assert.equal(payload.ghostReplay?.stageId, "originalDowntown");
  assert.equal(payload.ghostReplay?.frames.length, 2);
});

test("rejects a ghost replay for a different stage", () => {
  assertHttpsError(
    () =>
      cleanLeaderboardPayload({
        ...basePayload,
        ghostReplay: {
          schema: "zannenin-ghost-v1",
          stageId: "skybridgeSprint",
          playerName: "PLAYER",
          controlMode: "pc",
          durationMs: 100,
          frames: [
            {t: 0, x: 100, y: 200},
            {t: 50, x: 102, y: 198},
          ],
        },
      }),
    "invalid-argument",
  );
});

function assertHttpsError(fn: () => unknown, code: HttpsError["code"]) {
  assert.throws(fn, (error) => error instanceof HttpsError && error.code === code);
}
