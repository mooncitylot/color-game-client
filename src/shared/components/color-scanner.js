import { LitElement, html, css } from "lit";
import {
  getDailyColor,
  submitScore,
  getScoreHistory,
} from "../../services/colors.js";
import globalStyles from "../../styles/global-styles.js";
import "../../shared/components/loading-spinner.js";

class ColorScanner extends LitElement {
  static properties = {
    targetColor: { type: Object },
    isLoading: { type: Boolean },
    video: { type: Object },
    attempts: { type: Array },
    currentAttempt: { type: Number },
    maxAttempts: { type: Number },
    isSubmitting: { type: Boolean },
    message: { type: String },
    messageType: { type: String },
    gameComplete: { type: Boolean },
    previewColor: { type: Object },
    showingPreview: { type: Boolean },
    cameraReady: { type: Boolean },
  };

  constructor() {
    super();
    this.targetColor = null;
    this.isLoading = true;
    this.video = null;
    this.attempts = [];
    this.currentAttempt = 0;
    this.maxAttempts = 5;
    this.isSubmitting = false;
    this.message = "";
    this.messageType = "";
    this.gameComplete = false;
    this.previewColor = null;
    this.showingPreview = false;
    this.animationFrame = 0;
    this.cameraReady = false;
    this.animationId = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadGameState();

    // Only init camera if game is not complete
    if (!this.gameComplete) {
      requestAnimationFrame(() => {
        this.initCamera();
        this.startAnimation();
      });
    }
  }

  async loadGameState() {
    try {
      const [targetColor, scoreHistory] = await Promise.all([
        getDailyColor(),
        getScoreHistory(),
      ]);

      this.targetColor = targetColor;
      this.maxAttempts = scoreHistory?.max_attempts || 5;
      this.currentAttempt = scoreHistory?.attempts_used || 0;
      this.gameComplete = scoreHistory?.attempts_left === 0;

      if (scoreHistory?.attempts?.length) {
        this.attempts = scoreHistory.attempts.map((attempt) => ({
          red: attempt.submitted_color_r,
          green: attempt.submitted_color_g,
          blue: attempt.submitted_color_b,
          score: attempt.score,
          attemptNumber: attempt.attempt_number,
        }));

        if (this.currentAttempt >= this.maxAttempts) {
          this.gameComplete = true;
        }
      } else {
        this.attempts = [];
      }

      this.isLoading = false;
    } catch (error) {
      console.error("Error loading game state:", error);
      this.message = "Failed to load game data";
      this.messageType = "error";
      this.isLoading = false;
    }
  }

  initCamera() {
    this.video = this.shadowRoot.getElementById("cameraFeed");
    if (!this.video) return;

    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 640 },
        height: { ideal: 640 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.video.srcObject = stream;
        
        // Wait for video to actually start playing
        this.video.addEventListener('loadedmetadata', () => {
          this.video.play().then(() => {
            this.cameraReady = true;
            this.requestUpdate();
          });
        });
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
        this.message = "Camera access denied or unavailable";
        this.messageType = "error";
        this.cameraReady = true; // Show error state
      });
  }

  drawCircle() {
    const canvas = this.shadowRoot.getElementById("canvasOverlay");
    if (!canvas) return;

    // Set canvas dimensions to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Increment animation frame
    this.animationFrame += 0.05;

    // Add a pulsing circle overlay at the center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 25;
    const pulseAmount = Math.sin(this.animationFrame) * 3;
    const radius = baseRadius + pulseAmount;

    // Outer glow circle
    context.beginPath();
    context.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI, false);
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255, 255, 255, 0.3)";
    context.stroke();

    // Main circle
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 3;
    context.strokeStyle = "white";
    context.stroke();

    // Draw rounded corner markers instead of crosshair
    const markerOffset = radius + 8;
    const markerLength = 12;
    const markerThickness = 3;
    
    context.strokeStyle = "white";
    context.lineWidth = markerThickness;
    context.lineCap = "round";

    // Top marker
    context.beginPath();
    context.moveTo(centerX, centerY - markerOffset);
    context.lineTo(centerX, centerY - markerOffset - markerLength);
    context.stroke();

    // Bottom marker
    context.beginPath();
    context.moveTo(centerX, centerY + markerOffset);
    context.lineTo(centerX, centerY + markerOffset + markerLength);
    context.stroke();

    // Left marker
    context.beginPath();
    context.moveTo(centerX - markerOffset, centerY);
    context.lineTo(centerX - markerOffset - markerLength, centerY);
    context.stroke();

    // Right marker
    context.beginPath();
    context.moveTo(centerX + markerOffset, centerY);
    context.lineTo(centerX + markerOffset + markerLength, centerY);
    context.stroke();

    // Center dot with pulse
    const dotRadius = 3 + Math.sin(this.animationFrame * 2) * 1;
    context.beginPath();
    context.arc(centerX, centerY, dotRadius, 0, 2 * Math.PI, false);
    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.fill();
  }

  startAnimation() {
    const animate = () => {
      if (!this.gameComplete) {
        this.drawCircle();
        this.animationId = requestAnimationFrame(animate);
      }
    };
    animate();
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  captureImage() {
    const video = this.shadowRoot.getElementById("cameraFeed");
    const canvas = this.shadowRoot.getElementById("captureCanvas");

    if (!video || !canvas) return;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get pixel from center
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    const pixel = context.getImageData(centerX, centerY, 1, 1).data;

    const red = pixel[0];
    const green = pixel[1];
    const blue = pixel[2];

    // Store preview and show confirmation
    this.previewColor = { red, green, blue };
    this.showingPreview = true;
    this.requestUpdate();
  }

  stopCameraStream() {
    const video = this.shadowRoot?.getElementById("cameraFeed");
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
  }

  handleCancelPreview() {
    this.previewColor = null;
    this.showingPreview = false;
    this.requestUpdate();
  }

  async handleConfirmCapture() {
    if (!this.previewColor || this.isSubmitting) return;

    this.isSubmitting = true;
    this.message = "";

    try {
      const response = await submitScore({
        r: this.previewColor.red,
        g: this.previewColor.green,
        b: this.previewColor.blue,
      });

      // Store attempt with data from backend
      this.attempts.push({
        red: this.previewColor.red,
        green: this.previewColor.green,
        blue: this.previewColor.blue,
        score: response.score,
        attemptNumber: response.attempt_number,
      });

      this.currentAttempt = response.attempt_number;
      this.maxAttempts = response.max_attempts || this.maxAttempts;

      // Clear preview
      this.previewColor = null;
      this.showingPreview = false;

      if (response.attempts_left === 0) {
        this.gameComplete = true;
        this.stopCameraStream();
      }

      this.requestUpdate();
    } catch (error) {
      console.error("Error submitting score:", error);
      this.message = error.message || "Failed to submit attempt";
      this.messageType = "error";
    } finally {
      this.isSubmitting = false;
    }
  }

  getBestAttempt() {
    if (this.attempts.length === 0) return null;
    return this.attempts.reduce((best, current) =>
      current.score > best.score ? current : best,
    );
  }

  getAverageScore() {
    if (this.attempts.length === 0) return 0;
    const sum = this.attempts.reduce(
      (total, attempt) => total + attempt.score,
      0,
    );
    return Math.round(sum / this.attempts.length);
  }

  async handleRetry() {
    // Reload game state from backend
    this.attempts = [];
    this.currentAttempt = 0;
    this.gameComplete = false;
    this.message = "";
    this.messageType = "";
    this.isLoading = true;
    this.cameraReady = false;

    await this.loadGameState();

    if (!this.gameComplete) {
      requestAnimationFrame(() => {
        this.initCamera();
        this.startAnimation();
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopCameraStream();
    this.stopAnimation();
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="wrapper">
          <loading-spinner></loading-spinner>
          <p>Loading today's challenge...</p>
        </div>
      `;
    }

    if (!this.targetColor) {
      return html`
        <div class="wrapper">
          <div class="error-message">
            <p>No daily color available</p>
          </div>
        </div>
      `;
    }

    return html`
      ${this.gameComplete
        ? this.renderResults()
        : html`
            ${this.renderScanner()}
            ${this.showingPreview ? this.renderPreview() : ""}
          `}
    `;
  }

  renderScanner() {
    return html`
      <div class="scanner-wrapper" style="${this.showingPreview ? 'display: none;' : ''}">
        <div class="instructions-card">
          <h3>Daily Color Challenge</h3>
          <p>Try to find and capture the mystery color of the day!</p>
          <p>
            You have
            <strong>${this.maxAttempts - this.currentAttempt}</strong> attempts
            remaining.
          </p>
        </div>

        ${this.attempts.length > 0 ? this.renderAttempts() : ""}

        <div class="camera-section">
          <p class="instructions">
            Point your camera at colors in your environment
          </p>

          <div class="video-container">
            ${!this.cameraReady
              ? html`
                  <div class="camera-loading">
                    <div class="camera-loading-spinner"></div>
                    <p>Starting camera...</p>
                  </div>
                `
              : ""}
            <video id="cameraFeed" autoplay playsinline></video>
            <canvas id="canvasOverlay"></canvas>
          </div>

          <button class="capture-button" @click=${this.captureImage} ?disabled=${!this.cameraReady}>
            Capture Color (${this.currentAttempt + 1}/${this.maxAttempts})
          </button>
        </div>

        <canvas id="captureCanvas" style="display: none;"></canvas>

        ${this.message && this.messageType === "error"
          ? html`
              <div class="message error">
                <p>${this.message}</p>
              </div>
            `
          : ""}
      </div>
    `;
  }

  renderPreview() {
    return html`
      <div class="preview-wrapper">
        <div class="preview-card">
          <h3>Color Captured!</h3>
          <p class="preview-instructions">
            Review your captured color before submitting.
          </p>

          <div
            class="preview-color"
            style="background-color: rgb(${this.previewColor.red}, ${this
              .previewColor.green}, ${this.previewColor.blue})"
          ></div>

          <div class="preview-rgb">
            <h4>RGB Values</h4>
            <div class="rgb-display">
              <span><strong>R:</strong> ${this.previewColor.red}</span>
              <span><strong>G:</strong> ${this.previewColor.green}</span>
              <span><strong>B:</strong> ${this.previewColor.blue}</span>
            </div>
          </div>

          <p class="preview-note">
            Note: You won't see your score until after you submit.
          </p>

          ${this.message && this.messageType === "error"
            ? html`
                <div class="message error">
                  <p>${this.message}</p>
                </div>
              `
            : ""}

          <div class="preview-buttons">
            <button
              class="cancel-button"
              @click=${this.handleCancelPreview}
              ?disabled=${this.isSubmitting}
            >
              ↻ Scan Again
            </button>
            <button
              class="confirm-button"
              @click=${this.handleConfirmCapture}
              ?disabled=${this.isSubmitting}
            >
              ${this.isSubmitting ? "Submitting..." : "✓ Submit This Color"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderAttempts() {
    return html`
      <div class="attempts-section">
        <h4>Your Attempts</h4>
        <div class="attempts-grid">
          ${this.attempts.map(
            (attempt) => html`
              <div class="attempt-card">
                <div
                  class="attempt-color"
                  style="background-color: rgb(${attempt.red}, ${attempt.green}, ${attempt.blue})"
                ></div>
                <div class="attempt-info">
                  <span class="attempt-number">#${attempt.attemptNumber}</span>
                  <span class="attempt-score">${attempt.score}%</span>
                </div>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  renderResults() {
    const bestAttempt = this.getBestAttempt();
    const averageScore = this.getAverageScore();
    const scoreClass =
      bestAttempt.score >= 80
        ? "excellent"
        : bestAttempt.score >= 60
          ? "good"
          : "poor";

    return html`
      <div class="result-wrapper">
        <div class="reveal-card">
          <h3>The Mystery Color Was...</h3>
          <div
            class="color-preview large"
            style="background-color: ${this.targetColor.rgb}"
          ></div>
          <p class="color-name">${this.targetColor.color_name}</p>
          <p class="color-hex">${this.targetColor.hex}</p>
        </div>

        <div class="stats-section">
          <h4>Your Performance</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Best Score</span>
              <span class="stat-value ${scoreClass}">${bestAttempt.score}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Average Score</span>
              <span class="stat-value">${averageScore}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Attempts</span>
              <span class="stat-value">${this.attempts.length}</span>
            </div>
          </div>
        </div>

        <div class="all-attempts-section">
          <h4>All Your Attempts</h4>
          <div class="attempts-list">
            ${this.attempts.map(
              (attempt, index) => html`
                <div
                  class="attempt-row ${attempt === bestAttempt ? "best" : ""}"
                >
                  <span class="attempt-number">#${attempt.attemptNumber}</span>
                  <div
                    class="attempt-color-small"
                    style="background-color: rgb(${attempt.red}, ${attempt.green}, ${attempt.blue})"
                  ></div>
                  <span class="attempt-rgb"
                    >RGB(${attempt.red}, ${attempt.green},
                    ${attempt.blue})</span
                  >
                  <span class="attempt-score">${attempt.score}%</span>
                  ${attempt === bestAttempt
                    ? html`<span class="best-badge">Best</span>`
                    : ""}
                </div>
              `,
            )}
          </div>
        </div>

        ${this.message
          ? html`
              <div class="message ${this.messageType}">
                <p>${this.message}</p>
              </div>
            `
          : ""}

        <div class="button-group">
          <button class="retry-button full-width" @click=${this.handleRetry}>
            ${this.currentAttempt >= this.maxAttempts
              ? "Check for Tomorrow's Challenge"
              : "Continue Playing"}
          </button>
        </div>
      </div>
    `;
  }



  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
      }

      .wrapper,
      .scanner-wrapper,
      .result-wrapper,
      .preview-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        padding: 20px;
      }

      .instructions-card,
      .reveal-card,
      .stats-section,
      .attempts-section,
      .all-attempts-section,
      .preview-card {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: var(--box-shadow);
        width: 100%;
      }

      .preview-card {
        text-align: center;
        max-width: 500px;
      }

      .preview-card h3 {
        margin: 0 0 8px 0;
        color: var(--app-primary-color);
        font-size: 24px;
      }

      .preview-instructions {
        color: var(--app-grey);
        margin: 0 0 24px 0;
      }

      .preview-color {
        width: 100%;
        height: 200px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 24px;
      }

      .preview-rgb {
        margin-bottom: 20px;
      }

      .preview-rgb h4 {
        margin: 0 0 12px 0;
        color: var(--app-primary-color);
        font-size: 16px;
      }

      .rgb-display {
        display: flex;
        justify-content: space-around;
        padding: 16px;
        background: var(--app-white);
        border-radius: 8px;
      }

      .rgb-display span {
        font-size: 18px;
        font-family: monospace;
      }

      .preview-note {
        font-size: 14px;
        color: var(--app-grey);
        font-style: italic;
        margin: 0 0 24px 0;
        padding: 12px;
        background: #fef3c7;
        border-radius: 6px;
        border-left: 4px solid #f59e0b;
      }

      .preview-buttons {
        display: flex;
        gap: 12px;
        width: 100%;
      }

      .cancel-button,
      .confirm-button {
        flex: 1;
        padding: 16px 24px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .cancel-button {
        background-color: #6b7280;
        color: white;
      }

      .cancel-button:hover:not(:disabled) {
        background-color: #4b5563;
      }

      .confirm-button {
        background-color: #10b981;
        color: white;
      }

      .confirm-button:hover:not(:disabled) {
        background-color: #059669;
      }

      .cancel-button:disabled,
      .confirm-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .instructions-card {
        text-align: center;
      }

      .instructions-card h3 {
        margin: 0 0 12px 0;
        color: var(--app-primary-color);
        font-size: 24px;
      }

      .instructions-card p {
        margin: 8px 0;
        color: var(--app-grey);
      }

      .instructions-card strong {
        color: var(--app-primary-color);
        font-size: 18px;
      }

      .reveal-card {
        text-align: center;
      }

      .reveal-card h3 {
        margin: 0 0 20px 0;
        color: var(--app-primary-color);
        font-size: 24px;
      }

      .color-preview {
        width: 100%;
        height: 120px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        margin-bottom: 12px;
      }

      .color-preview.large {
        height: 180px;
      }

      .color-name {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--app-primary-color);
      }

      .color-hex {
        font-size: 18px;
        font-family: monospace;
        color: var(--app-grey);
        margin: 0;
      }

      .camera-section {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .instructions {
        text-align: center;
        color: var(--app-grey);
        margin: 0;
        font-size: 14px;
      }

      .video-container {
        position: relative;
        width: 100%;
        max-width: 320px;
        aspect-ratio: 1;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        background: #1f2937;
      }

      .camera-loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #1f2937;
        z-index: 10;
        gap: 16px;
      }

      .camera-loading p {
        color: white;
        margin: 0;
        font-size: 14px;
      }

      .camera-loading-spinner {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      #canvasOverlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .capture-button {
        background-color: var(--app-primary-color);
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        width: 100%;
        max-width: 320px;
      }

      .capture-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
      }

      .capture-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .capture-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: #9ca3af;
      }

      .attempts-section h4,
      .stats-section h4,
      .all-attempts-section h4 {
        margin: 0 0 16px 0;
        color: var(--app-primary-color);
      }

      .attempts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 12px;
      }

      .attempt-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .attempt-color {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .attempt-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .attempt-number {
        font-size: 12px;
        color: var(--app-grey);
        font-weight: 600;
      }

      .attempt-score {
        font-size: 16px;
        font-weight: bold;
        color: var(--app-primary-color);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px;
        background: var(--app-white);
        border-radius: 8px;
      }

      .stat-label {
        font-size: 12px;
        color: var(--app-grey);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: var(--app-primary-color);
      }

      .stat-value.excellent {
        color: #10b981;
      }

      .stat-value.good {
        color: #f59e0b;
      }

      .stat-value.poor {
        color: #ef4444;
      }

      .attempts-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .attempt-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--app-white);
        border-radius: 8px;
        border: 2px solid transparent;
      }

      .attempt-row.best {
        border-color: #10b981;
        background: #d1fae5;
      }

      .attempt-color-small {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
      }

      .attempt-rgb {
        flex: 1;
        font-family: monospace;
        font-size: 14px;
        color: var(--app-grey);
      }

      .best-badge {
        background: #10b981;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
      }

      .button-group {
        display: flex;
        gap: 12px;
        width: 100%;
      }

      .submit-button,
      .retry-button {
        flex: 1;
        padding: 14px 24px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .submit-button {
        background-color: #10b981;
        color: white;
      }

      .submit-button:hover:not(:disabled) {
        background-color: #059669;
      }

      .submit-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .retry-button {
        background-color: var(--app-primary-color);
        color: white;
      }

      .retry-button:hover {
        opacity: 0.9;
      }

      .full-width {
        width: 100%;
      }

      .message {
        width: 100%;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
      }

      .message.success {
        background-color: #d1fae5;
        color: #065f46;
        border: 1px solid #10b981;
      }

      .message.error {
        background-color: #fee2e2;
        color: #991b1b;
        border: 1px solid #dc2626;
      }

      .message p {
        margin: 0;
        font-weight: 500;
      }

      .error-message {
        background: white;
        padding: 32px;
        border-radius: 12px;
        box-shadow: var(--box-shadow);
      }

      .error-message p {
        margin: 0;
        color: #dc2626;
        font-size: 18px;
      }

      @media (max-width: 640px) {
        .wrapper,
        .scanner-wrapper,
        .result-wrapper {
          padding: 12px;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .stat-value {
          font-size: 24px;
        }

        .attempt-rgb {
          font-size: 12px;
        }
      }
    `,
  ];
}

customElements.define("color-scanner", ColorScanner);
export default ColorScanner;
