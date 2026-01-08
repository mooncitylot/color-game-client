import { LitElement, html, css } from 'lit'
import { getCurrentUser } from '../../services/users.js'
import { generateDailyColor } from '../../services/admin.js'
import globalStyles from '../../styles/global-styles.js'
import { clearSession } from '../../session/session.js'
import { go } from '../../router/router-mixin.js'
import { routes } from '../../router/routes.js'

class AdminContainer extends LitElement {
  static properties = {
    user: { type: Object },
    isGenerating: { type: Boolean },
    message: { type: String },
    messageType: { type: String },
  }

  constructor() {
    super()
    this.user = null
    this.isGenerating = false
    this.message = ''
    this.messageType = '' // 'success' or 'error'
  }

  async routeEnter() {
    try {
      this.user = await getCurrentUser()
      
      // Check if user is admin
      if (this.user.kind !== 'Admin') {
        this.message = 'Access denied. Admin privileges required.'
        this.messageType = 'error'
      }
    } catch (error) {
      console.error(error)
      this.message = 'Failed to load user data'
      this.messageType = 'error'
    }
  }

  handleLogout() {
    clearSession()
    go(routes.LOGIN.path)
  }

  handleBackToDashboard() {
    go(routes.DASHBOARD.path)
  }

  async handleGenerateColor() {
    if (this.isGenerating) return
    
    this.isGenerating = true
    this.message = ''
    
    try {
      const result = await generateDailyColor()
      this.message = 'Daily color generated successfully!'
      this.messageType = 'success'
      console.log('Generated color:', result)
    } catch (error) {
      console.error('Failed to generate color:', error)
      this.message = error.message || 'Failed to generate daily color'
      this.messageType = 'error'
    } finally {
      this.isGenerating = false
    }
  }

  render() {
    // Show access denied if not admin
    if (this.user && this.user.kind !== 'Admin') {
      return html`
        <div class="admin">
          <header>
            <h1>Admin Panel</h1>
            <button @click=${this.handleBackToDashboard}>Back to Dashboard</button>
          </header>
          <div class="content">
            <div class="error-card">
              <h2>Access Denied</h2>
              <p>You need admin privileges to access this page.</p>
              <button @click=${this.handleBackToDashboard}>Go to Dashboard</button>
            </div>
          </div>
        </div>
      `
    }

    return html`
      <div class="admin">
        <header>
          <h1>Admin Panel</h1>
          <div class="header-buttons">
            <button @click=${this.handleBackToDashboard}>Dashboard</button>
            <button @click=${this.handleLogout}>Logout</button>
          </div>
        </header>

        <div class="content">
          ${this.user
            ? html`
                <div class="welcome-card">
                  <h2>Welcome, ${this.user.username}</h2>
                  <p>Administrator Controls</p>
                </div>

                ${this.message
                  ? html`
                      <div class="message-card ${this.messageType}">
                        <p>${this.message}</p>
                      </div>
                    `
                  : ''}

                <div class="admin-section">
                  <h3>Daily Color Management</h3>
                  <p>Manually generate the daily color for today. This will override any existing color for the current day.</p>
                  
                  <button 
                    class="generate-button" 
                    @click=${this.handleGenerateColor}
                    ?disabled=${this.isGenerating}
                  >
                    ${this.isGenerating ? 'Generating...' : 'Generate Daily Color'}
                  </button>
                </div>

                <div class="info-card">
                  <h3>Admin Information</h3>
                  <p><strong>Username:</strong> ${this.user.username}</p>
                  <p><strong>Email:</strong> ${this.user.email}</p>
                  <p><strong>Account Type:</strong> ${this.user.kind}</p>
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

      .admin {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 40px;
        background-color: #dc2626;
        color: white;
        box-shadow: var(--box-shadow);
      }

      header h1 {
        color: white;
        margin: 0;
      }

      .header-buttons {
        display: flex;
        gap: 12px;
      }

      .content {
        flex: 1;
        padding: 40px;
        overflow-y: auto;
      }

      .welcome-card,
      .info-card,
      .admin-section,
      .error-card {
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
      .admin-section h3 {
        margin-bottom: 16px;
        color: var(--app-primary-color);
      }

      .info-card p {
        margin: 8px 0;
      }

      .admin-section p {
        color: var(--app-grey);
        margin-bottom: 24px;
        line-height: 1.6;
      }

      .generate-button {
        background-color: #10b981;
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .generate-button:hover:not(:disabled) {
        background-color: #059669;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .generate-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .generate-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .message-card {
        padding: 16px 24px;
        margin-bottom: 24px;
        border-radius: 8px;
        box-shadow: var(--box-shadow);
      }

      .message-card.success {
        background-color: #d1fae5;
        border-left: 4px solid #10b981;
      }

      .message-card.error {
        background-color: #fee2e2;
        border-left: 4px solid #dc2626;
      }

      .message-card p {
        margin: 0;
        font-weight: 500;
      }

      .message-card.success p {
        color: #065f46;
      }

      .message-card.error p {
        color: #991b1b;
      }

      .error-card {
        text-align: center;
        padding: 48px 24px;
      }

      .error-card h2 {
        color: #dc2626;
        margin-bottom: 16px;
      }

      .error-card p {
        color: var(--app-grey);
        margin-bottom: 24px;
      }

      .error-card button {
        background-color: var(--app-primary-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
      }

      .error-card button:hover {
        opacity: 0.9;
      }
    `,
  ]
}

customElements.define('admin-container', AdminContainer)
export default AdminContainer
