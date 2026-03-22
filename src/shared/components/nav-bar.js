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
  };

  constructor() {
    super();
    this.currentPath = window.location.pathname;
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
  }

  handleRouteChange() {
    this.currentPath = window.location.pathname;
  }

  render() {
    return html`
      <nav class="nav-bar">
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
        fill: white;
      }
    `,
  ];
}

customElements.define("nav-bar", NavBar);
export default NavBar;
