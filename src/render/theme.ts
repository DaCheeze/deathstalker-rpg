/**
 * Sci-Fi Visual Theme and Layout Constants.
 * Crisp space opera aesthetic: dark slate, neon cyan, amber warning, plasma magenta, crimson.
 */

export const THEME = {
  bg: '#080b12',
  panelBg: '#0f172a',
  panelBorder: '#1e293b',
  panelBorderActive: '#38bdf8',
  
  textMain: '#f1f5f9',
  textMuted: '#64748b',
  textHighlight: '#ffffff',
  textWarning: '#f59e0b',
  textDanger: '#ef4444',
  textSuccess: '#10b981',

  // Faction colors
  partyPrimary: '#38bdf8',       // Bright cyan
  partySecondary: '#0284c7',
  partyCardBg: '#091829',

  empirePrimary: '#f59e0b',      // Imperial Gold / Amber
  empireCardBg: '#1f150b',

  shubPrimary: '#a855f7',        // Rogue AI Purple
  shubCardBg: '#180d26',

  hadenmanPrimary: '#ef4444',    // Augmented Red
  hadenmanCardBg: '#210b0f',

  // Mechanic colors
  disruptorReady: '#10b981',     // Vivid glowing emerald
  disruptorCharging: '#475569',  // Dull slate
  disruptorActive: '#059669',
  
  boostActive: '#f59e0b',        // Amber
  burnoutHigh: '#ef4444',        // Red
  forceShield: '#00f2fe',        // Cyan energy glow
  espColor: '#c084fc',           // Psionic violet
  hpColor: '#22c55e',            // Green
  hpLowColor: '#ef4444',         // Red
  
  fontFamily: "'Courier New', Courier, monospace",
  fontHeader: "13px 'Courier New', monospace",
  fontBody: "11px 'Courier New', monospace",
  fontSmall: "9px 'Courier New', monospace",
  fontLarge: "bold 15px 'Courier New', monospace",
  fontBanner: "bold 22px 'Courier New', monospace",
};

export const LAYOUT = {
  canvasWidth: 1024,
  canvasHeight: 768,

  // 1. Single shared battlefield stage floor ground line (60-65% of frame height)
  deckY: 480,

  // 2. Battlefield arena bounds
  arenaX: 20,
  arenaWidth: 984,
  arenaY: 160,
  arenaHeight: 440,

  // 3. Top-left turn queue bounds
  queueX: 24,
  queueY: 20,
  queueWidth: 360,
  queueHeight: 46,

  // 4. Top-right party status column bounds
  partyColumnX: 810,
  partyColumnY: 24,
  partyColumnWidth: 194,
  partyColumnSlotHeight: 60,

  // 5. Contextual command menu default dimensions
  contextMenuWidth: 140,
  contextMenuHeight: 160,

  // Header & legacy aliases
  headerY: 4,
  headerHeight: 22,
  partyStripY: 482,
  partyStripHeight: 92,
  partyStripX: 20,
  partyStripWidth: 984,
  bottomY: 580,
  bottomHeight: 180,
  menuX: 20,
  menuWidth: 480,
  logX: 512,
  logWidth: 492,
  partyX: 20,
  partyWidth: 984,
  enemyX: 20,
  enemyWidth: 984,
};

/**
 * Sizing and positioning for enemy combatants on the left side of the shared ground plane.
 * Units stand grounded at deckY.
 */
export function getEnemyCardBounds(
  totalEnemies: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  const { deckY } = LAYOUT;

  if (totalEnemies <= 1) {
    const w = 180;
    const h = 230;
    const x = 160;
    const y = deckY - h + 24;
    return { x, y, w, h };
  }

  if (totalEnemies === 2) {
    const w = 150;
    const h = 210;
    const gap = 44;
    const x = 70 + index * (w + gap);
    const y = deckY - h + 24 + (index % 2) * 12;
    return { x, y, w, h };
  }

  if (totalEnemies === 3) {
    const w = 130;
    const h = 195;
    const gap = 24;
    const x = 46 + index * (w + gap);
    const y = deckY - h + 24 + (index % 2) * 14;
    return { x, y, w, h };
  }

  // 4 or more enemies
  const w = 120;
  const h = 195;
  const gap = 14;
  const x = 28 + index * (w + gap);
  const y = deckY - h + 24 + (index % 2) * 14;
  return { x, y, w, h };
}

/**
 * Sizing and positioning for party combatants on the right side of the shared ground plane.
 * Units stand in battle formation facing left, grounded at the same deckY.
 */
export function getPartyCombatantBounds(
  _totalParty: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  const { deckY } = LAYOUT;
  const w = 130;
  const h = 210;
  const spacing = 110;
  const startX = 540;
  const staggerY = (index % 2) * 12;

  const x = startX + index * spacing;
  const y = deckY - h + 24 + staggerY;
  return { x, y, w, h };
}

/**
 * Sizing and positioning for the right-aligned floating party status column entries.
 */
export function getPartyStatusColumnBounds(
  _totalParty: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  const { partyColumnX, partyColumnY, partyColumnWidth, partyColumnSlotHeight } = LAYOUT;
  const x = partyColumnX;
  const y = partyColumnY + index * partyColumnSlotHeight;
  const w = partyColumnWidth;
  const h = partyColumnSlotHeight - 8;
  return { x, y, w, h };
}

/**
 * Calculates contextual floating command menu position relative to the acting party member.
 */
export function getContextualMenuBounds(
  partyIndex: number,
  totalParty: number = 4
): { x: number; y: number; w: number; h: number } {
  const heroBounds = getPartyCombatantBounds(totalParty, partyIndex);
  const w = LAYOUT.contextMenuWidth;
  const h = LAYOUT.contextMenuHeight;

  // Position menu immediately to the left of the acting hero
  let x = heroBounds.x - w - 12;
  if (x < 24) x = heroBounds.x + heroBounds.w + 12; // Flip right if constrained
  let y = heroBounds.y - 18;
  if (y + h > LAYOUT.canvasHeight - 16) {
    y = LAYOUT.canvasHeight - 16 - h;
  }
  return { x, y, w, h };
}

/**
 * Legacy compatibility alias for party cards.
 */
export function getPartyCardBounds(
  totalParty: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  return getPartyStatusColumnBounds(totalParty, index);
}
