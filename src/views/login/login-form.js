import { LitElement, html, css } from 'lit'
import globalStyles from '../../styles/global-styles.js'
import '../../shared/components/app-error.js'
import { routes } from '../../router/routes.js'
import { go } from '../../router/router-mixin.js'
import { getCurrentUser, loginUser } from '../../services/users.js'
import { setSessionData, setSessionUser } from '../../session/session.js'

class LoginForm extends LitElement {
  static properties = {
    email: { type: String },
    error: { type: String },
  }

  constructor() {
    super()
    this.email = ''
    this.error = ''
  }

  async handleFormSubmit(e) {
    e.preventDefault()
    this.error = ''

    try {
      const data = Object.fromEntries(new FormData(e.target).entries())
      data.email = data.email.toLowerCase()

      const loginResponse = await loginUser({
        email: data.email,
        password: data.password,
        deviceFingerprint: navigator.userAgent, // Use user agent as device fingerprint
      })

      console.log('Login response:', loginResponse)

      // Store session data if tokens are returned
      if (loginResponse.token || loginResponse.accessToken) {
        setSessionData({
          token: loginResponse.token || loginResponse.accessToken,
          expiry: loginResponse.expiry || loginResponse.expiresAt,
        })
      }

      const user = await getCurrentUser()
      console.log('Current user:', user)
      setSessionUser(user)

      go(routes.DASHBOARD.path)
    } catch (error) {
      console.error('Login error:', error)
      this.error = 'Invalid email or password. Please try again.'
      this.shadowRoot.querySelector('input[name="password"]').value = ''
    }
  }

  render() {
    return html`
      <div class="login-card">
        <h1>Color Game</h1>
        <p>Welcome back! Please login to continue.</p>

        <form @submit=${this.handleFormSubmit}>
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />

          ${this.error ? html`<app-error>${this.error}</app-error>` : null}

          <button type="submit">Log In</button>
          <button class="secondary" type="button" @click=${() => go(routes.SIGNUP.path)}>
            Sign Up
          </button>
        </form>
      </div>
    `
  }

  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        width: 100%;
        max-width: 400px;
        padding: 20px;
      }

      .login-card {
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: var(--box-shadow);
      }

      h1 {
        text-align: center;
        margin-bottom: 8px;
      }

      p {
        text-align: center;
        color: var(--app-grey);
        margin-bottom: 24px;
      }

      button {
        width: 100%;
        margin-top: 8px;
      }
    `,
  ]
}

customElements.define('login-form', LoginForm)
export default LoginForm
