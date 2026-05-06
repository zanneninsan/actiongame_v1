import type { LeaderboardEntry } from "./leaderboard";
import type { Locale } from "./i18n";
import { DEFAULT_LOCALE, t } from "./i18n";

type LeaderboardPanelOptions = {
  stageName: string;
  gameVersion: string;
  locale?: Locale;
  fetchEntries: () => Promise<LeaderboardEntry[]>;
  statusMessage?: string;
  currentSubmissionId?: string;
  currentPlayerId?: string;
  currentScore?: LeaderboardCurrentScore;
  accountPrompt?: LeaderboardAccountPrompt;
};

type LeaderboardCurrentScore = {
  score: number;
  rank?: number;
  scoreUpdated: boolean;
  ghostStatus?: LeaderboardGhostSaveStatus;
};

type LeaderboardAccountPrompt = {
  show: boolean;
  onGoogleSignIn: () => Promise<void>;
};

export type LeaderboardGhostSaveStatus = "saved" | "missing" | "notEligible" | "notRecorded" | "unknown";

const LEADERBOARD_FETCH_RETRY_MS = 800;
const GAME_SHARE_URL = "https://zannenin-sisters-leaderboard.web.app/";

export function showLeaderboardPanel(options: LeaderboardPanelOptions) {
  document.getElementById("leaderboard-modal")?.remove();

  const locale = options.locale ?? DEFAULT_LOCALE;
  const modal = document.createElement("div");
  modal.id = "leaderboard-modal";
  modal.innerHTML = `
    <div class="leaderboard-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(t(locale, "leaderboard.title"))}">
      <h2>${escapeHtml(t(locale, "leaderboard.title"))}</h2>
      <p class="leaderboard-meta">${escapeHtml(options.stageName)} / ${escapeHtml(options.gameVersion)}</p>
      <p class="leaderboard-status">${escapeHtml(options.statusMessage ?? t(locale, "leaderboard.loading"))}</p>
      <div class="leaderboard-header">
        <span aria-hidden="true"></span>
        <span>RANK</span>
        <span>NAME</span>
        <span>ID</span>
        <span>SCORE</span>
        <span>DATE</span>
      </div>
      <ol class="leaderboard-list"></ol>
      <div class="leaderboard-current-score" hidden></div>
      <div class="leaderboard-footer">
        <div class="leaderboard-account-prompt" hidden></div>
        <div class="leaderboard-actions">
          <button id="leaderboard-share-x" class="ui-button" type="button" hidden>${escapeHtml(t(locale, "leaderboard.shareX"))}</button>
          <button id="leaderboard-close" class="ui-button" type="button">${escapeHtml(t(locale, "leaderboard.close"))}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.classList.add("is-leaderboard-modal-open");

  const status = modal.querySelector<HTMLElement>(".leaderboard-status")!;
  const list = modal.querySelector<HTMLOListElement>(".leaderboard-list")!;
  const currentScore = modal.querySelector<HTMLElement>(".leaderboard-current-score")!;
  const accountPrompt = modal.querySelector<HTMLElement>(".leaderboard-account-prompt")!;
  const shareButton = modal.querySelector<HTMLButtonElement>("#leaderboard-share-x")!;
  const closeButton = modal.querySelector<HTMLButtonElement>("#leaderboard-close")!;
  let currentRankLabel = formatCurrentScoreRank(options.currentScore, locale);
  const close = () => {
    modal.remove();
    document.body.classList.remove("is-leaderboard-modal-open");
  };
  renderCurrentScore(currentScore, options.currentScore, locale, currentRankLabel);
  renderAccountPrompt(accountPrompt, options.accountPrompt, locale);
  renderShareButton(shareButton, options, locale);

  shareButton.addEventListener("click", () => {
    openXShare(buildShareText(options, locale, currentRankLabel));
  });
  closeButton.addEventListener("click", close);
  modal.addEventListener("pointerdown", (event) => {
    if (event.target === modal) {
      close();
    }
    event.stopPropagation();
  });
  modal.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      close();
    }
  });

  fetchEntriesWithRetry(options.fetchEntries)
    .then((entries) => {
      status.classList.remove("is-error");
      if (entries.length === 0) {
        status.textContent = options.statusMessage ?? t(locale, "leaderboard.empty");
        return;
      }

      currentRankLabel = formatCurrentScoreRank(options.currentScore, locale, entries);
      renderCurrentScore(currentScore, options.currentScore, locale, currentRankLabel);
      status.textContent = options.statusMessage ?? t(locale, "leaderboard.topScores");
      list.replaceChildren(
        ...entries.map((entry, index) =>
          createEntryRow(entry, index + 1, options.currentSubmissionId, options.currentPlayerId, options.currentScore),
        ),
      );
      list.querySelector(".leaderboard-entry.is-current-score")?.scrollIntoView({ block: "center" });
    })
    .catch((error) => {
      const errorCode = getErrorCode(error);
      console.warn("Leaderboard entries could not be fetched.", { errorCode, error });
      status.classList.add("is-error");
      status.textContent = getLeaderboardErrorMessage(locale, errorCode);
    });
}

function renderShareButton(button: HTMLButtonElement, options: LeaderboardPanelOptions, locale: Locale) {
  const canShare = Boolean(options.currentScore);
  button.hidden = !canShare;
  button.closest(".leaderboard-actions")?.classList.toggle("is-share-hidden", !canShare);
  button.setAttribute("aria-label", t(locale, "leaderboard.shareX"));
}

function buildShareText(options: LeaderboardPanelOptions, locale: Locale, rankLabel: string) {
  const currentScore = options.currentScore;
  if (!currentScore) {
    return t(locale, "leaderboard.shareGeneric");
  }

  const bestStatus = currentScore.scoreUpdated ? t(locale, "leaderboard.bestUpdated") : t(locale, "leaderboard.bestNotUpdated");
  const scoreLine = t(locale, "leaderboard.shareScore")
    .replace("{stage}", options.stageName)
    .replace("{score}", currentScore.score.toFixed(2))
    .replace("{rank}", rankLabel)
    .replace("{status}", bestStatus);
  return scoreLine;
}

function openXShare(text: string) {
  const params = new URLSearchParams({
    text,
    url: GAME_SHARE_URL,
    hashtags: "スーパー残念院さんランド",
  });
  window.open(`https://twitter.com/intent/tweet?${params.toString()}`, "_blank", "noopener,noreferrer");
}

async function fetchEntriesWithRetry(fetchEntries: () => Promise<LeaderboardEntry[]>) {
  try {
    return await fetchEntries();
  } catch (error) {
    if (!shouldRetryFetch(error)) {
      throw error;
    }
    await wait(LEADERBOARD_FETCH_RETRY_MS);
    return fetchEntries();
  }
}

function shouldRetryFetch(error: unknown) {
  const code = getErrorCode(error);
  return code === "unavailable" || code === "deadline-exceeded" || code === "resource-exhausted";
}

function getLeaderboardErrorMessage(locale: Locale, errorCode: string) {
  if (errorCode === "permission-denied" || errorCode === "unauthenticated" || errorCode === "failed-precondition") {
    return t(locale, "leaderboard.notConfigured");
  }
  return t(locale, "leaderboard.unavailable");
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function createEntryRow(
  entry: LeaderboardEntry,
  rank: number,
  currentSubmissionId?: string,
  currentPlayerId?: string,
  currentScore?: LeaderboardCurrentScore,
) {
  const row = document.createElement("li");
  row.className = "leaderboard-entry";
  const isCurrentScore = isCurrentScoreEntry(entry, rank, currentSubmissionId, currentPlayerId, currentScore);
  const playerId = entry.playerId || (isCurrentScore ? currentPlayerId ?? "" : extractPlayerIdFromDocumentId(entry.id, entry.stageId));
  if (isCurrentScore) {
    row.classList.add("is-current-score");
  }
  row.innerHTML = `
    <span class="leaderboard-new-marker">${isCurrentScore ? "NEW" : ""}</span>
    <span class="leaderboard-rank">${rank}</span>
    <span class="leaderboard-name">${escapeHtml(entry.playerName)}</span>
    <span class="leaderboard-player-id">${escapeHtml(formatPlayerId(playerId))}</span>
    <span class="leaderboard-score">${entry.score.toFixed(2)}</span>
    <span class="leaderboard-date">${formatDate(entry.createdAt)}</span>
  `;
  return row;
}

function isCurrentScoreEntry(
  entry: LeaderboardEntry,
  rank: number,
  currentSubmissionId?: string,
  currentPlayerId?: string,
  currentScore?: LeaderboardCurrentScore,
) {
  if (currentSubmissionId && entry.submissionId === currentSubmissionId) {
    return true;
  }

  return Boolean(
    currentScore?.scoreUpdated &&
      currentPlayerId &&
      entry.playerId === currentPlayerId &&
      Math.abs(entry.score - currentScore.score) < 0.005 &&
      (!currentScore.rank || currentScore.rank === rank),
  );
}

function renderCurrentScore(container: HTMLElement, currentScore: LeaderboardCurrentScore | undefined, locale: Locale, rankLabel: string) {
  if (!currentScore) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  container.hidden = false;
  container.innerHTML = `
    <span class="leaderboard-current-label">${escapeHtml(t(locale, "leaderboard.currentScore"))}</span>
    <span class="leaderboard-current-rank">${escapeHtml(t(locale, "leaderboard.rankLabel"))} ${escapeHtml(rankLabel)}</span>
    <span class="leaderboard-current-value">${currentScore.score.toFixed(2)}</span>
    <span class="leaderboard-current-status">${escapeHtml(
      currentScore.scoreUpdated ? t(locale, "leaderboard.bestUpdated") : t(locale, "leaderboard.bestNotUpdated"),
    )}</span>
    ${currentScore.ghostStatus ? `<span class="leaderboard-current-ghost">${escapeHtml(getGhostStatusMessage(locale, currentScore.ghostStatus))}</span>` : ""}
  `;
}

function formatCurrentScoreRank(currentScore: LeaderboardCurrentScore | undefined, locale: Locale, entries?: LeaderboardEntry[]) {
  if (!currentScore) {
    return "-";
  }
  if (currentScore.scoreUpdated && currentScore.rank) {
    return formatRankNumber(locale, currentScore.rank);
  }
  if (!entries) {
    return t(locale, "leaderboard.rankPending");
  }

  const betterScoreCount = entries.filter((entry) => entry.score > currentScore.score + 0.005).length;
  const equivalentRank = betterScoreCount + 1;
  if (entries.length >= 100 && equivalentRank > 100) {
    return t(locale, "leaderboard.rankBeyondTop").replace("{rank}", String(entries.length + 1));
  }
  return t(locale, "leaderboard.rankEquivalent").replace("{rank}", formatRankNumber(locale, equivalentRank));
}

function formatRankNumber(locale: Locale, rank: number) {
  return locale === "ja" ? `${rank}\u4f4d` : `#${rank}`;
}

function getGhostStatusMessage(locale: Locale, status: LeaderboardGhostSaveStatus) {
  if (status === "saved") {
    return t(locale, "leaderboard.ghostSaved");
  }
  if (status === "missing") {
    return t(locale, "leaderboard.ghostMissing");
  }
  if (status === "notRecorded") {
    return t(locale, "leaderboard.ghostNotRecorded");
  }
  if (status === "unknown") {
    return t(locale, "leaderboard.ghostUnknown");
  }
  return t(locale, "leaderboard.ghostNotEligible");
}

function renderAccountPrompt(container: HTMLElement, accountPrompt: LeaderboardAccountPrompt | undefined, locale: Locale) {
  const footer = container.closest(".leaderboard-footer");
  if (!accountPrompt?.show) {
    footer?.classList.add("is-account-hidden");
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  footer?.classList.remove("is-account-hidden");
  container.hidden = false;
  container.innerHTML = `
    <div class="leaderboard-account-copy">
      <strong>${escapeHtml(t(locale, "leaderboard.accountPromptTitle"))}</strong>
      <span>${escapeHtml(t(locale, "leaderboard.accountPromptBody"))}</span>
    </div>
    <button class="leaderboard-google-button" type="button">${escapeHtml(t(locale, "leaderboard.googleSignIn"))}</button>
  `;

  const button = container.querySelector<HTMLButtonElement>(".leaderboard-google-button")!;
  button.addEventListener("click", () => {
    button.disabled = true;
    button.textContent = t(locale, "leaderboard.googleSigningIn");
    accountPrompt
      .onGoogleSignIn()
      .then(() => {
        container.classList.add("is-linked");
        container.innerHTML = `
          <div class="leaderboard-account-copy">
            <strong>${escapeHtml(t(locale, "leaderboard.accountLinkedTitle"))}</strong>
            <span>${escapeHtml(t(locale, "leaderboard.accountLinkedBody"))}</span>
          </div>
        `;
      })
      .catch(() => {
        button.disabled = false;
        button.textContent = t(locale, "leaderboard.googleSignIn");
      });
  });
}

function formatDate(date: Date | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPlayerId(playerId: string) {
  return playerId ? `#${playerId.slice(0, 8)}` : "";
}

function extractPlayerIdFromDocumentId(documentId: string, stageId: string) {
  const prefix = `${stageId}_`;
  return documentId.startsWith(prefix) ? documentId.slice(prefix.length) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
