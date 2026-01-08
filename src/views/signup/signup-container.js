import { LitElement, html, css } from 'lit'
import globalStyles from '../../styles/global-styles.js'
import './signup-form.js'

class SignupContainer extends LitElement {
  render() {
    return html`<signup-form></signup-form>`
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

customElements.define('signup-container', SignupContainer)
export default SignupContainer
