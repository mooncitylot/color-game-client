import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";
import "./login-form.js";
import routes from "../../router/routes.js";
import { go } from "../../router/router-mixin.js";
import { clearSession, isAuthenticated } from "../../session/session.js";
import { ensureSessionFromCookies } from "../../services/users.js";

class LoginContainerElement extends LitElement {
  async routeEnter() {
    await ensureSessionFromCookies();
    if (isAuthenticated()) {
      return go(routes.DASHBOARD.path);
    }
    clearSession();
  }

  render() {
    return html`<login-form></login-form>`;
  }

  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: var(--app-white);
      }
    `,
  ];
}

customElements.define("login-container", LoginContainerElement);
export default LoginContainerElement;
