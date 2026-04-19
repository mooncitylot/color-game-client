import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  sendTestNotification,
  initializePushNotifications,
} from "../../services/push-notifications.js";
import {
  isInstalledPwa,
  isIosLikeDevice,
  canUseInstallPrompt,
  canShowManualInstallGuide,
  promptAddToHomeScreen,
  showManualInstallGuide,
  subscribePwaInstallState,
} from "../../services/pwa-install.js";

class SettingsContainer extends LitElement {
  static properties = {
    pushSupported: { type: Boolean },
    notificationPermission: { type: String },
    isSubscribed: { type: Boolean },
    isLoading: { type: Boolean },
    message: { type: String },
    messageType: { type: String }, // 'success' or 'error'
    pwaInstalled: { type: Boolean },
    installPromptReady: { type: Boolean },
    showIosInstallHelp: { type: Boolean },
    showGenericInstallHint: { type: Boolean },
    manualInstallGuideAvailable: { type: Boolean },
    installLoading: { type: Boolean },
  };

  constructor() {
    super();
    this.pushSupported = false;
    this.notificationPermission = "unknown";
    this.isSubscribed = false;
    this.isLoading = false;
    this.message = "";
    this.messageType = "";
    this.pwaInstalled = false;
    this.installPromptReady = false;
    this.showIosInstallHelp = false;
    this.showGenericInstallHint = false;
    this.manualInstallGuideAvailable = false;
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
    const installed = isInstalledPwa();
    const promptReady = canUseInstallPrompt();
    const iosLike = isIosLikeDevice();
    const manualGuideAvailable = canShowManualInstallGuide();
    this.pwaInstalled = installed;
    this.installPromptReady = promptReady;
    this.showIosInstallHelp = !installed && iosLike && !promptReady;
    this.showGenericInstallHint = !installed && !iosLike && !promptReady;
    this.manualInstallGuideAvailable = manualGuideAvailable;

    console.log("[Settings Install UI] syncPwaInstallUi", {
      installed,
      promptReady,
      iosLike,
      manualGuideAvailable,
      showIosInstallHelp: this.showIosInstallHelp,
      showGenericInstallHint: this.showGenericInstallHint,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
    });
  }

  async routeEnter() {
    await this.loadSettings();
  }

  async loadSettings() {
    this.isLoading = true;

    try {
      this.pushSupported = isPushSupported();

      if (this.pushSupported) {
        this.notificationPermission = getNotificationPermission();
        this.isSubscribed = await isSubscribed();

        // Initialize service worker
        await initializePushNotifications();
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      this.showMessage("Failed to load settings", "error");
    } finally {
      this.isLoading = false;
    }
  }

  showMessage(text, type) {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = "";
      this.messageType = "";
    }, 5000);
  }

  async handleSubscribe() {
    this.isLoading = true;
    this.message = "";

    try {
      await subscribeToPush();
      this.isSubscribed = true;
      this.notificationPermission = "granted";
      this.showMessage(
        "Successfully subscribed to push notifications!",
        "success",
      );
    } catch (error) {
      console.error("Subscription error:", error);
      this.showMessage(error.message || "Failed to subscribe", "error");
    } finally {
      this.isLoading = false;
    }
  }

  async handleUnsubscribe() {
    this.isLoading = true;
    this.message = "";

    try {
      await unsubscribeFromPush();
      this.isSubscribed = false;
      this.showMessage(
        "Successfully unsubscribed from push notifications",
        "success",
      );
    } catch (error) {
      console.error("Unsubscription error:", error);
      this.showMessage("Failed to unsubscribe", "error");
    } finally {
      this.isLoading = false;
    }
  }

  async handleRequestPermission() {
    this.isLoading = true;

    try {
      const permission = await requestNotificationPermission();
      this.notificationPermission = permission;

      if (permission === "granted") {
        this.showMessage("Notification permission granted!", "success");
      } else if (permission === "denied") {
        this.showMessage("Notification permission denied", "error");
      }
    } catch (error) {
      this.showMessage("Failed to request permission", "error");
    } finally {
      this.isLoading = false;
    }
  }

  handleTestNotification() {
    try {
      sendTestNotification();
      this.showMessage("Test notification sent!", "success");
    } catch (error) {
      this.showMessage(
        error.message || "Failed to send test notification",
        "error",
      );
    }
  }

  async handleAddToHomeScreen() {
    this.installLoading = true;
    try {
      console.log("[Settings Install UI] handleAddToHomeScreen click");
      const { outcome } = await promptAddToHomeScreen();
      console.log("[Settings Install UI] prompt outcome", { outcome });
      if (outcome === "accepted") {
        this.showMessage("ColorZap added to your home screen!", "success");
      } else if (outcome === "guided") {
        this.showMessage("Install guide opened", "success");
      }
    } catch (err) {
      console.error("Install prompt error:", err);
      this.showMessage("Could not show install prompt", "error");
    } finally {
      this.installLoading = false;
    }
  }

  renderInstallAppSection() {
    if (this.pwaInstalled) {
      return html`
        <div class="setting-item install-pwa-block">
          <div class="setting-info">
            <h3>Installed app</h3>
            <p>You are running ColorZap as an installed app.</p>
          </div>
        </div>
      `;
    }

    if (this.installPromptReady) {
      return html`
        <div class="setting-item install-pwa-block">
          <div class="setting-info">
            <h3>Add to home screen</h3>
            <p>Install ColorZap for quick access like a native app.</p>
          </div>
          <div class="setting-controls">
            <button
              class="btn btn-primary"
              type="button"
              @click=${this.handleAddToHomeScreen}
              ?disabled=${this.installLoading}
            >
              ${this.installLoading ? "Please wait…" : "Add to home screen"}
            </button>
          </div>
        </div>
      `;
    }

    if (this.showIosInstallHelp) {
      return html`
        <div class="setting-item install-pwa-block install-ios-hint">
          <div class="setting-info">
            <h3>Add to home screen</h3>
            <p class="hint ios-steps">
              On iPhone or iPad: open the browser share/menu options, then tap
              <strong>Add to Home Screen</strong>.
            </p>
            ${this.manualInstallGuideAvailable
              ? html`
                  <button
                    class="btn btn-primary"
                    type="button"
                    @click=${() => showManualInstallGuide("en")}
                  >
                    Open Install Guide
                  </button>
                `
              : ""}
          </div>
        </div>
      `;
    }

    if (this.showGenericInstallHint) {
      return html`
        <div class="setting-item install-pwa-block">
          <div class="setting-info">
            <h3>Add to home screen</h3>
            <p class="hint">
              Look for an install icon in your browser’s address bar or menu, or
              keep using this page — an install option may appear here later.
            </p>
            ${this.manualInstallGuideAvailable
              ? html`
                  <button
                    class="btn btn-primary"
                    type="button"
                    @click=${() => showManualInstallGuide("en")}
                  >
                    Open Install Guide
                  </button>
                `
              : ""}
          </div>
        </div>
      `;
    }

    return null;
  }

  renderPushSettings() {
    if (!this.pushSupported) {
      return html`
        <div class="setting-item">
          <p class="error-text">
            Push notifications are not supported in your browser.
          </p>
          <p class="hint">
            Please use a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      `;
    }

    return html`
      <div class="setting-item">
        <div class="setting-info">
          <h3>Enable Notifications</h3>
          <p>Receive notifications???</p>
        </div>

        <div class="setting-controls">
          ${this.notificationPermission !== "granted"
            ? html`
                <button
                  class="btn btn-primary"
                  @click=${this.handleRequestPermission}
                  ?disabled=${this.isLoading}
                >
                  ${this.isLoading ? "Loading..." : "Enable Notifications"}
                </button>
              `
            : this.renderSubscriptionButton()}
        </div>
      </div>

      ${this.isSubscribed ? this.renderTestNotification() : ""}

      <div class="setting-item">
        <div class="setting-info">
          <h3>Status</h3>
          <p>Current notification settings</p>
        </div>
        <div class="status-info">
          <span class="status-badge ${this.notificationPermission}">
            Permission: ${this.notificationPermission}
          </span>
          <span
            class="status-badge ${this.isSubscribed
              ? "subscribed"
              : "unsubscribed"}"
          >
            Subscription: ${this.isSubscribed ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    `;
  }

  renderSubscriptionButton() {
    if (!this.isSubscribed) {
      return html`
        <button
          class="btn btn-primary"
          @click=${this.handleSubscribe}
          ?disabled=${this.isLoading}
        >
          ${this.isLoading ? "Subscribing..." : "Subscribe"}
        </button>
      `;
    }

    return html`
      <button
        class="btn btn-secondary"
        @click=${this.handleUnsubscribe}
        ?disabled=${this.isLoading}
      >
        ${this.isLoading ? "Unsubscribing..." : "Unsubscribe"}
      </button>
    `;
  }

  renderTestNotification() {
    return html`
      <div class="setting-item">
        <div class="setting-info">
          <h3>Test Notification</h3>
          <p>Send a test notification to verify everything is working.</p>
        </div>
        <button
          class="btn btn-outline"
          @click=${this.handleTestNotification}
          ?disabled=${this.isLoading}
        >
          Send Test
        </button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="settings-container">
        <h1>Settings</h1>

        ${this.message
          ? html`<div class="message ${this.messageType}">${this.message}</div>`
          : ""}

        <div class="settings-section">
          <h2>Push Notifications</h2>
          ${this.renderPushSettings()}
        </div>

        <div class="settings-section">
          <h2>Install app</h2>
          ${this.renderInstallAppSection()}
        </div>

        <div class="settings-section">
          <h2>About</h2>
          <div class="setting-item">
            <div class="setting-info">
              <h3>ColorZap</h3>
              <p>Version 1.0.1</p>
              <p class="hint">Made by Tyler xoxoxo</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    globalStyles,
    css`
      .settings-container {
        padding: 24px;
        max-width: 800px;
        margin: 0 auto;
      }

      h1 {
        font-size: 28px;
        margin-bottom: 24px;
        color: #333;
      }

      h2 {
        font-size: 20px;
        margin-bottom: 16px;
        color: #555;
        border-bottom: 2px solid #e0e0e0;
        padding-bottom: 8px;
      }

      h3 {
        font-size: 16px;
        margin-bottom: 4px;
        color: #333;
      }

      .settings-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .setting-item:last-child {
        border-bottom: none;
      }

      .install-pwa-block {
        align-items: flex-start;
      }

      .install-ios-hint .setting-info {
        width: 100%;
      }

      .ios-steps {
        line-height: 1.5;
      }

      .setting-info {
        flex: 1;
      }

      .setting-info p {
        color: #666;
        font-size: 14px;
        margin: 0;
      }

      .setting-controls {
        display: flex;
        gap: 8px;
      }

      .message {
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 14px;
      }

      .message.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .message.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .error-text {
        color: #dc3545;
        font-weight: 500;
      }

      .hint {
        color: #6c757d;
        font-size: 13px;
        margin-top: 4px !important;
      }

      .status-info {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .status-badge {
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        background: #f0f0f0;
        color: #666;
      }

      .status-badge.granted,
      .status-badge.subscribed {
        background: #d4edda;
        color: #155724;
      }

      .status-badge.denied,
      .status-badge.unsubscribed {
        background: #f8d7da;
        color: #721c24;
      }

      .btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-primary {
        background: #4caf50;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #45a049;
      }

      .btn-secondary {
        background: #dc3545;
        color: white;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #c82333;
      }

      .btn-outline {
        background: transparent;
        border: 2px solid #4caf50;
        color: #4caf50;
      }

      .btn-outline:hover:not(:disabled) {
        background: #4caf50;
        color: white;
      }

      @media (max-width: 600px) {
        .setting-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .setting-controls {
          width: 100%;
        }

        .btn {
          flex: 1;
        }
      }
    `,
  ];
}

customElements.define("settings-container", SettingsContainer);
export default SettingsContainer;
