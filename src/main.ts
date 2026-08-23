/**
 * Application Bootstrap.
 * Validates data schemas, initialises the Canvas renderer, input manager,
 * live battle controller, and replay controller.
 */

import {
  validateAbilities,
  validateCombatants,
  validateEncounter,
  validateEncounters,
} from './core/validator';
import { BattleCanvasRenderer } from './render/canvas';
import { CanvasClickEvent, InputManager } from './ui/input';
import { BattleController } from './ui/battleController';
import { ReplayController } from './ui/replayController';
import { globalAudio } from './audio/synth';
import { SAMPLE_REPLAYS } from './data/sampleReplays';
import { LAYOUT } from './render/theme';
import { TunerController } from './ui/tuner';
import { CompositorPerfRunner } from './ui/perfRunner';
import { requireValue } from './core/invariant';

import abilitiesJson from './data/abilities.json';
import partyJson from './data/party.json';
import enemiesJson from './data/enemies.json';
import encountersJson from './data/encounters.json';
import rangeBandPrototypeJson from './data/range-band-prototype.json';

function initApp(): void {
  const urlParams = new URLSearchParams(window.location.search);

  // Check for Dev Performance Benchmark route / mode
  const isPerfRoute = window.location.pathname.startsWith('/perf') || window.location.search.includes('mode=perf');
  if (isPerfRoute) {
    const appContainer = document.getElementById('app') || document.body;
    appContainer.innerHTML = '<div id="perf-root"></div>';
    const perfRoot = requireValue(document.getElementById('perf-root'), 'Performance root was not created');
    new CompositorPerfRunner(perfRoot);
    return;
  }

  // Check for Dev Tuner route / mode
  const isTunerRoute = window.location.pathname.startsWith('/tuner') || window.location.search.includes('mode=tuner');
  if (isTunerRoute) {
    const appContainer = document.getElementById('app') || document.body;
    appContainer.innerHTML = '<div id="tuner-root"></div>';
    const tunerRoot = requireValue(document.getElementById('tuner-root'), 'Tuner root was not created');
    new TunerController(tunerRoot);
    return;
  }

  const canvas = document.getElementById('battle-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error("Target canvas element '#battle-canvas' not found in DOM");
  }

  // 1. Validate content data at startup
  const abilities = validateAbilities(abilitiesJson);
  const partyRecord = validateCombatants(partyJson, 'party');
  const enemiesRecord = validateCombatants(enemiesJson, 'enemies');
  const encountersRecord = validateEncounters(encountersJson);
  const prototypePartyRecord = validateCombatants(rangeBandPrototypeJson.party, 'rangeBandPrototype.party');
  const prototypeEnemiesRecord = validateCombatants(rangeBandPrototypeJson.enemies, 'rangeBandPrototype.enemies');
  const prototypeEncounter = validateEncounter(rangeBandPrototypeJson.encounter, 'rangeBandPrototype.encounter');
  const isRangeBandPrototype = urlParams.get('mode') === 'range-band';
  const activeParty = isRangeBandPrototype ? Object.values(prototypePartyRecord) : Object.values(partyRecord);
  const activeEnemies = isRangeBandPrototype ? prototypeEnemiesRecord : enemiesRecord;
  const encountersList = isRangeBandPrototype ? [prototypeEncounter] : Object.values(encountersRecord);

  // 2. Instantiate Input, Renderer, and Controllers
  const input = new InputManager(canvas);
  const renderer = new BattleCanvasRenderer(canvas);
  const battleController = new BattleController(
    activeParty,
    activeEnemies,
    abilities,
    encountersList,
    input
  );
  const replayController = new ReplayController(abilities);

  let isReplayMode = false;
  const enterReplayMode = (): void => {
    battleController.suspend();
    replayController.resetFeedback();
    isReplayMode = true;
  };
  const exitReplayMode = (): void => {
    replayController.resetFeedback();
    isReplayMode = false;
    battleController.resume();
  };
  const sampleKeys = Object.keys(SAMPLE_REPLAYS);

  // Check URL query params for initial replay
  const replayParam = urlParams.get('replay');
  const seedParam = urlParams.get('seed');
  const encParam = urlParams.get('enc');

  if (replayParam && SAMPLE_REPLAYS[replayParam]) {
    replayController.loadReplay(requireValue(SAMPLE_REPLAYS[replayParam], `Replay not found: ${replayParam}`), replayParam);
    isReplayMode = true;
  } else if (encParam) {
    const targetSeed = seedParam ? parseInt(seedParam, 10) : undefined;
    const matchedKey = sampleKeys.find((k) => {
      const matchEnc = k.includes(encParam);
      const matchSeed = targetSeed ? SAMPLE_REPLAYS[k]?.seed === targetSeed : true;
      return matchEnc && matchSeed && k.includes('median');
    }) || sampleKeys.find((k) => k.includes(encParam)) || sampleKeys[0];

    if (matchedKey && SAMPLE_REPLAYS[matchedKey]) {
      replayController.loadReplay(requireValue(SAMPLE_REPLAYS[matchedKey], `Replay not found: ${matchedKey}`), matchedKey);
      isReplayMode = true;
    }
  } else if (sampleKeys.length > 0) {
    // Default loaded sample if user switches to replay mode
    const firstKey = requireValue(sampleKeys[0], 'Sample replay key list unexpectedly empty');
    replayController.loadReplay(requireValue(SAMPLE_REPLAYS[firstKey], `Replay not found: ${firstKey}`), firstKey);
  }

  if (isReplayMode) battleController.suspend();

  // 3. Global Input Dispatcher (handles Mode switches, Audio toggles, Replay Scrubbing)
  input.onInput((type, payload) => {
    if (type === 'MUTE_TOGGLE') {
      globalAudio.toggleMute();
      return;
    }

    if (type === 'POST_FX_TOGGLE') {
      const enabled = renderer.togglePostProcessing();
      console.log(`[HD-2D Compositor] Post-Processing: ${enabled ? 'ENABLED' : 'DISABLED'}`);
      return;
    }

    if (type === 'PERF_HUD_TOGGLE') {
      const shown = renderer.togglePerfOverlay();
      console.log(`[HD-2D Compositor] Profiler HUD: ${shown ? 'SHOWN' : 'HIDDEN'}`);
      return;
    }

    if (type === 'LAYER_TOGGLE') {
      const layerIdx = (payload as number) - 1;
      const layerIds: import('./render/compositor').LayerId[] = [
        'starfield_void',
        'far_backdrop',
        'stage_floor',
        'enemy_units',
        'party_units',
        'emissive_pass',
        'foreground_occluders',
        'post_processing',
        'ui_and_menus',
      ];
      if (layerIds[layerIdx]) {
        const lId = layerIds[layerIdx];
        const state = renderer.toggleLayer(lId);
        console.log(`[HD-2D Compositor] Layer '${lId}': ${state ? 'ENABLED' : 'DISABLED'}`);
      }
      return;
    }

    if (type === 'LAYER_RESET') {
      renderer.getCompositor().enableAllLayers();
      console.log('[HD-2D Compositor] All layers enabled');
      return;
    }

    if (type === 'REPLAY_TOGGLE') {
      if (isReplayMode) {
        exitReplayMode();
      } else {
        enterReplayMode();
      }
      globalAudio.playMenuConfirm();
      return;
    }

    if (isReplayMode) {
      if (type === 'CANCEL') {
        exitReplayMode();
        globalAudio.playMenuCancel();
      } else if (type === 'SPACE') {
        replayController.togglePlay();
      } else if (type === 'STEP_PREV') {
        replayController.stepBackward();
        globalAudio.playMenuMove();
      } else if (type === 'STEP_NEXT') {
        replayController.stepForward();
        globalAudio.playMenuMove();
      } else if (type === 'NUMKEY') {
        const num = payload as number;
        // Map 1-5 to the 5 encounter median replays
        const encounterIds = [
          'enc_empire_skirmish',
          'enc_shub_skirmish',
          'enc_empire_patrol',
          'enc_shub_swarm',
          'enc_hadenman_vanguard',
        ];
        const chosenEnc = encounterIds[num - 1];
        if (chosenEnc) {
          const key = `${chosenEnc}_median`;
          const replay = SAMPLE_REPLAYS[key];
          if (replay) {
            replayController.loadReplay(replay, `${replay.encounterTier.toUpperCase()} MEDIAN`);
            globalAudio.playMenuConfirm();
          }
        }
      } else if (type === 'CLICK') {
        const { canvasX, canvasY } = payload as CanvasClickEvent;
        const { menuX, bottomY, menuWidth, canvasWidth } = LAYOUT;

        // Top right mute click
        if (canvasX >= canvasWidth - 160 && canvasX <= canvasWidth - 10 && canvasY >= 5 && canvasY <= 32) {
          globalAudio.toggleMute();
          return;
        }

        // Top left mode toggle click
        if (canvasX >= 20 && canvasX <= 280 && canvasY >= 5 && canvasY <= 32) {
          exitReplayMode();
          globalAudio.playMenuCancel();
          return;
        }

        // Replay Controls interaction inside bottom panel
        if (canvasX >= menuX && canvasX <= menuX + menuWidth && canvasY >= bottomY) {
          const scrubX = menuX + 10;
          const scrubY = bottomY + 70;
          const scrubW = menuWidth - 20;
          const scrubH = 14;

          // Check scrub bar click
          if (canvasX >= scrubX && canvasX <= scrubX + scrubW && canvasY >= scrubY - 4 && canvasY <= scrubY + scrubH + 4) {
            const pct = Math.max(0, Math.min(1, (canvasX - scrubX) / scrubW));
            const hud = replayController.getHUDState();
            if (hud) {
              const targetIdx = Math.round(pct * hud.totalActions);
              replayController.scrubTo(targetIdx);
              globalAudio.playMenuMove();
            }
            return;
          }

          // Check buttons row (Y ~ bottomY + 96)
          const btnY = bottomY + 96;
          const btnH = 26;

          if (canvasY >= btnY && canvasY <= btnY + btnH) {
            // Play / Pause button
            if (canvasX >= menuX + 10 && canvasX <= menuX + 120) {
              replayController.togglePlay();
              return;
            }
            // Step Back
            if (canvasX >= menuX + 126 && canvasX <= menuX + 204) {
              replayController.stepBackward();
              globalAudio.playMenuMove();
              return;
            }
            // Step Next
            if (canvasX >= menuX + 208 && canvasX <= menuX + 286) {
              replayController.stepForward();
              globalAudio.playMenuMove();
              return;
            }
            // Speed Buttons: [0.5x], [1x], [2x], [4x], [MAX]
            const speedX = menuX + 294;
            const spdW = 32;
            const speeds = [0.5, 1, 2, 4, 10];
            speeds.forEach((s, idx) => {
              const bX = speedX + idx * (spdW + 4);
              if (canvasX >= bX && canvasX <= bX + spdW) {
                replayController.setSpeed(s);
                globalAudio.playMenuMove();
              }
            });
            return;
          }
        }
      }
    }
  });

  // 4. Main 60 FPS Canvas Render Loop
  function renderLoop(): void {
    if (isReplayMode) {
      replayController.update();
      const state = replayController.getBattleState();
      const hudState = replayController.getHUDState();

      const activeDelta = renderer.render(
        state,
        battleController.getUIState(),
        false,
        null,
        null,
        hudState
      );
      replayController.advanceFeedback(activeDelta);
    } else {
      const state = battleController.getState();
      const uiState = battleController.getUIState();
      const isPlayerTurn = battleController.isPlayerTurn();

      const activeDelta = renderer.render(
        state,
        uiState,
        isPlayerTurn,
        uiState.selectedTargetId,
        uiState.selectedTargetId,
        null
      );
      battleController.advanceFeedback(activeDelta);
    }

    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
