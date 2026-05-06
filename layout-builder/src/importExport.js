/**
 * importExport.js
 * Handle JSON import/export, preserve channel values, convert radians/degrees
 */

class ImportExporter {
  /**
   * Import a Spatial Root layout JSON
   * Converts radians to degrees for display
   * @param {string} jsonString - JSON text
   * @returns {Object} - { success: boolean, model: LayoutModel|null, error: string|null, summary: string }
   */
  static importJSON(jsonString, ModelClass) {
    try {
      const layout = JSON.parse(jsonString);
      const model = new ModelClass();
      model.fromRadians(layout);

      // Generate summary
      const activeSpeakers = model.getActiveSpeakers();
      const activeSubwoofers = model.getActiveSubwoofers();
      const { maxChannel } = model.getChannelRange();

      const parts = [];
      if (activeSpeakers.length > 0) {
        parts.push(`${activeSpeakers.length} speaker${activeSpeakers.length !== 1 ? 's' : ''}`);
      }
      if (activeSubwoofers.length > 0) {
        parts.push(`${activeSubwoofers.length} subwoofer${activeSubwoofers.length !== 1 ? 's' : ''}`);
      }

      let summary = `Imported ${parts.join(' and ')}.`;
      if (activeSpeakers.length > 0 || activeSubwoofers.length > 0) {
        summary += `\nHighest device channel: ${maxChannel}.`;
      }

      if (!model.isContiguous() && (activeSpeakers.length > 0 || activeSubwoofers.length > 0)) {
        summary += '\nDetected nonlinear channel layout. This is supported by Spatial Root.';
      }

      const duplicates = model.findDuplicateActiveChannels();
      if (duplicates.length === 0) {
        summary += '\nNo duplicate active channels found.';
      }

      return {
        success: true,
        model,
        error: null,
        summary
      };
    } catch (err) {
      return {
        success: false,
        model: null,
        error: `Import failed: ${err.message}`,
        summary: ''
      };
    }
  }

  /**
   * Export layout to Spatial Root JSON format
   * Converts degrees to radians
   * @param {LayoutModel} model
   * @param {boolean} pretty - whether to pretty-print (default true)
   * @returns {string} - JSON string
   */
  static exportJSON(model, pretty = true) {
    const exported = model.toRadians();

    // Clean up undefined notes
    if (!exported.notes) {
      delete exported.notes;
    }

    const json = pretty ? JSON.stringify(exported, null, 2) : JSON.stringify(exported);
    return json;
  }

  /**
   * Export layout to CSV for spreadsheet editing
   * Useful for batch modifications
   * @param {LayoutModel} model
   * @returns {string} - CSV text
   */
  static exportCSV(model) {
    const rows = [];

    // Header
    rows.push('id,type,channel,enabled,azimuthDeg,elevationDeg,radiusMeters');

    // Speakers
    model.speakers.forEach(speaker => {
      rows.push(
        `${speaker.id},speaker,${speaker.channel},${speaker.enabled},${speaker.azimuthDeg},${speaker.elevationDeg},${speaker.radiusMeters}`
      );
    });

    // Subwoofers
    model.subwoofers.forEach(subwoofer => {
      rows.push(`${subwoofer.id},subwoofer,${subwoofer.channel},${subwoofer.enabled}`);
    });

    // Notes as comments
    if (model.notes && model.notes.length > 0) {
      rows.push('');
      rows.push('# Notes:');
      model.notes.forEach(note => {
        rows.push(`# ${note}`);
      });
    }

    return rows.join('\n');
  }

  /**
   * Import layout from CSV
   * @param {string} csvString
   * @param {LayoutModel class} ModelClass
   * @returns {Object} - { success: boolean, model: LayoutModel|null, error: string|null }
   */
  static importCSV(csvString, ModelClass) {
    try {
      const model = new ModelClass();
      const lines = csvString.split('\n').filter(line => line.trim() && !line.startsWith('#'));

      if (lines.length === 0) {
        throw new Error('CSV is empty');
      }

      // Skip header
      lines.shift();

      let notes = [];

      lines.forEach((line, idx) => {
        const parts = line.split(',').map(p => p.trim());

        if (parts[1] === 'speaker') {
          const speaker = model.createSpeaker({
            id: parseInt(parts[0]),
            channel: parseInt(parts[2]),
            enabled: parts[3] === 'true',
            azimuthDeg: parseFloat(parts[4]),
            elevationDeg: parseFloat(parts[5]),
            radiusMeters: parseFloat(parts[6])
          });
          model.addSpeaker(speaker);
        } else if (parts[1] === 'subwoofer') {
          const subwoofer = model.createSubwoofer({
            id: parseInt(parts[0]),
            channel: parseInt(parts[2]),
            enabled: parts[3] === 'true'
          });
          model.addSubwoofer(subwoofer);
        }
      });

      return {
        success: true,
        model,
        error: null
      };
    } catch (err) {
      return {
        success: false,
        model: null,
        error: `CSV import failed: ${err.message}`
      };
    }
  }

  /**
   * Download a file in the browser
   * @param {string} content - file content
   * @param {string} filename - suggested filename
   * @param {string} mimeType - MIME type (default 'text/plain')
   */
  static downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy text to clipboard
   * @param {string} text
   * @returns {Promise<boolean>} - success
   */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImportExporter;
}
