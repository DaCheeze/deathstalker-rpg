/**
 * Automated Browser Runner for HD-2D Compositor 1080p Performance Benchmark.
 * Spawns headless Chromium/Chrome, navigates to /?mode=perf,
 * and extracts the exact live requestAnimationFrame measurements.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import type { FullCompositorPerfReport } from '../ui/perfRunner';

async function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
  console.log('Launching Chrome with Remote Debugging at 1920x1080...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\Users\\Daniel\\AppData\\Local\\Temp\\chrome-perf-profile';

  const chromeProc = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--user-data-dir=${userDataDir}`,
      '--window-size=1920,1080',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      'http://localhost:5173/?mode=perf',
    ],
    { stdio: 'ignore' }
  );

  try {
    // Wait for Chrome to bind port 9222
    let connected = false;
    for (let i = 0; i < 20; i++) {
      await delay(500);
      try {
        await fetchJson('http://localhost:9222/json/version');
        connected = true;
        break;
      } catch {
        // retry
      }
    }

    if (!connected) {
      throw new Error('Failed to connect to Chrome on port 9222');
    }

    // Get active pages
    const pages = await fetchJson<Array<{ id: string; webSocketDebuggerUrl: string; url: string }>>(
      'http://localhost:9222/json/list'
    );

    const perfPage = pages.find((p) => p.url.includes('mode=perf')) || pages[0];
    if (!perfPage || !perfPage.webSocketDebuggerUrl) {
      throw new Error('Could not find benchmark page target in Chrome');
    }

    // Connect to WebSocket
    const wsUrl = perfPage.webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = (e) => reject(e);
    });

    let messageId = 0;
    const sendCommand = (method: string, params: Record<string, unknown> = {}): Promise<{ value?: unknown }> => {
      return new Promise((resolve, reject) => {
        const id = ++messageId;
        const handler = (event: { data: unknown }) => {
          const res = JSON.parse(event.data?.toString() || '{}');
          if (res.id === id) {
            ws.removeEventListener('message', handler as never);
            if (res.error) reject(new Error(JSON.stringify(res.error)));
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler as never);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    // Forward browser console logs to terminal
    ws.addEventListener('message', (event: { data: unknown }) => {
      try {
        const msg = JSON.parse(event.data?.toString() || '{}');
        if (msg.method === 'Runtime.consoleAPICalled') {
          const args = msg.params.args.map((a: { value?: unknown }) => a.value).join(' ');
          console.log(`[Browser Console] ${args}`);
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error(`[Browser Exception]`, msg.params.exceptionDetails);
        }
      } catch {
        // ignore
      }
    });

    await sendCommand('Runtime.enable');
    await sendCommand('Page.enable');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/?mode=perf' });

    console.log('Connected to Chrome. Polling for in-browser rAF benchmark completion...');

    let report: FullCompositorPerfReport | null = null;
    const startTime = Date.now();

    while (Date.now() - startTime < 35000) {
      await delay(1000);
      try {
        const res = (await sendCommand('Runtime.evaluate', {
          expression: 'window.__PERF_RESULTS__ ? JSON.stringify(window.__PERF_RESULTS__) : null',
          returnByValue: true,
        })) as { result?: { value?: string }; value?: string };
        const raw = res?.result?.value || res?.value;
        if (raw && typeof raw === 'string' && raw !== 'null') {
          report = JSON.parse(raw);
          break;
        }
      } catch {
        // continue polling
      }
    }

    if (!report) {
      throw new Error('Benchmark did not complete within timeout window (35s)');
    }

    console.log('\n================================================================');
    console.log('   OFFICIAL BROWSER rAF COMPOSITOR BENCHMARK (1920x1080)');
    console.log('================================================================\n');

    console.log('--- FRAME PRESENTATION TIMINGS ---');
    console.log(
      `• Post-Processing ON:   Avg CPU: ${report.postProcessingOn.avgCpuTimeMs.toFixed(3)} ms | Worst: ${report.postProcessingOn.worstCpuTimeMs.toFixed(3)} ms | rAF Delta: ${report.postProcessingOn.avgrAFDeltaMs.toFixed(2)} ms (${report.postProcessingOn.fps} FPS)`
    );
    console.log(
      `• Post-Processing OFF:  Avg CPU: ${report.postProcessingOff.avgCpuTimeMs.toFixed(3)} ms | Worst: ${report.postProcessingOff.worstCpuTimeMs.toFixed(3)} ms | rAF Delta: ${report.postProcessingOff.avgrAFDeltaMs.toFixed(2)} ms (${report.postProcessingOff.fps} FPS)`
    );
    console.log(
      `• Disruptor Detonation: Avg CPU: ${report.peakDisruptorDetonation.avgCpuTimeMs.toFixed(3)} ms | Worst: ${report.peakDisruptorDetonation.worstCpuTimeMs.toFixed(3)} ms | rAF Delta: ${report.peakDisruptorDetonation.avgrAFDeltaMs.toFixed(2)} ms (${report.peakDisruptorDetonation.fps} FPS)\n`
    );

    console.log('--- PER-LAYER DELTA COST BREAKDOWN (1920x1080) ---');
    console.log('┌─────────────────────────────┬────────────────────────┬──────────────────┐');
    console.log('│ Layer ID                    │ Time Without Layer     │ Delta Cost (ms)  │');
    console.log('├─────────────────────────────┼────────────────────────┼──────────────────┤');
    for (const d of report.layerDeltas) {
      const name = d.layerId.padEnd(27, ' ');
      const timeWithout = `${d.timeWithoutLayerMs.toFixed(3)} ms`.padEnd(22, ' ');
      const delta = `+${d.deltaCostMs.toFixed(3)} ms`.padEnd(16, ' ');
      console.log(`│ ${name} │ ${timeWithout} │ ${delta} │`);
    }
    console.log('└─────────────────────────────┴────────────────────────┴──────────────────┘\n');

    console.log(`60 FPS Target (<= 16.67 ms): ${report.sustained60Fps ? 'SUSTAINED (PASS)' : 'FAILED'}`);
    console.log('================================================================\n');

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('[Benchmark Error]', err);
  process.exit(1);
});
