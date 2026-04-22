import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";
import { installIcon, addIcon } from "../../shared/assets/icons.js";

class InstallGuideDialog extends LitElement {
  static properties = {
    open: { type: Boolean },
  };

  constructor() {
    super();
    this.open = false;
    this.handleOpenEvent = this.handleOpenEvent.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("open-install-guide-dialog", this.handleOpenEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      "open-install-guide-dialog",
      this.handleOpenEvent,
    );
    window.removeEventListener("keydown", this.handleKeyDown);
    document.body.style.overflow = "";
  }

  /** @param {Event} event */
  handleOpenEvent(event) {
    event.preventDefault();
    this.openDialog();
  }

  openDialog() {
    this.open = true;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", this.handleKeyDown);
  }

  closeDialog() {
    this.open = false;
    document.body.style.overflow = "";
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  /** @param {KeyboardEvent} event */
  handleKeyDown(event) {
    if (event.key === "Escape") {
      this.closeDialog();
    }
  }

  handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }

  // Edit this template to customize the install guide HTML and icons.
  renderGuideContent() {
    return html`
      <h2 id="install-guide-title">Install ColorZap</h2>
      <p class="guide-subtitle">Follow these steps:</p>

      <ol class="steps">
        <li>
          <span class="step-icon" aria-hidden="true">${installIcon}</span>
          <span>Click on <strong>Share</strong> from menu bar</span>
        </li>
        <li>
          <span class="step-icon" aria-hidden="true">${addIcon}</span>
          <span>Click on <strong>Add to Home Screen</strong></span>
        </li>
      </ol>

      <div class="actions">
        <button type="button" class="close-btn" @click=${this.closeDialog}>
          Got it
        </button>
      </div>
    `;
  }

  render() {
    if (!this.open) {
      return html``;
    }

    return html`
      <div
        class="dialog-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        @click=${this.handleBackdropClick}
      >
        <div class="dialog-card">${this.renderGuideContent()}</div>
      </div>
    `;
  }

  static styles = [
    globalStyles,
    css`
      :host {
        position: fixed;
        inset: 0;
        z-index: 1200;
        pointer-events: none;
      }

      .dialog-backdrop {
        pointer-events: auto;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .dialog-card {
        width: min(520px, 100%);
        background: white;
        border-radius: 14px;
        border: 2px solid #e5e7eb;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
        padding: 20px;
        color: #222;
      }

      h2 {
        margin: 0 0 8px 0;
        color: var(--app-primary-color);
      }

      .guide-subtitle {
        margin: 0 0 14px 0;
        color: #555;
      }

      .steps {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 10px;
      }

      .steps li {
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 10px;
        align-items: center;
        background: #f7f8fa;
        border: 1px solid #eceff3;
        border-radius: 10px;
        padding: 10px 12px;
      }

      .step-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: #fff;
        border-radius: 999px;
        border: 1px solid #e1e4ea;
      }

      .actions {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
      }

      .close-btn {
        border: none;
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 14px;
        font-weight: 700;
        color: white;
        background: var(--app-primary-color);
        cursor: pointer;
      }

      @media (max-width: 600px) {
        .dialog-card {
          padding: 16px;
          border-radius: 12px;
        }
      }
    `,
  ];
}

customElements.define("install-guide-dialog", InstallGuideDialog);
export default InstallGuideDialog;
