import { LitElement, html, css } from "lit";
import { getCurrentUser } from "../../services/users.js";
import { getScoreHistory } from "../../services/colors.js";
import { getFriends, getFriendRequests } from "../../services/friends.js";
import globalStyles from "../../styles/global-styles.js";
import { logoutUser } from "../../services/users.js";
import { go } from "../../router/router-mixin.js";
import { routes } from "../../router/routes.js";
import { getDailyColor } from "../../services/colors.js";
import { winnerIcon } from "../../shared/assets/icons.js";
import {
  isInstalledPwa,
  canUseInstallPrompt,
  promptAddToHomeScreen,
  subscribePwaInstallState,
} from "../../services/pwa-install.js";

class DashboardContainer extends LitElement {
  static properties = {
    user: { type: Object },
    scoreHistory: { type: Object },
    isLoadingHistory: { type: Boolean },
    friendSummary: { type: Object },
    dailyChallenge: { type: Object },
    pwaInstalled: { type: Boolean },
    installPromptReady: { type: Boolean },
    installLoading: { type: Boolean },
  };

  constructor() {
    super();
    this.user = null;
    this.scoreHistory = null;
    this.isLoadingHistory = true;
    this.friendSummary = { friends: 0, requests: 0 };
    this.dailyChallenge = null;
    this.pwaInstalled = false;
    this.installPromptReady = false;
    this.installLoading = false;
    /** @type {(() => void) | undefined} */
    this._unsubscribePwaInstall = undefined;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribePwaInstall = subscribePwaInstallState(() =>
      this.syncPwaInstallUi(),
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribePwaInstall) {
      this._unsubscribePwaInstall();
    }
  }

  syncPwaInstallUi() {
    this.pwaInstalled = isInstalledPwa();
    this.installPromptReady = canUseInstallPrompt();
    console.log("[Dashboard Install UI] syncPwaInstallUi", {
      pwaInstalled: this.pwaInstalled,
      installPromptReady: this.installPromptReady,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    });
  }

  async routeEnter() {
    try {
      const [user, scoreHistory, friendsRes, requestsRes, dailyChallenge] =
        await Promise.all([
          getCurrentUser(),
          getScoreHistory(),
          getFriends(),
          getFriendRequests(),
          getDailyColor(),
        ]);
      this.user = user;
      this.scoreHistory = scoreHistory;
      this.friendSummary = {
        friends: friendsRes.friends?.length || 0,
        requests: requestsRes.requests?.length || 0,
      };
      this.isLoadingHistory = false;
      this.dailyChallenge = dailyChallenge;
    } catch (error) {
      console.error(error);
      this.isLoadingHistory = false;
    }
  }

  async handleLogout() {
    await logoutUser();
    go(routes.LOGIN.path);
  }

  handleGoToAdmin() {
    go(routes.ADMIN.path);
  }

  handleGoToScanner() {
    go(routes.SCANNER.path);
  }

  handleGoToStore() {
    go(routes.STORE.path);
  }

  handleGoToFriends() {
    go(routes.FRIENDS.path);
  }

  async handleInstallApp() {
    if (this.installLoading || !this.installPromptReady) {
      return;
    }
    this.installLoading = true;
    try {
      console.log("[Dashboard Install UI] handleInstallApp click");
      const result = await promptAddToHomeScreen();
      console.log("[Dashboard Install UI] prompt result", result);
    } catch (err) {
      console.error("Install prompt error:", err);
    } finally {
      this.installLoading = false;
    }
  }

  getBestAttempt() {
    if (
      !this.scoreHistory ||
      !this.scoreHistory.attempts ||
      this.scoreHistory.attempts.length === 0
    ) {
      return null;
    }
    return this.scoreHistory.attempts.reduce((best, current) =>
      current.score > best.score ? current : best,
    );
  }

  render() {
    return html`
      <div class="dashboard">
        <div class="content">
          ${this.user
            ? html`
                <div class="welcome-card">
                  <h2>Welcome, ${this.user.username}!</h2>
                  <p>Uncover today's color to earn points!</p>
                  <a class="news-link" href="/news">See what's new</a>
                  ${!this.pwaInstalled && this.installPromptReady
                    ? html`
                        <button
                          class="install-button"
                          type="button"
                          @click=${this.handleInstallApp}
                          ?disabled=${this.installLoading}
                        >
                          ${this.installLoading
                            ? "Opening install prompt..."
                            : "Install"}
                        </button>
                      `
                    : ""}
                </div>

                <div class="game-status-card">
                  ${this.isLoadingHistory
                    ? html`<loading-spinner></loading-spinner>`
                    : this.renderGameStatus()}
                </div>

                ${this.scoreHistory &&
                this.scoreHistory.attempts &&
                this.scoreHistory.attempts.length > 0
                  ? html`
                      <div class="attempts-card">
                        <h3>Your Attempts Today</h3>
                        ${this.renderAttempts()}
                      </div>
                    `
                  : ""}

                <div class="stats-grid">
                  <div
                    class="stat-card clickable"
                    @click=${this.handleGoToStore}
                  >
                    <div class="stat-label">Credits</div>
                    <div class="stat-value">${this.user.credits || 0}</div>
                    <div class="stat-action">View Shop</div>
                  </div>
                  <div
                    class="stat-card clickable"
                    @click=${this.handleGoToFriends}
                  >
                    <div class="stat-label">Friends</div>
                    <div class="stat-value">${this.friendSummary.friends}</div>
                    <div class="stat-action">
                      ${this.friendSummary.requests > 0
                        ? `${this.friendSummary.requests} pending`
                        : "View Friends"}
                    </div>
                  </div>
                </div>
              `
            : html`<loading-spinner></loading-spinner>`}
        </div>
      </div>
    `;
  }

  renderGameStatus() {
    if (!this.scoreHistory) {
      return html` <p>Unable to load game status</p> `;
    }

    const attemptsLeft = this.scoreHistory.attempts_left || 0;
    const attemptsUsed = this.scoreHistory.attempts_used || 0;
    const bestScore = this.scoreHistory.best_score || 0;
    const bestAttempt = this.getBestAttempt();

    const maxAttempts = this.scoreHistory.max_attempts || 3;

    if (attemptsUsed === 0) {
      return html`
        <div class="game-status-content">
          <p class="status-text">
            Today's Color: ${this.dailyChallenge.color_name}
          </p>
          <p class="status-text">You haven't started today's challenge yet!</p>
          <p class="attempts-info">
            You have <strong>${maxAttempts} attempts</strong> to find the
            mystery color.
          </p>
          <button class="scan-button" @click=${this.handleGoToScanner}>
            Start Zapping
          </button>
        </div>
      `;
    }

    if (attemptsLeft === 0) {
      return html`
        <div class="game-status-content">
          <p class="status-text">Today's Color complete!</p>
          <p class="attempts-info">
            You used all <strong>${maxAttempts} attempts</strong>
          </p>
          ${bestAttempt
            ? html`
                <div class="best-attempt-preview">
                  ${winnerIcon}
                  <span>Your Best Score:</span>
                  <div
                    class="score-badge ${bestScore >= 80
                      ? "excellent"
                      : bestScore >= 60
                        ? "good"
                        : "poor"}"
                  >
                    ${bestScore}
                  </div>
                </div>
              `
            : ""}
          <button class="scan-button" @click=${this.handleGoToScanner}>
            View Results
          </button>
        </div>
      `;
    }

    return html`
      <div class="game-status-content">
        <p class="status-text">
          Today's Color: ${this.dailyChallenge.color_name}
        </p>
        <p class="attempts-info">
          <strong>${attemptsLeft} attempts</strong> remaining out of
          <strong>${maxAttempts}</strong>
        </p>
        ${bestAttempt
          ? html`
              <div class="best-attempt-preview">
                <span>Current Best:</span>
                <div
                  class="score-badge ${bestScore >= 80
                    ? "excellent"
                    : bestScore >= 60
                      ? "good"
                      : "poor"}"
                >
                  ${bestScore}
                </div>
              </div>
            `
          : ""}
        <button class="scan-button" @click=${this.handleGoToScanner}>
          Continue Zapping
        </button>
      </div>
    `;
  }

  renderAttempts() {
    const attempts = this.scoreHistory.attempts || [];
    const bestAttempt = this.getBestAttempt();

    return html`
      <div class="attempts-list">
        ${attempts.map(
          (attempt) => html`
            <div class="attempt-item ${attempt === bestAttempt ? "best" : ""}">
              <span class="attempt-number">#${attempt.attempt_number}</span>
              <div
                class="attempt-color"
                style="background-color: rgb(${attempt.submitted_color_r}, ${attempt.submitted_color_g}, ${attempt.submitted_color_b})"
              ></div>
              <div class="attempt-details">
                <span class="attempt-score">Score: ${attempt.score}%</span>
              </div>
              ${attempt === bestAttempt
                ? html`<span class="best-badge-small">${winnerIcon}</span>`
                : ""}
            </div>
          `,
        )}
      </div>
    `;
  }

  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100vh;
        background-color: var(--app-white);
      }

      .dashboard {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .content {
        flex: 1;
        padding: 40px;
        overflow-y: auto;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 24px;
      }

      .stat-card {
        background: white;
        padding: 24px;
        border-radius: 8px;
        text-align: center;
        border: 2px solid #e5e7eb;
      }

      .stat-card.clickable {
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .stat-card.clickable:hover {
        transform: translateY(-4px);
        background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
      }

      .stat-action {
        margin-top: 8px;
        font-size: 14px;
        font-weight: 600;
        color: var(--app-primary-color);
      }

      .stat-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .stat-value {
        font-size: 36px;
        font-weight: bold;
        color: var(--app-primary-color);
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: var(--app-grey);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .welcome-card,
      .info-card,
      .game-section,
      .game-status-card,
      .attempts-card {
        background: white;
        padding: 24px;
        margin-bottom: 24px;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
      }

      .game-status-card h3,
      .attempts-card h3 {
        margin: 0 0 20px 0;
        color: var(--app-primary-color);
      }

      .game-status-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        text-align: center;
      }

      .status-text {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--app-primary-color);
      }

      .attempts-info {
        font-size: 16px;
        margin: 0;
        color: var(--app-grey);
      }

      .attempts-info strong {
        color: var(--app-primary-color);
        font-size: 18px;
      }

      .best-attempt-preview {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        background: var(--app-white);
        border-radius: 8px;
        font-size: 16px;
      }

      .score-badge {
        font-size: 24px;
        font-weight: bold;
        padding: 8px 16px;
        border-radius: 8px;
        background: var(--app-white);
      }

      .score-badge.excellent {
        color: #10b981;
      }

      .score-badge.good {
        color: #f59e0b;
      }

      .score-badge.poor {
        color: #ef4444;
      }

      .scan-button {
        width: 100%;
        background-color: var(--app-primary-color);
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .scan-button:hover {
        transform: translateY(-2px);
      }

      .attempts-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .attempt-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: var(--app-white);
        border-radius: 8px;
        border: 2px solid transparent;
        transition: all 0.2s ease;
      }

      .attempt-item:hover {
        background: #f9fafb;
      }

      .attempt-item.best {
        border-color: #10b981;
        background: #d1fae5;
      }

      .attempt-number {
        font-weight: bold;
        color: var(--app-grey);
        min-width: 30px;
      }

      .attempt-color {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        flex-shrink: 0;
      }

      .attempt-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .attempt-rgb {
        font-family: monospace;
        font-size: 14px;
        color: var(--app-grey);
      }

      .attempt-score {
        font-weight: bold;
        color: var(--app-primary-color);
        font-size: 16px;
      }

      .best-badge-small {
        background: #10b981;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
      }
      .best-badge-small svg {
        width: 24px;
        height: 24px;
        fill: white;
      }

      .welcome-card,
      .info-card,
      .game-section {
        background: white;
        padding: 24px;
        margin-bottom: 24px;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
      }

      .welcome-card h2 {
        margin-bottom: 8px;
      }

      .welcome-card p {
        color: var(--app-grey);
        font-size: 18px;
      }

      .info-card h3,
      .game-section h3 {
        margin-bottom: 16px;
      }

      .info-card p {
        margin: 8px 0;
      }

      .news-link {
        text-decoration: none;
        color: var(--app-cta-color);
      }

      .install-button {
        margin-top: 16px;
        background-color: var(--app-primary-color);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }

      .install-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    `,
  ];
}

customElements.define("dashboard-container", DashboardContainer);
export default DashboardContainer;
