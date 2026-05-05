import type { LeaderboardEntry, LeaderboardIdentity } from "./leaderboard";
import type { Locale } from "./i18n";
import { DEFAULT_LOCALE, t } from "./i18n";

type AccountPanelOptions = {
  locale?: Locale;
  getIdentity: () => Promise<LeaderboardIdentity | undefined>;
  fetchEntries: () => Promise<LeaderboardEntry[]>;
  onGoogleSignIn: () => Promise<LeaderboardIdentity | undefined>;
  onGoogleUnlink: () => Promise<LeaderboardIdentity | undefined>;
};

export function showAccountPanel(options: AccountPanelOptions) {
  document.getElementById("account-modal")?.remove();

  const locale = options.locale ?? DEFAULT_LOCALE;
  const modal = document.createElement("div");
  modal.id = "account-modal";
  modal.innerHTML = `
    <div class="account-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(t(locale, "account.title"))}">
      <h2>${escapeHtml(t(locale, "account.title"))}</h2>
      <p class="account-status">${escapeHtml(t(locale, "account.loading"))}</p>
      <section class="account-card">
        <h3>${escapeHtml(t(locale, "account.linkStatus"))}</h3>
        <dl class="account-detail-list">
          <div>
            <dt>${escapeHtml(t(locale, "account.playerId"))}</dt>
            <dd class="account-player-id">-</dd>
          </div>
          <div>
            <dt>${escapeHtml(t(locale, "account.googleStatus"))}</dt>
            <dd class="account-google-status">-</dd>
          </div>
          <div>
            <dt>${escapeHtml(t(locale, "account.googleUser"))}</dt>
            <dd class="account-google-user">-</dd>
          </div>
        </dl>
        <div class="account-actions">
          <button class="account-google-link" type="button">${escapeHtml(t(locale, "account.linkGoogle"))}</button>
          <button class="account-google-unlink" type="button">${escapeHtml(t(locale, "account.unlinkGoogle"))}</button>
        </div>
        <p class="account-note">${escapeHtml(t(locale, "account.unlinkNote"))}</p>
      </section>
      <section class="account-card account-scores-card">
        <h3>${escapeHtml(t(locale, "account.stageScores"))}</h3>
        <div class="account-score-header">
          <span>${escapeHtml(t(locale, "account.stage"))}</span>
          <span>${escapeHtml(t(locale, "account.score"))}</span>
          <span>${escapeHtml(t(locale, "account.date"))}</span>
        </div>
        <ol class="account-score-list"></ol>
      </section>
      <button id="account-close" class="ui-button" type="button">${escapeHtml(t(locale, "account.close"))}</button>
    </div>
  `;
  document.body.appendChild(modal);

  const status = modal.querySelector<HTMLElement>(".account-status")!;
  const playerId = modal.querySelector<HTMLElement>(".account-player-id")!;
  const googleStatus = modal.querySelector<HTMLElement>(".account-google-status")!;
  const googleUser = modal.querySelector<HTMLElement>(".account-google-user")!;
  const linkButton = modal.querySelector<HTMLButtonElement>(".account-google-link")!;
  const unlinkButton = modal.querySelector<HTMLButtonElement>(".account-google-unlink")!;
  const scoreList = modal.querySelector<HTMLOListElement>(".account-score-list")!;
  const closeButton = modal.querySelector<HTMLButtonElement>("#account-close")!;

  const renderIdentity = (identity: LeaderboardIdentity | undefined) => {
    playerId.textContent = identity?.playerId ? `#${identity.playerId.slice(0, 8)}` : "-";
    googleStatus.textContent = identity?.isGoogleLinked ? t(locale, "account.linked") : t(locale, "account.notLinked");
    googleUser.textContent = identity?.email || identity?.displayName || "-";
    linkButton.hidden = Boolean(identity?.isGoogleLinked);
    unlinkButton.hidden = !identity?.isGoogleLinked;
  };

  const refresh = async (message?: string) => {
    status.textContent = message ?? t(locale, "account.loading");
    try {
      const [identity, entries] = await Promise.all([options.getIdentity(), options.fetchEntries()]);
      renderIdentity(identity);
      renderScores(scoreList, entries, locale);
      status.textContent = t(locale, "account.ready");
    } catch (error) {
      console.warn("Account panel refresh failed.", error);
      status.textContent = t(locale, "account.unavailable");
    }
  };

  linkButton.addEventListener("click", () => {
    linkButton.disabled = true;
    status.textContent = t(locale, "account.linking");
    options
      .onGoogleSignIn()
      .then((identity) => {
        renderIdentity(identity);
        status.textContent = t(locale, "account.linkedMessage");
      })
      .catch((error) => {
        console.warn("Google account link failed.", error);
        status.textContent = t(locale, "account.linkFailed");
      })
      .finally(() => {
        linkButton.disabled = false;
      });
  });

  unlinkButton.addEventListener("click", () => {
    unlinkButton.disabled = true;
    status.textContent = t(locale, "account.unlinking");
    options
      .onGoogleUnlink()
      .then((identity) => {
        renderIdentity(identity);
        status.textContent = t(locale, "account.unlinkedMessage");
      })
      .catch((error) => {
        console.warn("Google account unlink failed.", error);
        status.textContent = t(locale, "account.unlinkFailed");
      })
      .finally(() => {
        unlinkButton.disabled = false;
      });
  });

  closeButton.addEventListener("click", () => modal.remove());
  modal.addEventListener("pointerdown", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
    event.stopPropagation();
  });
  modal.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      modal.remove();
    }
  });

  void refresh();
}

function renderScores(container: HTMLOListElement, entries: LeaderboardEntry[], locale: Locale) {
  container.innerHTML = "";
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "account-score-empty";
    empty.textContent = t(locale, "account.noScores");
    container.appendChild(empty);
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("li");
    row.className = "account-score-row";
    row.innerHTML = `
      <span class="account-score-stage">${escapeHtml(entry.stageName || entry.stageId)}</span>
      <span class="account-score-value">${entry.score.toFixed(2)}</span>
      <span class="account-score-date">${formatDate(entry.createdAt)}</span>
    `;
    container.appendChild(row);
  }
}

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}
