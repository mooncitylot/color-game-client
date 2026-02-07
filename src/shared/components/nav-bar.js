import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";
import { go } from "../../router/router-mixin.js";
import { routes } from "../../router/routes.js";
import {
  dashboardIcon,
  friendsIcon,
  scannerIcon,
  storeIcon,
} from "../assets/icons.js";

class NavBar extends LitElement {
  static properties = {
    currentPath: { type: String },
    isCollapsed: { type: Boolean },
  };

  constructor() {
    super();
    this.currentPath = window.location.pathname;
    this.isCollapsed = false;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("route-change", () => this.handleRouteChange());
    window.addEventListener("popstate", () => this.handleRouteChange());

    // Auto-collapse after 2 seconds
    setTimeout(() => {
      this.isCollapsed = true;
    }, 1000);
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("route-change", () => this.handleRouteChange());
    window.removeEventListener("popstate", () => this.handleRouteChange());
  }

  handleRouteChange() {
    this.currentPath = window.location.pathname;
    setTimeout(() => {
      this.isCollapsed = true;
    }, 500);
  }

  render() {
    return html`
      <nav class="nav-bar ${this.isCollapsed ? "collapsed" : "expanded"}">
        <button class="toggle-button" @click="${this.toggleCollapse}">
          <span class="toggle-icon">${this.isCollapsed ? "▲" : "▼"}</span>
        </button>
        <div class="nav-content">
          <div class="nav-links">
            <a
              class="${this.currentPath === routes.DASHBOARD.path
                ? "active"
                : ""}"
              @click="${() => go(routes.DASHBOARD.path)}"
              >${dashboardIcon}</a
            >
            <a
              class="${this.currentPath === routes.FRIENDS.path
                ? "active"
                : ""}"
              @click="${() => go(routes.FRIENDS.path)}"
              >${friendsIcon}</a
            >
            <a
              class="${this.currentPath === routes.SCANNER.path
                ? "active"
                : ""}"
              @click="${() => go(routes.SCANNER.path)}"
              >${scannerIcon}</a
            >
            <a
              class="${this.currentPath === routes.STORE.path ? "active" : ""}"
              @click="${() => go(routes.STORE.path)}"
              >${storeIcon}</a
            >
          </div>
        </div>
      </nav>
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

      .nav-bar {
        background-color: var(--app-primary-color);
        color: white;
        padding: 10px 20px;
        box-shadow: var(--box-shadow);
        transition: transform 0.3s ease-in-out;
        transform: translateY(0);
      }

      .nav-bar.collapsed {
        transform: translateY(100%);
      }

      .nav-bar.expanded {
        transform: translateY(0);
      }

      .toggle-button {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        bottom: 80px;
        left: 32px;
        transform: translateX(-50%);
        background-color: var(--app-primary-color);
        width: 40px;
        height: 40px;
        border: none;
        color: white;
        cursor: pointer;
        border-radius: 50px;
        box-shadow: var(--box-shadow);
        transition: all 0.2s ease;
      }

      .toggle-button:hover {
        opacity: 0.8;
      }

      .toggle-icon {
        font-size: 14px;
        display: block;
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

      .nav-links {
        display: flex;
        align-items: center;
        margin: auto;
        fill: grey;
      }

      .nav-links a {
        margin-left: 20px;
        color: white;
        text-decoration: none;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .nav-links a.active {
        fill: #e59861;
      }
    `,
  ];
}

customElements.define("nav-bar", NavBar);
export default NavBar;
