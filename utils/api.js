/**
 * API Client for GandonOmeter Backend
 */

const API = {
  // Railway deployment URL
  BASE_URL: 'https://gandon.up.railway.app/api',

  /**
   * Perform daily Gandon check
   */
  async check(fingerprintHash) {
    const response = await fetch(`${this.BASE_URL}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fingerprintHash })
    });
    return response.json();
  },

  /**
   * Get today's check status
   */
  async getStatus(fingerprintHash) {
    const response = await fetch(`${this.BASE_URL}/check/status`, {
      headers: {
        'X-Fingerprint-Hash': fingerprintHash
      }
    });
    return response.json();
  },

  /**
   * Set permanent username
   */
  async setUsername(fingerprintHash, username) {
    const response = await fetch(`${this.BASE_URL}/user/username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fingerprintHash, username })
    });
    return response.json();
  },

  /**
   * Get user profile
   */
  async getProfile(fingerprintHash) {
    const response = await fetch(`${this.BASE_URL}/user/profile`, {
      headers: {
        'X-Fingerprint-Hash': fingerprintHash
      }
    });
    return response.json();
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    const response = await fetch(`${this.BASE_URL}/leaderboard`);
    return response.json();
  },

  /**
   * Get user's rank
   */
  async getRank(fingerprintHash) {
    const response = await fetch(`${this.BASE_URL}/leaderboard/rank`, {
      headers: {
        'X-Fingerprint-Hash': fingerprintHash
      }
    });
    return response.json();
  }
};

window.API = API;
