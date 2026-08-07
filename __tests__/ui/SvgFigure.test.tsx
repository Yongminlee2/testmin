import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SvgFigure } from '@/ui/SvgFigure';
import { emptyCell, shape } from '@/engine/iq/figure';
import type { FigureSpec } from '@/engine/types';

const single = (spec: Partial<FigureSpec> = {}): FigureSpec => ({
  kind: 'single',
  cells: [{ shapes: [shape('circle')] }],
  ...spec,
});

const grid = (blankIndex?: number): FigureSpec => ({
  kind: 'grid',
  cells: Array.from({ length: 9 }, () => ({ shapes: [shape('square')] })),
  ...(blankIndex === undefined ? {} : { blankIndex }),
});

describe('SvgFigure', () => {
  test('낱개 도형을 크래시 없이 그린다', async () => {
    await render(<SvgFigure spec={single()} testID="fig" />);
    expect(screen.getByTestId('fig')).toBeTruthy();
  });

  test('3×3 격자를 크래시 없이 그린다', async () => {
    await render(<SvgFigure spec={grid()} testID="fig" />);
    expect(screen.getByTestId('fig')).toBeTruthy();
  });

  test('blankIndex가 있으면 물음표를 그린다', async () => {
    await render(<SvgFigure spec={grid(8)} testID="fig" />);
    expect(screen.getByTestId('figure-blank')).toBeTruthy();
  });

  test('blankIndex가 없으면 물음표가 없다', async () => {
    await render(<SvgFigure spec={grid()} testID="fig" />);
    expect(screen.queryByTestId('figure-blank')).toBeNull();
  });

  test('빈 셀만 있어도 크래시하지 않는다', async () => {
    const spec: FigureSpec = { kind: 'grid', cells: Array.from({ length: 9 }, emptyCell) };
    await render(<SvgFigure spec={spec} testID="fig" />);
    expect(screen.getByTestId('fig')).toBeTruthy();
  });

  test('네 가지 도형 종류를 모두 그린다', async () => {
    const spec: FigureSpec = {
      kind: 'single',
      cells: [
        {
          shapes: [
            shape('circle', { x: 0.25, y: 0.25 }),
            shape('square', { x: 0.75, y: 0.25 }),
            shape('triangle', { x: 0.25, y: 0.75 }),
            shape('diamond', { x: 0.75, y: 0.75 }),
          ],
        },
      ],
    };
    await render(<SvgFigure spec={spec} testID="fig" />);
    expect(screen.getByTestId('fig')).toBeTruthy();
  });
});
