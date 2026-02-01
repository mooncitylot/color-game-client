import { html, LitElement, css } from "lit";
import { getCurrentUser } from "../../services/users.js";
import {
  getShopItems,
  purchaseItem,
  getUserInventory,
} from "../../services/shop.js";
import globalStyles from "../../styles/global-styles.js";
import { go } from "../../router/router-mixin.js";
import { routes } from "../../router/routes.js";
import "../../shared/components/shop-item-card.js";
import "../../shared/components/loading-spinner.js";

class StoreContainer extends LitElement {
  static properties = {
    user: { type: Object },
    items: { type: Array },
    filteredItems: { type: Array },
    isLoading: { type: Boolean },
    selectedType: { type: String },
    purchaseMessage: { type: String },
    purchaseError: { type: String },
    isPurchasing: { type: Boolean },
    showInventory: { type: Boolean },
    userInventory: { type: Array },
  };

  constructor() {
    super();
    this.user = null;
    this.items = [];
    this.filteredItems = [];
    this.isLoading = true;
    this.selectedType = "all";
    this.purchaseMessage = null;
    this.purchaseError = null;
    this.isPurchasing = false;
    this.showInventory = false;
    this.userInventory = [];
  }

  async routeEnter() {
    try {
      const [user, items, userInventory] = await Promise.all([
        getCurrentUser(),
        getShopItems(),
        getUserInventory(),
      ]);
      this.user = user;
      this.items = items;
      this.filteredItems = items;
      this.userInventory = userInventory;
      console.log("userInventory", this.userInventory);
      this.isLoading = false;
    } catch (error) {
      console.error("Error loading shop:", error);
      this.isLoading = false;
    }
  }

  handleBackToDashboard() {
    go(routes.DASHBOARD.path);
  }

  handleShowInventory() {
    this.showInventory = !this.showInventory;
  }

  handleFilterChange(type) {
    this.selectedType = type;
    if (type === "all") {
      this.filteredItems = this.items;
    } else {
      this.filteredItems = this.items.filter((item) => item.itemType === type);
    }
  }

  async handlePurchaseItem(e) {
    const { item } = e.detail;

    if (this.isPurchasing) return;

    // Clear previous messages
    this.purchaseMessage = null;
    this.purchaseError = null;

    // Confirm purchase
    const confirmed = confirm(
      `Purchase "${item.name}" for ${item.creditCost} credits?`
    );

    if (!confirmed) return;

    this.isPurchasing = true;

    try {
      const result = await purchaseItem(item.itemId, 1);

      // Update user credits
      this.user = { ...this.user, credits: result.creditsRemaining };

      // Update stock for limited items
      if (item.isLimitedEdition) {
        const itemIndex = this.items.findIndex((i) => i.itemId === item.itemId);
        if (itemIndex !== -1) {
          this.items[itemIndex].stockQuantity -= 1;
          this.items = [...this.items];
          this.handleFilterChange(this.selectedType);
        }
      }

      // Show success message
      this.purchaseMessage = `Successfully purchased ${item.name}!`;
      setTimeout(() => {
        this.purchaseMessage = null;
      }, 5000);
    } catch (error) {
      console.error("Purchase error:", error);
      this.purchaseError = error.message || "Failed to complete purchase";
      setTimeout(() => {
        this.purchaseError = null;
      }, 5000);
    } finally {
      this.isPurchasing = false;
    }
  }

  getItemTypeCount(type) {
    if (type === "all") return this.items.length;
    return this.items.filter((item) => item.itemType === type).length;
  }

  renderHeader() {
    return html`
      <header>
        <div class="header-content">
          <h1>Shop</h1>
          <div class="user-info">
            <div class="credits-display">
              <span class="credits-label">Your Credits:</span>
              <span class="credits-value">${this.user?.credits || 0}</span>
            </div>
            <button @click=${this.handleBackToDashboard}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>
    `;
  }

  renderFilters() {
    const filters = [
      { type: "all", label: "All Items" },
      { type: "powerup", label: "Powerups" },
      { type: "badge", label: "Badges" },
      { type: "avatar_hat", label: "Hats" },
      { type: "avatar_skin", label: "Skins" },
    ];

    const availableFilters = filters.filter(
      (filter) => this.getItemTypeCount(filter.type) > 0
    );

    return html`
      <div class="filters">
        ${availableFilters.map(
          (filter) => html`
            <button
              class="filter-button ${this.selectedType === filter.type
                ? "active"
                : ""}"
              @click=${() => this.handleFilterChange(filter.type)}
            >
              <span class="filter-label">${filter.label}</span>
              <span class="filter-count"
                >${this.getItemTypeCount(filter.type)}</span
              >
            </button>
          `
        )}
      </div>
    `;
  }

  renderMessages() {
    return html`
      ${this.purchaseMessage
        ? html` <div class="message success">✓ ${this.purchaseMessage}</div> `
        : ""}
      ${this.purchaseError
        ? html` <div class="message error">✗ ${this.purchaseError}</div> `
        : ""}
    `;
  }

  renderItems() {
    if (this.filteredItems.length === 0) {
      return html`
        <div class="empty-state">
          <h3>No items found</h3>
          <p>Check back later for new items!</p>
        </div>
      `;
    }

    return html`
      <div class="items-grid">
        ${this.filteredItems.map(
          (item) => html`
            <shop-item-card
              .item=${item}
              .userCredits=${this.user?.credits || 0}
              .disabled=${this.isPurchasing}
              @purchase-item=${this.handlePurchaseItem}
            ></shop-item-card>
          `
        )}
      </div>
    `;
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="loading-container">
          <loading-spinner></loading-spinner>
        </div>
      `;
    }

    return html`
      <div class="store-container">
        ${this.renderHeader()} ${this.renderMessages()}
        <div class="content">
          ${this.showInventory
            ? this.renderInventory()
            : html`${this.renderFilters()} ${this.renderItems()}`}
        </div>
      </div>
    `;
  }

  renderInventory() {
    return html`
      <div class="inventory">
        <h2>Inventory</h2>
        ${this.user?.inventory?.map(
          (item) => html`
            <div class="inventory-item">
              <h3>${item.name}</h3>
              <p>${item.description}</p>
            </div>
          `
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
        min-height: 100vh;
        background-color: var(--app-white);
      }

      .store-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }

      header {
        background-color: var(--app-primary-color);
        color: white;
        padding: 24px 40px;
        box-shadow: var(--box-shadow);
      }

      .header-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      header h1 {
        color: white;
        margin: 0;
        font-size: 32px;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .credits-display {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        backdrop-filter: blur(10px);
      }

      .credits-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.9;
      }

      .credits-value {
        font-size: 28px;
        font-weight: 700;
        margin-top: 4px;
      }

      .content {
        flex: 1;
        max-width: 1400px;
        width: 100%;
        margin: 0 auto;
        padding: 40px;
      }

      .message {
        max-width: 1400px;
        margin: 20px auto 0;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        animation: slideIn 0.3s ease;
      }

      .message.success {
        background-color: #d1fae5;
        color: #065f46;
        border: 2px solid #10b981;
      }

      .message.error {
        background-color: #fee2e2;
        color: #991b1b;
        border: 2px solid #ef4444;
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

      .filters {
        display: flex;
        gap: 12px;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }

      .filter-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;
        font-weight: 600;
        color: #4b5563;
      }

      .filter-button:hover {
        border-color: var(--app-primary-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(41, 41, 41, 0.2);
      }

      .filter-button.active {
        background: var(--app-primary-color);
        border-color: var(--app-primary-color);
        color: white;
      }

      .filter-count {
        background: rgba(0, 0, 0, 0.1);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
      }

      .filter-button.active .filter-count {
        background: rgba(255, 255, 255, 0.2);
      }

      .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 24px;
      }

      .empty-state {
        text-align: center;
        padding: 80px 20px;
        color: #6b7280;
      }

      .empty-icon {
        font-size: 80px;
        margin-bottom: 20px;
      }

      .empty-state h3 {
        font-size: 24px;
        margin: 0 0 12px 0;
        color: #1f2937;
      }

      .empty-state p {
        font-size: 16px;
        margin: 0;
      }

      @media (max-width: 768px) {
        .header-content {
          flex-direction: column;
          gap: 20px;
          align-items: flex-start;
        }

        .user-info {
          width: 100%;
          justify-content: space-between;
        }

        .content {
          padding: 20px;
        }

        .items-grid {
          grid-template-columns: 1fr;
        }

        .filters {
          gap: 8px;
        }

        .filter-button {
          flex: 1;
          min-width: 140px;
          justify-content: center;
        }
      }
    `,
  ];
}

customElements.define("store-container", StoreContainer);
export default StoreContainer;
