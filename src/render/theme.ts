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

  // 1. Top status / mode header
  headerY: 4,
  headerHeight: 22,

  // 2. Turn queue banner
  queueY: 28,
  queueHeight: 40,

  // 3. Battlefield arena (Enemies focus - upper 55-60%, no dead space)
  arenaY: 72,
  arenaHeight: 406,
  arenaX: 20,
  arenaWidth: 984,

  // 4. Party horizontal status strip (Lower third)
  partyStripY: 482,
  partyStripHeight: 92,
  partyStripX: 20,
  partyStripWidth: 984,

  // 5. Bottom tactical console (Command menu left, Combat log right)
  bottomY: 580,
  bottomHeight: 180,
  menuX: 20,
  menuWidth: 480,
  logX: 512,
  logWidth: 492,

  // Legacy aliases
  partyX: 20,
  partyWidth: 984,
  enemyX: 20,
  enemyWidth: 984,
};

/**
 * Calculates card geometry for enemies sized to content in the battlefield arena.
 * Dynamically scales and centers based on enemy count.
 */
export function getEnemyCardBounds(
  totalEnemies: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  const { arenaX, arenaY, arenaWidth, arenaHeight } = LAYOUT;

  if (totalEnemies <= 1) {
    const w = 280;
    const h = 260;
    const x = arenaX + (arenaWidth - w) / 2;
    const y = arenaY + (arenaHeight - h) / 2;
    return { x, y, w, h };
  }

  if (totalEnemies === 2) {
    const w = 250;
    const h = 260;
    const gap = 60;
    const totalW = w * 2 + gap;
    const startX = arenaX + (arenaWidth - totalW) / 2;
    const x = startX + index * (w + gap);
    const y = arenaY + (arenaHeight - h) / 2;
    return { x, y, w, h };
  }

  if (totalEnemies === 3) {
    const w = 220;
    const h = 250;
    const gap = 36;
    const totalW = w * 3 + gap * 2;
    const startX = arenaX + (arenaWidth - totalW) / 2;
    const x = startX + index * (w + gap);
    const y = arenaY + (arenaHeight - h) / 2;
    return { x, y, w, h };
  }

  // 4 or more enemies
  const w = 200;
  const h = 240;
  const gap = 20;
  const totalW = w * totalEnemies + gap * (totalEnemies - 1);
  const startX = arenaX + Math.max(0, (arenaWidth - totalW) / 2);
  const x = startX + index * (w + gap);
  const y = arenaY + (arenaHeight - h) / 2;
  return { x, y, w, h };
}

/**
 * Calculates battlefield arena positioning for party units standing grounded in the environment.
 */
export function getPartyCombatantBounds(
  totalParty: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  const { arenaX, arenaY, arenaWidth, arenaHeight } = LAYOUT;
  // Position party standing in formation on the stage floor
  const startX = arenaX + Math.floor(arenaWidth * 0.54);
  const availableWidth = Math.floor(arenaWidth * 0.44);
  const cardW = Math.min(105, Math.floor((availableWidth - 12 * (totalParty - 1)) / Math.max(1, totalParty)));
  const totalW = cardW * totalParty + 12 * (totalParty - 1);
  const x = startX + Math.floor((availableWidth - totalW) / 2) + index * (cardW + 12);
  const y = arenaY + 30;
  const w = cardW;
  const h = arenaHeight - 40;
  return { x, y, w, h };
}

/**
 * Calculates card geometry for party members in the bottom horizontal strip.
 */
export function getPartyCardBounds(
  totalParty: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  const { partyStripX, partyStripY, partyStripWidth, partyStripHeight } = LAYOUT;
  const gap = 12;
  const w = (partyStripWidth - gap * (totalParty - 1)) / totalParty;
  const x = partyStripX + index * (w + gap);
  const y = partyStripY;
  const h = partyStripHeight;
  return { x, y, w, h };
}
