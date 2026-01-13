/**
 * GandonOmeter - Background Service Worker
 * Manages badge display based on check status
 */

const API_BASE_URL = 'https://gandon.app/api';

// Check status and update badge
async function updateBadge() {
  try {
    // Get fingerprint from storage
    const result = await chrome.storage.local.get('fingerprintHash');
    const fingerprintHash = result.fingerprintHash;

    if (!fingerprintHash) {
      // New user - show badge to prompt check
      setBadge('!', '#a855f7');
      return;
    }

    // Check server for today's status
    const response = await fetch(`${API_BASE_URL}/check/status`, {
      headers: {
        'X-Fingerprint-Hash': fingerprintHash
      }
    });

    const data = await response.json();

    if (data.success && data.data.hasChecked) {
      // Already checked today - clear badge
      clearBadge();
    } else {
      // Not checked yet - show reminder badge
      setBadge('!', '#a855f7');
    }
  } catch (error) {
    // On error, show badge as reminder
    console.error('Badge update failed:', error);
    setBadge('!', '#a855f7');
  }
}

// Set badge text and color
function setBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Clear badge
function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

// Update badge on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

// Update badge when browser starts
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Update badge periodically (every hour)
chrome.alarms.create('updateBadge', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateBadge') {
    updateBadge();
  }
});

// Listen for messages from popup to update badge
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    if (message.checked) {
      clearBadge();
    } else {
      setBadge('!', '#a855f7');
    }
    sendResponse({ success: true });
  }
  return true;
});
