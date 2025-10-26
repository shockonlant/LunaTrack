/**
 * Chrome Storage API Wrapper
 * Manages saving, retrieving, and deleting menstrual record data
 */

const RecordStorage = {
  STORAGE_KEY: 'menstrual_records',

  /**
   * Generate UUID
   * @returns {string} UUID v4 format string
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Get all records
   * @returns {Promise<Array>} Array of records (newest first)
   */
  async getAllRecords() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          const records = result[this.STORAGE_KEY] || [];
          // Sort by newest first
          records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          resolve(records);
        }
      });
    });
  },

  /**
   * Save record
   * @param {Object} recordData - Record data
   * @param {string} recordData.datetime - Date and time (ISO 8601 format)
   * @param {number} recordData.amount - Menstrual flow amount (ml)
   * @param {string} recordData.memo - Memo (optional)
   * @returns {Promise<Object>} Saved record
   */
  async saveRecord(recordData) {
    const records = await this.getAllRecords();

    const newRecord = {
      id: this.generateId(),
      datetime: recordData.datetime,
      amount: recordData.amount,
      memo: recordData.memo || '',
      source: recordData.source || 'manual', // 'manual' | 'ai'
      imageData: null, // To be implemented in Phase 3
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    records.push(newRecord);

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: records }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(newRecord);
        }
      });
    });
  },

  /**
   * Update record
   * @param {string} id - Record ID
   * @param {Object} updates - Update contents
   * @returns {Promise<Object>} Updated record
   */
  async updateRecord(id, updates) {
    const records = await this.getAllRecords();
    const index = records.findIndex(r => r.id === id);

    if (index === -1) {
      throw new Error('Record not found');
    }

    records[index] = {
      ...records[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: records }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(records[index]);
        }
      });
    });
  },

  /**
   * Delete record
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async deleteRecord(id) {
    const records = await this.getAllRecords();
    const filteredRecords = records.filter(r => r.id !== id);

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: filteredRecords }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Get record by ID
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>} Record object or null
   */
  async getRecordById(id) {
    const records = await this.getAllRecords();
    return records.find(r => r.id === id) || null;
  },

  /**
   * Delete all records (dangerous)
   * @returns {Promise<void>}
   */
  async clearAllRecords() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([this.STORAGE_KEY], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Format record as text (for display)
   * @param {Object} record - Record object
   * @returns {string} Formatted text
   */
  formatRecordForDisplay(record) {
    const datetime = this.formatDateTime(record.datetime);
    let text = `Date & Time: ${datetime}\nFlow Amount: ${record.amount}ml`;

    if (record.memo && record.memo.trim()) {
      text += `\nNotes: ${record.memo.trim()}`;
    }

    return text;
  },

  /**
   * Convert ISO 8601 format date/time to readable format
   * @param {string} isoString - ISO 8601 format date/time string
   * @returns {string} Formatted date/time (e.g., 2024-12-25 14:30)
   */
  formatDateTime(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * Export data as JSON
   * @returns {Promise<string>} JSON string
   */
  async exportToJSON() {
    const records = await this.getAllRecords();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      records: records
    }, null, 2);
  },

  /**
   * Import data from JSON (append to existing data)
   * @param {string} jsonString - JSON string
   * @returns {Promise<number>} Number of imported records
   */
  async importFromJSON(jsonString) {
    const data = JSON.parse(jsonString);
    const importedRecords = data.records || [];
    const existingRecords = await this.getAllRecords();

    // Check for duplicates (ensure IDs don't overlap with existing ones)
    const existingIds = new Set(existingRecords.map(r => r.id));
    const newRecords = importedRecords.filter(r => !existingIds.has(r.id));

    const allRecords = [...existingRecords, ...newRecords];

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: allRecords }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(newRecords.length);
        }
      });
    });
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.RecordStorage = RecordStorage;
}
