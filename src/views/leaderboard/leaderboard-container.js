import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";
import { getCurrentUser } from "../../services/users.js";
import { getPointsLeaderboard } from "../../services/leaderboard.js";
import { go } from "../../router/router-mixin.js";
import { routes } from "../../router/routes.js";
import "../../shared/components/loading-spinner.js";

class LeaderboardContainer extends LitElement {
  static properties = {
    scope: { type: String },
    entries: { type: Array },
    currentUserId: { type: String },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
  };

  constructor() {
    super();
    this.scope = "global";
    this.entries = [];
    this.currentUserId = null;
    this.isLoading = true;
    this.errorMessage = null;
  }

  async routeEnter() {
    try {
      const user = await getCurrentUser();
      this.currentUserId = user?.userId ?? null;
    } catch (e) {
      console.error(e);
    }
    await this.loadLeaderboard();
  }

  async loadLeaderboard() {
    try {
      this.isLoading = true;
      this.errorMessage = null;
      const rows = await getPointsLeaderboard(this.scope);
      this.entries = Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error(error);
      this.errorMessage = error.message || "Unable to load leaderboard";
      this.entries = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * @param {"global" | "friends"} nextScope
   */
  handleScopeChange(nextScope) {
    if (this.scope === nextScope) {
      return;
    }
    this.scope = nextScope;
    this.loadLeaderboard();
  }

  render() {
    return html`
      <div class="leaderboard-container">
        <header>
          <div class="header-content">
            <div>
              <h1>Leaderboard</h1>
              <p class="subtitle">Top 10 by total points</p>
            </div>
          </div>
        </header>

        <div class="scope-toggle" role="tablist" aria-label="Leaderboard scope">
          <button
            type="button"
            role="tab"
            class="scope-tab ${this.scope === "global" ? "active" : ""}"
            aria-selected=${this.scope === "global"}
            @click=${() => this.handleScopeChange("global")}
          >
            Global
          </button>
          <button
            type="button"
            role="tab"
            class="scope-tab ${this.scope === "friends" ? "active" : ""}"
            aria-selected=${this.scope === "friends"}
            @click=${() => this.handleScopeChange("friends")}
          >
            Friends
          </button>
        </div>

        ${this.errorMessage
          ? html`<div class="message error">${this.errorMessage}</div>`
          : null}

        <section class="leaderboard-card">
          ${this.isLoading
            ? html`<loading-spinner></loading-spinner>`
            : this.entries.length === 0
              ? html`<p class="empty-state">No entries yet.</p>`
              : html`
                  <ol class="leaderboard-list">
                    ${this.entries.map(
                      (row) => html`
                        <li
                          class="leaderboard-row ${this.currentUserId ===
                          row.userId
                            ? "is-self"
                            : ""}"
                        >
                          <span class="rank">#${row.rank}</span>
                          <div class="player">
                            <span class="username">${row.username}</span>
                            ${this.currentUserId === row.userId
                              ? html`<span class="you-badge">You</span>`
                              : null}
                          </div>
                          <div class="stats">
                            <span class="points">${row.points} pts</span>
                            <span class="level">Lv ${row.level}</span>
                          </div>
                        </li>
                      `,
                    )}
                  </ol>
                `}
        </section>
      </div>
    `;
  }

  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--app-white);
      }

      .leaderboard-container {
        max-width: 720px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding-bottom: 120px;
      }

      header h1 {
        margin: 0;
        font-size: 28px;
      }

      .subtitle {
        margin: 4px 0 0;
        color: var(--app-grey);
        font-size: 15px;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .scope-toggle {
        display: flex;
        padding: 4px;
        border-radius: 12px;
        background: #f3f4f6;
        gap: 4px;
      }

      .scope-tab {
        flex: 1;
        padding: 12px 16px;
        border: none;
        border-radius: 10px;
        background: transparent;
        font-size: 16px;
        font-weight: 600;
        color: var(--app-grey);
        cursor: pointer;
      }

      .scope-tab.active {
        background: white;
        color: var(--app-primary-color);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .scope-tab:focus-visible {
        outline: 2px solid var(--app-primary-color);
        outline-offset: 2px;
      }

      .leaderboard-card {
        background: white;
        padding: 24px;
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        min-height: 120px;
      }

      .leaderboard-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .leaderboard-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        border: 1px solid var(--app-light-grey);
        border-radius: 10px;
      }

      .leaderboard-row.is-self {
        border-color: var(--app-primary-color);
        background: rgba(59, 130, 246, 0.06);
      }

      .rank {
        font-weight: 800;
        font-size: 18px;
        min-width: 40px;
        color: var(--app-primary-color);
      }

      .player {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .username {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .you-badge {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 4px 8px;
        border-radius: 999px;
        background: var(--app-primary-color);
        color: white;
      }

      .stats {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        font-size: 14px;
      }

      .points {
        font-weight: 700;
      }

      .level {
        color: var(--app-grey);
        font-size: 13px;
      }

      .empty-state {
        color: var(--app-grey);
        margin: 0;
        text-align: center;
        padding: 24px 8px;
      }

      .message.error {
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 600;
        background: #fee2e2;
        color: #991b1b;
      }
    `,
  ];
}

customElements.define("leaderboard-container", LeaderboardContainer);
export default LeaderboardContainer;
