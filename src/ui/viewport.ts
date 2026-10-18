import type { ViewportMode } from '../types';

export const VIRTUAL_CANVAS_WIDTH = 800;
export const VIRTUAL_CANVAS_HEIGHT = 500;
export const MOBILE_TOUCH_OFFSET_Y = -48;

export interface BoundingRectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VirtualPoint {
  x: number;
  y: number;
  rawY: number;
  isTouch: boolean;
}

export function computeViewportMode(widthPx: number, heightPx: number): ViewportMode {
  if (widthPx < 768) {
    return heightPx >= widthPx ? 'mobile-portrait' : 'mobile-landscape';
  }
  if (widthPx < 920 && heightPx < 560) {
    return 'mobile-landscape';
  }
  return 'desktop';
}

export function clientToVirtualCanvas(
  clientX: number,
  clientY: number,
  rect: BoundingRectLike,
  pointerType: string = 'mouse',
  applyTouchOffset: boolean = false
): VirtualPoint {
  const safeWidth = Math.max(1, rect.width);
  const safeHeight = Math.max(1, rect.height);
  const normX = Math.max(0, Math.min(1, (clientX - rect.left) / safeWidth));
  const normY = Math.max(0, Math.min(1, (clientY - rect.top) / safeHeight));

  const x = normX * VIRTUAL_CANVAS_WIDTH;
  const rawY = normY * VIRTUAL_CANVAS_HEIGHT;
  const isTouch = pointerType === 'touch';

  const offsetY = isTouch && applyTouchOffset ? MOBILE_TOUCH_OFFSET_Y : 0;
  const y = Math.max(16, Math.min(VIRTUAL_CANVAS_HEIGHT - 16, rawY + offsetY));

  return { x, y, rawY, isTouch };
}

export function syncCanvasHiDpi(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  devicePixelRatio: number = 1
): { width: number; height: number; scale: number } {
  const dpr = Math.max(1, Math.min(3, devicePixelRatio || 1));
  const targetCssWidth = Math.max(280, Math.floor(cssWidth));
  const aspect = VIRTUAL_CANVAS_HEIGHT / VIRTUAL_CANVAS_WIDTH;
  const targetCssHeight = Math.round(targetCssWidth * aspect);

  const backingW = Math.round(targetCssWidth * dpr);
  const backingH = Math.round(targetCssHeight * dpr);

  if (canvas.width !== backingW || canvas.height !== backingH) {
    canvas.width = backingW;
    canvas.height = backingH;
  }

  return {
    width: targetCssWidth,
    height: targetCssHeight,
    scale: backingW / VIRTUAL_CANVAS_WIDTH,
  };
}
