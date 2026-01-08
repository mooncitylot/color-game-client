import { LitElement, html, css } from 'lit'

class AppError extends LitElement {
  render() {
    return html`<slot></slot>`
  }

  static styles = css`
    :host {
      display: block;
      padding: 12px;
      margin: 12px 0;
      background-color: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      color: #c33;
      font-size: 14px;
    }
  `
}

customElements.define('app-error', AppError)
export default AppError
