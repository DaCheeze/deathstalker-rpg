/**
 * DOM Input Handler for keyboard and mouse events.
 * Translates canvas coordinates and keystrokes into UI intents.
 */

import { LAYOUT } from '../render/theme';

export interface CanvasClickEvent {
  canvasX: number;
  canvasY: number;
}

export type InputCallback = (action: string, payload?: unknown) => void;

export class InputManager {
  private listeners: InputCallback[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.bindEvents();
  }

  public onInput(cb: InputCallback): void {
    this.listeners.push(cb);
  }

  private emit(action: string, payload?: unknown): void {
    for (const cb of this.listeners) {
      cb(action, payload);
    }
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key;

      if (key === 'm' || key === 'M') {
        this.emit('MUTE_TOGGLE');
      } else if (key === 'n' || key === 'N') {
        this.emit('RESTART');
      } else if (key === 'r' || key === 'R') {
        this.emit('REPLAY_TOGGLE');
      } else if (key === 'p' || key === 'P') {
        this.emit('POST_FX_TOGGLE');
      } else if (key === 'f' || key === 'F') {
        this.emit('PERF_HUD_TOGGLE');
      } else if (key === 'l' || key === 'L') {
        this.emit('LOG_TOGGLE');
      } else if (e.shiftKey && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
        this.emit('LAYER_TOGGLE', parseInt(key, 10));
      } else if (key === '0') {
        this.emit('LAYER_RESET');
      } else if (['1', '2', '3', '4', '5', '6'].includes(key)) {
        this.emit('NUMKEY', parseInt(key, 10));
      } else if (key === 'Escape' || key === 'Backspace') {
        this.emit('CANCEL');
      } else if (key === 'Enter') {
        this.emit('CONFIRM');
      } else if (key === ' ') {
        e.preventDefault();
        this.emit('SPACE');
      } else if (key === 'ArrowLeft') {
        this.emit('STEP_PREV');
      } else if (key === 'ArrowRight') {
        this.emit('STEP_NEXT');
      } else if (key === 'ArrowUp') {
        this.emit('NAV_UP');
      } else if (key === 'ArrowDown') {
        this.emit('NAV_DOWN');
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = LAYOUT.canvasWidth / rect.width;
      const scaleY = LAYOUT.canvasHeight / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      this.emit('CLICK', { canvasX, canvasY } as CanvasClickEvent);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = LAYOUT.canvasWidth / rect.width;
      const scaleY = LAYOUT.canvasHeight / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      this.emit('MOUSEMOVE', { canvasX, canvasY } as CanvasClickEvent);
    });
  }
}
