# Firebase Leaderboard Setup

The game client reads accepted scores from Firestore and submits new scores through the `submitScore` callable Cloud Function. Do not allow direct client writes to `leaderboardScores`.

## Client Env

Copy `.env.example` to `.env.local` and fill the Firebase web app values. `VITE_FIREBASE_APPCHECK_SITE_KEY` is optional during local development, but should be enabled for public builds.

## Firestore

Use `firebase/firestore.rules`. The leaderboard documents are public to read, but writes are denied from the client. The callable function is responsible for validation and writes.

Create this composite index if Firestore asks for it:

- Collection: `leaderboardScores`
- Fields: `stageId` ascending, `status` ascending, `score` descending

## Callable Function Shape

The callable should require anonymous Auth and App Check, recompute or sanity-check the final score, rate-limit per UID/IP where possible, and write only accepted submissions.

```ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";

const MAX_NAME_LENGTH = 16;
const MAX_GAME_TIME_MS = 360_000;
const TIME_BONUS_PER_SECOND = 10;

export const submitScore = onCall(
  { region: "asia-northeast1", enforceAppCheck: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Anonymous auth is required.");
    }

    const data = request.data ?? {};
    const itemScore = clampNumber(data.itemScore, 0, 100_000);
    const remainingMs = clampNumber(data.remainingMs, 0, MAX_GAME_TIME_MS);
    const expectedScore = roundScore(itemScore + (remainingMs / 1000) * TIME_BONUS_PER_SECOND);
    const submittedScore = roundScore(clampNumber(data.score, 0, 200_000));

    if (Math.abs(submittedScore - expectedScore) > 0.01) {
      throw new HttpsError("failed-precondition", "Score payload is invalid.");
    }

    await getFirestore().collection("leaderboardScores").add({
      uid: request.auth.uid,
      stageId: cleanText(data.stageId, 40),
      stageName: cleanText(data.stageName, 60),
      gameVersion: cleanText(data.gameVersion, 24),
      playerName: cleanText(data.playerName, MAX_NAME_LENGTH) || "PLAYER",
      score: expectedScore,
      itemScore,
      timeBonus: roundScore(expectedScore - itemScore),
      elapsedMs: clampNumber(data.elapsedMs, 0, MAX_GAME_TIME_MS),
      remainingMs,
      status: "accepted",
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ok: true, status: "accepted" };
  },
);

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
```

This is not perfect anti-cheat because the client still reports run data, but it blocks trivial direct Firestore writes and rejects inconsistent scores. For stronger protection, add server-side stage version allowlists, per-version max score limits, duplicate suppression, and moderation flags.
