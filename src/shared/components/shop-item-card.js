import { LitElement, html, css } from "lit";

class ShopItemCard extends LitElement {
  static properties = {
    item: { type: Object },
    userCredits: { type: Number },
    disabled: { type: Boolean },
  };

  constructor() {
    super();
    this.item = null;
    this.userCredits = 0;
    this.disabled = false;
  }

  getRarityClass() {
    return `rarity-${this.item?.rarity || "common"}`;
  }

  getRarityLabel() {
    const rarity = this.item?.rarity || "common";
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  }

  canAfford() {
    return this.userCredits >= (this.item?.creditCost || 0);
  }

  isAvailable() {
    if (!this.item?.isActive) return false;
    if (!this.item?.isLimitedEdition) return true;
    return this.item?.stockQuantity > 0;
  }

  handlePurchase() {
    if (this.disabled || !this.canAfford() || !this.isAvailable()) return;

    this.dispatchEvent(
      new CustomEvent("purchase-item", {
        detail: { item: this.item },
        bubbles: true,
        composed: true,
      }),
    );
  }

  getItemTypeLabel() {
    const typeMap = {
      powerup: "Powerup",
      badge: "Badge",
      avatar_hat: "Hat",
      avatar_skin: "Skin",
    };
    return typeMap[this.item?.itemType] || "Item";
  }

  render() {
    if (!this.item) return html``;

    const canAfford = this.canAfford();
    const isAvailable = this.isAvailable();
    const canPurchase = canAfford && isAvailable && !this.disabled;

    return html`
      <div class="shop-item-card ${this.getRarityClass()}">
        <div class="item-header">
          <span class="item-type">${this.getItemTypeLabel()}</span>
          <span class="item-rarity">${this.getRarityLabel()}</span>
        </div>

        ${this.item.metadata?.icon_url
          ? html`
              <div class="item-icon">
                <img
                  src="${this.item.metadata.icon_url || null}"
                  alt="${this.item.name}"
                />
              </div>
            `
          : html`
              <div class="item-icon placeholder">
                <span class="placeholder-text"
                  >${this.item.name.charAt(0)}</span
                >
              </div>
            `}

        <div class="item-details">
          <h3 class="item-name">${this.item.name}</h3>
          <p class="item-description">${this.item.description}</p>

          ${this.item.isLimitedEdition
            ? html`
                <div class="limited-edition-badge">
                  <span class="badge-text">Limited Edition</span>
                  <span class="stock-count"
                    >${this.item.stockQuantity} left</span
                  >
                </div>
              `
            : ""}

          <div class="item-footer">
            <div class="item-cost">
              <span class="cost-label">Cost:</span>
              <span class="cost-value">${this.item.creditCost}</span>
              <span class="cost-currency">credits</span>
            </div>

            <button
              class="purchase-button ${!canPurchase ? "disabled" : ""}"
              @click=${this.handlePurchase}
              ?disabled=${!canPurchase}
            >
              ${!isAvailable
                ? "Sold Out"
                : !canAfford
                  ? "Insufficient Credits"
                  : "Purchase"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .shop-item-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 2px solid transparent;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .shop-item-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .rarity-common {
      border-color: #9ca3af;
    }

    .rarity-rare {
      border-color: #3b82f6;
    }

    .rarity-epic {
      border-color: #a855f7;
    }

    .rarity-legendary {
      border-color: #f59e0b;
      background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .item-type {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.5px;
    }

    .item-rarity {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .rarity-common .item-rarity {
      background-color: #e5e7eb;
      color: #4b5563;
    }

    .rarity-rare .item-rarity {
      background-color: #dbeafe;
      color: #2563eb;
    }

    .rarity-epic .item-rarity {
      background-color: #f3e8ff;
      color: #9333ea;
    }

    .rarity-legendary .item-rarity {
      background-color: #fef3c7;
      color: #d97706;
    }

    .item-icon {
      width: 100%;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      border-radius: 8px;
      overflow: hidden;
      background-color: #f9fafb;
    }

    .item-icon img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .item-icon.placeholder {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .placeholder-text {
      font-size: 72px;
      font-weight: bold;
      color: white;
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #1f2937;
    }

    .item-description {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 16px 0;
      flex: 1;
      line-height: 1.5;
    }

    .limited-edition-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 12px;
      font-weight: 700;
    }

    .badge-text {
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stock-count {
      background: rgba(255, 255, 255, 0.3);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .item-footer {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-cost {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 14px;
    }

    .cost-label {
      color: #6b7280;
      font-weight: 500;
    }

    .cost-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }

    .cost-currency {
      color: #6b7280;
      font-weight: 500;
    }

    .purchase-button {
      width: 100%;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .purchase-button:hover:not(.disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .purchase-button.disabled {
      background: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }

    .purchase-button:active:not(.disabled) {
      transform: translateY(0);
    }
  `;
}

customElements.define("shop-item-card", ShopItemCard);
export default ShopItemCard;
