/**
 * validation.js
 * Validation rules and severity levels (info, warning, error)
 * Prioritizes: nonlinear layouts allowed, subwoofers allowed, duplicate channels block export
 */

class ValidationMessage {
  constructor(severity, title, description, details = '') {
    this.severity = severity; // 'info', 'warning', or 'error'
    this.title = title;
    this.description = description;
    this.details = details;
  }
}

class Validator {
  /**
   * Run full validation on a layout model
   * @param {LayoutModel} model
   * @returns {Object} - { messages: Array, canExport: boolean }
   */
  static validate(model) {
    const messages = [];

    // Info: import summary
    messages.push(...Validator.infoMessages(model));

    // Errors: structural issues that block export
    messages.push(...Validator.errorMessages(model));

    // Warnings: allowed but unusual layouts
    messages.push(...Validator.warningMessages(model));

    const canExport = !messages.some(m => m.severity === 'error');

    return { messages, canExport };
  }

  /**
   * Generate info messages (summaries, statistics)
   * @param {LayoutModel} model
   * @returns {Array}
   */
  static infoMessages(model) {
    const messages = [];
    const activeSpeakers = model.getActiveSpeakers();
    const activeSubwoofers = model.getActiveSubwoofers();

    // Import summary
    if (activeSpeakers.length > 0 || activeSubwoofers.length > 0) {
      const parts = [];
      if (activeSpeakers.length > 0) {
        parts.push(`${activeSpeakers.length} speaker${activeSpeakers.length !== 1 ? 's' : ''}`);
      }
      if (activeSubwoofers.length > 0) {
        parts.push(`${activeSubwoofers.length} subwoofer${activeSubwoofers.length !== 1 ? 's' : ''}`);
      }
      messages.push(
        new ValidationMessage(
          'info',
          'Layout Summary',
          `Imported ${parts.join(' and ')}.`,
          ''
        )
      );
    }

    // Highest device channel
    const { maxChannel } = model.getChannelRange();
    if (activeSpeakers.length > 0 || activeSubwoofers.length > 0) {
      messages.push(
        new ValidationMessage(
          'info',
          'Highest Device Channel',
          `Highest device channel is ${maxChannel}.`,
          `Minimum required output bus size is ${maxChannel + 1} channels.`
        )
      );
    }

    // Internal format note
    messages.push(
      new ValidationMessage(
        'info',
        'Internal Format',
        'Layout uses radians internally and degrees in the UI.',
        'Export will convert degrees to radians automatically.'
      )
    );

    return messages;
  }

  /**
   * Generate error messages (export-blocking issues)
   * @param {LayoutModel} model
   * @returns {Array}
   */
  static errorMessages(model) {
    const messages = [];
    const activeSpeakers = model.getActiveSpeakers();
    const activeSubwoofers = model.getActiveSubwoofers();

    // Duplicate active channels
    const duplicates = model.findDuplicateActiveChannels();
    if (duplicates.length > 0) {
      messages.push(
        new ValidationMessage(
          'error',
          'Duplicate Active Channels',
          `Duplicate active channels detected: ${duplicates.join(', ')}.`,
          'Each active speaker or subwoofer must have a unique device channel.'
        )
      );
    }

    // Validate speaker fields
    activeSpeakers.forEach((speaker, idx) => {
      if (!Number.isInteger(speaker.channel)) {
        messages.push(
          new ValidationMessage(
            'error',
            'Invalid Speaker Channel',
            `Speaker #${speaker.id}: channel is not an integer.`,
            `Current value: ${speaker.channel}`
          )
        );
      }

      if (!Number.isFinite(speaker.azimuthDeg)) {
        messages.push(
          new ValidationMessage(
            'error',
            'Invalid Speaker Azimuth',
            `Speaker #${speaker.id}: azimuth is not finite.`,
            `Current value: ${speaker.azimuthDeg}`
          )
        );
      }

      if (!Number.isFinite(speaker.elevationDeg)) {
        messages.push(
          new ValidationMessage(
            'error',
            'Invalid Speaker Elevation',
            `Speaker #${speaker.id}: elevation is not finite.`,
            `Current value: ${speaker.elevationDeg}`
          )
        );
      }

      if (!Number.isFinite(speaker.radiusMeters) || speaker.radiusMeters <= 0) {
        messages.push(
          new ValidationMessage(
            'error',
            'Invalid Speaker Radius',
            `Speaker #${speaker.id}: radius must be positive and finite.`,
            `Current value: ${speaker.radiusMeters}`
          )
        );
      }
    });

    // Validate subwoofer fields
    activeSubwoofers.forEach(subwoofer => {
      if (!Number.isInteger(subwoofer.channel)) {
        messages.push(
          new ValidationMessage(
            'error',
            'Invalid Subwoofer Channel',
            `Subwoofer #${subwoofer.id}: channel is not an integer.`,
            `Current value: ${subwoofer.channel}`
          )
        );
      }
    });

    return messages;
  }

  /**
   * Generate warning messages (allowed but notable conditions)
   * @param {LayoutModel} model
   * @returns {Array}
   */
  static warningMessages(model) {
    const messages = [];
    const activeSpeakers = model.getActiveSpeakers();
    const activeSubwoofers = model.getActiveSubwoofers();

    if (activeSpeakers.length === 0) {
      return messages; // no warnings if no active speakers
    }

    // Non-contiguous device channels
    if (!model.isContiguous()) {
      messages.push(
        new ValidationMessage(
          'warning',
          'Non-Contiguous Device Channels',
          'Non-contiguous device channels detected. This is allowed.',
          'Spatial Root supports nonlinear speaker layouts, but the output device must expose enough channels for the highest device channel.'
        )
      );
    }

    // Subwoofer inside speaker channel range
    const subwoofersInside = model.findSubwoofersInsideSpeakerRange();
    if (subwoofersInside.length > 0) {
      messages.push(
        new ValidationMessage(
          'warning',
          'Subwoofer Inside Speaker Channel Range',
          `Subwoofer channel(s) ${subwoofersInside.join(', ')} sit inside the broader speaker channel range.`,
          'This is allowed. Confirm that the hardware routing intentionally sends subwoofer or LFE content to this output.'
        )
      );
    }

    // Check for high channel count relative to speaker count
    const { maxChannel } = model.getChannelRange();
    if (maxChannel > activeSpeakers.length * 2) {
      messages.push(
        new ValidationMessage(
          'warning',
          'High Channel-to-Speaker Ratio',
          `Highest device channel (${maxChannel}) is much larger than speaker count (${activeSpeakers.length}).`,
          'This is allowed. Verify that the channel assignment intentionally skips many hardware outputs.'
        )
      );
    }

    // Detect one-based layout
    const baseStyle = model.detectBaseStyle();
    if (baseStyle === 'likely-one-based') {
      messages.push(
        new ValidationMessage(
          'warning',
          'Likely One-Based Layout',
          'Layout appears to use one-based channel numbering (channels start at 1).',
          'Confirm whether this is intentional. If zero-based numbering is required, use the channel conversion tool.'
        )
      );
    }

    // Speaker order differs from channel order
    const byChannel = [...activeSpeakers].sort((a, b) => a.channel - b.channel);
    const inOrder = activeSpeakers.every((s, i) => s.channel === byChannel[i].channel);
    if (!inOrder) {
      messages.push(
        new ValidationMessage(
          'warning',
          'Speaker Order Differs From Channel Order',
          'Speakers are not ordered by device channel.',
          'This is allowed. Consider sorting by channel for clarity.'
        )
      );
    }

    // Notes mention uncertainty
    if (model.notes && model.notes.length > 0) {
      const notesText = model.notes.join(' ').toLowerCase();
      if (
        notesText.includes('uncertain') ||
        notesText.includes('unclear') ||
        notesText.includes('verify') ||
        notesText.includes('check')
      ) {
        messages.push(
          new ValidationMessage(
            'warning',
            'Notes Mention Uncertain Mapping',
            'Notes contain language suggesting uncertain hardware routing.',
            'Review the layout carefully before deployment.'
          )
        );
      }
    }

    return messages;
  }

  /**
   * Check if a layout can be exported (no errors)
   * @param {LayoutModel} model
   * @returns {boolean}
   */
  static canExport(model) {
    const { canExport } = Validator.validate(model);
    return canExport;
  }

  /**
   * Get a summary string for UI display
   * @param {Array} messages - from validate()
   * @returns {string}
   */
  static getSummary(messages) {
    const errors = messages.filter(m => m.severity === 'error');
    const warnings = messages.filter(m => m.severity === 'warning');

    const parts = [];
    if (errors.length > 0) {
      parts.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`);
    }
    if (warnings.length > 0) {
      parts.push(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Valid';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
}
