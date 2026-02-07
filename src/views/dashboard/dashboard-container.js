import { LitElement, html, css } from "lit";
import { getCurrentUser } from "../../services/users.js";
import { getScoreHistory } from "../../services/colors.js";
import { getFriends, getFriendRequests } from "../../services/friends.js";
import globalStyles from "../../styles/global-styles.js";
import { getSessionUser, clearSession } from "../../session/session.js";
import { go } from "../../router/router-mixin.js";
import { routes } from "../../router/routes.js";
import { getDailyColor } from "../../services/colors.js";
import { getUserInventory, useItem } from "../../services/shop.js";

class DashboardContainer extends LitElement {
  static properties = {
    user: { type: Object },
    scoreHistory: { type: Object },
    isLoadingHistory: { type: Boolean },
    friendSummary: { type: Object },
    dailyChallenge: { type: Object },
    userInventory: { type: Array },
    isUsingPowerup: { type: Boolean },
    powerupMessage: { type: String },
  };

  constructor() {
    super();
    this.user = null;
    this.scoreHistory = null;
    this.isLoadingHistory = true;
    this.friendSummary = { friends: 0, requests: 0 };
    this.dailyChallenge = null;
    this.userInventory = [];
    this.isUsingPowerup = false;
    this.powerupMessage = "";
  }

  async routeEnter() {
    try {
      const [
        user,
        scoreHistory,
        friendsRes,
        requestsRes,
        dailyChallenge,
        inventory,
      ] = await Promise.all([
        getCurrentUser(),
        getScoreHistory(),
        getFriends(),
        getFriendRequests(),
        getDailyColor(),
        getUserInventory(),
      ]);
      this.user = user;
      this.scoreHistory = scoreHistory;
      this.friendSummary = {
        friends: friendsRes.friends?.length || 0,
        requests: requestsRes.requests?.length || 0,
      };
      this.isLoadingHistory = false;
      this.dailyChallenge = dailyChallenge;
      this.userInventory = inventory || [];
      console.log("dailyChallenge", this.dailyChallenge);
      console.log("userInventory", this.userInventory);
    } catch (error) {
      console.error(error);
      this.isLoadingHistory = false;
    }
  }

  handleLogout() {
    clearSession();
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

  /**
   * @param {number} inventoryId
   */
  async handleUsePowerup(inventoryId) {
    if (this.isUsingPowerup) return;

    this.isUsingPowerup = true;
    this.powerupMessage = "";

    try {
      const response = await useItem(inventoryId);

      // Refresh user data and score history to get updated attempts
      const [updatedScoreHistory, updatedInventory] = await Promise.all([
        getScoreHistory(),
        getUserInventory(),
      ]);

      this.scoreHistory = updatedScoreHistory;
      this.userInventory = updatedInventory || [];

      this.powerupMessage = `${response.message} You now have ${
        response.effectMetadata?.max_attempts || this.scoreHistory.max_attempts
      } attempts!`;

      setTimeout(() => {
        this.powerupMessage = "";
      }, 5000);
    } catch (error) {
      console.error("Error using powerup:", error);
      this.powerupMessage = error.message || "Failed to use powerup";

      setTimeout(() => {
        this.powerupMessage = "";
      }, 5000);
    } finally {
      this.isUsingPowerup = false;
    }
  }

  /**
   * @returns {Array}
   */
  getAvailablePowerups() {
    return this.userInventory.filter(
      (invItem) => invItem.item.itemType === "powerup" && invItem.quantity > 0,
    );
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

  renderPowerups() {
    const powerups = this.getAvailablePowerups();

    if (powerups.length === 0) {
      return html``;
    }

    return html`
      <div class="powerups-card">
        <h3>Available Powerups</h3>
        <div class="powerups-list">
          ${powerups.map(
            (invItem) => html`
              <div class="powerup-item">
                <div class="powerup-info">
                  <div class="powerup-name">${invItem.item.name}</div>
                  <div class="powerup-description">
                    ${invItem.item.description}
                  </div>
                  <div class="powerup-quantity">
                    Quantity: ${invItem.quantity}
                  </div>
                </div>
                <button
                  class="use-powerup-button"
                  @click=${() => this.handleUsePowerup(invItem.inventoryId)}
                  ?disabled=${this.isUsingPowerup}
                >
                  ${this.isUsingPowerup ? "Using..." : "Use"}
                </button>
              </div>
            `,
          )}
        </div>
      </div>
    `;
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
                </div>

                ${this.powerupMessage
                  ? html`
                      <div class="powerup-message">${this.powerupMessage}</div>
                    `
                  : ""}
                ${this.renderPowerups()}

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

    const maxAttempts = this.scoreHistory.max_attempts || 5;

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
            Start Scanning
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
          <button
            class="scan-button secondary"
            @click=${this.handleGoToScanner}
          >
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
          Continue Scanning
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
                <span class="attempt-rgb">
                  RGB(${attempt.submitted_color_r},
                  ${attempt.submitted_color_g}, ${attempt.submitted_color_b})
                </span>
                <span class="attempt-score">Score: ${attempt.score}%</span>
              </div>
              ${attempt === bestAttempt
                ? html`<span class="best-badge-small">Best</span>`
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

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 40px;
        background-color: var(--app-primary-color);
        color: white;
      }

      header h1 {
        color: white;
        margin: 0;
      }

      .header-buttons {
        display: flex;
        gap: 12px;
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
      .attempts-card,
      .powerups-card {
        background: white;
        padding: 24px;
        margin-bottom: 24px;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
      }

      .powerup-message {
        background: #d1fae5;
        color: #065f46;
        border: 2px solid #10b981;
        padding: 16px 24px;
        border-radius: 8px;
        margin-bottom: 24px;
        font-weight: 600;
        text-align: center;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .powerups-card h3 {
        margin: 0 0 20px 0;
        color: var(--app-primary-color);
      }

      .powerups-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .powerup-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: var(--app-white);
        border-radius: 8px;
        border: 2px solid #e5e7eb;
        transition: all 0.2s ease;
      }

      .powerup-item:hover {
        border-color: var(--app-primary-color);
      }

      .powerup-info {
        flex: 1;
      }

      .powerup-name {
        font-size: 18px;
        font-weight: 700;
        color: var(--app-primary-color);
        margin-bottom: 4px;
      }

      .powerup-description {
        font-size: 14px;
        color: var(--app-grey);
        margin-bottom: 4px;
      }

      .powerup-quantity {
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
      }

      .use-powerup-button {
        background-color: #10b981;
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 100px;
      }

      .use-powerup-button:hover:not(:disabled) {
        background-color: #059669;
        transform: translateY(-2px);
      }

      .use-powerup-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
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
        background-color: var(--app-primary-color);
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 250px;
      }

      .scan-button:hover {
        transform: translateY(-2px);
      }

      .scan-button.secondary {
        background-color: #6b7280;
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
    `,
  ];
}

customElements.define("dashboard-container", DashboardContainer);
export default DashboardContainer;
