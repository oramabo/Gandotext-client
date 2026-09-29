/**
 * GandonOmeter - Fun extras from the API (meter, diagnosis, streaks,
 * special days, achievements). Every field is optional, so the popup still
 * works against a server that doesn't send them yet.
 */

// All achievements, so locked ones can be shown too. Secret ones stay "???"
// until earned.
const ACHIEVEMENT_CATALOG = [
  { code: 'eternal-gandon', emoji: '♾️', name: 'Eternal Gandon', description: '365 checks and not a single escape' },
  { code: 'lucky-bastard', emoji: '\u{1F340}', name: 'Lucky Bastard', description: 'Escaped Gandon status 2 or more times' },
  { code: 'early-bird', emoji: '\u{1F413}', name: 'Early Bird', description: 'Checked within the first minute after midnight GMT' },
  { code: 'loyal-gandon', emoji: '\u{1FAE1}', name: 'Loyal Gandon', description: 'Checked 30 days in a row' },
  { code: 'legendary-gandon', emoji: '\u{1F451}', name: 'Legendary Gandon', description: 'Rolled a 1-in-1,000 Legendary Gandon' },
  { code: 'nice-try', emoji: '\u{1F6A8}', name: 'Nice Try', description: 'Tripped the anti-cheat. Babushka saw everything.', secret: true },
  { code: 'hacker-gandon', emoji: '\u{1F4BB}', name: 'Hacker Gandon', description: 'Found the secret debug endpoint. It did nothing.', secret: true }
];

const SPECIAL_DAY_EMOJI = {
  'april-fools': '\u{1F0CF}',
  'new-year': '\u{1F386}',
  'friday-13': '\u{1F5A4}',
  anniversary: '\u{1F382}'
};

const SQUAD_STATUS_EMOJI = {
  gandon: '\u{1F921}',
  'not-gandon': '\u{1F451}',
  pending: '⏳'
};

/**
 * Create an element with an optional class and text
 */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/**
 * A line with a leading emoji
 */
function flavorLine(emoji, text, modifier) {
  const line = el('p', `flavor-line${modifier ? ` ${modifier}` : ''}`);
  line.append(el('span', 'flavor-emoji', emoji), el('span', 'flavor-text', text));
  return line;
}

/**
 * The GandonOmeter gauge: today's roll, with the tiny win zone on the left
 */
function renderMeter(meter) {
  const wrapper = el('div', `meter meter-${meter.zone}`);

  const header = el('div', 'meter-header');
  header.append(
    el('span', 'meter-level', `${meter.level.toFixed(1)}% GANDON`),
    el('span', 'meter-win', `win < ${meter.winBelow}%`)
  );

  const track = el('div', 'meter-track');
  track.setAttribute('role', 'meter');
  track.setAttribute('aria-label', 'GandonOmeter reading');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  track.setAttribute('aria-valuenow', String(meter.level));
  track.setAttribute('aria-valuetext', `${meter.level}% gandon. ${meter.label}`);

  const winZone = el('div', 'meter-win-zone');
  winZone.style.width = `${meter.winBelow}%`;
  const fill = el('div', 'meter-fill');
  fill.style.width = `${Math.max(meter.level, 1)}%`;
  track.append(winZone, fill);

  wrapper.append(header, track, el('p', 'meter-label', meter.label));
  return wrapper;
}

/**
 * Button that copies the public share card link and opens it
 */
function createShareButton(username) {
  const button = el('button', 'share-btn', '\u{1F4E4} SHARE MY CARD');
  button.type = 'button';
  button.addEventListener('click', async () => {
    const url = API.getCardUrl(username);
    try {
      await navigator.clipboard.writeText(url);
      button.textContent = '✅ LINK COPIED';
    } catch (error) {
      console.error('Copy failed:', error);
    }
    chrome.tabs.create({ url });
  });
  return button;
}

/**
 * Fill a result view's extras container.
 * fresh: this result comes from a check made just now
 */
function renderResultExtras(container, result, { fresh = false } = {}) {
  container.replaceChildren();

  // Most exciting first: the popup is short and the rest scrolls
  if (result.meter) {
    container.append(renderMeter(result.meter));
  }
  if (fresh) {
    for (const achievement of result.newAchievements || []) {
      const line = flavorLine('\u{1F3C5}', `Achievement unlocked: ${achievement.emoji} ${achievement.name}`, 'unlocked');
      line.setAttribute('role', 'status');
      container.append(line);
    }
  }
  for (const day of result.specialDays || []) {
    container.append(flavorLine(SPECIAL_DAY_EMOJI[day.code] || '\u{1F389}', day.message, 'special'));
  }
  if (result.streak?.message) {
    container.append(flavorLine('\u{1F525}', result.streak.message));
  }
  if (result.diagnosis) {
    container.append(flavorLine('\u{1FA7A}', `Diagnosis: ${result.diagnosis}`));
  }
  if (result.username && result.meter) {
    container.append(createShareButton(result.username));
  }

  container.classList.toggle('hidden', container.childElementCount === 0);
}

/**
 * Rank title and badge emojis under a name in a leaderboard row
 */
function renderEntryMeta(entry) {
  const badges = entry.badges || [];
  if (!entry.gandonRank && !badges.length) return null;

  const meta = el('span', 'entry-meta');
  if (entry.gandonRank) meta.append(el('span', 'entry-rank', entry.gandonRank));
  for (const badge of badges) {
    const icon = el('span', 'entry-badge', badge.emoji);
    icon.title = badge.name;
    icon.setAttribute('aria-label', badge.name);
    meta.append(icon);
  }
  return meta;
}

/**
 * Every achievement, earned ones first-class and the rest locked
 */
function renderAchievementGrid(earned) {
  const earnedByCode = new Map((earned || []).map(achievement => [achievement.code, achievement]));
  const known = new Set(ACHIEVEMENT_CATALOG.map(achievement => achievement.code));
  // Codes this version doesn't know about yet still show up
  const all = [...ACHIEVEMENT_CATALOG, ...(earned || []).filter(achievement => !known.has(achievement.code))];

  const grid = el('ul', 'achievement-grid');
  for (const achievement of all) {
    const isEarned = earnedByCode.has(achievement.code);
    const hidden = !isEarned && achievement.secret;
    const tile = el('li', `achievement${isEarned ? ' earned' : ' locked'}`);
    tile.append(
      el('span', 'achievement-emoji', hidden ? '❓' : achievement.emoji),
      el('span', 'achievement-name', hidden ? '???' : achievement.name)
    );
    const description = hidden ? 'Secret achievement. Babushka will not say.' : achievement.description;
    tile.title = `${description}${isEarned ? '' : ' (locked)'}`;
    tile.setAttribute('aria-label', `${hidden ? 'Secret achievement' : achievement.name}: ${tile.title}`);
    grid.append(tile);
  }
  return grid;
}

window.Extras = {
  ACHIEVEMENT_CATALOG,
  SQUAD_STATUS_EMOJI,
  el,
  renderMeter,
  renderResultExtras,
  renderEntryMeta,
  renderAchievementGrid,
  createShareButton
};
