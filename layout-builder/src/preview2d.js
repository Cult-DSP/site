/**
 * preview2d.js
 * 2D top-down polar view for speaker layout preview
 * Listener at center, speakers positioned by azimuth and radius
 */

class Preview2D {
  /**
   * Initialize a 2D preview on a canvas element
   * @param {HTMLCanvasElement} canvas
   * @param {LayoutModel} model
   * @param {Object} options - { width, height, showIds, showChannels }
   */
  constructor(canvas, model, options = {}) {
    this.canvas = canvas;
    this.model = model;
    this.ctx = canvas.getContext("2d");
    this.showIds = options.showIds !== false; // default true
    this.showChannels = options.showChannels !== false; // default true
    this.labelMode = options.labelMode || "channel"; // 'channel' or 'id'

    // Size
    this.width = options.width || canvas.width || 800;
    this.height = options.height || canvas.height || 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Layout
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    this.draw();
  }

  /**
   * Calculate normalized scale based on furthest speaker distance
   * Ensures all speakers fit in view with padding
   */
  calculateScale() {
    const speakers = this.model.getActiveSpeakers();
    if (speakers.length === 0) {
      return 80; // default scale if no speakers
    }

    // Find max distance
    const maxDistance = Math.max(...speakers.map((s) => s.radiusMeters));
    if (maxDistance === 0) {
      return 80; // default if all speakers at center
    }

    // Calculate scale to fit max distance with padding
    // Reserve 80 pixels on edges for labels, grid labels, etc.
    const padding = 80;
    const availableWidth = this.width - padding * 2;
    const availableHeight = this.height - padding * 2;
    const maxAvailable = Math.min(availableWidth, availableHeight) / 2;

    return maxAvailable / maxDistance;
  }

  /**
   * Redraw the preview
   */
  draw() {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Calculate dynamic scale based on layout
    this.scale = this.calculateScale();

    // Draw grid and axes
    this.drawGrid();
    this.drawAxes();

    // Draw speaker positions
    const speakers = this.model.getActiveSpeakers();
    speakers.forEach((speaker) => {
      this.drawSpeaker(speaker);
    });

    // Draw subwoofer positions
    const subwoofers = this.model.getActiveSubwoofers();
    subwoofers.forEach((subwoofer) => {
      this.drawSubwoofer(subwoofer);
    });

    // Draw listener indicator
    this.drawListener();

    // Draw legend
    this.drawLegend();
  }

  /**
   * Draw background grid
   */
  drawGrid() {
    this.ctx.strokeStyle = "#f0f0f0";
    this.ctx.lineWidth = 1;

    // Radial grid (circles)
    for (let r = 1; r <= 5; r++) {
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, r * this.scale, 0, 2 * Math.PI);
      this.ctx.stroke();

      // Labels
      this.ctx.fillStyle = "#cccccc";
      this.ctx.font = "10px sans-serif";
      this.ctx.textAlign = "left";
      this.ctx.fillText(
        `${r}m`,
        this.centerX + r * this.scale + 2,
        this.centerY - 2,
      );
    }

    // Cardinal directions (axes)
    this.ctx.strokeStyle = "#e0e0e0";
    this.ctx.lineWidth = 2;

    // Front (0°)
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY);
    this.ctx.lineTo(this.centerX, this.centerY - 5 * this.scale);
    this.ctx.stroke();

    // Right (90°)
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY);
    this.ctx.lineTo(this.centerX + 5 * this.scale, this.centerY);
    this.ctx.stroke();

    // Back (180°)
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY);
    this.ctx.lineTo(this.centerX, this.centerY + 5 * this.scale);
    this.ctx.stroke();

    // Left (270°)
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY);
    this.ctx.lineTo(this.centerX - 5 * this.scale, this.centerY);
    this.ctx.stroke();
  }

  /**
   * Draw cardinal direction labels
   */
  drawAxes() {
    this.ctx.fillStyle = "#666666";
    this.ctx.font = "bold 12px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "bottom";

    // Front (0°)
    this.ctx.fillText(
      "Front (0°)",
      this.centerX,
      this.centerY - 5 * this.scale - 10,
    );

    this.ctx.textBaseline = "top";
    // Back (180°)
    this.ctx.fillText(
      "Back (180°)",
      this.centerX,
      this.centerY + 5 * this.scale + 10,
    );

    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "middle";
    // Left (270°)
    this.ctx.fillText(
      "Left (270°)",
      this.centerX - 5 * this.scale - 10,
      this.centerY,
    );

    this.ctx.textAlign = "left";
    // Right (90°)
    this.ctx.fillText(
      "Right (90°)",
      this.centerX + 5 * this.scale + 10,
      this.centerY,
    );
  }

  /**
   * Draw a speaker on the preview
   * @param {Object} speaker
   */
  drawSpeaker(speaker) {
    // Convert azimuth (degrees) to canvas coordinates
    // 0° = up (front), 90° = right, 180° = down (back), 270° = left
    const azRad = (speaker.azimuthDeg * Math.PI) / 180;
    const x =
      this.centerX + speaker.radiusMeters * this.scale * Math.sin(azRad);
    const y =
      this.centerY - speaker.radiusMeters * this.scale * Math.cos(azRad);

    // Draw circle
    const radius = 8;
    this.ctx.fillStyle = "#2e5090"; // dark blue
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw border
    this.ctx.strokeStyle = "#1a3050";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw label
    const label = this.labelMode === "id" ? speaker.id : speaker.channel;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 10px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(String(label), x, y);

    // Optional: draw elevation indicator
    if (Math.abs(speaker.elevationDeg) > 2) {
      this.ctx.strokeStyle = speaker.elevationDeg > 0 ? "#4a90e2" : "#e29a4a";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
  }

  /**
   * Draw a subwoofer on the preview
   * @param {Object} subwoofer
   */
  drawSubwoofer(subwoofer) {
    // Subwoofers don't have spatial position (azimuth/radius)
    // Draw them clustered near the listener position with an offset for visibility
    const subwoofers = this.model.getActiveSubwoofers();
    const idx = subwoofers.findIndex((s) => s.id === subwoofer.id);
    const offsetRadius = 35; // pixels from center
    const angleStep = (2 * Math.PI) / Math.max(subwoofers.length, 1);
    const angle = idx * angleStep;

    const x = this.centerX + Math.cos(angle) * offsetRadius;
    const y = this.centerY + Math.sin(angle) * offsetRadius;

    // Draw square
    const size = 10;
    this.ctx.fillStyle = "#e24a4a"; // red
    this.ctx.fillRect(x - size / 2, y - size / 2, size, size);

    // Draw border
    this.ctx.strokeStyle = "#8a1a1a";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);

    // Draw label
    const label = this.labelMode === "id" ? subwoofer.id : subwoofer.channel;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 8px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(String(label), x, y);
  }

  /**
   * Draw listener indicator at center
   */
  drawListener() {
    const size = 6;
    this.ctx.fillStyle = "#333333";
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, size, 0, 2 * Math.PI);
    this.ctx.fill();

    // Small cross
    this.ctx.strokeStyle = "#333333";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX - 3, this.centerY);
    this.ctx.lineTo(this.centerX + 3, this.centerY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY - 3);
    this.ctx.lineTo(this.centerX, this.centerY + 3);
    this.ctx.stroke();
  }

  /**
   * Draw legend
   */
  drawLegend() {
    const padding = 10;
    const x = padding + 10;
    let y = padding + 10;

    this.ctx.font = "bold 11px sans-serif";
    this.ctx.fillStyle = "#333333";
    this.ctx.textAlign = "left";
    this.ctx.fillText("Legend", x, y);

    y += 20;

    // Listener
    this.ctx.fillStyle = "#333333";
    this.ctx.beginPath();
    this.ctx.arc(x + 5, y, 2, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.font = "10px sans-serif";
    this.ctx.fillText("Listener", x + 15, y);

    y += 15;

    // Speaker
    this.ctx.fillStyle = "#2e5090";
    this.ctx.beginPath();
    this.ctx.arc(x + 5, y, 4, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.fillText("Speaker", x + 15, y);

    y += 15;

    // Subwoofer
    this.ctx.fillStyle = "#e24a4a";
    this.ctx.fillRect(x + 1, y - 4, 8, 8);
    this.ctx.fillText("Subwoofer", x + 15, y);

    y += 15;

    // Elevation hint
    this.ctx.strokeStyle = "#4a90e2";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x + 5, y, 4, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.fillStyle = "#333333";
    this.ctx.font = "9px sans-serif";
    this.ctx.fillText("Elevated", x + 15, y);

    y += 15;
    this.ctx.strokeStyle = "#e29a4a";
    this.ctx.beginPath();
    this.ctx.arc(x + 5, y, 4, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.fillStyle = "#333333";
    this.ctx.fillText("Depressed", x + 15, y);
  }

  /**
   * Update label mode
   * @param {string} mode - 'channel' or 'id'
   */
  setLabelMode(mode) {
    this.labelMode = mode;
    this.draw();
  }

  /**
   * Resize canvas
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.draw();
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = Preview2D;
}
