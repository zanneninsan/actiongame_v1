import type { LeaderboardEntry, LeaderboardIdentity } from "./leaderboard";
import type { Locale } from "./i18n";
import { DEFAULT_LOCALE, t } from "./i18n";

type AccountPanelOptions = {
  locale?: Locale;
  getIdentity: () => Promise<LeaderboardIdentity | undefined>;
  fetchEntries: () => Promise<LeaderboardEntry[]>;
  onGoogleSignIn: () => Promise<LeaderboardIdentity | undefined>;
  onGoogleLogin: () => Promise<LeaderboardIdentity | undefined>;
  onGoogleUnlink: () => Promise<LeaderboardIdentity | undefined>;
  onGoogleTestDataClear: () => Promise<LeaderboardIdentity | undefined>;
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
          <button class="account-google-login" type="button">${escapeHtml(t(locale, "account.loginGoogle"))}</button>
          <button class="account-google-unlink" type="button">${escapeHtml(t(locale, "account.unlinkGoogle"))}</button>
          <button class="account-google-clear-test" type="button">${escapeHtml(t(locale, "account.clearTestData"))}</button>
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
  document.body.classList.add("is-account-modal-open");

  const status = modal.querySelector<HTMLElement>(".account-status")!;
  const playerId = modal.querySelector<HTMLElement>(".account-player-id")!;
  const googleStatus = modal.querySelector<HTMLElement>(".account-google-status")!;
  const googleUser = modal.querySelector<HTMLElement>(".account-google-user")!;
  const linkButton = modal.querySelector<HTMLButtonElement>(".account-google-link")!;
  const loginButton = modal.querySelector<HTMLButtonElement>(".account-google-login")!;
  const unlinkButton = modal.querySelector<HTMLButtonElement>(".account-google-unlink")!;
  const clearTestDataButton = modal.querySelector<HTMLButtonElement>(".account-google-clear-test")!;
  const scoreList = modal.querySelector<HTMLOListElement>(".account-score-list")!;
  const closeButton = modal.querySelector<HTMLButtonElement>("#account-close")!;
  const close = () => {
    modal.remove();
    document.body.classList.remove("is-account-modal-open");
  };
  const setStatus = (message: string, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  const renderIdentity = (identity: LeaderboardIdentity | undefined) => {
    playerId.textContent = identity?.playerId ? `#${identity.playerId.slice(0, 8)}` : "-";
    googleStatus.textContent = identity?.isGoogleLinked ? t(locale, "account.linked") : t(locale, "account.notLinked");
    googleUser.textContent = identity?.email || identity?.displayName || "-";
    linkButton.hidden = Boolean(identity?.isGoogleLinked);
    loginButton.hidden = Boolean(identity?.isGoogleLinked);
    unlinkButton.hidden = !identity?.isGoogleLinked;
    clearTestDataButton.hidden = !identity?.isGoogleLinked;
  };

  const refresh = async (message?: string) => {
    setStatus(message ?? t(locale, "account.loading"));
    try {
      const [identity, entries] = await Promise.all([options.getIdentity(), options.fetchEntries()]);
      renderIdentity(identity);
      renderScores(scoreList, entries, locale);
      setStatus(t(locale, "account.ready"));
    } catch (error) {
      console.warn("Account panel refresh failed.", error);
      setStatus(t(locale, "account.unavailable"), true);
    }
  };

  linkButton.addEventListener("click", () => {
    linkButton.disabled = true;
    loginButton.disabled = true;
    setStatus(t(locale, "account.linking"));
    options
      .onGoogleSignIn()
      .then((identity) => {
        renderIdentity(identity);
        setStatus(t(locale, "account.linkedMessage"));
      })
      .catch((error) => {
        console.warn("Google account link failed.", error);
        setStatus(t(locale, "account.linkFailed"), true);
      })
      .finally(() => {
        linkButton.disabled = false;
        loginButton.disabled = false;
      });
  });

  loginButton.addEventListener("click", () => {
    linkButton.disabled = true;
    loginButton.disabled = true;
    setStatus(t(locale, "account.loggingIn"));
    options
      .onGoogleLogin()
      .then((identity) => {
        renderIdentity(identity);
        setStatus(t(locale, "account.loggedInMessage"));
        return options.fetchEntries();
      })
      .then((entries) => renderScores(scoreList, entries, locale))
      .catch((error) => {
        console.warn("Google account login failed.", error);
        setStatus(t(locale, "account.loginFailed"), true);
      })
      .finally(() => {
        linkButton.disabled = false;
        loginButton.disabled = false;
      });
  });

  unlinkButton.addEventListener("click", () => {
    unlinkButton.disabled = true;
    setStatus(t(locale, "account.unlinking"));
    options
      .onGoogleUnlink()
      .then((identity) => {
        renderIdentity(identity);
        setStatus(t(locale, "account.unlinkedMessage"));
      })
      .catch((error) => {
        console.warn("Google account unlink failed.", error);
        setStatus(t(locale, "account.unlinkFailed"), true);
      })
      .finally(() => {
        unlinkButton.disabled = false;
      });
  });

  clearTestDataButton.addEventListener("click", () => {
    if (!window.confirm(t(locale, "account.clearTestDataConfirm"))) {
      return;
    }

    clearTestDataButton.disabled = true;
    unlinkButton.disabled = true;
    setStatus(t(locale, "account.clearingTestData"));
    options
      .onGoogleTestDataClear()
      .then((identity) => {
        renderIdentity(identity);
        setStatus(t(locale, "account.clearedTestDataMessage"));
      })
      .catch((error) => {
        console.warn("Google-linked test data clear failed.", error);
        setStatus(t(locale, "account.clearTestDataFailed"), true);
      })
      .finally(() => {
        clearTestDataButton.disabled = false;
        unlinkButton.disabled = false;
      });
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
