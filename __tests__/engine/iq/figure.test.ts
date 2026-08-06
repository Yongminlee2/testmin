import { cellEquals, emptyCell, figureEquals, shape } from '@/engine/iq/figure';
import type { CellSpec, FigureSpec } from '@/engine/types';

describe('shape', () => {
  test('기본값이 채워진다', () => {
    const s = shape('circle');
    expect(s.kind).toBe('circle');
    expect(s.rotation).toBe(0);
    expect(s.filled).toBe(false);
    expect(s.size).toBeGreaterThan(0);
    expect(s.x).toBeGreaterThanOrEqual(0);
    expect(s.y).toBeGreaterThanOrEqual(0);
  });

  test('넘긴 값이 기본값을 덮는다', () => {
    const s = shape('square', { rotation: 90, filled: true, size: 0.5 });
    expect(s.rotation).toBe(90);
    expect(s.filled).toBe(true);
    expect(s.size).toBe(0.5);
  });
});

describe('cellEquals', () => {
  test('같은 도형이면 같다', () => {
    const a: CellSpec = { shapes: [shape('circle')] };
    const b: CellSpec = { shapes: [shape('circle')] };
    expect(cellEquals(a, b)).toBe(true);
  });

  test('회전이 다르면 다르다', () => {
    const a: CellSpec = { shapes: [shape('circle', { rotation: 0 })] };
    const b: CellSpec = { shapes: [shape('circle', { rotation: 90 })] };
    expect(cellEquals(a, b)).toBe(false);
  });

  test('개수가 다르면 다르다', () => {
    const a: CellSpec = { shapes: [shape('circle')] };
    const b: CellSpec = { shapes: [shape('circle'), shape('circle')] };
    expect(cellEquals(a, b)).toBe(false);
  });

  test('채움이 다르면 다르다', () => {
    const a: CellSpec = { shapes: [shape('circle', { filled: true })] };
    const b: CellSpec = { shapes: [shape('circle', { filled: false })] };
    expect(cellEquals(a, b)).toBe(false);
  });

  test('크기가 다르면 다르다', () => {
    const a: CellSpec = { shapes: [shape('circle', { size: 0.3 })] };
    const b: CellSpec = { shapes: [shape('circle', { size: 0.8 })] };
    expect(cellEquals(a, b)).toBe(false);
  });

  test('x 위치가 다르면 다르다', () => {
    const a: CellSpec = { shapes: [shape('circle', { x: 0.2, y: 0.5 })] };
    const b: CellSpec = { shapes: [shape('circle', { x: 0.8, y: 0.5 })] };
    expect(cellEquals(a, b)).toBe(false);
  });

  test('y 위치가 다르면 다르다', () => {
    const a: CellSpec = { shapes: [shape('circle', { x: 0.5, y: 0.2 })] };
    const b: CellSpec = { shapes: [shape('circle', { x: 0.5, y: 0.8 })] };
    expect(cellEquals(a, b)).toBe(false);
  });

  test('도형 순서가 달라도 내용이 같으면 같다', () => {
    const a: CellSpec = { shapes: [shape('circle'), shape('square')] };
    const b: CellSpec = { shapes: [shape('square'), shape('circle')] };
    expect(cellEquals(a, b)).toBe(true);
  });

  test('빈 셀끼리는 같다', () => {
    expect(cellEquals(emptyCell(), emptyCell())).toBe(true);
  });
});

describe('figureEquals', () => {
  const single = (c: CellSpec): FigureSpec => ({ kind: 'single', cells: [c] });

  test('같은 셀이면 같다', () => {
    expect(figureEquals(single({ shapes: [shape('circle')] }), single({ shapes: [shape('circle')] }))).toBe(true);
  });

  test('다른 셀이면 다르다', () => {
    expect(figureEquals(single({ shapes: [shape('circle')] }), single({ shapes: [shape('square')] }))).toBe(false);
  });

  test('kind가 다르면 다르다', () => {
    const a: FigureSpec = { kind: 'single', cells: [emptyCell()] };
    const b: FigureSpec = { kind: 'grid', cells: [emptyCell()] };
    expect(figureEquals(a, b)).toBe(false);
  });

  test('셀 개수가 다르면 다르다', () => {
    const a: FigureSpec = { kind: 'grid', cells: [emptyCell()] };
    const b: FigureSpec = { kind: 'grid', cells: [emptyCell(), emptyCell()] };
    expect(figureEquals(a, b)).toBe(false);
  });
});
