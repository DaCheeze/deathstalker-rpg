/**
 * Sci-Fi Visual Theme and Layout Constants.
 * Crisp space opera aesthetic: dark slate, neon cyan, amber warning, plasma magenta, crimson.
 * Design resolution: 1920×1080 (native HD).
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
  fontHeader: "18px 'Courier New', monospace",
  fontBody: "15px 'Courier New', monospace",
  fontSmall: "13px 'Courier New', monospace",
  fontLarge: "bold 20px 'Courier New', monospace",
  fontBanner: "bold 28px 'Courier New', monospace",
};

export const LAYOUT = {
  canvasWidth: 1920,
  canvasHeight: 1080,

  // 1. Single shared battlefield stage floor ground line (62.5% of frame height)
  deckY: 675,

  // 2. Battlefield arena bounds
  arenaX: 38,
  arenaWidth: 1844,
  arenaY: 225,
  arenaHeight: 620,

  // 3. Top-left turn queue bounds
  queueX: 40,
  queueY: 30,
  queueWidth: 600,
  queueHeight: 65,

  // 4. Top-right party status column bounds
  partyColumnX: 1560,
  partyColumnY: 36,
  partyColumnWidth: 330,
  partyColumnSlotHeight: 85,

  // 5. Contextual command menu default dimensions
  contextMenuWidth: 200,
  contextMenuHeight: 225,

  // Header & legacy aliases
  headerY: 6,
  headerHeight: 32,
  partyStripY: 680,
  partyStripHeight: 130,
  partyStripX: 38,
  partyStripWidth: 1844,
  bottomY: 820,
  bottomHeight: 250,
  menuX: 38,
  menuWidth: 700,
  logX: 760,
  logWidth: 700,
  partyX: 38,
  partyWidth: 1844,
  enemyX: 38,
  enemyWidth: 1844,
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
    const w = 280;
    const h = 320;
    const x = 260;
    const y = deckY - h + 34;
    return { x, y, w, h };
  }

  if (totalEnemies === 2) {
    const w = 250;
    const h = 300;
    const gap = 70;
    const x = 130 + index * (w + gap);
    const y = deckY - h + 34 + (index % 2) * 16;
    return { x, y, w, h };
  }

  if (totalEnemies === 3) {
    const w = 220;
    const h = 280;
    const gap = 40;
    const x = 80 + index * (w + gap);
    const y = deckY - h + 34 + (index % 2) * 18;
    return { x, y, w, h };
  }

  // 4 or more enemies
  const w = 190;
  const h = 270;
  const gap = 24;
  const x = 50 + index * (w + gap);
  const y = deckY - h + 34 + (index % 2) * 18;
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
  const w = 200;
  const h = 290;
  const spacing = 170;
  const startX = 900;
  const staggerY = (index % 2) * 16;

  const x = startX + index * spacing;
  const y = deckY - h + 34 + staggerY;
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
  let x = heroBounds.x - w - 18;
  if (x < 40) x = heroBounds.x + heroBounds.w + 18; // Flip right if constrained
  let y = heroBounds.y - 24;
  if (y + h > LAYOUT.canvasHeight - 24) {
    y = LAYOUT.canvasHeight - 24 - h;
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
