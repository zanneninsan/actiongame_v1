import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  limit as limitQuery,
  orderBy,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { getFunctions, httpsCallable, type Functions } from "firebase/functions";

export type LeaderboardEntry = {
  id: string;
  playerName: string;
  score: number;
  stageId: string;
  stageName: string;
  gameVersion: string;
  createdAt: Date | null;
};

export type LeaderboardSubmitPayload = {
  stageId: string;
  stageName: string;
  gameVersion: string;
  playerName: string;
  score: number;
  itemScore: number;
  timeBonus: number;
  elapsedMs: number;
  remainingMs: number;
};

type FirebaseServices = {
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
};

const LEADERBOARD_COLLECTION = "leaderboardScores";
const SUBMIT_SCORE_FUNCTION = "submitScore";
let servicesPromise: Promise<FirebaseServices | undefined> | undefined;
let appCheckInitialized = false;

export function isLeaderboardConfigured() {
  return Boolean(getFirebaseConfig());
}

export async function submitLeaderboardScore(payload: LeaderboardSubmitPayload) {
  const services = await getFirebaseServices();
  if (!services) {
    return { ok: false, reason: "Leaderboard is not configured." };
  }

  await ensureAnonymousAuth(services.auth);
  const submitScore = httpsCallable<LeaderboardSubmitPayload, { ok: boolean; status?: string }>(
    services.functions,
    SUBMIT_SCORE_FUNCTION,
  );
  return submitScore({
    ...payload,
    playerName: sanitizePlayerName(payload.playerName),
    score: roundScore(payload.score),
    timeBonus: roundScore(payload.timeBonus),
  }).then((result) => result.data);
}

export async function fetchLeaderboardEntries(stageId: string, maxEntries = 10): Promise<LeaderboardEntry[]> {
  const services = await getFirebaseServices();
  if (!services) {
    return [];
  }

  const entriesQuery = query(
    collection(services.firestore, LEADERBOARD_COLLECTION),
    where("stageId", "==", stageId),
    where("status", "==", "accepted"),
    orderBy("score", "desc"),
    limitQuery(maxEntries),
  );
  const snapshot = await getDocs(entriesQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAtValue = data.createdAt as { toDate?: () => Date } | undefined;
    return {
      id: doc.id,
      playerName: typeof data.playerName === "string" ? data.playerName : "PLAYER",
      score: typeof data.score === "number" ? data.score : 0,
      stageId: typeof data.stageId === "string" ? data.stageId : stageId,
      stageName: typeof data.stageName === "string" ? data.stageName : stageId,
      gameVersion: typeof data.gameVersion === "string" ? data.gameVersion : "",
      createdAt: createdAtValue?.toDate?.() ?? null,
    };
  });
}

function getFirebaseServices() {
  servicesPromise ??= initializeFirebaseServices();
  return servicesPromise;
}

async function initializeFirebaseServices(): Promise<FirebaseServices | undefined> {
  const config = getFirebaseConfig();
  if (!config) {
    return undefined;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  initializeOptionalAppCheck(app);

  return {
    auth: getAuth(app),
    firestore: getFirestore(app),
    functions: getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || undefined),
  };
}

function getFirebaseConfig(): FirebaseOptions | undefined {
  const env = import.meta.env;
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  };

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    return undefined;
  }

  return config;
}

function initializeOptionalAppCheck(app: FirebaseApp) {
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
  if (!siteKey || typeof window === "undefined" || appCheckInitialized) {
    return;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  appCheckInitialized = true;
}

async function ensureAnonymousAuth(auth: Auth) {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const credential = await signInAnonymously(auth);
  return credential.user;
}

function sanitizePlayerName(playerName: string) {
  return playerName.trim().slice(0, 16) || "PLAYER";
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}
