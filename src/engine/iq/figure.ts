import type { CellSpec, FigureSpec, ShapeKind, ShapeSpec } from '../types';

const DEFAULT_SHAPE: Omit<ShapeSpec, 'kind'> = {
  rotation: 0,
  filled: false,
  size: 0.6,
  x: 0.5,
  y: 0.5,
};

/** 기본값이 채워진 도형을 만든다. 생성기가 쓰는 유일한 생성 경로. */
export function shape(kind: ShapeKind, overrides: Partial<Omit<ShapeSpec, 'kind'>> = {}): ShapeSpec {
  return { kind, ...DEFAULT_SHAPE, ...overrides };
}

export function emptyCell(): CellSpec {
  return { shapes: [] };
}

/** 도형 하나를 순서 무관 비교가 가능한 문자열로 만든다. */
function shapeKey(s: ShapeSpec): string {
  return [s.kind, s.rotation, s.filled ? 1 : 0, s.size, s.x, s.y].join('|');
}

/**
 * 셀 비교. 도형의 나열 순서는 무시한다 —
 * 같은 도형 두 개가 순서만 다르게 담겼다고 다른 그림이 되지는 않는다.
 */
export function cellEquals(a: CellSpec, b: CellSpec): boolean {
  if (a.shapes.length !== b.shapes.length) return false;
  const ka = a.shapes.map(shapeKey).sort();
  const kb = b.shapes.map(shapeKey).sort();
  return ka.every((k, i) => k === kb[i]);
}

export function figureEquals(a: FigureSpec, b: FigureSpec): boolean {
  if (a.kind !== b.kind) return false;
  if (a.cells.length !== b.cells.length) return false;
  return a.cells.every((c, i) => {
    const other = b.cells[i];
    return other !== undefined && cellEquals(c, other);
  });
}
