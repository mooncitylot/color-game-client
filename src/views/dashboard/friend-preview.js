import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";

class FriendPreview extends LitElement {
  static properties = {
    friendCount: { type: Number },
    requestCount: { type: Number },
  };

  constructor() {
    super();
    this.friendCount = 0;
    this.requestCount = 0;
  }

  render() {
    return html`
      <div class="friend-preview">
        <div>
          <h3>Friends</h3>
          <p>${this.friendCount} total • ${this.requestCount} pending</p>
        </div>
        <button @click=${this.goToFriends}>Open Friends</button>
      </div>
    `;
  }

  goToFriends() {
    this.dispatchEvent(new CustomEvent("open-friends", { bubbles: true, composed: true }));
  }

  static styles = [
    globalStyles,
    css`
      .friend-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        border: 1px solid rgba(102, 126, 234, 0.2);
      }

      p {
        margin: 4px 0 0;
        color: var(--app-grey);
      }

      button {
        min-width: 140px;
      }
    `,
  ];
}

customElements.define("friend-preview", FriendPreview);
export default FriendPreview;
