// SemLiFi Circuits - Interactive Breadboard Model & Electrical Bus Strips
import { BreadboardHole } from '../types/circuit';

export const BREADBOARD_ORIGIN_X = 140;
export const BREADBOARD_ORIGIN_Y = 110;
export const HOLE_PITCH = 19; // px between standard 0.1" (2.54mm) holes
export const NUM_ROWS = 30;

export interface BreadboardGeometry {
  originX: number;
  originY: number;
  width: number;
  height: number;
  holes: BreadboardHole[];
  holeMap: Map<string, BreadboardHole>;
  strips: Map<string, string[]>; // stripId -> holeIds
}

export function generateBreadboardModel(
  originX = BREADBOARD_ORIGIN_X,
  originY = BREADBOARD_ORIGIN_Y
): BreadboardGeometry {
  const holes: BreadboardHole[] = [];
  const holeMap = new Map<string, BreadboardHole>();
  const strips = new Map<string, string[]>();

  const addHole = (id: string, row: number, col: string, x: number, y: number, stripId: string) => {
    const hole: BreadboardHole = {
      id,
      row,
      col,
      x,
      y,
      stripId,
      connectedPinIds: []
    };
    holes.push(hole);
    holeMap.set(id, hole);

    if (!strips.has(stripId)) {
      strips.set(stripId, []);
    }
    strips.get(stripId)!.push(id);
  };

  const topRailY_Pos = originY + 24;
  const topRailY_Neg = originY + 44;
  const terminalTopY = originY + 76;
  const centerGutterHeight = 24;
  const terminalBotY = terminalTopY + 5 * HOLE_PITCH + centerGutterHeight;
  const botRailY_Pos = terminalBotY + 5 * HOLE_PITCH + 22;
  const botRailY_Neg = botRailY_Pos + 20;

  const leftMargin = originX + 50;

  for (let r = 1; r <= NUM_ROWS; r++) {
    const holeX = leftMargin + (r - 1) * HOLE_PITCH;

    // Top power rails (continuous horizontal strips)
    addHole(`TP_${r}`, r, '+', holeX, topRailY_Pos, 'STRIP_TOP_POS');
    addHole(`TN_${r}`, r, '-', holeX, topRailY_Neg, 'STRIP_TOP_NEG');

    // Terminal columns a - e (electrically common 5-hole strip for this row)
    const leftStripId = `STRIP_ROW_${r}_LEFT`;
    const leftCols = ['a', 'b', 'c', 'd', 'e'];
    leftCols.forEach((col, idx) => {
      const holeY = terminalTopY + idx * HOLE_PITCH;
      addHole(`${col.toUpperCase()}${r}`, r, col, holeX, holeY, leftStripId);
    });

    // Terminal columns f - j (electrically common 5-hole strip for this row)
    const rightStripId = `STRIP_ROW_${r}_RIGHT`;
    const rightCols = ['f', 'g', 'h', 'i', 'j'];
    rightCols.forEach((col, idx) => {
      const holeY = terminalBotY + idx * HOLE_PITCH;
      addHole(`${col.toUpperCase()}${r}`, r, col, holeX, holeY, rightStripId);
    });

    // Bottom power rails
    addHole(`BP_${r}`, r, '+', holeX, botRailY_Pos, 'STRIP_BOT_POS');
    addHole(`BN_${r}`, r, '-', holeX, botRailY_Neg, 'STRIP_BOT_NEG');
  }

  const width = NUM_ROWS * HOLE_PITCH + 90;
  const height = botRailY_Neg - originY + 35;

  return {
    originX,
    originY,
    width,
    height,
    holes,
    holeMap,
    strips
  };
}

// Find closest hole within snapping threshold
export function findClosestHole(
  x: number,
  y: number,
  holes: BreadboardHole[],
  snapRadius = 14
): BreadboardHole | null {
  let closest: BreadboardHole | null = null;
  let minDistSq = snapRadius * snapRadius;

  for (const hole of holes) {
    const dx = hole.x - x;
    const dy = hole.y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= minDistSq) {
      minDistSq = distSq;
      closest = hole;
    }
  }

  return closest;
}

// Given any breadboard hole ID, return all hole IDs in the same electrically connected bus strip
export function getConnectedHoleIds(holeId: string, model: BreadboardGeometry): string[] {
  const hole = model.holeMap.get(holeId);
  if (!hole) return [holeId];
  return model.strips.get(hole.stripId) || [holeId];
}
