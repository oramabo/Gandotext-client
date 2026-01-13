/**
 * GandonOmeter - Main Popup Logic
 */

// DOM Elements
const views = {
  loading: document.getElementById('loadingView'),
  ready: document.getElementById('readyView'),
  checking: document.getElementById('checkingView'),
  gandon: document.getElementById('gandonView'),
  notGandon: document.getElementById('notGandonView'),
  alreadyChecked: document.getElementById('alreadyCheckedView'),
  leaderboard: document.getElementById('leaderboardView'),
  shameboard: document.getElementById('shameboardView')
};

const elements = {
  checkBtn: document.getElementById('checkBtn'),
  leaderboardBtn: document.getElementById('leaderboardBtn'),
  backFromLeaderboard: document.getElementById('backFromLeaderboard'),
  progressFill: document.getElementById('progressFill'),
  checkingMessages: document.getElementById('checkingMessages'),
  matrixBg: document.getElementById('matrixBg'),
  confetti: document.getElementById('confetti'),

  // Stats
  gandonDays: document.getElementById('gandonDays'),
  notGandonCount: document.getElementById('notGandonCount'),
  notGandonTotal: document.getElementById('notGandonTotal'),
  userRank: document.getElementById('userRank'),

  // Already checked
  alreadyIcon: document.getElementById('alreadyIcon'),
  alreadyTitle: document.getElementById('alreadyTitle'),
  alreadyResult: document.getElementById('alreadyResult'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds'),

  // Username (notGandon view)
  usernameSection: document.getElementById('usernameSection'),
  usernameInput: document.getElementById('usernameInput'),
  setUsernameBtn: document.getElementById('setUsernameBtn'),
  usernameDisplay: document.getElementById('usernameDisplay'),

  // Username (alreadyChecked view)
  usernameSectionAlready: document.getElementById('usernameSectionAlready'),
  usernameInputAlready: document.getElementById('usernameInputAlready'),
  setUsernameBtnAlready: document.getElementById('setUsernameBtnAlready'),
  usernameDisplayAlready: document.getElementById('usernameDisplayAlready'),

  // Leaderboard
  leaderboardList: document.getElementById('leaderboardList'),

  // Shameboard
  shameboardBtn: document.getElementById('shameboardBtn'),
  backFromShameboard: document.getElementById('backFromShameboard'),
  shameboardList: document.getElementById('shameboardList'),

  // User identity
  userIdentity: document.getElementById('userIdentity')
};

// State
let fingerprintHash = null;
let currentView = 'loading';
let countdownInterval = null;
let lastCheckResult = null;

// ========================================
// View Management
// ========================================
function showView(viewName) {
  Object.keys(views).forEach(key => {
    views[key].classList.add('hidden');
  });
  views[viewName].classList.remove('hidden');
  currentView = viewName;
}

// ========================================
// Matrix Background Animation
// ========================================
function initMatrixBackground() {
  const chars = 'GANDONSUKAPRIVETBLYADCYKANAHUY0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const matrixBg = elements.matrixBg;

  setInterval(() => {
    if (document.hidden) return;

    const char = document.createElement('span');
    char.className = 'matrix-char';
    char.textContent = chars[Math.floor(Math.random() * chars.length)];
    char.style.left = Math.random() * 100 + '%';
    char.style.animationDuration = (3 + Math.random() * 4) + 's';

    matrixBg.appendChild(char);

    setTimeout(() => char.remove(), 7000);
  }, 200);
}

// ========================================
// Confetti Animation
// ========================================
function createConfetti() {
  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96f', '#ff8c00'];
  const confettiContainer = elements.confetti;
  confettiContainer.innerHTML = '';

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confettiContainer.appendChild(piece);
  }
}

// ========================================
// Countdown Timer
// ========================================
function startCountdown(targetTime) {
  if (countdownInterval) clearInterval(countdownInterval);

  const updateCountdown = () => {
    const now = new Date().getTime();
    const target = new Date(targetTime).getTime();
    const diff = target - now;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      // Refresh to check again
      init();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    elements.hours.textContent = String(hours).padStart(2, '0');
    elements.minutes.textContent = String(minutes).padStart(2, '0');
    elements.seconds.textContent = String(seconds).padStart(2, '0');
  };

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

// ========================================
// Checking Animation
// ========================================
async function playCheckingAnimation() {
  const messages = elements.checkingMessages.querySelectorAll('.check-msg');
  let progress = 0;
  const duration = 3000; // 3 seconds
  const interval = 50;
  const steps = duration / interval;
  const progressPerStep = 100 / steps;

  // Cycle through messages
  let messageIndex = 0;
  const messageInterval = setInterval(() => {
    messages.forEach((msg, i) => {
      msg.classList.toggle('active', i === messageIndex);
    });
    messageIndex = (messageIndex + 1) % messages.length;
  }, 600);

  // Progress bar animation
  return new Promise((resolve) => {
    const progressInterval = setInterval(() => {
      progress += progressPerStep;
      elements.progressFill.style.width = Math.min(progress, 100) + '%';

      if (progress >= 100) {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        resolve();
      }
    }, interval);
  });
}

// ========================================
// Badge Update
// ========================================
function notifyBadgeUpdate(hasChecked) {
  chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', checked: hasChecked });
}

// ========================================
// Check Logic
// ========================================
async function performCheck() {
  showView('checking');
  elements.progressFill.style.width = '0%';

  // Start animation
  const animationPromise = playCheckingAnimation();

  // Make API call (will likely finish before animation)
  let result;
  try {
    const response = await API.check(fingerprintHash);
    if (!response.success) {
      throw new Error(response.error);
    }
    result = response.data;
  } catch (error) {
    console.error('Check failed:', error);
    // Fallback to local calculation for demo
    result = {
      isGandon: Math.random() > 0.005, // 0.5% not gandon
      stats: { totalChecks: 1, notGandonCount: 0 }
    };
  }

  // Wait for animation to complete
  await animationPromise;

  // Store result
  lastCheckResult = result;
  await Storage.setTodayResult(result);

  // Show result
  if (result.alreadyChecked) {
    showAlreadyChecked(result);
  } else if (result.isGandon) {
    showGandonResult(result);
  } else {
    showNotGandonResult(result);
  }

  // Notify background to clear badge (user has checked)
  notifyBadgeUpdate(true);
}

function showGandonResult(result) {
  elements.gandonDays.textContent = result.stats?.totalChecks || 1;
  elements.notGandonCount.textContent = result.stats?.notGandonCount || 0;
  showView('gandon');
}

async function showNotGandonResult(result) {
  createConfetti();
  elements.notGandonTotal.textContent = result.stats?.notGandonCount || 1;

  // Get rank
  try {
    const rankResponse = await API.getRank(fingerprintHash);
    if (rankResponse.success && rankResponse.data.rank) {
      elements.userRank.textContent = '#' + rankResponse.data.rank;
    }
  } catch (e) {
    elements.userRank.textContent = '-';
  }

  // Show username section if user can change from AnonymousGandon# to custom
  if (result.canChangeUsername) {
    elements.usernameSection.classList.remove('hidden');
    elements.usernameDisplay.textContent = `Current name: ${result.username}`;
    elements.usernameDisplay.classList.remove('hidden');
  } else {
    elements.usernameSection.classList.add('hidden');
    elements.usernameDisplay.textContent = `Leaderboard name: ${result.username}`;
    elements.usernameDisplay.classList.remove('hidden');
  }

  showView('notGandon');
}

function showAlreadyChecked(result) {
  if (result.isGandon) {
    elements.alreadyIcon.textContent = '\u{1F921}'; // clown
    elements.alreadyResult.textContent = 'You ARE Gandon today. DA, TY GANDON!';
  } else {
    elements.alreadyIcon.textContent = '\u{1F451}'; // crown
    elements.alreadyResult.textContent = 'You are NOT Gandon today! NE GANDON!';
  }

  // Show username section if user can still set their name (one-time only)
  if (result.canChangeUsername) {
    elements.usernameSectionAlready.classList.remove('hidden');
    elements.usernameDisplayAlready.textContent = `Current: ${result.username}`;
    elements.usernameDisplayAlready.classList.remove('hidden');
  } else {
    elements.usernameSectionAlready.classList.add('hidden');
    elements.usernameDisplayAlready.textContent = `Name: ${result.username}`;
    elements.usernameDisplayAlready.classList.remove('hidden');
  }

  startCountdown(result.nextCheckAvailable);
  showView('alreadyChecked');
}

// ========================================
// Username Setting
// ========================================
async function setUsername(inputElement, sectionElement, displayElement) {
  // Support both notGandon view and alreadyChecked view
  const input = inputElement || elements.usernameInput;
  const section = sectionElement || elements.usernameSection;
  const display = displayElement || elements.usernameDisplay;

  const username = input.value.trim();

  if (username.length < 3 || username.length > 20) {
    alert('Username must be 3-20 characters');
    return;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    alert('Username can only contain letters, numbers, underscores, and hyphens');
    return;
  }

  try {
    const response = await API.setUsername(fingerprintHash, username);

    if (response.success) {
      // Hide ALL username input sections
      elements.usernameSection.classList.add('hidden');
      elements.usernameSectionAlready.classList.add('hidden');

      // Update display in both views
      elements.usernameDisplay.textContent = `Leaderboard name: ${username}`;
      elements.usernameDisplay.classList.remove('hidden');
      elements.usernameDisplayAlready.textContent = `Name: ${username}`;
      elements.usernameDisplayAlready.classList.remove('hidden');

      // Update cached result so section doesn't reappear on view change
      if (lastCheckResult) {
        lastCheckResult.canChangeUsername = false;
        lastCheckResult.username = username;
        Storage.setTodayResult(lastCheckResult);
      }
    } else {
      alert(response.error || 'Failed to set username');
    }
  } catch (error) {
    console.error('Set username failed:', error);
    alert('Failed to set username. Try again!');
  }
}

// ========================================
// Leaderboard
// ========================================
async function loadLeaderboard() {
  showView('leaderboard');
  elements.leaderboardList.innerHTML = '<p style="color: var(--text-secondary);">Loading...</p>';

  try {
    const response = await API.getLeaderboard();

    if (!response.success) {
      throw new Error(response.error);
    }

    const leaderboard = response.data.leaderboard;

    if (leaderboard.length === 0) {
      elements.leaderboardList.innerHTML = '<p style="color: var(--text-secondary);">No one has escaped Gandon status yet!</p>';
      return;
    }

    elements.leaderboardList.innerHTML = leaderboard.map((entry, index) => {
      let rankClass = '';
      let rankEmoji = '';

      if (index === 0) { rankClass = 'gold'; rankEmoji = '\u{1F451}'; }
      else if (index === 1) { rankClass = 'silver'; rankEmoji = '\u{1F948}'; }
      else if (index === 2) { rankClass = 'bronze'; rankEmoji = '\u{1F949}'; }

      return `
        <div class="leaderboard-item ${index < 3 ? 'top-3' : ''}">
          <span class="rank ${rankClass}">${rankEmoji || '#' + entry.rank}</span>
          <span class="username">${escapeHtml(entry.username)}</span>
          <span class="score">${entry.notGandonCount}x</span>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Leaderboard failed:', error);
    elements.leaderboardList.innerHTML = '<p style="color: var(--text-secondary);">Failed to load leaderboard</p>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// Shame Board
// ========================================
async function loadShameboard() {
  showView('shameboard');
  elements.shameboardList.innerHTML = '<p style="color: var(--text-secondary);">Loading...</p>';

  try {
    const response = await API.getShameboard();

    if (!response.success) {
      throw new Error(response.error);
    }

    const shameboard = response.data.shameboard;

    if (shameboard.length === 0) {
      elements.shameboardList.innerHTML = '<p style="color: var(--text-secondary);">No Gandons recorded yet!</p>';
      return;
    }

    elements.shameboardList.innerHTML = shameboard.map((entry, index) => {
      let rankClass = '';
      let rankEmoji = '';

      if (index === 0) { rankClass = 'gold'; rankEmoji = '\u{1F4A9}'; } // poop for #1 gandon
      else if (index === 1) { rankClass = 'silver'; rankEmoji = '\u{1F921}'; } // clown
      else if (index === 2) { rankClass = 'bronze'; rankEmoji = '\u{1F47A}'; } // goblin

      return `
        <div class="leaderboard-item ${index < 3 ? 'top-3' : ''}">
          <span class="rank ${rankClass}">${rankEmoji || '#' + entry.rank}</span>
          <span class="username">${escapeHtml(entry.username)}</span>
          <span class="score">${entry.gandonCount}x</span>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Shameboard failed:', error);
    elements.shameboardList.innerHTML = '<p style="color: var(--text-secondary);">Failed to load shame board</p>';
  }
}

// ========================================
// User Identity Display
// ========================================
async function loadUserIdentity() {
  try {
    const response = await API.getProfile(fingerprintHash);
    if (response.success && response.data.displayName) {
      elements.userIdentity.textContent = response.data.displayName;
    }
  } catch (error) {
    // Silently fail - user identity is not critical
    console.error('Failed to load user identity:', error);
  }
}

// ========================================
// Initialization
// ========================================
async function init() {
  showView('loading');
  initMatrixBackground();

  // Get or generate fingerprint
  fingerprintHash = await Storage.getFingerprintHash();

  if (!fingerprintHash) {
    fingerprintHash = await Fingerprint.generate();
    await Storage.setFingerprintHash(fingerprintHash);
  }

  // ALWAYS check server first (anti-cheat)
  try {
    const statusResponse = await API.getStatus(fingerprintHash);

    if (statusResponse.success && statusResponse.data.hasChecked) {
      lastCheckResult = statusResponse.data;
      await Storage.setTodayResult(statusResponse.data);
      showAlreadyChecked(statusResponse.data);
      // Load user identity in background
      loadUserIdentity();
      // Notify badge that user has checked
      notifyBadgeUpdate(true);
      return;
    }

    // Server says not checked yet - clear stale local cache
    await Storage.clearTodayResult();
    // Try to load user identity if they exist
    loadUserIdentity();

  } catch (error) {
    console.error('Status check failed:', error);
    // Fallback to local cache only when server unreachable
    const cachedResult = await Storage.getTodayResult();
    if (cachedResult) {
      lastCheckResult = cachedResult;
      showAlreadyChecked(cachedResult);
      return;
    }
  }

  showView('ready');
}

// ========================================
// Event Listeners
// ========================================
elements.checkBtn.addEventListener('click', performCheck);
elements.leaderboardBtn.addEventListener('click', loadLeaderboard);
elements.backFromLeaderboard.addEventListener('click', () => {
  if (lastCheckResult) {
    showAlreadyChecked(lastCheckResult);
  } else {
    showView('ready');
  }
});
elements.setUsernameBtn.addEventListener('click', () => setUsername());
elements.usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') setUsername();
});
// Username from alreadyChecked view
elements.setUsernameBtnAlready.addEventListener('click', () => {
  setUsername(elements.usernameInputAlready, elements.usernameSectionAlready, elements.usernameDisplayAlready);
});
elements.usernameInputAlready.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') setUsername(elements.usernameInputAlready, elements.usernameSectionAlready, elements.usernameDisplayAlready);
});
elements.shameboardBtn.addEventListener('click', loadShameboard);
elements.backFromShameboard.addEventListener('click', () => {
  if (lastCheckResult) {
    showAlreadyChecked(lastCheckResult);
  } else {
    showView('ready');
  }
});

// Start
init();
