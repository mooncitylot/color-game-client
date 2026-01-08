import { LitElement, html, css } from 'lit'
import { getCurrentUser } from '../../services/users.js'
import globalStyles from '../../styles/global-styles.js'
import { getSessionUser, clearSession } from '../../session/session.js'
import { go } from '../../router/router-mixin.js'
import { routes } from '../../router/routes.js'

class DashboardContainer extends LitElement {
  static properties = {
    user: { type: Object },
  }

  constructor() {
    super()
    this.user = null
  }

  async routeEnter() {
    try {
      this.user = await getCurrentUser()
    } catch (error) {
      console.error(error)
    }
  }

  handleLogout() {
    clearSession()
    go(routes.LOGIN.path)
  }

  render() {
    return html`
      <div class="dashboard">
        <header>
          <h1>Color Game Dashboard</h1>
          <button @click=${this.handleLogout}>Logout</button>
        </header>

        <div class="content">
          ${this.user
            ? html`
                <div class="welcome-card">
                  <h2>Welcome, ${this.user.username}!</h2>
                  <p>Ready to play some color games?</p>
                </div>

                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-value">${this.user.points || 0}</div>
                    <div class="stat-label">Points</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value">${this.user.level || 1}</div>
                    <div class="stat-label">Level</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-value">${this.user.credits || 0}</div>
                    <div class="stat-label">Credits</div>
                  </div>
                </div>

                <div class="info-card">
                  <h3>Your Profile</h3>
                  <p><strong>Username:</strong> ${this.user.username}</p>
                  <p><strong>Email:</strong> ${this.user.email}</p>
                  <p><strong>Account Type:</strong> ${this.user.kind}</p>
                </div>

                <div class="game-section">
                  <h3>Game Area</h3>
                  <p>Game content will go here...</p>
                </div>
              `
            : html`<loading-spinner></loading-spinner>`}
        </div>
      </div>
    `
  }

  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100vh;
        background-color: var(--app-white);
      }

      .dashboard {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 40px;
        background-color: var(--app-primary-color);
        color: white;
        box-shadow: var(--box-shadow);
      }

      header h1 {
        color: white;
        margin: 0;
      }

      .content {
        flex: 1;
        padding: 40px;
        overflow-y: auto;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 24px;
      }

      .stat-card {
        background: white;
        padding: 24px;
        border-radius: 8px;
        box-shadow: var(--box-shadow);
        text-align: center;
      }

      .stat-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .stat-value {
        font-size: 36px;
        font-weight: bold;
        color: var(--app-primary-color);
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: var(--app-grey);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .welcome-card,
      .info-card,
      .game-section {
        background: white;
        padding: 24px;
        margin-bottom: 24px;
        border-radius: 8px;
        box-shadow: var(--box-shadow);
      }

      .welcome-card h2 {
        margin-bottom: 8px;
      }

      .welcome-card p {
        color: var(--app-grey);
        font-size: 18px;
      }

      .info-card h3,
      .game-section h3 {
        margin-bottom: 16px;
      }

      .info-card p {
        margin: 8px 0;
      }
    `,
  ]
}

customElements.define('dashboard-container', DashboardContainer)
export default DashboardContainer
