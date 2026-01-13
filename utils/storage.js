/**
 * Chrome Storage Helper for GandonOmeter
 */

const Storage = {
  /**
   * Get value from storage
   */
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  },

  /**
   * Set value in storage
   */
  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  /**
   * Remove value from storage
   */
  async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], resolve);
    });
  },

  /**
   * Get cached fingerprint hash
   */
  async getFingerprintHash() {
    return this.get('fingerprintHash');
  },

  /**
   * Set fingerprint hash
   */
  async setFingerprintHash(hash) {
    return this.set('fingerprintHash', hash);
  },

  /**
   * Get cached check result for today
   */
  async getTodayResult() {
    const cached = await this.get('todayResult');
    if (!cached) return null;

    // Check if it's still valid (same GMT day)
    const today = new Date().toISOString().split('T')[0];
    if (cached.date !== today) {
      await this.remove('todayResult');
      return null;
    }

    return cached;
  },

  /**
   * Cache today's result
   */
  async setTodayResult(result) {
    const today = new Date().toISOString().split('T')[0];
    return this.set('todayResult', {
      date: today,
      ...result
    });
  },

  /**
   * Clear today's cached result
   */
  async clearTodayResult() {
    return this.remove('todayResult');
  }
};

window.Storage = Storage;
