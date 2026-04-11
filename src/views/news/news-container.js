import { LitElement, html, css } from "lit";
import globalStyles from "../../styles/global-styles.js";

class NewsContainer extends LitElement {
  render() {
    const newsItems = [
      {
        title: "New Feature: App notifications",
        description: "Go to settings and enable notifications!",
        path: "/settings",
      },
      {
        title: "New Feature: Download App",
        description:
          "From your mobile browser, tap the share icon and then 'Add to Home Screen' to install the app on your device.",
        path: "settings",
      },
    ];
    return html`
      <div class="news-container">
        <h1>News</h1>
        ${newsItems.map(
          (item) => html`
            <div class="news-item">
              <h2>${item.title}</h2>
              <p>${item.description}</p>
              ${item.path ? html`<a href="${item.path}">Learn more</a>` : null}
            </div>
          `,
        )}
      </div>
    `;
  }

  static styles = css`
    ${globalStyles}
    .news-container {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .news-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background-color: var(--app-light-grey);
      border: 1px solid var(--app-grey);
      border-radius: 8px;
      padding: 16px;
    }

    a {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 8px 12px;
      border: 1px solid var(--app-primary-color);
      background-color: var(--app-primary-color);
      color: white;
    }
  `;
}

export default NewsContainer;
customElements.define("news-container", NewsContainer);
