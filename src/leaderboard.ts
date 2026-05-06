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
  signOut,
  unlink,
  type Auth,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
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
  hasGhost: boolean;
};

export type LeaderboardGhostOption = {
  id: string;
  label: string;
  stageId: string;
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
  ghostReplay?: unknown;
};

export type LeaderboardSubmitResult =
  | {
      ok: true;
      status?: string;
      submissionId?: string;
      scoreUpdated: boolean;
      rank?: number;
      ghostSaved?: boolean;
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
  bgmVolumePercent?: number;
  seVolumePercent?: number;
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

export async function clearLeaderboardUserSettings() {
  const services = await getFirebaseServices();
  if (!services) {
    return { ok: false as const, reason: "Leaderboard is not configured." };
  }

  const user = await ensureAnonymousAuth(services.auth);
  if (!isGoogleLinkedUser(user)) {
    return { ok: false as const, reason: "Google account is not linked." };
  }

  await deleteDoc(doc(services.firestore, "users", user.uid, "settings", USER_SETTINGS_DOC));
  return { ok: true as const, identity: createLeaderboardIdentity(user) };
}

export async function signOutLeaderboardAuth() {
  const services = await getFirebaseServices();
  if (!services) {
    return false;
  }

  await signOut(services.auth);
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
        hasGhost: data.hasGhost === true,
      };
    })
    .filter((entry) => entry.playerId);
}

export async function fetchLeaderboardGhostOptions(stageId: string, maxEntries = 10): Promise<LeaderboardGhostOption[]> {
  const services = await getFirebaseServices();
  if (!services) {
    return [];
  }

  const entries = await fetchLeaderboardEntries(stageId, maxEntries);
  const ghostCandidates = entries
    .map((entry, index) => ({ entry, rank: index + 1 }))
    .filter(({ entry }) => entry.hasGhost);
  const availableGhosts = await Promise.all(
    ghostCandidates.map(async ({ entry, rank }) => {
      try {
        const snapshot = await getDoc(doc(services.firestore, "leaderboardGhosts", entry.id));
        return snapshot.exists() && expandCompactGhostReplay(snapshot.data().ghostReplay) ? { entry, rank } : undefined;
      } catch {
        return undefined;
      }
    }),
  );

  return availableGhosts
    .filter((option): option is { entry: LeaderboardEntry; rank: number } => Boolean(option))
    .map(({ entry, rank }) => ({
      id: entry.id,
      stageId: entry.stageId,
      label: `#${rank} ${entry.playerName} ${entry.score.toFixed(2)}`,
    }));
}

export async function fetchLeaderboardGhostReplay(ghostId: string): Promise<unknown> {
  const services = await getFirebaseServices();
  if (!services) {
    throw new Error("Leaderboard is not configured.");
  }

  const safeGhostId = String(ghostId).trim();
  if (!/^[a-zA-Z0-9_-]+_[a-zA-Z0-9_-]+$/.test(safeGhostId)) {
    throw new Error("Ghost id is invalid.");
  }

  const snapshot = await getDoc(doc(services.firestore, "leaderboardGhosts", safeGhostId));
  const ghostReplay = snapshot.data()?.ghostReplay;
  const expanded = expandCompactGhostReplay(ghostReplay);
  if (!expanded) {
    throw new Error("Ghost replay is unavailable.");
  }
  return expanded;
}

function expandCompactGhostReplay(value: unknown): unknown {
  if (!isRecord(value)) {
    return undefined;
  }
  if (!Array.isArray(value.frames)) {
    return value;
  }
  if (value.format === "compact-v2") {
    return expandCompactGhostReplayFrames(value, (frame) => {
      if (!isRecord(frame)) {
        return undefined;
      }
      return [frame.t, frame.x, frame.y, frame.f, frame.a];
    });
  }
  if (value.format !== "compact-v1") {
    return value;
  }

  return expandCompactGhostReplayFrames(value, (frame) => (Array.isArray(frame) ? frame : undefined));
}

function expandCompactGhostReplayFrames(value: Record<string, unknown>, getFrameValues: (frame: unknown) => unknown[] | undefined) {
  const animations = Array.isArray(value.animations) ? value.animations.map((animation) => String(animation ?? "")) : [""];
  const frames = Array.isArray(value.frames) ? value.frames : [];
  return {
    schema: value.schema,
    gameVersion: value.gameVersion,
    stageId: value.stageId,
    playerName: value.playerName,
    controlMode: value.controlMode,
    createdAt: value.createdAt,
    durationMs: value.durationMs,
    frames: frames
      .map(getFrameValues)
      .filter((frame): frame is unknown[] => Array.isArray(frame))
      .map((frame) => {
        const flags = Number(frame[3]) || 0;
        return {
          t: Number(frame[0]),
          x: Number(frame[1]),
          y: Number(frame[2]),
          left: Boolean(flags & 1),
          right: Boolean(flags & 2),
          up: Boolean(flags & 4),
          down: Boolean(flags & 8),
          dash: Boolean(flags & 16),
          flipX: Boolean(flags & 32),
          anim: animations[Number(frame[4]) || 0] || undefined,
        };
      }),
  };
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
        hasGhost: data.hasGhost === true,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
  if (typeof source.bgmVolumePercent === "number" && Number.isFinite(source.bgmVolumePercent)) {
    settings.bgmVolumePercent = Math.max(0, Math.min(100, Math.round(source.bgmVolumePercent)));
  }
  if (typeof source.seVolumePercent === "number" && Number.isFinite(source.seVolumePercent)) {
    settings.seVolumePercent = Math.max(0, Math.min(100, Math.round(source.seVolumePercent)));
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
