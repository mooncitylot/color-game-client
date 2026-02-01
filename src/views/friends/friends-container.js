import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";
import {
  getFriends,
  getFriendRequests,
  getFriendActivity,
  searchFriends,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
} from "../../services/friends.js";
import { go } from "../../router/router-mixin.js";
import { routes } from "../../router/routes.js";

class FriendsContainer extends LitElement {
  static properties = {
    friends: { type: Array },
    requests: { type: Array },
    activity: { type: Array },
    searchResults: { type: Array },
    searchQuery: { type: String },
    isLoading: { type: Boolean },
    isSearching: { type: Boolean },
    errorMessage: { type: String },
    successMessage: { type: String },
  };

  constructor() {
    super();
    this.friends = [];
    this.requests = [];
    this.activity = [];
    this.searchResults = [];
    this.searchQuery = "";
    this.isLoading = true;
    this.isSearching = false;
    this.errorMessage = null;
    this.successMessage = null;
  }

  async routeEnter() {
    await this.loadFriendsData();
  }

  async loadFriendsData() {
    try {
      this.isLoading = true;
      const [friendsRes, requestsRes, activityRes] = await Promise.all([
        getFriends(),
        getFriendRequests(),
        getFriendActivity(),
      ]);
      this.friends = friendsRes.friends || [];
      this.requests = requestsRes.requests || [];
      this.activity = activityRes.activity || [];
      this.isLoading = false;
    } catch (error) {
      console.error("Failed to load friends data", error);
      this.errorMessage = error.message || "Unable to load friends data";
      this.isLoading = false;
    }
  }

  handleBackToDashboard() {
    go(routes.DASHBOARD.path);
  }

  async handleSearch(e) {
    e.preventDefault();
    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.errorMessage = "Search must be at least 2 characters";
      return;
    }

    try {
      this.isSearching = true;
      const result = await searchFriends(this.searchQuery);
      this.searchResults = result.results || [];
      this.errorMessage = null;
    } catch (error) {
      console.error("Search failed", error);
      this.errorMessage = error.message || "Search failed";
    } finally {
      this.isSearching = false;
    }
  }

  async handleSendRequest(userId) {
    try {
      await sendFriendRequest(userId);
      this.successMessage = "Friend request sent!";
      await this.loadFriendsData();
      await this.handleQuickSearch(this.searchQuery);
      setTimeout(() => (this.successMessage = null), 3000);
    } catch (error) {
      console.error("Failed to send request", error);
      this.errorMessage = error.message || "Unable to send request";
      setTimeout(() => (this.errorMessage = null), 3000);
    }
  }

  async handleRespond(friendshipId, action) {
    try {
      await respondToFriendRequest(friendshipId, action);
      this.successMessage = action === "accept" ? "Friend added!" : "Request declined";
      await this.loadFriendsData();
      setTimeout(() => (this.successMessage = null), 3000);
    } catch (error) {
      console.error("Failed to respond", error);
      this.errorMessage = error.message || "Unable to update request";
      setTimeout(() => (this.errorMessage = null), 3000);
    }
  }

  async handleRemoveFriend(friendshipId) {
    try {
      await removeFriend(friendshipId);
      this.successMessage = "Friend removed";
      await this.loadFriendsData();
      setTimeout(() => (this.successMessage = null), 3000);
    } catch (error) {
      console.error("Failed to remove friend", error);
      this.errorMessage = error.message || "Unable to remove friend";
      setTimeout(() => (this.errorMessage = null), 3000);
    }
  }

  async handleQuickSearch(query) {
    if (!query || query.length < 2) {
      this.searchResults = [];
      return;
    }
    try {
      const result = await searchFriends(query);
      this.searchResults = result.results || [];
    } catch (error) {
      console.error("Quick search failed", error);
    }
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="friends-container loading">
          <p>Loading your friends list...</p>
        </div>
      `;
    }

    return html`
      <div class="friends-container">
        <header>
          <div class="header-content">
            <h1>Friends</h1>
            <button @click=${this.handleBackToDashboard}>Back to Dashboard</button>
          </div>
          <p>Find friends, manage requests, and follow their activity.</p>
        </header>

        ${this.renderMessages()}

        <div class="content-grid">
          <section class="search-card">
            <h2>Find Players</h2>
            <form @submit=${this.handleSearch}>
              <label for="friend-search">Search by username</label>
              <input
                id="friend-search"
                type="text"
                placeholder="Enter username"
                .value=${this.searchQuery}
                @input=${(e) => {
                  this.searchQuery = e.target.value;
                  if (!this.isSearching) {
                    this.handleQuickSearch(this.searchQuery);
                  }
                }}
              />
              <button type="submit" ?disabled=${this.isSearching}>${
                this.isSearching ? "Searching..." : "Search"
              }</button>
            </form>
            ${this.renderSearchResults()}
          </section>

          <section class="friends-card">
            <div class="section-header">
              <h2>My Friends</h2>
              <span class="count">${this.friends.length} total</span>
            </div>
            ${this.friends.length === 0
              ? html`<p class="empty-state">You don't have any friends yet. Start connecting!</p>`
              : this.renderFriendsList()}
          </section>
        </div>

        <div class="content-grid">
          <section class="requests-card">
            <div class="section-header">
              <h2>Friend Requests</h2>
              <span class="count">${this.requests.length}</span>
            </div>
            ${this.requests.length === 0
              ? html`<p class="empty-state">No pending requests.</p>`
              : this.renderRequestsList()}
          </section>

          <section class="activity-card">
            <div class="section-header">
              <h2>Friend Activity</h2>
              <span class="count">${this.activity.length} recent</span>
            </div>
            ${this.activity.length === 0
              ? html`<p class="empty-state">No recent activity from friends.</p>`
              : this.renderActivityList()}
          </section>
        </div>
      </div>
    `;
  }

  renderMessages() {
    return html`
      ${this.successMessage
        ? html`<div class="message success">${this.successMessage}</div>`
        : ""}
      ${this.errorMessage
        ? html`<div class="message error">${this.errorMessage}</div>`
        : ""}
    `;
  }

  renderFriendsList() {
    return html`
      <ul class="friends-list">
        ${this.friends.map(
          (friend) => html`
            <li>
               <div class="friend-info">
                 <div>
                   <h3>${friend.friend.username}</h3>
                   <p>Level ${friend.friend.level} • ${friend.friend.points} pts</p>
                 </div>
               </div>
               <div class="friend-actions">
                 <span class="status accepted">Friends</span>
                 <button class="secondary" @click=${() => this.handleRemoveFriend(friend.friendshipId)}>
                   Remove
                 </button>
               </div>
             </li>

          `
        )}
      </ul>
    `;
  }

  renderRequestsList() {
    return html`
      <ul class="requests-list">
        ${this.requests.map(
          (request) => html`
            <li>
              <div>
                <h3>${request.user.username}</h3>
                <p>Level ${request.user.level} • ${request.user.points} pts</p>
                <span class="direction">${request.direction}</span>
              </div>
              ${request.direction === "incoming"
                ? html`
                    <div class="request-actions">
                      <button class="secondary" @click=${() =>
                        this.handleRespond(request.friendshipId, "decline")}>
                        Decline
                      </button>
                      <button @click=${() =>
                        this.handleRespond(request.friendshipId, "accept")}>
                        Accept
                      </button>
                    </div>
                  `
                : html`<span class="status pending">Pending</span>`}
            </li>
          `
        )}
      </ul>
    `;
  }

  renderActivityList() {
    return html`
      <ul class="activity-list">
        ${this.activity.map(
          (entry) => html`
            <li>
              <div>
                <h3>${entry.username}</h3>
                <p>
                  Best score: <strong>${entry.bestScore}%</strong> (${entry.attemptsUsed} attempts)
                  on ${entry.date}
                </p>
              </div>
              <div class="score-badge">${entry.bestScore}</div>
            </li>
          `
        )}
      </ul>
    `;
  }

  renderSearchResults() {
    if (!this.searchResults || this.searchResults.length === 0) {
      return html`<p class="empty-state small">No results yet.</p>`;
    }

    return html`
      <ul class="search-results">
        ${this.searchResults.map((result) => {
          const status = result.relationshipStatus || "none";
          const isFriend = status === "accepted";
          const isPending = status === "pending";
          const isOutgoing = result.requestDirection === "outgoing";

          return html`
            <li>
              <div>
                <h3>${result.username}</h3>
                <p>Level ${result.level} • ${result.points} pts</p>
              </div>
              <div class="search-actions">
                ${isFriend
                  ? html`<span class="status accepted">Friends</span>`
                  : isPending
                  ? html`
                      <span class="status pending">
                        ${isOutgoing ? "Request Sent" : "Respond Pending"}
                      </span>
                    `
                  : html`
                      <button
                        class="secondary"
                        @click=${() => this.handleSendRequest(result.userId)}
                      >
                        Add Friend
                      </button>
                    `}
              </div>
            </li>
          `;
        })}
      </ul>
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

      .friends-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      header {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .content-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
      }

      section {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: var(--box-shadow);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .count {
        font-size: 14px;
        color: var(--app-grey);
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border: 1px solid var(--app-light-grey);
        border-radius: 10px;
      }

      .friends-list li,
      .requests-list li,
      .activity-list li,
      .search-results li {
        gap: 16px;
      }

      .friend-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .friend-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .status {
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 14px;
        text-transform: capitalize;
      }

      .status.accepted {
        background: #d1fae5;
        color: #065f46;
      }

      .status.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .direction {
        font-size: 12px;
        color: var(--app-grey);
        text-transform: uppercase;
      }

      .request-actions {
        display: flex;
        gap: 12px;
      }

      .activity-card .score-badge {
        background: var(--app-primary-color);
        color: white;
        font-weight: bold;
        padding: 10px 16px;
        border-radius: 999px;
      }

      .message {
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 600;
      }

      .message.success {
        background: #d1fae5;
        color: #065f46;
      }

      .message.error {
        background: #fee2e2;
        color: #991b1b;
      }

      .empty-state {
        color: var(--app-grey);
        margin: 0;
      }

      .empty-state.small {
        font-size: 14px;
      }

      .search-results {
        margin-top: 16px;
      }

      .search-actions {
        display: flex;
        align-items: center;
      }

      form {
        margin-top: 12px;
      }
    `,
  ];
}

customElements.define("friends-container", FriendsContainer);
export default FriendsContainer;
