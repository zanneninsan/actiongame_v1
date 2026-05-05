import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  GoogleAuthProvider,
  getAuth,
  linkWithPopup,
  signInAnonymously,
  signInWithPopup,
  type Auth,
  type User,
} from "firebase/auth";
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
  submissionId: string;
  playerId: string;
  playerName: string;
  score: number;
  stageId: string;
  stageName: string;
  gameVersion: string;
  createdAt: Date | null;
};

export type LeaderboardSubmitPayload = {
  submissionId: string;
  playerId: string;
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

export type LeaderboardSubmitResult =
  | {
      ok: true;
      status?: string;
      submissionId?: string;
      scoreUpdated: boolean;
      rank?: number;
    }
  | { ok: false; reason: string };

export type LeaderboardIdentity = {
  playerId: string;
  isAnonymous: boolean;
  isGoogleLinked: boolean;
  email: string | null;
  displayName: string | null;
};

type FirebaseServices = {
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
};

const LEADERBOARD_COLLECTION = "leaderboardScores";
const SUBMIT_SCORE_FUNCTION = "submitScore";
const DEFAULT_LEADERBOARD_LIMIT = 100;
let servicesPromise: Promise<FirebaseServices | undefined> | undefined;
let appCheckInitialized = false;

export function isLeaderboardConfigured() {
  return Boolean(getFirebaseConfig());
}

export async function getLeaderboardIdentity(): Promise<LeaderboardIdentity | undefined> {
  const services = await getFirebaseServices();
  if (!services) {
    return undefined;
  }

  const user = await ensureAnonymousAuth(services.auth);
  return createLeaderboardIdentity(user);
}

export async function signInLeaderboardWithGoogle() {
  const services = await getFirebaseServices();
  if (!services) {
    return { ok: false as const, reason: "Leaderboard is not configured." };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const currentUser = services.auth.currentUser ?? (await ensureAnonymousAuth(services.auth));

  try {
    const credential = currentUser.isAnonymous
      ? await linkWithPopup(currentUser, provider)
      : await signInWithPopup(services.auth, provider);
    return { ok: true as const, identity: createLeaderboardIdentity(credential.user) };
  } catch (error) {
    if (shouldFallbackToGoogleSignIn(error)) {
      const credential = await signInWithPopup(services.auth, provider);
      return { ok: true as const, identity: createLeaderboardIdentity(credential.user) };
    }
    throw error;
  }
}

export async function submitLeaderboardScore(payload: LeaderboardSubmitPayload) {
  const services = await getFirebaseServices();
  if (!services) {
    return { ok: false as const, reason: "Leaderboard is not configured." };
  }

  const playerId = sanitizePlayerId(payload.playerId);
  if (!playerId) {
    throw new Error("Leaderboard player id is required.");
  }

  await ensureAnonymousAuth(services.auth);
  const submitScore = httpsCallable<LeaderboardSubmitPayload, LeaderboardSubmitResult>(
    services.functions,
    SUBMIT_SCORE_FUNCTION,
  );
  return submitScore({
    ...payload,
    playerId,
    playerName: sanitizePlayerName(payload.playerName),
    score: roundScore(payload.score),
    itemScore: roundScore(payload.itemScore),
    timeBonus: roundScore(payload.timeBonus),
  }).then((result) => result.data);
}

export async function fetchLeaderboardEntries(stageId: string, maxEntries = DEFAULT_LEADERBOARD_LIMIT): Promise<LeaderboardEntry[]> {
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
  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const playerId = sanitizePlayerId(data.playerId);
      const createdAtValue = data.createdAt as { toDate?: () => Date } | undefined;
      return {
        id: doc.id,
        submissionId: typeof data.submissionId === "string" ? data.submissionId : "",
        playerId,
        playerName: typeof data.playerName === "string" ? data.playerName : "PLAYER",
        score: typeof data.score === "number" ? data.score : 0,
        stageId: typeof data.stageId === "string" ? data.stageId : stageId,
        stageName: typeof data.stageName === "string" ? data.stageName : stageId,
        gameVersion: typeof data.gameVersion === "string" ? data.gameVersion : "",
        createdAt: createdAtValue?.toDate?.() ?? null,
      };
    })
    .filter((entry) => entry.playerId);
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

function createLeaderboardIdentity(user: User): LeaderboardIdentity {
  return {
    playerId: user.uid,
    isAnonymous: user.isAnonymous,
    isGoogleLinked: user.providerData.some((provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID),
    email: user.email,
    displayName: user.displayName,
  };
}

function shouldFallbackToGoogleSignIn(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  return (
    code === "auth/credential-already-in-use" ||
    code === "auth/email-already-in-use" ||
    code === "auth/account-exists-with-different-credential" ||
    code === "auth/provider-already-linked"
  );
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

function sanitizePlayerId(playerId: unknown) {
  const normalizedPlayerId = String(playerId ?? "").trim().slice(0, 80);
  return /^[a-zA-Z0-9_-]{8,80}$/.test(normalizedPlayerId) ? normalizedPlayerId : "";
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}
