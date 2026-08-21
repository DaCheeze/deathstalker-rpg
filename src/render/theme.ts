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
  
  // Turn queue banner (top)
  queueY: 12,
  queueHeight: 52,
  
  // Combat arena (middle)
  arenaY: 76,
  arenaHeight: 410,
  partyX: 30,
  partyWidth: 380,
  enemyX: 614,
  enemyWidth: 380,
  
  // UI & Menu area (bottom)
  bottomY: 498,
  bottomHeight: 258,
  menuX: 30,
  menuWidth: 460,
  logX: 510,
  logWidth: 484,
};
