import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";
import { go } from "../../router/router-mixin.js";
import { routes } from "../../router/routes.js";
import {
  dashboardIcon,
  leaderboardIcon,
  friendsIcon,
  scannerIcon,
  storeIcon,
  profileIcon,
  settingsIcon,
  menuIcon,
} from "../assets/icons.js";

class NavBar extends LitElement {
  static properties = {
    currentPath: { type: String },
    showNav: { type: Boolean },
    isClosing: { type: Boolean },
  };

  constructor() {
    super();
    this.currentPath = window.location.pathname;
    this.showNav = false;
    this.isClosing = false;
    this._navMenuItems = [
      {
        path: routes.DASHBOARD.path,
        label: "Dashboard",
        icon: dashboardIcon,
      },
      {
        path: routes.SCANNER.path,
        label: "Zapper",
        icon: scannerIcon,
      },
      {
        path: routes.LEADERBOARD.path,
        label: "Leaderboard",
        icon: leaderboardIcon,
      },
      {
        path: routes.FRIENDS.path,
        label: "Friends",
        icon: friendsIcon,
      },
      {
        path: routes.STORE.path,
        label: "Store",
        icon: storeIcon,
      },
      {
        path: routes.PROFILE.path,
        label: "Profile",
        icon: profileIcon,
      },
      {
        path: routes.SETTINGS.path,
        label: "Settings",
        icon: settingsIcon,
      },
    ];
    this.handleNavDialogKeyDown = this.handleNavDialogKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("route-change", () => this.handleRouteChange());
    window.addEventListener("popstate", () => this.handleRouteChange());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("route-change", () => this.handleRouteChange());
    window.removeEventListener("popstate", () => this.handleRouteChange());
    window.removeEventListener("keydown", this.handleNavDialogKeyDown);
    document.body.style.overflow = "";
  }

  handleRouteChange() {
    this.currentPath = window.location.pathname;
    this.showNav = false;
    this.isClosing = false;
  }

  /**
   * @param {KeyboardEvent} e
   */
  handleNavDialogKeyDown(e) {
    if (e.key !== "Escape") {
      return;
    }
    this.handleCloseNavDialog();
  }

  handleCloseNavDialog() {
    if (!this.showNav) {
      return;
    }
    this.isClosing = true;
    this.showNav = false;
  }

  handleNavDialogAnimationEnd() {
    if (!this.isClosing) {
      return;
    }
    this.isClosing = false;
  }

  /** @param {import("lit").PropertyValues<this>} changedProperties */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (
      !changedProperties.has("showNav") &&
      !changedProperties.has("isClosing")
    ) {
      return;
    }
    const isNavVisible = this.showNav || this.isClosing;
    if (isNavVisible) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", this.handleNavDialogKeyDown);
      return;
    }
    document.body.style.overflow = "";
    window.removeEventListener("keydown", this.handleNavDialogKeyDown);
  }

  render() {
    const isNavVisible = this.showNav || this.isClosing;
    return html` ${isNavVisible ? this.renderNav() : this.renderSmallNav()} `;
  }

  renderSmallNav() {
    return html`
      <div class="menu-button-background" aria-hidden="true"></div>
      <button class="menu-button" @click="${() => (this.showNav = true)}">
        Menu +
      </button>
    `;
  }

  renderNav() {
    const navDialogClass = this.isClosing
      ? "nav-dialog nav-dialog-closing"
      : "nav-dialog nav-dialog-opening";

    return html`
      <div
        class="${navDialogClass}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-menu-title"
        @animationend="${this.handleNavDialogAnimationEnd}"
      >
        <div class="nav-dialog-header">
          <h2 id="nav-menu-title" class="nav-dialog-title">Menu</h2>
        </div>
        <nav class="nav-dialog-menu" aria-label="Main navigation">
          ${this._navMenuItems.map(
            (item) => html`
              <a
                class="nav-dialog-link ${this.currentPath === item.path
                  ? "active"
                  : ""}"
                href="${item.path}"
                @click="${(e) => {
                  e.preventDefault();
                  go(item.path);
                }}"
              >
                <span class="nav-dialog-link-icon">${item.icon}</span>
                <span class="nav-dialog-link-label">${item.label}</span>
              </a>
            `,
          )}
        </nav>
        <div class="nav-dialog-footer">
          <button
            type="button"
            class="nav-dialog-close nav-dialog-close-bottom"
            aria-label="Close menu"
            @click="${this.handleCloseNavDialog}"
          >
            Close
          </button>
        </div>
      </div>
    `;
  }

  handleLogoClick() {
    go(routes.DASHBOARD.path);
  }

  static styles = [
    globalStyles,
    css`
      .menu-button {
        width: calc(100% - 72px);
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        align-content: center;
        gap: 4px;
        flex: 1;
        padding: 8px;
        overflow: auto;
        background-color: white;
        color: var(--app-grey);
        border-radius: 8px;
        font-size: 18px;
        border: 2px solid #e5e7eb;
        z-index: 1001;
      }

      .nav-dialog {
        position: fixed;
        inset: 0;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        padding: 16px 20px 16px;
        background-color: var(--app-primary-color);
        color: white;
        box-shadow: var(--box-shadow);
      }

      .nav-dialog-header {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .nav-dialog-title {
        margin: 0;
        font-size: 22px;
        font-weight: bold;
      }

      .nav-dialog-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 52px;
        padding: 12px 16px;
        border-radius: 12px;
        background: none;
        color: var(--app-light-grey);
        font-size: 18px;
        cursor: pointer;
        border: 2px solid var(--app-light-grey);
        transition:
          background-color 0.2s ease,
          border-color 0.2s ease;
      }

      .nav-dialog-menu {
        display: flex;
        flex-direction: column;
        padding-top: 16px;
        padding-bottom: 12px;
        gap: 4px;
        flex: 1;
        overflow: auto;
      }

      .nav-dialog-link {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 12px;
        border-radius: 8px;
        color: white;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .nav-dialog-link:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
      }

      .nav-dialog-link:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .nav-dialog-link.active {
        background-color: rgba(255, 255, 255, 0.15);
      }

      .nav-dialog-link-icon {
        display: flex;
        align-items: center;
        fill: currentColor;
      }

      .nav-dialog-link-label {
        font-size: 18px;
        font-weight: 500;
      }

      .nav-bar {
        background-color: var(--app-primary-color);
        color: white;
        padding: 10px 20px;
        box-shadow: var(--box-shadow);
      }

      .nav-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo {
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
      }

      @keyframes menu-open {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes menu-close {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(100%);
          opacity: 0;
        }
      }

      .nav-dialog-opening {
        animation: menu-open 0.25s ease-out forwards;
      }

      .nav-dialog-closing {
        animation: menu-close 0.2s ease-in forwards;
      }
    `,
  ];
}

customElements.define("nav-bar", NavBar);
export default NavBar;
