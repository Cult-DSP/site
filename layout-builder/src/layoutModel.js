/**
 * layoutModel.js
 * Core data model for speaker/subwoofer layouts
 * Handles degree/radian conversions, data serialization, and UI state management
 */

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

class LayoutModel {
  constructor() {
    this.speakers = [];
    this.subwoofers = [];
    this.notes = [];
    this.nextId = 0;
  }

  /**
   * Create a speaker from input (degrees, meters)
   * @param {Object} input - { azimuthDeg, elevationDeg, radiusMeters, channel, enabled, id }
   * @returns {Object} speaker with internal id
   */
  createSpeaker(input = {}) {
    const speaker = {
      id: input.id !== undefined ? input.id : this.nextId++,
      channel: input.channel !== undefined ? input.channel : 0,
      azimuthDeg: input.azimuthDeg !== undefined ? input.azimuthDeg : 0,
      elevationDeg: input.elevationDeg !== undefined ? input.elevationDeg : 0,
      radiusMeters: input.radiusMeters !== undefined ? input.radiusMeters : 1,
      enabled: input.enabled !== undefined ? input.enabled : true,
      type: 'speaker'
    };
    return speaker;
  }

  /**
   * Create a subwoofer
   * @param {Object} input - { channel, enabled, id }
   * @returns {Object} subwoofer
   */
  createSubwoofer(input = {}) {
    const subwoofer = {
      id: input.id !== undefined ? input.id : this.nextId++,
      channel: input.channel !== undefined ? input.channel : 0,
      enabled: input.enabled !== undefined ? input.enabled : true,
      type: 'subwoofer'
    };
    return subwoofer;
  }

  /**
   * Add a speaker to the layout
   * @param {Object} speaker
   */
  addSpeaker(speaker) {
    if (speaker.id >= this.nextId) {
      this.nextId = speaker.id + 1;
    }
    this.speakers.push(speaker);
  }

  /**
   * Add a subwoofer to the layout
   * @param {Object} subwoofer
   */
  addSubwoofer(subwoofer) {
    if (subwoofer.id >= this.nextId) {
      this.nextId = subwoofer.id + 1;
    }
    this.subwoofers.push(subwoofer);
  }

  /**
   * Remove speaker by id
   * @param {number} id
   */
  removeSpeaker(id) {
    this.speakers = this.speakers.filter(s => s.id !== id);
  }

  /**
   * Remove subwoofer by id
   * @param {number} id
   */
  removeSubwoofer(id) {
    this.subwoofers = this.subwoofers.filter(s => s.id !== id);
  }

  /**
   * Update speaker by id
   * @param {number} id
   * @param {Object} updates - partial speaker object
   */
  updateSpeaker(id, updates) {
    const speaker = this.speakers.find(s => s.id === id);
    if (speaker) {
      Object.assign(speaker, updates);
    }
  }

  /**
   * Update subwoofer by id
   * @param {number} id
   * @param {Object} updates - partial subwoofer object
   */
  updateSubwoofer(id, updates) {
    const subwoofer = this.subwoofers.find(s => s.id === id);
    if (subwoofer) {
      Object.assign(subwoofer, updates);
    }
  }

  /**
   * Duplicate a speaker by id
   * @param {number} id
   * @returns {Object} new speaker
   */
  duplicateSpeaker(id) {
    const original = this.speakers.find(s => s.id === id);
    if (!original) return null;
    const copy = this.createSpeaker(original);
    copy.id = this.nextId++;
    copy.channel = original.channel + 1; // bump channel by default
    this.addSpeaker(copy);
    return copy;
  }

  /**
   * Duplicate a subwoofer by id
   * @param {number} id
   * @returns {Object} new subwoofer
   */
  duplicateSubwoofer(id) {
    const original = this.subwoofers.find(s => s.id === id);
    if (!original) return null;
    const copy = this.createSubwoofer(original);
    copy.id = this.nextId++;
    this.addSubwoofer(copy);
    return copy;
  }

  /**
   * Get speaker by id
   * @param {number} id
   * @returns {Object|null}
   */
  getSpeaker(id) {
    return this.speakers.find(s => s.id === id) || null;
  }

  /**
   * Get subwoofer by id
   * @param {number} id
   * @returns {Object|null}
   */
  getSubwoofer(id) {
    return this.subwoofers.find(s => s.id === id) || null;
  }

  /**
   * Get all active speakers (enabled=true)
   * @returns {Array}
   */
  getActiveSpeakers() {
    return this.speakers.filter(s => s.enabled);
  }

  /**
   * Get all active subwoofers (enabled=true)
   * @returns {Array}
   */
  getActiveSubwoofers() {
    return this.subwoofers.filter(s => s.enabled);
  }

  /**
   * Sort speakers by channel (in-place)
   */
  sortSpeakersByChannel() {
    this.speakers.sort((a, b) => a.channel - b.channel);
  }

  /**
   * Sort speakers by azimuth (in-place)
   */
  sortSpeakersByAzimuth() {
    this.speakers.sort((a, b) => a.azimuthDeg - b.azimuthDeg);
  }

  /**
   * Offset all speaker channels by a constant
   * @param {number} offset
   */
  offsetSpeakerChannels(offset) {
    this.speakers.forEach(s => {
      s.channel = Math.max(0, s.channel + offset);
    });
  }

  /**
   * Offset all subwoofer channels by a constant
   * @param {number} offset
   */
  offsetSubwooferChannels(offset) {
    this.subwoofers.forEach(s => {
      s.channel = Math.max(0, s.channel + offset);
    });
  }

  /**
   * Convert all speaker channels from one-based to zero-based
   * Assumes all channels >= 1
   */
  convertSpokersOneBasedToZeroBased() {
    this.speakers.forEach(s => {
      if (s.channel >= 1) {
        s.channel -= 1;
      }
    });
  }

  /**
   * Convert all speaker channels from zero-based to one-based
   */
  convertSpeakersZeroBasedToOneBased() {
    this.speakers.forEach(s => {
      s.channel += 1;
    });
  }

  /**
   * Convert degrees to radians in the internal representation
   * @returns {Object} - { speakers, subwoofers, notes }
   */
  toRadians() {
    const speakers = this.getActiveSpeakers().map(s => ({
      channel: s.channel,
      az: s.azimuthDeg * DEG_TO_RAD,
      el: s.elevationDeg * DEG_TO_RAD,
      radius: s.radiusMeters
    }));

    const subwoofers = this.getActiveSubwoofers().map(s => ({
      channel: s.channel
    }));

    return {
      speakers,
      subwoofers,
      notes: this.notes.length > 0 ? this.notes : undefined
    };
  }

  /**
   * Convert from radians to degrees and load into model
   * @param {Object} layout - { speakers, subwoofers, notes }
   */
  fromRadians(layout) {
    this.speakers = [];
    this.subwoofers = [];
    this.notes = layout.notes || [];

    if (layout.speakers) {
      layout.speakers.forEach((s, idx) => {
        const speaker = this.createSpeaker({
          channel: s.channel,
          azimuthDeg: s.az * RAD_TO_DEG,
          elevationDeg: s.el * RAD_TO_DEG,
          radiusMeters: s.radius,
          id: idx,
          enabled: true
        });
        this.addSpeaker(speaker);
      });
    }

    if (layout.subwoofers) {
      layout.subwoofers.forEach((s, idx) => {
        const subwoofer = this.createSubwoofer({
          channel: s.channel,
          id: 1000 + idx, // offset to avoid collision with speaker ids
          enabled: true
        });
        this.addSubwoofer(subwoofer);
      });
    }

    this.nextId = Math.max(
      this.speakers.length > 0 ? Math.max(...this.speakers.map(s => s.id)) + 1 : 0,
      this.subwoofers.length > 0 ? Math.max(...this.subwoofers.map(s => s.id)) + 1 : 0
    );
  }

  /**
   * Get min and max channels across all elements
   * @returns {Object} - { minChannel, maxChannel }
   */
  getChannelRange() {
    const allChannels = [
      ...this.speakers.map(s => s.channel),
      ...this.subwoofers.map(s => s.channel)
    ];

    if (allChannels.length === 0) {
      return { minChannel: 0, maxChannel: 0 };
    }

    return {
      minChannel: Math.min(...allChannels),
      maxChannel: Math.max(...allChannels)
    };
  }

  /**
   * Check if layout is contiguous (no gaps)
   * @returns {boolean}
   */
  isContiguous() {
    const allChannels = [
      ...this.speakers.map(s => s.channel),
      ...this.subwoofers.map(s => s.channel)
    ];

    if (allChannels.length === 0) return true;

    const sorted = allChannels.slice().sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    for (let i = 0; i <= max - min; i++) {
      if (!sorted.includes(min + i)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get active channel set
   * @returns {Set}
   */
  getActiveChannels() {
    const channels = new Set();
    this.getActiveSpeakers().forEach(s => channels.add(s.channel));
    this.getActiveSubwoofers().forEach(s => channels.add(s.channel));
    return channels;
  }

  /**
   * Find duplicate active channels
   * @returns {Array} - array of duplicate channel numbers
   */
  findDuplicateActiveChannels() {
    const channels = new Map();
    const duplicates = new Set();

    this.getActiveSpeakers().forEach(s => {
      if (channels.has(s.channel)) {
        duplicates.add(s.channel);
      } else {
        channels.set(s.channel, 1);
      }
    });

    this.getActiveSubwoofers().forEach(s => {
      if (channels.has(s.channel)) {
        duplicates.add(s.channel);
      } else {
        channels.set(s.channel, 1);
      }
    });

    return Array.from(duplicates);
  }

  /**
   * Check if any subwoofer channel sits inside the speaker channel range
   * @returns {Array} - array of subwoofer channels inside speaker range
   */
  findSubwoofersInsideSpeakerRange() {
    const activeSpeakers = this.getActiveSpeakers();
    if (activeSpeakers.length === 0) return [];

    const speakerChannels = activeSpeakers.map(s => s.channel);
    const minSpeaker = Math.min(...speakerChannels);
    const maxSpeaker = Math.max(...speakerChannels);

    const result = [];
    this.getActiveSubwoofers().forEach(s => {
      if (s.channel >= minSpeaker && s.channel <= maxSpeaker) {
        result.push(s.channel);
      }
    });

    return result;
  }

  /**
   * Detect layout style (zero-based vs one-based)
   * @returns {string} - 'likely-zero-based', 'likely-one-based', or 'ambiguous'
   */
  detectBaseStyle() {
    const allChannels = [
      ...this.speakers.map(s => s.channel),
      ...this.subwoofers.map(s => s.channel)
    ];

    if (allChannels.length === 0) return 'ambiguous';

    const hasZero = allChannels.includes(0);
    const hasOne = allChannels.includes(1);
    const min = Math.min(...allChannels);
    const max = Math.max(...allChannels);

    if (hasZero && !hasOne) return 'likely-zero-based';
    if (hasOne && !hasZero && min > 0) return 'likely-one-based';

    return 'ambiguous';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayoutModel;
}
