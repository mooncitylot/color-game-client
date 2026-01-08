import { LitElement, html, css } from 'lit'
import globalStyles from '../../styles/global-styles.js'
import { go } from '../../router/router-mixin.js'
import { routes } from '../../router/routes.js'
import '../../shared/components/color-scanner.js'

class ScannerContainer extends LitElement {
  render() {
    return html`
      <div class="scanner-page">
        <header>
          <button class="back-button" @click=${this.handleBack}>
            ← Back to Dashboard
          </button>
          <h1>Color Scanner</h1>
        </header>

        <div class="content">
          <color-scanner></color-scanner>
        </div>
      </div>
    `
  }

  handleBack() {
    go(routes.DASHBOARD.path)
  }

  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        width: 100%;
        min-height: 100vh;
        background-color: var(--app-white);
      }

      .scanner-page {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      header {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px 40px;
        background-color: var(--app-primary-color);
        color: white;
        box-shadow: var(--box-shadow);
      }

      header h1 {
        color: white;
        margin: 0;
        font-size: 24px;
      }

      .back-button {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.3s ease;
      }

      .back-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .content {
        flex: 1;
        padding: 40px 20px;
        overflow-y: auto;
      }

      @media (max-width: 640px) {
        header {
          padding: 16px 20px;
        }

        header h1 {
          font-size: 20px;
        }

        .content {
          padding: 20px 12px;
        }
      }
    `,
  ]
}

customElements.define('scanner-container', ScannerContainer)
export default ScannerContainer
