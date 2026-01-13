/**
 * Browser Fingerprinting for GandonOmeter
 * Creates a deterministic fingerprint hash for the user's browser
 */

const Fingerprint = {
  /**
   * Collect all fingerprint components
   */
  async collectComponents() {
    return {
      screenResolution: `${screen.width}x${screen.height}`,
      screenColorDepth: screen.colorDepth,
      devicePixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      canvas: await this.getCanvasFingerprint(),
      webgl: this.getWebGLFingerprint(),
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      languages: navigator.languages?.join(',') || navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  },

  /**
   * Generate canvas fingerprint
   */
  async getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');

      // Draw unique pattern
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('GandonOmeter', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      return await this.sha256(canvas.toDataURL());
    } catch (e) {
      return 'canvas-error';
    }
  },

  /**
   * Get WebGL fingerprint
   */
  getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return `${vendor}~${renderer}`;
      }
      return 'webgl-no-debug';
    } catch (e) {
      return 'webgl-error';
    }
  },

  /**
   * SHA-256 hash function
   */
  async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Generate final fingerprint hash
   */
  async generate() {
    const components = await this.collectComponents();
    const orderedString = Object.keys(components)
      .sort()
      .map(key => `${key}:${components[key]}`)
      .join('|');
    return await this.sha256(orderedString);
  }
};

// Export for use in popup
window.Fingerprint = Fingerprint;
