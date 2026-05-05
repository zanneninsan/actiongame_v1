import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  GoogleAuthProvider,
  getAuth,
  linkWithPopup,
  browserLocalPersistence,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  unlink,
  type Auth,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  getFirestore,
  limit as limitQuery,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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

export type LeaderboardUserSettings = {
  playerName?: string;
  locale?: string;
  stageId?: string;
  soundVolumePercent?: number;
  soundMuted?: boolean;
  danmakuEnabled?: boolean;
  danmakuMode?: string;
};

type FirebaseServices = {
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
};

const LEADERBOARD_COLLECTION = "leaderboardScores";
const USER_SETTINGS_DOC = "app";
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

export async function logInLeaderboardWithGoogle() {
  const services = await getFirebaseServices();
  if (!services) {
    return { ok: false as const, reason: "Leaderboard is not configured." };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(services.auth, provider);
  return { ok: true as const, identity: createLeaderboardIdentity(credential.user) };
}

export async function unlinkLeaderboardGoogleAccount() {
  const services = await getFirebaseServices();
  if (!services) {
    return { ok: false as const, reason: "Leaderboard is not configured." };
  }

  const user = services.auth.currentUser ?? (await ensureAnonymousAuth(services.auth));
  if (!isGoogleLinkedUser(user)) {
    return { ok: true as const, identity: createLeaderboardIdentity(user) };
  }

  const unlinkedUser = await unlink(user, GoogleAuthProvider.PROVIDER_ID);
  return { ok: true as const, identity: createLeaderboardIdentity(unlinkedUser) };
}

export async function fetchLeaderboardUserSettings(): Promise<LeaderboardUserSettings | undefined> {
  const services = await getFirebaseServices();
  if (!services) {
    return undefined;
  }

  const user = await ensureAnonymousAuth(services.auth);
  if (!isGoogleLinkedUser(user)) {
    return undefined;
  }

  const snapshot = await getDoc(doc(services.firestore, "users", user.uid, "settings", USER_SETTINGS_DOC));
  return snapshot.exists() ? sanitizeUserSettings(snapshot.data()) : undefined;
}

export async function saveLeaderboardUserSettings(settings: LeaderboardUserSettings) {
  const services = await getFirebaseServices();
  if (!services) {
    return false;
  }

  const user = await ensureAnonymousAuth(services.auth);
  if (!isGoogleLinkedUser(user)) {
    return false;
  }

  await setDoc(
    doc(services.firestore, "users", user.uid, "settings", USER_SETTINGS_DOC),
    {
      ...sanitizeUserSettings(settings),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return true;
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

export async function fetchMyLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const services = await getFirebaseServices();
  if (!services) {
    return [];
  }

  const user = await ensureAnonymousAuth(services.auth);
  const entriesQuery = query(collection(services.firestore, LEADERBOARD_COLLECTION), where("playerId", "==", user.uid));
  const snapshot = await getDocs(entriesQuery);
  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const playerId = sanitizePlayerId(data.playerId);
      const createdAtValue = data.createdAt as { toDate?: () => Date } | undefined;
      return {
        status: getEntryStatus(data),
        id: doc.id,
        submissionId: typeof data.submissionId === "string" ? data.submissionId : "",
        playerId,
        playerName: typeof data.playerName === "string" ? data.playerName : "PLAYER",
        score: typeof data.score === "number" ? data.score : 0,
        stageId: typeof data.stageId === "string" ? data.stageId : "",
        stageName: typeof data.stageName === "string" ? data.stageName : "",
        gameVersion: typeof data.gameVersion === "string" ? data.gameVersion : "",
        createdAt: createdAtValue?.toDate?.() ?? null,
      };
    })
    .filter((entry) => entry.playerId === user.uid && entry.stageId && entry.status === "accepted")
    .map(({status: _status, ...entry}) => entry)
    .sort((a, b) => a.stageName.localeCompare(b.stageName) || b.score - a.score);
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

  const auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);

  return {
    auth,
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
    isGoogleLinked: isGoogleLinkedUser(user),
    email: user.email,
    displayName: user.displayName,
  };
}

function isGoogleLinkedUser(user: User) {
  return user.providerData.some((provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID);
}

function getEntryStatus(data: Record<string, unknown> | undefined) {
  return typeof data?.status === "string" ? data.status : "";
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

function sanitizeUserSettings(data: unknown): LeaderboardUserSettings {
  const source = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const settings: LeaderboardUserSettings = {};
  if (typeof source.playerName === "string") {
    settings.playerName = sanitizePlayerName(source.playerName);
  }
  if (typeof source.locale === "string") {
    settings.locale = source.locale.slice(0, 8);
  }
  if (typeof source.stageId === "string") {
    settings.stageId = source.stageId.slice(0, 80);
  }
  if (typeof source.soundVolumePercent === "number" && Number.isFinite(source.soundVolumePercent)) {
    settings.soundVolumePercent = Math.max(0, Math.min(100, Math.round(source.soundVolumePercent)));
  }
  if (typeof source.soundMuted === "boolean") {
    settings.soundMuted = source.soundMuted;
  }
  if (typeof source.danmakuEnabled === "boolean") {
    settings.danmakuEnabled = source.danmakuEnabled;
  }
  if (source.danmakuMode === "classic" || source.danmakuMode === "liveChat") {
    settings.danmakuMode = source.danmakuMode;
  }
  return settings;
}
