import { LitElement, html, css, unsafeCSS } from "lit";
import routerMixin, { VIEW_ROUTE_ENTER_CLASS } from "./router/router-mixin.js";
import globalStyles from "./styles/global-styles.js";
import { getRouteByPath } from "./router/routes.js";
import "../src/shared/components/nav-bar.js";

class AppEnterElement extends routerMixin(LitElement) {
  static properties = {
    showHeader: { type: Boolean },
    showNavBar: { type: Boolean },
    currentRoute: { type: Object },
  };

  constructor() {
    super();
    this.showHeader = true;
    this.showNavBar = true;
    this.currentRoute = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateCurrentRoute();
    window.addEventListener("route-change", () => this.urlChange(), false);
  }

  updateCurrentRoute() {
    this.currentRoute = getRouteByPath(window.location.pathname);

    // Update UI visibility based on route properties
    if (this.currentRoute) {
      this.showNavBar = this.currentRoute.showNav !== false; // default to true if not specified
    }
  }

  async urlChange() {
    await super.urlChange(); // Call the mixin's urlChange first to load the view
    this.updateCurrentRoute(); // Then update our route tracking
  }

  render() {
    return html`
      <slot></slot>
      ${this.currentRoute.showNav ? html` <nav-bar></nav-bar> ` : null}
    `;
  }

  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100%;
      }

      header {
        background-color: #333;
        padding-left: 16px;
      }

      header > p {
        color: white;
      }

      slot {
        flex: 1;
        overflow: auto;
        perspective: 1200px;
      }

      @keyframes view-route-enter {
        0% {
          opacity: 0;
          transform: translateY(22px) rotateX(8deg) scale(0.94);
        }
        55% {
          opacity: 1;
          transform: translateY(-6px) rotateX(-2deg) scale(1.02);
        }
        100% {
          opacity: 1;
          transform: translateY(0) rotateX(0) scale(1);
        }
      }

      slot > ${unsafeCSS(`.${VIEW_ROUTE_ENTER_CLASS}`)} {
        animation: view-route-enter 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
        transform-origin: 50% 0%;
      }

      @media (prefers-reduced-motion: reduce) {
        slot > ${unsafeCSS(`.${VIEW_ROUTE_ENTER_CLASS}`)} {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }
    `,
  ];
}

customElements.define("app-enter", AppEnterElement);
export default AppEnterElement;
