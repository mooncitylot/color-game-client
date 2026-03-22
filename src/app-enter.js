import { LitElement, html, css } from "lit";
import routerMixin from "./router/router-mixin.js";
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
      ${this.showHeader ? html` <header><p>colorzap</p></header> ` : null}
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
      }
    `,
  ];
}

customElements.define("app-enter", AppEnterElement);
export default AppEnterElement;
