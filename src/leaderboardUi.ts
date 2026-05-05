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
};

type LeaderboardCurrentScore = {
  score: number;
  rank?: number;
  scoreUpdated: boolean;
};

const LEADERBOARD_FETCH_RETRY_MS = 800;

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
      <button id="leaderboard-close" class="ui-button" type="button">${escapeHtml(t(locale, "leaderboard.close"))}</button>
    </div>
  `;
  document.body.appendChild(modal);

  const status = modal.querySelector<HTMLElement>(".leaderboard-status")!;
  const list = modal.querySelector<HTMLOListElement>(".leaderboard-list")!;
  const currentScore = modal.querySelector<HTMLElement>(".leaderboard-current-score")!;
  const closeButton = modal.querySelector<HTMLButtonElement>("#leaderboard-close")!;
  const close = () => modal.remove();
  renderCurrentScore(currentScore, options.currentScore, locale);

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
      if (entries.length === 0) {
        status.textContent = options.statusMessage ?? t(locale, "leaderboard.empty");
        return;
      }

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
      status.textContent = getLeaderboardErrorMessage(locale, errorCode);
    });
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

function renderCurrentScore(container: HTMLElement, currentScore: LeaderboardCurrentScore | undefined, locale: Locale) {
  if (!currentScore) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  container.hidden = false;
  container.innerHTML = `
    <span class="leaderboard-current-label">${escapeHtml(t(locale, "leaderboard.currentScore"))}</span>
    <span class="leaderboard-current-rank">RANK ${currentScore.scoreUpdated && currentScore.rank ? currentScore.rank : "-"}</span>
    <span class="leaderboard-current-value">${currentScore.score.toFixed(2)}</span>
    <span class="leaderboard-current-status">${escapeHtml(
      currentScore.scoreUpdated ? t(locale, "leaderboard.bestUpdated") : t(locale, "leaderboard.bestNotUpdated"),
    )}</span>
  `;
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
