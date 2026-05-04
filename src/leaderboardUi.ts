import type { LeaderboardEntry } from "./leaderboard";

type LeaderboardPanelOptions = {
  stageName: string;
  gameVersion: string;
  fetchEntries: () => Promise<LeaderboardEntry[]>;
  statusMessage?: string;
  currentSubmissionId?: string;
};

export function showLeaderboardPanel(options: LeaderboardPanelOptions) {
  document.getElementById("leaderboard-modal")?.remove();

  const modal = document.createElement("div");
  modal.id = "leaderboard-modal";
  modal.innerHTML = `
    <div class="leaderboard-dialog" role="dialog" aria-modal="true" aria-label="Leaderboard">
      <h2>LEADERBOARD</h2>
      <p class="leaderboard-meta">${escapeHtml(options.stageName)} / ${escapeHtml(options.gameVersion)}</p>
      <p class="leaderboard-status">${escapeHtml(options.statusMessage ?? "Loading...")}</p>
      <ol class="leaderboard-list"></ol>
      <button id="leaderboard-close" class="ui-button" type="button">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  const status = modal.querySelector<HTMLElement>(".leaderboard-status")!;
  const list = modal.querySelector<HTMLOListElement>(".leaderboard-list")!;
  const closeButton = modal.querySelector<HTMLButtonElement>("#leaderboard-close")!;
  const close = () => modal.remove();

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

  options
    .fetchEntries()
    .then((entries) => {
      if (entries.length === 0) {
        status.textContent = options.statusMessage ?? "No scores yet.";
        return;
      }

      status.textContent = options.statusMessage ?? "Top scores";
      list.replaceChildren(...entries.map((entry, index) => createEntryRow(entry, index + 1, options.currentSubmissionId)));
    })
    .catch(() => {
      status.textContent = "Leaderboard is unavailable.";
    });
}

function createEntryRow(entry: LeaderboardEntry, rank: number, currentSubmissionId?: string) {
  const row = document.createElement("li");
  row.className = "leaderboard-entry";
  if (currentSubmissionId && entry.submissionId === currentSubmissionId) {
    row.classList.add("is-current-score");
  }
  row.innerHTML = `
    <span class="leaderboard-rank">${rank}</span>
    <span class="leaderboard-name">${escapeHtml(entry.playerName)}</span>
    <span class="leaderboard-score">${entry.score.toFixed(2)}</span>
    <span class="leaderboard-date">${formatDate(entry.createdAt)}</span>
  `;
  return row;
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
