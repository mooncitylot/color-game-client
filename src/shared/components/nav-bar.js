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
  menuIcon,
} from "../assets/icons.js";

class NavBar extends LitElement {
  static properties = {
    currentPath: { type: String },
    showNav: { type: Boolean },
  };

  constructor() {
    super();
    this.currentPath = window.location.pathname;
    this.showNav = false;
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
  }

  /**
   * @param {KeyboardEvent} e
   */
  handleNavDialogKeyDown(e) {
    if (e.key !== "Escape") {
      return;
    }
    this.showNav = false;
  }

  handleCloseNavDialog() {
    this.showNav = false;
  }

  /** @param {import("lit").PropertyValues<this>} changedProperties */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (!changedProperties.has("showNav")) {
      return;
    }
    if (this.showNav) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", this.handleNavDialogKeyDown);
      return;
    }
    document.body.style.overflow = "";
    window.removeEventListener("keydown", this.handleNavDialogKeyDown);
  }

  render() {
    return html` ${this.showNav ? this.renderNav() : this.renderSmallNav()} `;
  }

  renderSmallNav() {
    return html`
      <nav class="nav-bar">
        <div class="nav-content">
          <a @click="${() => (this.showNav = true)}">${menuIcon}</a>
        </div>
      </nav>
    `;
  }

  renderNav() {
    return html`
      <div
        class="nav-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-menu-title"
      >
        <div class="nav-dialog-header">
          <h2 id="nav-menu-title" class="nav-dialog-title">Menu</h2>
          <button
            type="button"
            class="nav-dialog-close"
            aria-label="Close menu"
            @click="${this.handleCloseNavDialog}"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                fill="currentColor"
              />
            </svg>
          </button>
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
      </div>
    `;
  }

  handleLogoClick() {
    go(routes.DASHBOARD.path);
  }

  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
      }

      .nav-dialog {
        position: fixed;
        inset: 0;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        padding: 16px 20px 24px;
        background-color: var(--app-primary-color);
        color: white;
        box-shadow: var(--box-shadow);
      }

      .nav-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
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
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: white;
        cursor: pointer;
      }

      .nav-dialog-close:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
      }

      .nav-dialog-menu {
        display: flex;
        flex-direction: column;
        padding-top: 16px;
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
    `,
  ];
}

customElements.define("nav-bar", NavBar);
export default NavBar;
