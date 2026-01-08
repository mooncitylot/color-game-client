import { LitElement, html, css } from 'lit'
import globalStyles from '../../styles/global-styles.js'
import './login-form.js'
import routes from '../../router/routes.js'
import { go } from '../../router/router-mixin.js'
import { clearSession, getSessionUser, sessionIsExpired } from '../../session/session.js'

class LoginContainerElement extends LitElement {
  routeEnter() {
    if (!sessionIsExpired()) {
      const user = getSessionUser()
      if (user) return go(routes.DASHBOARD.path)
    }
    clearSession()
  }

  render() {
    return html`<login-form></login-form>`
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
  ]
}

customElements.define('login-container', LoginContainerElement)
export default LoginContainerElement
