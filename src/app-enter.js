import { LitElement, html, css } from 'lit'
import routerMixin from './router/router-mixin.js'
import globalStyles from './styles/global-styles.js'

class AppEnterElement extends routerMixin(LitElement) {
  render() {
    return html`
      ${this.showHeader
        ? html`
            <header>
              <h1>Color Game</h1>
            </header>
          `
        : null}
      <slot></slot>
    `
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
        display: flex;
        align-items: center;
        padding: 0 20px;
        height: var(--app-header-height);
        background-color: var(--app-primary-color);
        color: white;
        box-shadow: var(--box-shadow);
      }

      header h1 {
        color: white;
        font-size: 20px;
        margin: 0;
      }

      slot {
        flex: 1;
        overflow: auto;
      }
    `,
  ]
}

customElements.define('app-enter', AppEnterElement)
export default AppEnterElement
