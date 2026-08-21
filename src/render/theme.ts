/**
 * Sci-Fi Visual Theme and Layout Constants.
 * Crisp space opera aesthetic: dark slate, neon cyan, amber warning, plasma magenta, crimson.
 */

export const THEME = {
  bg: '#0a0d14',
  panelBg: '#121824',
  panelBorder: '#223249',
  panelBorderActive: '#4e73df',
  
  textMain: '#e0e6ed',
  textMuted: '#7c8ba1',
  textHighlight: '#ffffff',
  textWarning: '#f6ad55',
  textDanger: '#fc8181',
  textSuccess: '#68d391',

  // Faction colors
  partyPrimary: '#38bdf8',       // Bright cyan
  partySecondary: '#0284c7',
  partyCardBg: '#0f1f33',

  empirePrimary: '#f59e0b',      // Imperial Gold / Amber
  empireCardBg: '#2a1e12',

  shubPrimary: '#a855f7',        // Rogue AI Purple
  shubCardBg: '#221330',

  hadenmanPrimary: '#ef4444',    // Augmented Red
  hadenmanCardBg: '#2b1317',

  // Mechanic colors
  disruptorReady: '#38ef7d',     // Vivid glowing green
  disruptorCharging: '#64748b',  // Dull slate
  disruptorActive: '#11998e',
  
  boostActive: '#f59e0b',        // Amber
  burnoutHigh: '#ef4444',        // Red
  forceShield: '#00f2fe',        // Cyan energy glow
  espColor: '#c084fc',           // Psionic violet
  hpColor: '#22c55e',            // Green
  hpLowColor: '#ef4444',         // Red
  
  fontFamily: "'Courier New', Courier, monospace",
  fontHeader: "14px 'Courier New', monospace",
  fontBody: "12px 'Courier New', monospace",
  fontSmall: "10px 'Courier New', monospace",
  fontLarge: "bold 16px 'Courier New', monospace",
  fontBanner: "bold 24px 'Courier New', monospace",
};

export const LAYOUT = {
  canvasWidth: 1024,
  canvasHeight: 768,

  // 1. Top status / mode header
  headerY: 8,
  headerHeight: 24,

  // 2. Turn queue banner
  queueY: 36,
  queueHeight: 48,

  // 3. Battlefield arena (Enemies focus - upper 55-60%)
  arenaY: 90,
  arenaHeight: 380,
  arenaX: 20,
  arenaWidth: 984,

  // 4. Party horizontal status strip
  partyStripY: 480,
  partyStripHeight: 98,
  partyStripX: 20,
  partyStripWidth: 984,

  // 5. Bottom tactical console (Command menu left, Combat log right)
  bottomY: 588,
  bottomHeight: 170,
  menuX: 20,
  menuWidth: 480,
  logX: 512,
  logWidth: 492,

  // Legacy aliases for backwards compatibility
  partyX: 20,
  partyWidth: 984,
  enemyX: 20,
  enemyWidth: 984,
};

/**
 * Calculates card geometry for enemies sized to content in the battlefield arena.
 */
export function getEnemyCardBounds(
  totalEnemies: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  const { arenaX, arenaY, arenaWidth, arenaHeight } = LAYOUT;

  if (totalEnemies <= 1) {
    const w = 480;
    const h = 260;
    const x = arenaX + (arenaWidth - w) / 2;
    const y = arenaY + (arenaHeight - h) / 2;
    return { x, y, w, h };
  }

  if (totalEnemies === 2) {
    const w = 440;
    const h = 260;
    const gap = 34;
    const totalW = w * 2 + gap;
    const startX = arenaX + (arenaWidth - totalW) / 2;
    const x = startX + index * (w + gap);
    const y = arenaY + (arenaHeight - h) / 2;
    return { x, y, w, h };
  }

  if (totalEnemies === 3) {
    const w = 308;
    const h = 260;
    const gap = 20;
    const totalW = w * 3 + gap * 2;
    const startX = arenaX + (arenaWidth - totalW) / 2;
    const x = startX + index * (w + gap);
    const y = arenaY + (arenaHeight - h) / 2;
    return { x, y, w, h };
  }

  // 4 or more enemies (e.g. 4 horizontal cards)
  const count = Math.min(totalEnemies, 5);
  const gap = 14;
  const w = Math.floor((arenaWidth - (count - 1) * gap) / count);
  const h = 260;
  const x = arenaX + index * (w + gap);
  const y = arenaY + (arenaHeight - h) / 2;
  return { x, y, w, h };
}

/**
 * Calculates card geometry for party members in the horizontal status strip.
 */
export function getPartyCardBounds(
  totalParty: number,
  index: number
): { x: number; y: number; w: number; h: number } {
  const { partyStripX, partyStripY, partyStripWidth, partyStripHeight } = LAYOUT;
  const count = Math.max(1, totalParty);
  const gap = 12;
  const w = Math.floor((partyStripWidth - (count - 1) * gap) / count);
  const h = partyStripHeight;
  const x = partyStripX + index * (w + gap);
  const y = partyStripY;
  return { x, y, w, h };
}
