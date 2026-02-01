import { LitElement, html, css } from 'lit'
import { getCurrentUser } from '../../services/users.js'
import { generateDailyColor, createShopItem, resetUserGame } from '../../services/admin.js'
import { searchFriends } from '../../services/friends.js'
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
    isCreatingItem: { type: Boolean },
    showMetadataHelp: { type: Boolean },
    isResettingGame: { type: Boolean },
    userSearchQuery: { type: String },
    searchResults: { type: Array },
    isSearching: { type: Boolean },
    selectedUser: { type: Object },
  }

  constructor() {
    super()
    this.user = null
    this.isGenerating = false
    this.isCreatingItem = false
    this.isResettingGame = false
    this.message = ''
    this.messageType = '' // 'success' or 'error'
    this.showMetadataHelp = false
    this.userSearchQuery = ''
    this.searchResults = []
    this.isSearching = false
    this.selectedUser = null
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

  async handleCreateShopItem(e) {
    e.preventDefault()
    if (this.isCreatingItem) return

    const form = e.target
    const formData = new FormData(form)

    // Parse metadata JSON
    let metadata = {}
    try {
      const metadataString = formData.get('metadata')
      if (metadataString && metadataString.trim()) {
        metadata = JSON.parse(metadataString)
      }
    } catch (error) {
      this.message = 'Invalid JSON in metadata field'
      this.messageType = 'error'
      return
    }

    // Build item data
    const itemData = {
      itemType: formData.get('itemType'),
      name: formData.get('name'),
      description: formData.get('description'),
      creditCost: parseInt(formData.get('creditCost')),
      rarity: formData.get('rarity'),
      metadata: metadata,
      isLimitedEdition: formData.get('isLimitedEdition') === 'on',
      stockQuantity: formData.get('stockQuantity') 
        ? parseInt(formData.get('stockQuantity')) 
        : null,
    }

    this.isCreatingItem = true
    this.message = ''

    try {
      const result = await createShopItem(itemData)
      this.message = `Item "${itemData.name}" created successfully!`
      this.messageType = 'success'
      console.log('Created item:', result)
      
      // Reset form
      form.reset()
    } catch (error) {
      console.error('Failed to create item:', error)
      this.message = error.message || 'Failed to create shop item'
      this.messageType = 'error'
    } finally {
      this.isCreatingItem = false
    }
  }

  toggleMetadataHelp() {
    this.showMetadataHelp = !this.showMetadataHelp
  }

  async handleUserSearch(e) {
    const query = e.target.value.trim()
    this.userSearchQuery = query

    if (query.length < 2) {
      this.searchResults = []
      return
    }

    this.isSearching = true

    try {
      console.log('Searching for:', query)
      const result = await searchFriends(query)
      console.log('Search result:', result)
      
      // Handle both null and empty array cases
      if (result.results === null || result.results === undefined) {
        this.searchResults = []
      } else {
        this.searchResults = [...result.results]
      }
      
      console.log('Final search results:', this.searchResults)
    } catch (error) {
      console.error('Failed to search users:', error)
      console.error('Error details:', error.message, error.stack)
      this.searchResults = []
    } finally {
      this.isSearching = false
    }
  }

  handleSelectUser(user) {
    this.selectedUser = user
    this.searchResults = []
    this.userSearchQuery = ''
  }

  handleClearSelectedUser() {
    this.selectedUser = null
  }

  async handleResetUserGame(e) {
    e.preventDefault()
    if (this.isResettingGame || !this.selectedUser) return

    this.isResettingGame = true
    this.message = ''

    try {
      await resetUserGame(this.selectedUser.userId)
      this.message = `Game reset successfully for ${this.selectedUser.username}`
      this.messageType = 'success'
      
      // Clear selection
      this.selectedUser = null
    } catch (error) {
      console.error('Failed to reset user game:', error)
      this.message = error.message || 'Failed to reset user game'
      this.messageType = 'error'
    } finally {
      this.isResettingGame = false
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

                <div class="admin-section">
                  <h3>Reset User Game</h3>
                  <p>Reset a user's game for today. This will remove their tries for the day and reset their remaining tries to 5.</p>
                  
                  <form class="reset-game-form" @submit=${this.handleResetUserGame}>
                    ${!this.selectedUser ? html`
                      <div class="form-group">
                        <label for="userSearch">Search User by Username *</label>
                        <input 
                          type="text" 
                          id="userSearch" 
                          .value=${this.userSearchQuery}
                          @input=${this.handleUserSearch}
                          placeholder="Type to search..."
                          autocomplete="off"
                        />
                        
                        ${this.isSearching ? html`
                          <div class="search-status">Searching...</div>
                        ` : ''}

                        ${this.searchResults.length > 0 ? html`
                          <div class="search-results">
                            ${this.searchResults.map(user => html`
                              <div class="search-result-item" @click=${() => this.handleSelectUser(user)}>
                                <div class="user-info">
                                  <strong>${user.username}</strong>
                                  <span class="user-stats">Level ${user.level} • ${user.points} pts</span>
                                </div>
                              </div>
                            `)}
                          </div>
                        ` : ''}

                        ${!this.isSearching && this.userSearchQuery.length >= 2 && this.searchResults.length === 0 ? html`
                          <div class="no-results">No users found</div>
                        ` : ''}
                      </div>
                    ` : html`
                      <div class="selected-user">
                        <div class="selected-user-info">
                          <strong>${this.selectedUser.username}</strong>
                          <span>Level ${this.selectedUser.level} • ${this.selectedUser.points} pts</span>
                        </div>
                        <button 
                          type="button" 
                          class="clear-button"
                          @click=${this.handleClearSelectedUser}
                        >
                          Change User
                        </button>
                      </div>
                    `}

                    <button 
                      type="submit" 
                      class="reset-button"
                      ?disabled=${this.isResettingGame || !this.selectedUser}
                    >
                      ${this.isResettingGame ? 'Resetting...' : 'Reset User Game'}
                    </button>
                  </form>
                </div>

                <div class="admin-section">
                  <h3>Create Shop Item</h3>
                  <p>Add a new item to the shop catalog. Users can purchase these with their credits.</p>
                  
                  <form class="shop-form" @submit=${this.handleCreateShopItem}>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="name">Item Name *</label>
                        <input 
                          type="text" 
                          id="name" 
                          name="name" 
                          required
                          placeholder="e.g., Double Points Powerup"
                        />
                      </div>

                      <div class="form-group">
                        <label for="itemType">Item Type *</label>
                        <select id="itemType" name="itemType" required>
                          <option value="powerup">Powerup</option>
                          <option value="badge">Badge</option>
                          <option value="avatar_hat">Avatar Hat</option>
                          <option value="avatar_skin">Avatar Skin</option>
                        </select>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="description">Description *</label>
                      <textarea 
                        id="description" 
                        name="description" 
                        rows="3" 
                        required
                        placeholder="Describe what this item does..."
                      ></textarea>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="creditCost">Credit Cost *</label>
                        <input 
                          type="number" 
                          id="creditCost" 
                          name="creditCost" 
                          min="0" 
                          required
                          placeholder="100"
                        />
                      </div>

                      <div class="form-group">
                        <label for="rarity">Rarity *</label>
                        <select id="rarity" name="rarity" required>
                          <option value="common">Common</option>
                          <option value="rare">Rare</option>
                          <option value="epic">Epic</option>
                          <option value="legendary">Legendary</option>
                        </select>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group checkbox-group">
                        <label>
                          <input 
                            type="checkbox" 
                            id="isLimitedEdition" 
                            name="isLimitedEdition"
                          />
                          <span>Limited Edition</span>
                        </label>
                      </div>

                      <div class="form-group">
                        <label for="stockQuantity">Stock Quantity</label>
                        <input 
                          type="number" 
                          id="stockQuantity" 
                          name="stockQuantity" 
                          min="1"
                          placeholder="Leave empty for unlimited"
                        />
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="metadata">
                        Metadata (JSON)
                        <button 
                          type="button" 
                          class="help-button"
                          @click=${this.toggleMetadataHelp}
                        >
                          ${this.showMetadataHelp ? 'Hide' : 'Show'} Examples
                        </button>
                      </label>
                      <textarea 
                        id="metadata" 
                        name="metadata" 
                        rows="6"
                        placeholder='{"icon_url": "/assets/items/icon.png"}'
                      ></textarea>
                    </div>

                    ${this.showMetadataHelp ? html`
                      <div class="metadata-help">
                        <h4>Metadata Examples:</h4>
                        
                        <div class="example">
                          <strong>Powerup:</strong>
                          <pre>{"icon_url": "/assets/powerups/double.png", "duration_seconds": 60, "multiplier": 2.0}</pre>
                        </div>

                        <div class="example">
                          <strong>Badge:</strong>
                          <pre>{"icon_url": "/assets/badges/champion.png", "display_order": 1}</pre>
                        </div>

                        <div class="example">
                          <strong>Avatar Hat:</strong>
                          <pre>{"icon_url": "/assets/hats/wizard.png", "layer": "head", "color_customizable": true}</pre>
                        </div>

                        <div class="example">
                          <strong>Avatar Skin:</strong>
                          <pre>{"icon_url": "/assets/skins/rainbow.png", "animated": true}</pre>
                        </div>
                      </div>
                    ` : ''}

                    <button 
                      type="submit" 
                      class="submit-button"
                      ?disabled=${this.isCreatingItem}
                    >
                      ${this.isCreatingItem ? 'Creating...' : 'Create Item'}
                    </button>
                  </form>
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

      .reset-button {
        background-color: #f59e0b;
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 100%;
        margin-top: 8px;
      }

      .reset-button:hover:not(:disabled) {
        background-color: #d97706;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .reset-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .reset-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .reset-game-form {
        max-width: 400px;
      }

      .search-results {
        position: relative;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        margin-top: 8px;
        background: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .search-result-item {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .search-result-item:last-child {
        border-bottom: none;
      }

      .search-result-item:hover {
        background-color: #f3f4f6;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .user-stats {
        font-size: 12px;
        color: var(--app-grey);
      }

      .search-status,
      .no-results {
        padding: 12px;
        text-align: center;
        color: var(--app-grey);
        font-size: 14px;
        margin-top: 8px;
        background: #f9fafb;
        border-radius: 6px;
      }

      .selected-user {
        background: #f0f9ff;
        border: 2px solid #3b82f6;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .selected-user-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .selected-user-info strong {
        color: var(--app-dark);
        font-size: 16px;
      }

      .selected-user-info span {
        color: var(--app-grey);
        font-size: 14px;
      }

      .clear-button {
        background: transparent;
        border: 1px solid #3b82f6;
        color: #3b82f6;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .clear-button:hover {
        background: #3b82f6;
        color: white;
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

      /* Shop Form Styles */
      .shop-form {
        max-width: 800px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--app-dark);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        padding: 12px;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        transition: border-color 0.2s;
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: var(--app-primary-color);
      }

      .form-group textarea {
        resize: vertical;
        font-family: monospace;
      }

      .checkbox-group {
        justify-content: center;
      }

      .checkbox-group label {
        flex-direction: row;
        align-items: center;
        cursor: pointer;
        gap: 8px;
      }

      .checkbox-group input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .checkbox-group span {
        font-weight: 500;
      }

      .help-button {
        background: transparent;
        border: 1px solid var(--app-primary-color);
        color: var(--app-primary-color);
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .help-button:hover {
        background: var(--app-primary-color);
        color: white;
      }

      .metadata-help {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .metadata-help h4 {
        margin: 0 0 12px 0;
        color: var(--app-dark);
      }

      .metadata-help .example {
        margin-bottom: 12px;
      }

      .metadata-help .example:last-child {
        margin-bottom: 0;
      }

      .metadata-help strong {
        color: var(--app-primary-color);
        display: block;
        margin-bottom: 4px;
      }

      .metadata-help pre {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 8px;
        margin: 0;
        overflow-x: auto;
        font-size: 12px;
        color: #374151;
      }

      .submit-button {
        width: 100%;
        background-color: var(--app-primary-color);
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-top: 8px;
      }

      .submit-button:hover:not(:disabled) {
        background-color: #2563eb;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .submit-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .submit-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }

        .content {
          padding: 20px;
        }

        header {
          padding: 16px 20px;
        }
      }
    `,
  ]
}

customElements.define('admin-container', AdminContainer)
export default AdminContainer
