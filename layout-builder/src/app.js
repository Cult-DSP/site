/**
 * app.js
 * Main layout builder application
 * Orchestrates UI, model updates, validation, and export/import
 */

class LayoutBuilderApp {
  constructor() {
    this.model = new LayoutModel();
    this.validator = Validator;
    this.exporter = ImportExporter;

    // Cache DOM elements
    this.elements = {};
    this.cacheElements();

    // State
    this.editingId = null;
    this.currentValidation = { messages: [], canExport: false };

    // Event listeners
    this.attachEventListeners();

    // Initial render
    this.refreshUI();
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    const ids = [
      "speaker-table",
      "subwoofer-table",
      "preview-canvas",
      "validation-container",
      "add-speaker-btn",
      "add-subwoofer-btn",
      "sort-channel-btn",
      "sort-azimuth-btn",
      "export-json-btn",
      "copy-json-btn",
      "download-json-btn",
      "import-file-input",
      "import-btn",
      "json-output",
      "label-mode-select",
    ];

    ids.forEach((id) => {
      this.elements[id] = document.getElementById(id);
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Add speakers/subwoofers
    if (this.elements["add-speaker-btn"]) {
      this.elements["add-speaker-btn"].addEventListener("click", () =>
        this.addSpeaker(),
      );
    }
    if (this.elements["add-subwoofer-btn"]) {
      this.elements["add-subwoofer-btn"].addEventListener("click", () =>
        this.addSubwoofer(),
      );
    }

    // Sort
    if (this.elements["sort-channel-btn"]) {
      this.elements["sort-channel-btn"].addEventListener("click", () => {
        this.model.sortSpeakersByChannel();
        this.refreshUI();
      });
    }
    if (this.elements["sort-azimuth-btn"]) {
      this.elements["sort-azimuth-btn"].addEventListener("click", () => {
        this.model.sortSpeakersByAzimuth();
        this.refreshUI();
      });
    }

    // Export/Import
    if (this.elements["export-json-btn"]) {
      this.elements["export-json-btn"].addEventListener("click", () =>
        this.generateExportJSON(),
      );
    }
    if (this.elements["copy-json-btn"]) {
      this.elements["copy-json-btn"].addEventListener("click", () =>
        this.copyJSONToClipboard(),
      );
    }
    if (this.elements["download-json-btn"]) {
      this.elements["download-json-btn"].addEventListener("click", () =>
        this.downloadJSON(),
      );
    }
    if (this.elements["import-btn"]) {
      this.elements["import-btn"].addEventListener("click", () =>
        this.importFromFile(),
      );
    }

    // Label mode toggle
    if (this.elements["label-mode-select"]) {
      this.elements["label-mode-select"].addEventListener("change", (e) => {
        if (this.preview) {
          this.preview.setLabelMode(e.target.value);
        }
      });
    }

    // Load example layouts dropdown
    const exampleSelect = document.getElementById("example-select");
    const loadExampleBtn = document.getElementById("load-example-btn");

    if (loadExampleBtn && exampleSelect) {
      // Click handler - use arrow function to preserve 'this'
      loadExampleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!exampleSelect.value) {
          alert("Please select an example layout first");
          return;
        }
        console.log("Button clicked, loading:", exampleSelect.value);
        this.loadExampleLayout(exampleSelect.value);
      });

      // Change handler for visual feedback
      exampleSelect.addEventListener("change", (e) => {
        loadExampleBtn.style.opacity = e.target.value ? "1" : "0.6";
        loadExampleBtn.disabled = !e.target.value;
      });

      // Initialize button state
      loadExampleBtn.style.opacity = "0.6";
      loadExampleBtn.disabled = true;
    }
  }

  /**
   * Add a new speaker
   */
  addSpeaker() {
    const speaker = this.model.createSpeaker({
      channel: this.model.getActiveSpeakers().length,
      azimuthDeg: 0,
      elevationDeg: 0,
      radiusMeters: 1,
    });
    this.model.addSpeaker(speaker);
    this.refreshUI();
  }

  /**
   * Add a new subwoofer
   */
  addSubwoofer() {
    const subwoofer = this.model.createSubwoofer({
      channel: this.model.getActiveSubwoofers().length + 10,
    });
    this.model.addSubwoofer(subwoofer);
    this.refreshUI();
  }

  /**
   * Render speaker table
   */
  renderSpeakerTable() {
    if (!this.elements["speaker-table"]) return;

    const tbody = this.elements["speaker-table"].querySelector("tbody");
    tbody.innerHTML = "";

    this.model.speakers.forEach((speaker) => {
      const row = this.createSpeakerRow(speaker);
      tbody.appendChild(row);
    });
  }

  /**
   * Create a table row for a speaker
   */
  createSpeakerRow(speaker) {
    const row = document.createElement("tr");
    if (!speaker.enabled) {
      row.classList.add("disabled");
    }

    row.innerHTML = `
      <td style="width: 50px;">
        <input type="checkbox" 
          ${speaker.enabled ? "checked" : ""}
          onchange="app.toggleSpeaker(${speaker.id}, this.checked)">
      </td>
      <td style="width: 40px; text-align: center; font-family: monospace;">
        ${speaker.id}
      </td>
      <td style="width: 60px;">
        <input type="number" value="${speaker.channel}"
          onchange="app.updateSpeaker(${speaker.id}, { channel: parseInt(this.value) })">
      </td>
      <td style="width: 80px;">
        <input type="number" step="0.1" value="${speaker.azimuthDeg.toFixed(2)}"
          onchange="app.updateSpeaker(${speaker.id}, { azimuthDeg: parseFloat(this.value) })">
      </td>
      <td style="width: 80px;">
        <input type="number" step="0.1" value="${speaker.elevationDeg.toFixed(2)}"
          onchange="app.updateSpeaker(${speaker.id}, { elevationDeg: parseFloat(this.value) })">
      </td>
      <td style="width: 80px;">
        <input type="number" step="0.1" value="${speaker.radiusMeters.toFixed(2)}"
          onchange="app.updateSpeaker(${speaker.id}, { radiusMeters: parseFloat(this.value) })">
      </td>
      <td style="width: 80px;">
        <button onclick="app.duplicateSpeaker(${speaker.id})">Dup</button>
      </td>
      <td style="width: 60px;">
        <button class="danger" onclick="app.deleteSpeaker(${speaker.id})">Del</button>
      </td>
    `;
    return row;
  }

  /**
   * Update speaker
   */
  updateSpeaker(id, updates) {
    this.model.updateSpeaker(id, updates);
    this.refreshUI();
  }

  /**
   * Toggle speaker enabled state
   */
  toggleSpeaker(id, enabled) {
    this.model.updateSpeaker(id, { enabled });
    this.refreshUI();
  }

  /**
   * Duplicate speaker
   */
  duplicateSpeaker(id) {
    this.model.duplicateSpeaker(id);
    this.refreshUI();
  }

  /**
   * Delete speaker
   */
  deleteSpeaker(id) {
    if (confirm("Delete this speaker?")) {
      this.model.removeSpeaker(id);
      this.refreshUI();
    }
  }

  /**
   * Render subwoofer table
   */
  renderSubwooferTable() {
    if (!this.elements["subwoofer-table"]) return;

    const tbody = this.elements["subwoofer-table"].querySelector("tbody");
    tbody.innerHTML = "";

    this.model.subwoofers.forEach((subwoofer) => {
      const row = this.createSubwooferRow(subwoofer);
      tbody.appendChild(row);
    });
  }

  /**
   * Create a table row for a subwoofer
   */
  createSubwooferRow(subwoofer) {
    const row = document.createElement("tr");
    if (!subwoofer.enabled) {
      row.classList.add("disabled");
    }

    row.innerHTML = `
      <td style="width: 50px;">
        <input type="checkbox"
          ${subwoofer.enabled ? "checked" : ""}
          onchange="app.toggleSubwoofer(${subwoofer.id}, this.checked)">
      </td>
      <td style="width: 40px; text-align: center; font-family: monospace;">
        ${subwoofer.id}
      </td>
      <td style="width: 60px;">
        <input type="number" value="${subwoofer.channel}"
          onchange="app.updateSubwoofer(${subwoofer.id}, { channel: parseInt(this.value) })">
      </td>
      <td style="flex: 1;"></td>
      <td style="width: 80px;">
        <button onclick="app.duplicateSubwoofer(${subwoofer.id})">Dup</button>
      </td>
      <td style="width: 60px;">
        <button class="danger" onclick="app.deleteSubwoofer(${subwoofer.id})">Del</button>
      </td>
    `;
    return row;
  }

  /**
   * Update subwoofer
   */
  updateSubwoofer(id, updates) {
    this.model.updateSubwoofer(id, updates);
    this.refreshUI();
  }

  /**
   * Toggle subwoofer enabled state
   */
  toggleSubwoofer(id, enabled) {
    this.model.updateSubwoofer(id, { enabled });
    this.refreshUI();
  }

  /**
   * Duplicate subwoofer
   */
  duplicateSubwoofer(id) {
    this.model.duplicateSubwoofer(id);
    this.refreshUI();
  }

  /**
   * Delete subwoofer
   */
  deleteSubwoofer(id) {
    if (confirm("Delete this subwoofer?")) {
      this.model.removeSubwoofer(id);
      this.refreshUI();
    }
  }

  /**
   * Render validation messages
   */
  renderValidationMessages() {
    if (!this.elements["validation-container"]) return;

    this.currentValidation = this.validator.validate(this.model);
    const { messages, canExport } = this.currentValidation;

    const container = this.elements["validation-container"];
    container.innerHTML = "";

    messages.forEach((msg) => {
      const div = document.createElement("div");
      div.className = `validation-message ${msg.severity}`;

      const icon =
        { error: "⚠", warning: "⚡", info: "ℹ" }[msg.severity] || "•";

      div.innerHTML = `
        <div class="validation-message-icon">${icon}</div>
        <div class="validation-message-content">
          <div class="validation-message-title">${msg.title}</div>
          <div class="validation-message-description">${msg.description}</div>
          ${msg.details ? `<div class="validation-message-details">${msg.details}</div>` : ""}
        </div>
      `;
      container.appendChild(div);
    });

    // Update export button
    if (this.elements["export-json-btn"]) {
      this.elements["export-json-btn"].disabled = !canExport;
    }
  }

  /**
   * Render 2D preview
   */
  renderPreview() {
    if (!this.elements["preview-canvas"]) return;

    // Always recreate preview to ensure model is properly reflected
    // (fixes issue where imported layouts weren't displaying)
    this.preview = new Preview2D(this.elements["preview-canvas"], this.model, {
      width: this.elements["preview-canvas"].parentElement.clientWidth,
      height: 400,
      labelMode: this.preview ? this.preview.labelMode : "channel",
    });
  }

  /**
   * Generate export JSON and display it
   */
  generateExportJSON() {
    const json = this.exporter.exportJSON(this.model, true);
    if (this.elements["json-output"]) {
      this.elements["json-output"].textContent = json;
    }
  }

  /**
   * Copy JSON to clipboard
   */
  async copyJSONToClipboard() {
    const json = this.exporter.exportJSON(this.model, true);
    const success = await this.exporter.copyToClipboard(json);
    if (success) {
      alert("Copied to clipboard!");
    } else {
      alert("Failed to copy to clipboard");
    }
  }

  /**
   * Download JSON file
   */
  downloadJSON() {
    const json = this.exporter.exportJSON(this.model, true);
    const timestamp = new Date().toISOString().slice(0, 10);
    this.exporter.downloadFile(
      json,
      `layout_${timestamp}.json`,
      "application/json",
    );
  }

  /**
   * Import from file
   */
  importFromFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        const jsonString = event.target.result;
        const result = this.exporter.importJSON(jsonString, LayoutModel);

        if (result.success) {
          this.model = result.model;
          alert(`Import successful!\n\n${result.summary}`);
          this.refreshUI();
        } else {
          alert(`Import failed: ${result.error}`);
        }
      });
      reader.readAsText(file);
    });
    input.click();
  }

  /**
   * Load an example layout
   */
  loadExampleLayout(layoutName) {
    const layouts = {
      // Basic
      stereo: "./examples/stereo.json",
      quad: "./examples/quad_4.json",
      hexagon: "./examples/hexagon_6.json",
      octagon: "./examples/octagon_8.json",
      // Ring layouts
      circle_12: "./examples/circle_12.json",
      circle_16: "./examples/circle_16.json",
      ring8_top4: "./examples/ring8_top4.json",
      ring12_top4: "./examples/ring12_top4.json",
      // 3D layouts
      cube: "./examples/cube_8.json",
      dual_ring: "./examples/dual_ring_16.json",
      // Advanced
      "5_1": "./examples/5_1.json",
      translab: "./examples/translab-sono-layout.json",
      allosphere: "./examples/allosphere_layout.json",
    };

    if (!layouts[layoutName]) {
      alert("Unknown layout");
      return;
    }

    const filePath = layouts[layoutName];
    console.log("Loading layout:", layoutName, "from:", filePath);

    fetch(filePath)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.text();
      })
      .then((json) => {
        console.log("Fetched JSON, parsing...");
        const result = this.exporter.importJSON(json, LayoutModel);
        if (result.success) {
          this.model = result.model;
          this.refreshUI();
          console.log("Layout loaded successfully:", result.summary);
          alert(`Loaded: ${layoutName}\n\n${result.summary}`);
        } else {
          console.error("Import failed:", result.error);
          alert(`Failed to load example: ${result.error}`);
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        alert(`Failed to fetch example: ${err.message}`);
      });
  }

  /**
   * Full UI refresh
   */
  refreshUI() {
    this.renderSpeakerTable();
    this.renderSubwooferTable();
    this.renderValidationMessages();
    this.renderPreview();
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new LayoutBuilderApp();
});
