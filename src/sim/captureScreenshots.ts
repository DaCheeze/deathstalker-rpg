/**
 * Automated Screenshot Capture for Pass 16 Octopath UI Verification.
 * Captures 1920x1080 screenshots of Empire, Shub, Hadenman, and Post-FX OFF.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { requireValue } from '../core/invariant';

interface CDPResponse {
  id: number;
  result?: {
    data?: string;
    result?: {
      value?: unknown;
    };
  };
}

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

class CDPClient {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, (res: CDPResponse) => void>();

  constructor(private wsUrl: string) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e: Event) => reject(e);
      this.ws.onmessage = (event: { data: unknown }) => {
        const parsed = JSON.parse(event.data?.toString() || '{}') as CDPResponse;
        if (parsed.id && this.pending.has(parsed.id)) {
          requireValue(this.pending.get(parsed.id), `Pending CDP request not found: ${parsed.id}`)(parsed);
          this.pending.delete(parsed.id);
        }
      };
    });
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<CDPResponse> {
    return new Promise((resolve) => {
      const id = this.nextId++;
      this.pending.set(id, resolve);
      requireValue(this.ws, 'CDP WebSocket is not connected').send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr: string): Promise<unknown> {
    const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result?.result?.value;
  }

  async sendKey(key: string, code: string, keyCode: number): Promise<void> {
    await this.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await delay(30);
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await delay(50);
  }

  async captureScreenshot(outputPath: string): Promise<void> {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res.result?.data) {
      const buf = Buffer.from(res.result.data, 'base64');
      fs.writeFileSync(outputPath, buf);
      console.log(`Saved screenshot: ${outputPath}`);
    }
  }

  close(): void {
    if (this.ws) this.ws.close();
  }
}

async function main(): Promise<void> {
  const artifactDir = 'C:\\Users\\Daniel\\.gemini\\antigravity\\brain\\b535174e-846f-4064-b86d-14d720582fb2';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\Users\\Daniel\\AppData\\Local\\Temp\\chrome-capture-profile';

  console.log('Launching Headless Chrome for Pass 16 Octopath Screenshots...');
  const chromeProc = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=9223',
      `--user-data-dir=${userDataDir}`,
      '--window-size=1920,1080',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      'http://localhost:5173/',
    ],
    { stdio: 'ignore' }
  );

  try {
    for (let i = 0; i < 20; i++) {
      await delay(500);
      try {
        await fetchJson('http://localhost:9223/json/version');
        break;
      } catch {
        // waiting
      }
    }

    const tabs = await fetchJson<Array<{ webSocketDebuggerUrl: string; url: string }>>('http://localhost:9223/json/list');
    const targetTab = tabs.find((t) => t.url.includes('localhost:5173')) || tabs[0];
    if (!targetTab) throw new Error('No target tab found');

    const cdp = new CDPClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Waiting for game to load...');
    await delay(2500);

    // 1. Capture Empire Live Encounter (Party turn with contextual menu open)
    console.log('Capturing Empire encounter...');
    await cdp.captureScreenshot(path.join(artifactDir, 'octopath_empire_turn.png'));

    // 2. Capture with Post-Processing OFF (P key)
    console.log('Toggling Post-Processing OFF (P key)...');
    await cdp.sendKey('p', 'KeyP', 80);
    await delay(300);
    await cdp.captureScreenshot(path.join(artifactDir, 'octopath_postfx_off.png'));

    // Toggle Post-Processing back ON
    await cdp.sendKey('p', 'KeyP', 80);
    await delay(300);

    // 3. Switch to Replay mode (R key) and select Shub (2 key)
    console.log('Switching to Replay mode and selecting Shub encounter...');
    await cdp.sendKey('r', 'KeyR', 82);
    await delay(500);
    await cdp.sendKey('2', 'Digit2', 50);
    await delay(800);
    await cdp.captureScreenshot(path.join(artifactDir, 'octopath_shub_turn.png'));

    // 4. Select Hadenman encounter (5 key)
    console.log('Selecting Hadenman encounter (5 key)...');
    await cdp.sendKey('5', 'Digit5', 53);
    await delay(800);
    await cdp.captureScreenshot(path.join(artifactDir, 'octopath_hadenman_turn.png'));

    console.log('All screenshots captured successfully!');
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

main().catch(console.error);
