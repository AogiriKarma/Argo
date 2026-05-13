/**
 * Map calibration — copied from the old Map/data.js.
 * The map images are rendered into a 900×900 logical coordinate space.
 * Markers position themselves in that space via gameToPixel().
 */
export const MAP_SIZE = 900;

export interface Calibration {
  centerPixel: { x: number; y: number };
  centerGame: { x: number; y: number };
  radiusPixel: number;
  radiusGame: number;
}

export const MAP_CALIBRATION: Record<number, Calibration> = {
  1: { centerPixel: { x: 450, y: 450 }, centerGame: { x: 2545.6, y: 2550 }, radiusPixel: 450, radiusGame: 2498.1 },
  2: { centerPixel: { x: 450, y: 450 }, centerGame: { x: -1.3, y: 0.8 },   radiusPixel: 450, radiusGame: 1072.5 },
  3: { centerPixel: { x: 450, y: 450 }, centerGame: { x: 597, y: 771 },    radiusPixel: 450, radiusGame: 850 }
};

export const FLOOR_NAMES: Record<number, string> = {
  1: 'Villes Européennes',
  2: 'Désert Aride',
  3: 'Forêt Elfique'
};

export function gameToPixel(floor: number, gx: number, gy: number): { x: number; y: number } | null {
  const c = MAP_CALIBRATION[floor];
  if (!c) return null;
  const scale = c.radiusPixel / c.radiusGame;
  return {
    x: c.centerPixel.x + (gx - c.centerGame.x) * scale,
    y: c.centerPixel.y + (gy - c.centerGame.y) * scale
  };
}

/**
 * Determine which floor an entity belongs to.
 * Convention from old code: P1 → floor 1, P2 → floor 2, P3 → floor 3.
 * Returns null if no palier known.
 */
export function floorForPalier(palier?: number): number | null {
  if (palier && palier >= 1 && palier <= 3) return palier;
  return null;
}
