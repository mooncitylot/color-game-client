import { LitElement, html, css } from 'lit'
import '../../shared/components/app-error.js'
import globalStyles from '../../styles/global-styles.js'
import { signupUser } from '../../services/users.js'
import { go } from '../../router/router-mixin.js'
import { routes } from '../../router/routes.js'

class SignupForm extends LitElement {
  static properties = {
    success: { type: Boolean },
    error: { type: String },
  }

  constructor() {
    super()
    this.success = false
    this.error = ''
  }

  async handleFormSubmit(e) {
    e.preventDefault()
    this.error = ''

    try {
      const data = Object.fromEntries(new FormData(e.target).entries())
      data.email = data.email.toLowerCase()

      // Basic password validation
      if (data.password !== data.confirmPassword) {
        this.error = 'Passwords do not match.'
        return
      }

      await signupUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      })

      this.success = true
    } catch (error) {
      this.error = 'There was a problem creating your account. Please try again.'
    }
  }

  render() {
    if (this.success) {
      return html`
        <div class="signup-card">
          <h1>Success!</h1>
          <p>Your account has been created successfully.</p>
          <button @click=${() => go(routes.LOGIN.path)}>Go to Login</button>
        </div>
      `
    }

    return html`
      <div class="signup-card">
        <h1>Create Account</h1>
        <p>Join Color Game today!</p>

        <form @submit=${this.handleFormSubmit}>
          <label for="firstName">First Name</label>
          <input type="text" name="firstName" required />

          <label for="lastName">Last Name</label>
          <input type="text" name="lastName" required />

          <label for="email">Email</label>
          <input type="email" name="email" required />

          <label for="password">Password</label>
          <input type="password" name="password" required minlength="8" />

          <label for="confirmPassword">Confirm Password</label>
          <input type="password" name="confirmPassword" required minlength="8" />

          ${this.error ? html`<app-error>${this.error}</app-error>` : null}

          <button type="submit">Sign Up</button>
          <button class="secondary" type="button" @click=${() => go(routes.LOGIN.path)}>
            Back to Login
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

      .signup-card {
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

customElements.define('signup-form', SignupForm)
export default SignupForm
