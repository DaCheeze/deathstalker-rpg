/**
 * Interactive Browser Tuning Dashboard.
 * Dev-only pure UI panel rendered in the DOM above the canvas when accessing /tuner.
 * Provides controls for game rules, progression, equipment, levels, supply mode,
 * and live difficulty curve charts.
 */

import { GameData, loadGameData, BalanceOverrides } from '../core/configLoader';
import { TunerWorkerProgress, TunerWorkerComplete } from './tuner.worker';

export class TunerController {
  private container: HTMLElement;
  private gameData: GameData;
  private activeOverrides: BalanceOverrides = {};
  private worker: Worker | null = null;
  private isSimulating = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.gameData = loadGameData();
    this.initWorker();
    this.render();
    this.attachEventListeners();
  }

  private initWorker(): void {
    try {
      this.worker = new Worker(new URL('./tuner.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e: MessageEvent<TunerWorkerProgress | TunerWorkerComplete>) => {
        this.handleWorkerMessage(e.data);
      };

      this.worker.onerror = (err) => {
        console.error('Tuner Web Worker error:', err);
        this.updateStatus('Simulation Worker Error', true);
        this.isSimulating = false;
        this.updateRunButton();
      };
    } catch (err) {
      console.error('Failed to spawn worker:', err);
    }
  }

  private render(): void {
    const recLvl = this.gameData.rules.progression?.recommendedLevel ?? 3;

    this.container.innerHTML = `
      <div style="background:#090d16; color:#f1f5f9; min-height:100vh; font-family:'Courier New', monospace; padding:20px; box-sizing:border-box;">
        <!-- Header -->
        <header style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #1e293b; padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h1 style="font-size:20px; color:#38bdf8; margin:0 0 4px 0; letter-spacing:1px;">⚡ DEATHSTALKER COMBAT ENGINE // PROGRESSION TUNER</h1>
            <div style="font-size:11px; color:#94a3b8;">JRPG Difficulty Curve, Level Progression & Economy Tuning Dashboard</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button id="btn-back-game" style="background:#1e293b; border:1px solid #334155; color:#cbd5e1; padding:8px 14px; font-weight:bold; cursor:pointer; font-family:inherit;">◀ RETURN TO GAME</button>
            <button id="btn-copy-json" style="background:#0284c7; border:1px solid #38bdf8; color:#ffffff; padding:8px 14px; font-weight:bold; cursor:pointer; font-family:inherit;">📋 COPY OVERRIDES JSON</button>
          </div>
        </header>

        <!-- Top Control Bar -->
        <div style="background:#0f172a; border:1px solid #1e293b; padding:12px 16px; border-radius:4px; display:flex; gap:20px; align-items:center; margin-bottom:16px; flex-wrap:wrap;">
          <div>
            <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">PARTY LEVEL (1-10):</label>
            <input id="input-party-level" type="number" value="${recLvl}" min="1" max="10" step="1" style="background:#1e293b; border:1px solid #334155; color:#34d399; padding:6px 10px; font-weight:bold; width:70px; font-family:inherit;">
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">SUPPLY LOADOUT:</label>
            <select id="select-supply-mode" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:6px 10px; font-weight:bold; font-family:inherit;">
              <option value="full">Full Supply (4 Medkits / 2 Revives)</option>
              <option value="half">Half Supply (2 Medkits / 1 Revive)</option>
              <option value="none">Zero Supply (0 Medkits / 0 Revives)</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">RUNS PER MODE:</label>
            <input id="input-runs" type="number" value="200" min="50" max="2000" step="50" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:6px 10px; font-weight:bold; width:90px; font-family:inherit;">
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">SEED A:</label>
            <input id="input-seed-a" type="number" value="12345" style="background:#1e293b; border:1px solid #334155; color:#f59e0b; padding:6px 10px; font-weight:bold; width:85px; font-family:inherit;">
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">SEED B:</label>
            <input id="input-seed-b" type="number" value="98765" style="background:#1e293b; border:1px solid #334155; color:#f59e0b; padding:6px 10px; font-weight:bold; width:85px; font-family:inherit;">
          </div>
          <button id="btn-run-sim" style="background:#059669; border:1px solid #34d399; color:#ffffff; padding:8px 24px; font-weight:bold; font-size:13px; cursor:pointer; font-family:inherit; margin-left:auto;">
            ▶ RUN SIMULATION & SWEEP
          </button>
        </div>

        <!-- Progress Indicator -->
        <div id="sim-progress-bar-container" style="display:none; margin-bottom:16px; background:#0f172a; border:1px solid #1e293b; padding:10px 14px; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px;">
            <span id="sim-progress-phase" style="color:#38bdf8;">Initializing simulation worker...</span>
            <span id="sim-progress-pct" style="color:#34d399; font-weight:bold;">0%</span>
          </div>
          <div style="background:#1e293b; height:8px; border-radius:4px; overflow:hidden;">
            <div id="sim-progress-bar-fill" style="background:#10b981; width:0%; height:100%; transition:width 0.15s ease;"></div>
          </div>
        </div>

        <!-- Main Workspace: 2-Column Grid -->
        <div style="display:grid; grid-template-columns: 440px 1fr; gap:20px; align-items:start;">
          
          <!-- LEFT COLUMN: Tuning Controls -->
          <div style="display:flex; flex-direction:column; gap:16px;">
            
            <!-- Progression & Economy Accordion -->
            <div style="background:#0f172a; border:1px solid #1e293b; padding:14px; border-radius:4px;">
              <h2 style="font-size:13px; color:#34d399; margin:0 0 12px 0; border-bottom:1px solid #1e293b; padding-bottom:6px;">📈 PROGRESSION & SHOP ECONOMY</h2>
              
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                ${this.renderNumberInput('recommendedLevel', 'Recommended Lvl', this.gameData.rules.progression?.recommendedLevel ?? 3, 1, 10, 1, 'rules.progression.recommendedLevel')}
                ${this.renderNumberInput('medkitCost', 'Medkit Cost (g)', this.gameData.rules.progression?.medkitCost ?? 50, 10, 200, 10, 'rules.progression.medkitCost')}
                ${this.renderNumberInput('reviveCost', 'Revive Cost (g)', this.gameData.rules.progression?.reviveCost ?? 120, 20, 400, 10, 'rules.progression.reviveCost')}
                ${this.renderNumberInput('bonusGold', 'Expedition Gold Bonus', this.gameData.rules.progression?.expeditionBonusGold ?? 150, 0, 500, 25, 'rules.progression.expeditionBonusGold')}
              </div>
            </div>

            <!-- Global Rules Accordion -->
            <div style="background:#0f172a; border:1px solid #1e293b; padding:14px; border-radius:4px;">
              <h2 style="font-size:13px; color:#38bdf8; margin:0 0 12px 0; border-bottom:1px solid #1e293b; padding-bottom:6px;">⚙️ GLOBAL MECHANICS & INVENTORY</h2>
              
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                ${this.renderNumberInput('medkits', 'Max Medkits Carry', this.gameData.rules.progression?.maxMedkitsPerExpedition ?? 4, 0, 10, 1, 'rules.progression.maxMedkitsPerExpedition')}
                ${this.renderNumberInput('medkitHealPercent', 'Medkit Heal %', this.gameData.rules.inventory.medkitHealPercent * 100, 10, 100, 5, 'rules.inventory.medkitHealPercent', true)}
                ${this.renderNumberInput('revives', 'Max Revives Carry', this.gameData.rules.progression?.maxRevivesPerExpedition ?? 2, 0, 5, 1, 'rules.progression.maxRevivesPerExpedition')}
                ${this.renderNumberInput('reviveHealPercent', 'Revive Heal %', this.gameData.rules.inventory.reviveHealPercent * 100, 10, 100, 5, 'rules.inventory.reviveHealPercent', true)}
                ${this.renderNumberInput('boostEntryBurnout', 'Boost Entry Burnout', this.gameData.rules.boost.entryBurnout, 0, 8, 1, 'rules.boost.entryBurnout')}
                ${this.renderNumberInput('boostChipThreshold', 'Chip Burnout Threshold', this.gameData.rules.boost.chipThreshold, 1, 8, 1, 'rules.boost.chipThreshold')}
                ${this.renderNumberInput('boostDropThreshold', 'AI Boost Drop Threshold', this.gameData.rules.boost.aiDropThreshold, 1, 8, 1, 'rules.boost.aiDropThreshold')}
                ${this.renderNumberInput('disruptorCooldown', 'Disruptor Cooldown', this.gameData.rules.disruptor.baseCooldownTurns, 1, 10, 1, 'rules.disruptor.baseCooldownTurns')}
              </div>
            </div>

            <!-- Enemy Stat Tuning Accordion -->
            <div style="background:#0f172a; border:1px solid #1e293b; padding:14px; border-radius:4px;">
              <h2 style="font-size:13px; color:#f43f5e; margin:0 0 12px 0; border-bottom:1px solid #1e293b; padding-bottom:6px;">⚔️ ENEMY STATS</h2>
              
              <div style="display:flex; flex-direction:column; gap:12px; max-height:360px; overflow-y:auto; padding-right:6px;">
                ${this.renderEnemyControls('emp_legionnaire', 'Imperial Legionnaire (Skirmish / Line)')}
                ${this.renderEnemyControls('emp_guard', 'Imperial House Guard (Standard Patrol)')}
                ${this.renderEnemyControls('psi_blocker', 'Psi-Blocker Pylon')}
                ${this.renderEnemyControls('shub_drone_a', 'Shub Swarm Drone (Alpha)')}
                ${this.renderEnemyControls('shub_stalker', 'Shub Stalker (Standard Hunter)')}
                ${this.renderEnemyControls('haden_decimator', 'Hadenman Decimator (Elite Vanguard)')}
                ${this.renderEnemyControls('haden_enforcer', 'Hadenman Enforcer (Elite Enforcer)')}
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Telemetry, Difficulty Curve & Assertions -->
          <div style="display:flex; flex-direction:column; gap:16px;">
            
            <!-- Assertions Table -->
            <div style="background:#0f172a; border:1px solid #1e293b; padding:16px; border-radius:4px;">
              <h2 style="font-size:13px; color:#34d399; margin:0 0 12px 0; display:flex; justify-content:space-between; align-items:center;">
                <span>🎯 TARGET ASSERTIONS (DIFFICULTY CURVE & INVARIANTS)</span>
                <span id="assertions-overall-badge" style="font-size:11px; padding:3px 8px; border-radius:3px; background:#334155; color:#cbd5e1;">AWAITING SIMULATION</span>
              </h2>

              <div id="assertions-table-container">
                <div style="color:#64748b; font-size:11px; padding:12px 0;">Click "RUN SIMULATION & SWEEP" to execute level sweeps and evaluate balance targets.</div>
              </div>
            </div>

            <!-- Difficulty Curve Chart & Detailed Telemetry -->
            <div id="telemetry-details-container" style="display:none; background:#0f172a; border:1px solid #1e293b; padding:16px; border-radius:4px;">
              <h2 style="font-size:13px; color:#38bdf8; margin:0 0 12px 0;">📊 JRPG DIFFICULTY CURVE & ATTRITION TELEMETRY</h2>
              <div id="telemetry-charts-content"></div>
            </div>

          </div>

        </div>
      </div>
    `;
  }

  private renderNumberInput(
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    path: string,
    isPercentage = false
  ): string {
    return `
      <div>
        <label for="${id}" style="font-size:11px; color:#94a3b8; display:block; margin-bottom:3px;">${label}:</label>
        <input id="${id}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" data-override-path="${path}" data-is-pct="${isPercentage}" style="background:#1e293b; border:1px solid #334155; color:#f1f5f9; padding:5px 8px; font-size:11px; width:100%; box-sizing:border-box; font-family:inherit;">
      </div>
    `;
  }

  private renderEnemyControls(enemyId: string, label: string): string {
    const enemy = this.gameData.enemies[enemyId];
    if (!enemy) return '';

    return `
      <div style="background:#1e293b; border:1px solid #334155; padding:10px; border-radius:4px;">
        <div style="font-size:11px; font-weight:bold; color:#f43f5e; margin-bottom:8px;">${label}</div>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          ${this.renderNumberInput(`${enemyId}-hp`, 'HP', enemy.stats.hp, 10, 800, 5, `enemies.${enemyId}.stats.hp`)}
          ${this.renderNumberInput(`${enemyId}-atk`, 'ATK', enemy.stats.attack, 1, 100, 1, `enemies.${enemyId}.stats.attack`)}
          ${this.renderNumberInput(`${enemyId}-def`, 'DEF', enemy.stats.defense, 0, 50, 1, `enemies.${enemyId}.stats.defense`)}
          ${this.renderNumberInput(`${enemyId}-spd`, 'SPD', enemy.stats.speed, 0, 50, 1, `enemies.${enemyId}.stats.speed`)}
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const btnBack = document.getElementById('btn-back-game');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        window.location.href = window.location.pathname.replace('/tuner', '');
      });
    }

    const btnCopy = document.getElementById('btn-copy-json');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => this.copyOverridesJson());
    }

    const btnRun = document.getElementById('btn-run-sim');
    if (btnRun) {
      btnRun.addEventListener('click', () => this.startSimulation());
    }

    // Auto-update overrides upon input changes
    this.container.querySelectorAll<HTMLInputElement>('input[data-override-path]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const path = target.getAttribute('data-override-path');
        const isPct = target.getAttribute('data-is-pct') === 'true';
        if (!path) return;

        let val = parseFloat(target.value);
        if (isPct) val = val / 100;

        this.setOverrideValue(path, val);
      });
    });
  }

  private setOverrideValue(pathStr: string, value: number): void {
    const keys = pathStr.split('.');
    let curr: Record<string, unknown> = this.activeOverrides as unknown as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]!;
      if (!curr[k] || typeof curr[k] !== 'object') {
        curr[k] = {};
      }
      curr = curr[k] as Record<string, unknown>;
    }
    const lastKey = keys[keys.length - 1] ?? '';
    curr[lastKey] = value;
  }

  private copyOverridesJson(): void {
    const jsonStr = JSON.stringify(this.activeOverrides, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('✓ Copied active balance overrides to clipboard in balance-overrides.json format!');
    }).catch(() => {
      prompt('Copy balance-overrides.json config:', jsonStr);
    });
  }

  private startSimulation(): void {
    if (this.isSimulating || !this.worker) return;

    this.isSimulating = true;
    this.updateRunButton();

    const runsInput = document.getElementById('input-runs') as HTMLInputElement | null;
    const seedAInput = document.getElementById('input-seed-a') as HTMLInputElement | null;
    const seedBInput = document.getElementById('input-seed-b') as HTMLInputElement | null;
    const levelInput = document.getElementById('input-party-level') as HTMLInputElement | null;
    const supplySelect = document.getElementById('select-supply-mode') as HTMLSelectElement | null;

    const runs = runsInput ? parseInt(runsInput.value, 10) : 200;
    const seedA = seedAInput ? parseInt(seedAInput.value, 10) : 12345;
    const seedB = seedBInput ? parseInt(seedBInput.value, 10) : 98765;
    const partyLevel = levelInput ? parseInt(levelInput.value, 10) : 3;
    const supplyMode = (supplySelect?.value as 'full' | 'half' | 'none') || 'full';

    const progressContainer = document.getElementById('sim-progress-bar-container');
    if (progressContainer) progressContainer.style.display = 'block';

    this.worker.postMessage({
      type: 'START_SIMULATION',
      overrides: this.activeOverrides,
      runs,
      seedA,
      seedB,
      partyLevel,
      supplyMode,
    });
  }

  private handleWorkerMessage(data: TunerWorkerProgress | TunerWorkerComplete): void {
    if (data.type === 'PROGRESS') {
      const phaseEl = document.getElementById('sim-progress-phase');
      const pctEl = document.getElementById('sim-progress-pct');
      const fillEl = document.getElementById('sim-progress-bar-fill');

      if (phaseEl) phaseEl.textContent = data.phase;
      if (pctEl) pctEl.textContent = `${data.percent.toFixed(0)}%`;
      if (fillEl) fillEl.style.width = `${data.percent}%`;
    } else if (data.type === 'COMPLETE') {
      this.isSimulating = false;
      this.updateRunButton();

      const progressContainer = document.getElementById('sim-progress-bar-container');
      if (progressContainer) progressContainer.style.display = 'none';

      this.renderResults(data);
    }
  }

  private updateRunButton(): void {
    const btn = document.getElementById('btn-run-sim');
    if (btn) {
      if (this.isSimulating) {
        btn.textContent = '⏳ SIMULATING...';
        btn.style.background = '#475569';
      } else {
        btn.textContent = '▶ RUN SIMULATION & SWEEP';
        btn.style.background = '#059669';
      }
    }
  }

  private updateStatus(msg: string, isError = false): void {
    const phaseEl = document.getElementById('sim-progress-phase');
    if (phaseEl) {
      phaseEl.textContent = msg;
      phaseEl.style.color = isError ? '#ef4444' : '#38bdf8';
    }
  }

  private renderResults(data: TunerWorkerComplete): void {
    const { assertions, seedA } = data;

    // 1. Assertions Overall Badge
    const badge = document.getElementById('assertions-overall-badge');
    if (badge) {
      if (assertions.allPassed) {
        badge.textContent = '✓ ALL TARGETS MET (PASSED)';
        badge.style.background = '#065f46';
        badge.style.color = '#34d399';
      } else {
        const failCount = assertions.rows.filter((r) => !r.passed).length;
        badge.textContent = `✗ ${failCount} TARGETS OUT OF BAND (FAILED)`;
        badge.style.background = '#7f1d1d';
        badge.style.color = '#fca5a5';
      }
    }

    // 2. Assertions Table
    const tableContainer = document.getElementById('assertions-table-container');
    if (tableContainer) {
      let rowsHtml = '';
      for (const r of assertions.rows) {
        let statusBadge = r.passed
          ? '<span style="background:#065f46; color:#34d399; padding:2px 6px; border-radius:3px; font-weight:bold; font-size:10px;">PASS</span>'
          : '<span style="background:#7f1d1d; color:#fca5a5; padding:2px 6px; border-radius:3px; font-weight:bold; font-size:10px;">FAIL</span>';
        if (r.isInsufficientData) {
          statusBadge = '<span style="background:#78350f; color:#fcd34d; padding:2px 6px; border-radius:3px; font-weight:bold; font-size:10px;">NO DATA</span>';
        }

        rowsHtml += `
          <tr style="border-bottom:1px solid #1e293b;">
            <td style="padding:8px 6px; color:#f1f5f9; font-size:11px;">${r.metric}</td>
            <td style="padding:8px 6px; color:#38bdf8; font-size:11px; font-weight:bold;">${r.measured}</td>
            <td style="padding:8px 6px; color:#94a3b8; font-size:11px;">${r.targetBand}</td>
            <td style="padding:8px 6px; text-align:center;">${statusBadge}</td>
          </tr>
        `;
      }

      tableContainer.innerHTML = `
        <table style="width:100%; border-collapse:collapse; text-align:left;">
          <thead>
            <tr style="border-bottom:2px solid #334155; font-size:10px; color:#94a3b8;">
              <th style="padding:6px;">METRIC</th>
              <th style="padding:6px;">MEASURED</th>
              <th style="padding:6px;">TARGET BAND</th>
              <th style="padding:6px; text-align:center;">STATUS</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    }

    // 3. Difficulty Curve Chart & Detailed Telemetry
    const detailsContainer = document.getElementById('telemetry-details-container');
    const detailsContent = document.getElementById('telemetry-charts-content');
    if (detailsContainer && detailsContent) {
      detailsContainer.style.display = 'block';

      const sweep = seedA.sweep;
      const baseA = seedA.baseline;

      detailsContent.innerHTML = `
        <!-- Difficulty Curve Visualization -->
        <div style="margin-bottom:20px; background:#1e293b; padding:12px; border-radius:4px;">
          <div style="font-size:11px; color:#34d399; font-weight:bold; margin-bottom:10px;">JRPG DIFFICULTY CURVE (Clear Rate Across Levels):</div>
          <div style="display:flex; flex-direction:column; gap:8px; font-size:11px;">
            ${sweep.levels.map((lvl) => {
              const offsetLabel = lvl.offset === 0 ? 'Rec Level' : `Level ${lvl.offset > 0 ? '+' : ''}${lvl.offset}`;
              const rate = lvl.result.runCompletionRate;
              const barColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
              return `
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="width:140px; color:#cbd5e1;">Lvl ${lvl.level} (${offsetLabel}):</span>
                  <div style="flex:1; background:#0f172a; height:14px; border-radius:2px; overflow:hidden;">
                    <div style="background:${barColor}; width:${rate}%; height:100%;"></div>
                  </div>
                  <span style="width:80px; text-align:right; color:#38bdf8; font-weight:bold;">${rate.toFixed(1)}%</span>
                </div>
              `;
            }).join('')}
          </div>

          <div style="margin-top:12px; padding-top:8px; border-top:1px solid #334155; font-size:10px; color:#94a3b8; display:flex; justify-content:space-between;">
            <span>Supply Sensitivity: Full Supply (${sweep.supplySweep.full.runCompletionRate.toFixed(1)}%) vs Half (${sweep.supplySweep.half.runCompletionRate.toFixed(1)}%)</span>
            <span style="color:#38bdf8; font-weight:bold;">Delta: +${sweep.supplySweep.delta.toFixed(1)}%</span>
          </div>
        </div>

        <!-- Encounter Pacing & Pre-Heal Attrition -->
        <div>
          <div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">ENCOUNTER PACING & ATTRITION (At Selected Level):</div>
          <table style="width:100%; border-collapse:collapse; font-size:10px; text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid #334155; color:#94a3b8;">
                <th style="padding:4px;">ENCOUNTER</th>
                <th style="padding:4px;">TIER</th>
                <th style="padding:4px;">WIN %</th>
                <th style="padding:4px;">AVG ROUNDS</th>
                <th style="padding:4px;">HP COST %</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(baseA.encounterBreakdowns).map((e) => `
                <tr style="border-bottom:1px solid #1e293b;">
                  <td style="padding:5px 4px; color:#f1f5f9;">[F${e.index}] ${e.name}</td>
                  <td style="padding:5px 4px; color:#94a3b8;">${e.tier.toUpperCase()}</td>
                  <td style="padding:5px 4px; color:#34d399;">${(e.winRate * 100).toFixed(1)}%</td>
                  <td style="padding:5px 4px; color:#f59e0b;">${e.avgRounds.toFixed(1)} r</td>
                  <td style="padding:5px 4px; color:#f43f5e;">${e.avgHpLostPct.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }
}
