import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";
import { getCurrentUser } from "../../services/users.js";
import { getScoreHistory } from "../../services/colors.js";
import { getUserInventory, useItem } from "../../services/shop.js";
import { getFriends } from "../../services/friends.js";
import { clearSession } from "../../session/session.js";
import { go } from "../../router/router-mixin.js";
import { routes } from "../../router/routes.js";

class ProfileContainer extends LitElement {
  static properties = {
    user: { type: Object },
    scoreHistory: { type: Object },
    userInventory: { type: Array },
    isUsingPowerup: { type: Boolean },
    powerupMessage: { type: String },
    friends: { type: Array },
    selectedPowerupTargets: { type: Object },
  };

  constructor() {
    super();
    this.user = null;
    this.scoreHistory = null;
    this.userInventory = [];
    this.isUsingPowerup = false;
    this.powerupMessage = "";
    this.friends = [];
    this.selectedPowerupTargets = {};
  }

  async routeEnter() {
    try {
      const [user, inventory, scoreHistory, friendsRes] = await Promise.all([
        getCurrentUser(),
        getUserInventory(),
        getScoreHistory(),
        getFriends(),
      ]);
      this.user = user;
      this.userInventory = inventory || [];
      console.log(this.userInventory);
      this.scoreHistory = scoreHistory;
      this.friends = friendsRes?.friends ?? [];
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * @param {number} inventoryId
   * @param {Object} item
   * @param {string} [targetUserId]
   */
  async handleUsePowerup(inventoryId, item, targetUserId) {
    if (this.isUsingPowerup) return;
    if (item?.metadata?.effect_target === "other" && !targetUserId) {
      this.powerupMessage = "Select a friend to target first.";
      return;
    }

    this.isUsingPowerup = true;
    this.powerupMessage = "";

    try {
      const response = await useItem(inventoryId, targetUserId);

      const [updatedScoreHistory, updatedInventory] = await Promise.all([
        getScoreHistory(),
        getUserInventory(),
      ]);

      this.scoreHistory = updatedScoreHistory;
      this.userInventory = updatedInventory || [];

      this.powerupMessage = this.getPowerupSuccessMessage(response);

      if (item?.metadata?.effect_target === "other") {
        this.selectedPowerupTargets = {
          ...this.selectedPowerupTargets,
          [inventoryId]: "",
        };
      }

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
   * @param {number} inventoryId
   * @param {Event} e
   */
  handleTargetUserChange(inventoryId, e) {
    this.selectedPowerupTargets = {
      ...this.selectedPowerupTargets,
      [inventoryId]: e.target.value,
    };
  }

  /**
   * @param {Object} response
   * @returns {string}
   */
  getPowerupSuccessMessage(response) {
    if (response?.effectMetadata?.max_attempts) {
      return `${response.message} You now have ${response.effectMetadata.max_attempts} attempts!`;
    }

    return response?.message || "Powerup used successfully";
  }

  /**
   * @returns {Array}
   */
  getAvailablePowerups() {
    return this.userInventory.filter(
      (invItem) => invItem.item.itemType === "powerup" && invItem.quantity > 0,
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
          ${powerups.map((invItem) => {
            const selectedTargetUserId =
              this.selectedPowerupTargets[invItem.inventoryId] || "";
            const requiresTarget =
              invItem.item.metadata?.effect_target === "other";

            return html`
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
                ${requiresTarget
                  ? html`
                      <select
                        class="target-user-select"
                        name="target-user-${invItem.inventoryId}"
                        .value=${selectedTargetUserId}
                        @change=${(e) =>
                          this.handleTargetUserChange(invItem.inventoryId, e)}
                      >
                        <option value="">Select a target user</option>
                        ${(this.friends ?? []).map(
                          (friend) => html`
                            <option value="${friend.friend.userId}">
                              ${friend.friend.username}
                            </option>
                          `,
                        )}
                      </select>
                    `
                  : ""}
                <button
                  class="use-powerup-button"
                  @click=${() =>
                    this.handleUsePowerup(
                      invItem.inventoryId,
                      invItem.item,
                      selectedTargetUserId,
                    )}
                  ?disabled=${this.isUsingPowerup ||
                  (requiresTarget && !selectedTargetUserId)}
                >
                  ${this.isUsingPowerup ? "Using..." : "Use"}
                </button>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  handleLogout() {
    clearSession();
    go(routes.LOGIN.path);
  }

  render() {
    return html`
      <div class="profile">
        <div class="content">
          ${this.user
            ? html`
                <div class="profile-header">
                  <h2>Profile</h2>
                  <p class="profile-username">${this.user.username}</p>
                  <button @click=${this.handleLogout}>logout</button>
                </div>
                ${this.powerupMessage
                  ? html`
                      <div class="powerup-message">${this.powerupMessage}</div>
                    `
                  : ""}
                ${this.renderPowerups()}
              `
            : html`<loading-spinner></loading-spinner>`}
        </div>
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

      .profile {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .content {
        flex: 1;
        padding: 40px;
        overflow-y: auto;
        margin-bottom: 80px;
      }

      .profile-header {
        background: white;
        padding: 24px;
        margin-bottom: 24px;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
      }

      .profile-header h2 {
        margin: 0 0 8px 0;
        color: var(--app-primary-color);
      }

      .profile-username {
        margin: 0;
        color: var(--app-grey);
        font-size: 18px;
      }

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

      .target-user-select {
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        padding: 12px 16px;
        background: white;
        color: var(--app-primary-color);
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
    `,
  ];
}

customElements.define("profile-container", ProfileContainer);

export default ProfileContainer;
