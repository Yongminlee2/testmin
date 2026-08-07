import Svg, { Circle, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import { colors } from './tokens';
import type { CellSpec, FigureSpec, ShapeSpec } from '@/engine/types';

const CELL = 100;
const STROKE = 4;

interface Props {
  readonly spec: FigureSpec;
  /** 렌더 크기(px). 격자는 정사각형으로 그린다. */
  readonly size?: number;
  readonly testID?: string;
}

function renderShape(s: ShapeSpec, key: string, ox: number, oy: number) {
  const cx = ox + s.x * CELL;
  const cy = oy + s.y * CELL;
  const r = (s.size * CELL) / 2;
  const fill = s.filled ? colors.lavender : colors.white;
  const common = { stroke: colors.ink, strokeWidth: STROKE, fill };
  const spin = `rotate(${s.rotation} ${cx} ${cy})`;

  switch (s.kind) {
    case 'circle':
      // 원은 회전이 보이지 않으므로 transform을 주지 않는다
      return <Circle key={key} cx={cx} cy={cy} r={r} {...common} />;
    case 'square':
      return (
        <Rect
          key={key}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          transform={spin}
          {...common}
        />
      );
    case 'triangle':
      return (
        <Polygon
          key={key}
          points={`${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`}
          transform={spin}
          {...common}
        />
      );
    case 'diamond':
      return (
        <Polygon
          key={key}
          points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
          transform={spin}
          {...common}
        />
      );
  }
}

function renderCell(cell: CellSpec, index: number, ox: number, oy: number) {
  return cell.shapes.map((s, i) => renderShape(s, `c${index}-s${i}`, ox, oy));
}

export function SvgFigure({ spec, size = 120, testID }: Props) {
  const isGrid = spec.kind === 'grid';
  const span = isGrid ? CELL * 3 : CELL;

  return (
    <View style={styles.wrap} testID={testID}>
      <Svg width={size} height={size} viewBox={`0 0 ${span} ${span}`}>
        {isGrid ? (
          <>
            {/* 칸 구분선 */}
            {[1, 2].map((i) => (
              <Line
                key={`v${i}`}
                x1={i * CELL}
                y1={0}
                x2={i * CELL}
                y2={span}
                stroke={colors.ink}
                strokeWidth={2}
              />
            ))}
            {[1, 2].map((i) => (
              <Line
                key={`h${i}`}
                x1={0}
                y1={i * CELL}
                x2={span}
                y2={i * CELL}
                stroke={colors.ink}
                strokeWidth={2}
              />
            ))}
          </>
        ) : null}

        {spec.cells.map((cell, i) => {
          const ox = isGrid ? (i % 3) * CELL : 0;
          const oy = isGrid ? Math.floor(i / 3) * CELL : 0;
          if (isGrid && spec.blankIndex === i) {
            return (
              <SvgText
                key={`blank${i}`}
                testID="figure-blank"
                x={ox + CELL / 2}
                y={oy + CELL / 2 + 18}
                fontSize={52}
                textAnchor="middle"
                fill={colors.ink}
              >
                ?
              </SvgText>
            );
          }
          return renderCell(cell, i, ox, oy);
        })}

        {/* 바깥 테두리 */}
        <Rect
          x={STROKE / 2}
          y={STROKE / 2}
          width={span - STROKE}
          height={span - STROKE}
          fill="none"
          stroke={colors.ink}
          strokeWidth={STROKE}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
