/**
 * API Client for GandonOmeter Backend
 */

const API = {
  BASE_URL: 'https://gandon.app/api',

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
  },

  /**
   * Get shame board (top Gandons)
   */
  async getShameboard() {
    const response = await fetch(`${this.BASE_URL}/leaderboard/shame`);
    return response.json();
  },

  /**
   * Public share card image URL for a username
   */
  getCardUrl(username) {
    return `${this.BASE_URL}/card/${encodeURIComponent(username)}.svg`;
  },

  /**
   * Get squads the user belongs to
   */
  async getSquads(fingerprintHash) {
    const response = await fetch(`${this.BASE_URL}/squads`, {
      headers: {
        'X-Fingerprint-Hash': fingerprintHash
      }
    });
    return response.json();
  },

  /**
   * Get a squad's private leaderboard (members only)
   */
  async getSquad(fingerprintHash, code) {
    const response = await fetch(`${this.BASE_URL}/squads/${encodeURIComponent(code)}`, {
      headers: {
        'X-Fingerprint-Hash': fingerprintHash
      }
    });
    return response.json();
  },

  /**
   * Create a squad (and join it)
   */
  async createSquad(fingerprintHash, name) {
    const response = await fetch(`${this.BASE_URL}/squads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fingerprintHash, name })
    });
    return response.json();
  },

  /**
   * Join a squad by code
   */
  async joinSquad(fingerprintHash, code) {
    const response = await fetch(`${this.BASE_URL}/squads/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fingerprintHash, code })
    });
    return response.json();
  },

  /**
   * Leave a squad
   */
  async leaveSquad(fingerprintHash, code) {
    const response = await fetch(`${this.BASE_URL}/squads/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fingerprintHash, code })
    });
    return response.json();
  }
};

window.API = API;
