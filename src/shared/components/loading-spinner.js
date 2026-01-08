import { LitElement, html, css } from 'lit'

class LoadingSpinner extends LitElement {
  render() {
    return html`
      <div class="spinner">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
    `
  }

  static styles = css`
    .spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }

    .spinner > div {
      width: 12px;
      height: 12px;
      background-color: var(--app-primary-color);
      border-radius: 100%;
      display: inline-block;
      animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    }

    .bounce1 {
      animation-delay: -0.32s;
    }

    .bounce2 {
      animation-delay: -0.16s;
    }

    @keyframes sk-bouncedelay {
      0%,
      80%,
      100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }
  `
}

customElements.define('loading-spinner', LoadingSpinner)
export default LoadingSpinner
