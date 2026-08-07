# 테스트의 민족 — 계획 3: IQ 고사 (도형 생성기) Implementation Plan


**Goal:** 폰에서 IQ 고사를 실제로 풀고, 급수와 추정 점수, 그리고 문항마다 "왜 이게 답인가"를 규칙에서 자동 도출된 해설로 받는 상태까지 만든다.

**Architecture:** 도형 문항을 데이터로 저장하지 않고 **시드에서 생성**한다. 생성기는 규칙을 코드로 갖고 있고, 같은 규칙에서 문제·정답·해설이 동시에 나온다. 도형은 `FigureSpec`이라는 선언적 스펙으로 표현하고, 렌더링은 `SvgFigure`가 따로 맡는다 — 생성기는 그림 그리는 법을 모른다.

**Tech Stack:** 계획 1·2와 동일 + `react-native-svg`(이미 설치됨)

**선행 계획:** 계획 1(기반+사투리), 계획 2(유형형) — 둘 다 완료, 실기기 검증 완료
**설계 문서:** `docs/specs/2026-08-06-testmin-design.md`

## Global Constraints

계획 1·2에서 이어지는 제약. 전부 그대로 유효하다.

- 패키지명 `com.testmin.app`, 앱 이름 `테스트의 민족`
- `minSdkVersion 24`, `compileSdkVersion 36`, `targetSdkVersion 36`, `buildToolsVersion 37.0.0`
- **사용자 노출 권한 0개.** 예외는 `androidx.core`의 `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` 하나뿐
- `expo-updates` 설치 금지 / 라이트 모드 고정
- **`src/engine/**`는 `react`, `react-native`, `expo*`를 import하지 않는다**
- **어떤 스타일도 `fontFamily`와 `fontWeight`를 동시에 지정하지 않는다**
- **큰 글자에는 반드시 `lineHeight`를 준다**
- 화면에 `SafeAreaView`를 넣지 않는다. `useSafeAreaInsets()`로 하단 여백만 더한다
- 한글 조사는 `attachParticle`로 붙인다. `은(는)` 같은 임시방편 금지
- **레이븐 누진행렬(Raven's Progressive Matrices)·WAIS 등 표준화 검사의 문항을 인용하거나 변형하지 않는다.** 규칙 자체(회전·증감·합성·분배)는 보호 대상이 아니므로 우리가 직접 구현한다
- **IQ 점수를 단정하지 않는다.** 결과에 오락용 추정치임을 명시한다
- 커밋 메시지는 한국어

## 개발 환경 / 테스트 함정

계획 1·2에서 확정된 것들. **재조사 금지.** 자세한 내용은 `docs/build-notes.md`와 계획 2 문서 참조.

- 빌드: `TEMP`=`TMP`=`C:\workAndroid\tmp-ascii`, `GRADLE_USER_HOME`=`C:\workAndroid\gradle-home-ascii`(정션 아님), `JAVA_HOME`=Android Studio JBR, `ANDROID_HOME`=`C:\workAndroid\android-sdk-ascii`
- `@testing-library/react-native@14.0.1`의 `render`/`fireEvent.press`는 **async**
- `jest.mock()` 팩토리는 `mock` 접두사 변수만 참조 가능
- `describe.each` 콜백 인자를 `test`로 이름 짓지 말 것
- `StyleSheet.absoluteFillObject`는 RN 0.86.2에 없음 → `absoluteFill`
- `experiments.typedRoutes`는 OFF 유지

---

## 이 계획의 핵심 설계

### 왜 문항을 저장하지 않고 생성하는가

세 가지가 동시에 해결된다.

1. **해설이 틀릴 수 없다.** 문제를 만든 규칙이 곧 해설이다. "이 행은 시계방향 90° 회전이고, 열마다 도형 개수가 하나씩 늘어난다 — 따라서 답은 ③"이라는 문장이 생성 로직에서 그대로 나온다. 사람이 수백 개를 쓰면 몇 개는 반드시 틀린다.
2. **재도전 때마다 새 문제가 나온다.** 계획 1의 사투리는 풀이 작아 재도전 시 대부분 같은 문제가 나왔다. 생성기는 시드만 바꾸면 된다.
3. **앱 용량이 늘지 않는다.** 도형을 이미지가 아니라 벡터 스펙으로 갖고 있으므로, 문항이 무한해도 바이트가 안 는다.

부수 효과로 **오답노트에 문항 전체가 아니라 `(생성기 id, 시드)`만 저장하면 그 문제가 정확히 복원된다.**

### 생성기는 그림을 모른다

`FigureSpec`은 "무엇을 그릴지"만 담은 순수 데이터다. 좌표·색·선 굵기 같은 렌더링 결정은 전부 `SvgFigure` 쪽에 있다. 이 경계가 있어야 생성기를 Node에서 테스트할 수 있고(`src/engine`의 no-React 규칙), 나중에 도형 디자인을 바꿔도 규칙 코드를 안 건드린다.

### 정답 유일성은 테스트로 강제한다

생성기가 만든 오답 4개가 정답과 **모두 달라야** 한다. 규칙을 어긋나게 해서 오답을 만들다 보면 우연히 정답과 같은 그림이 나올 수 있고, 그러면 정답이 둘인 문제가 출제된다. 각 생성기마다 **시드 500개 이상을 돌려 정답이 항상 유일한지** 확인하는 속성 테스트를 붙인다.

계획 1·2에서 반복된 교훈 — "코드는 맞는데 그걸 지켜주는 테스트가 없다"가 다섯 번 나왔다. 생성기는 특히 이 함정에 빠지기 쉬우므로, **각 규칙마다 그 규칙을 어긴 변형이 테스트에 걸리는지**를 명시적으로 확인한다.

---

## File Structure

```
src/
  engine/
    types.ts              (수정) FigureSpec·ShapeSpec 구체화, GeneratedQuestion 추가
    iq/
      figure.ts           (신규) FigureSpec 생성·비교 유틸
      generators/
        index.ts          (신규) 생성기 레지스트리
        rotation.ts       (신규) 행마다 회전
        count.ts          (신규) 개수 증감
        fill.ts           (신규) 채움 교대
        distribute.ts     (신규) 3분배
        size.ts           (신규) 크기 진행
        sequence.ts       (신규) 수열 (도형 아님)
      assembleIq.ts       (신규) 규칙 분포에 따라 생성기를 골라 출제
  content/
    grades.json           (수정) iq 급수 테이블 추가
    registry.ts           (수정) IQ 등록, IQ_DRAW
  ui/
    SvgFigure.tsx         (신규) FigureSpec → SVG
app/
  test/iq/
    intro.tsx quiz.tsx result.tsx review.tsx   (신규)
```

`QuizRunner`(계획 2)가 도형 선택지를 그릴 수 있도록 확장한다 — 선택지에 `figure`가 있으면 `SvgFigure`를, 없으면 지금처럼 텍스트를 그린다.

---

### Task 1: FigureSpec 타입과 비교 유틸

**Files:**
- Modify: `src/engine/types.ts`
- Create: `src/engine/iq/figure.ts`
- Test: `__tests__/engine/iq/figure.test.ts`

**Interfaces:**
- Produces: `ShapeKind`, `ShapeSpec`, `CellSpec`, `FigureSpec`, `figureEquals`, `cellEquals`, `emptyCell`, `GeneratedQuestion`

**설계 의도:** 도형을 그리는 데 필요한 최소한만 담는다. 필드를 늘리고 싶어질 때마다 "이게 규칙을 표현하는 데 진짜 필요한가, 아니면 예쁘게 그리려는 건가"를 물을 것 — 후자면 `SvgFigure` 쪽에 둔다.

- [ ] **Step 1: 타입 추가**

`src/engine/types.ts`의 기존 `FigureSpec`(계획 1에서 자리만 잡아둔 느슨한 정의)을 아래로 **교체**한다. 기존 정의를 쓰는 곳이 없으므로 안전하다 — 교체 전에 `grep -rn "FigureSpec" src/ app/`로 확인할 것.

```ts
export type ShapeKind = 'circle' | 'square' | 'triangle' | 'diamond';

export interface ShapeSpec {
  readonly kind: ShapeKind;
  /** 0, 90, 180, 270 */
  readonly rotation: number;
  readonly filled: boolean;
  /** 셀 크기 대비 0.2~1.0 */
  readonly size: number;
  /** 셀 안에서의 위치. 0~1 */
  readonly x: number;
  readonly y: number;
}

export interface CellSpec {
  readonly shapes: readonly ShapeSpec[];
}

export interface FigureSpec {
  /** 'grid'는 3×3 행렬(cells 9개), 'single'은 낱개 도형(cells 1개) */
  readonly kind: 'grid' | 'single';
  readonly cells: readonly CellSpec[];
  /** grid 전용: 비워둘 칸의 인덱스. 보통 8(마지막) */
  readonly blankIndex?: number;
}

/** 생성기가 돌려주는 것 — 문항 하나와 그걸 만든 근거 */
export interface GeneratedQuestion {
  readonly question: Question;
  readonly generatorId: string;
  readonly seed: number;
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

`__tests__/engine/iq/figure.test.ts`:

```ts
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
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/iq/figure.test.ts
```

Expected: FAIL — `Cannot find module '@/engine/iq/figure'`

- [ ] **Step 4: 구현**

`src/engine/iq/figure.ts`:

```ts
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
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/iq/figure.test.ts && npx tsc --noEmit
```

Expected: PASS (12 tests), 타입 에러 0개

- [ ] **Step 6: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: IQ 도형 스펙과 비교 유틸

도형을 그리는 법이 아니라 무엇을 그릴지만 담는 선언적 스펙.
렌더링은 SvgFigure가 따로 맡아 생성기가 순수 TS로 남는다.
셀 비교는 도형 나열 순서를 무시한다 - 정답 유일성 판정의 기준이 된다.

"
```

---

## Task 2 이후 — 개요

각 태스크의 전체 코드는 착수 직전에 이 문서에 채워 넣는다. 지금 확정된 것은 범위와 인터페이스다.

### Task 2 — `SvgFigure` 렌더러

**Files:** Create `src/ui/SvgFigure.tsx`, `__tests__/ui/SvgFigure.test.tsx`

`FigureSpec`을 실제 그림으로 바꾸는 유일한 곳이다. 엔진은 여기를 모르고, 여기는 규칙을 모른다.

**⚠️ 생성기 설계 제약 — 여기서 발견한 것이므로 Task 3 이후에 그대로 적용한다**

`cellEquals`는 `rotation`이 다르면 다른 도형으로 판정한다. 그런데 **원은 아무리 돌려도 똑같이 보인다.** 마름모는 90° 돌리면 자기 자신이고, 정사각형도 90°의 배수로는 구분이 안 된다.

즉 회전만으로 오답을 만드는 규칙이 원·마름모·정사각형에 적용되면 **화면상 정답과 똑같은 오답**이 나오는데, `cellEquals`는 다르다고 판정하므로 정답 유일성 테스트를 통과해버린다. 사용자는 똑같아 보이는 선택지 두 개를 보게 된다.

**따라서:**
- 회전을 구분 기준으로 쓰는 생성기는 **삼각형만** 쓴다 (삼각형은 90·180·270°가 전부 다르게 보인다)
- 정사각형·마름모에 회전을 줄 거면 45°처럼 시각적으로 구분되는 각도만 쓴다
- 원에는 회전을 주지 않는다

이 제약을 Task 3의 회전 생성기부터 지키고, **"화면상 구분 가능한가"를 사람이 실기기에서 확인**한다 (Task 8). 기계는 스펙이 다른지만 알지 보이는 게 다른지는 모른다.

**`src/ui/SvgFigure.tsx`**

```tsx
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
```

**Test:** `__tests__/ui/SvgFigure.test.tsx` — `render`는 async다.

렌더러 테스트는 픽셀을 검증하지 않는다. 크래시 없이 그려지는지, 빈 칸 표시가 나오는지, 도형 개수만큼 요소가 나오는지 수준으로 둔다. 시각적 정확성은 실기기 확인(Task 8)의 몫이다.

```tsx
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
    expect(screen.getByText('?')).toBeTruthy();
  });

  test('blankIndex가 없으면 물음표가 없다', async () => {
    await render(<SvgFigure spec={grid()} testID="fig" />);
    expect(screen.queryByText('?')).toBeNull();
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
```

### Task 3 — 생성기 프레임워크 + 회전 규칙

**Files:**
- Create: `src/engine/iq/verify.ts`, `src/engine/iq/generators/rotation.ts`, `src/engine/iq/generators/index.ts`
- Test: `__tests__/engine/iq/verify.test.ts`, `__tests__/engine/iq/rotation.test.ts`

이 태스크가 계획 3의 뼈대다. 이후 생성기 5종이 전부 여기서 정한 계약과 검증기를 재사용한다.

**`verifyGenerated`가 왜 테스트 헬퍼가 아니라 엔진 모듈인가**

"생성된 문항이 유효한가"는 테스트만의 관심사가 아니라 **제품 규칙**이다. 콘텐츠 검증기(`tools/validate-content.ts`)가 저장된 문항에 대해 하는 일을, 이쪽은 생성된 문항에 대해 한다. 그래서 `src/engine/iq/verify.ts`에 둔다 — 테스트에서 부르고, 나중에 필요하면 런타임에서도 부를 수 있다.

**`src/engine/iq/verify.ts`**

```ts
import { figureEquals } from './figure';
import type { GeneratedQuestion } from '../types';

/**
 * 생성된 문항이 출제 가능한 상태인지 검사한다.
 * 사람이 읽을 수 있는 문제 목록을 돌려주고, 비어 있으면 통과.
 *
 * 가장 중요한 검사는 정답 유일성이다. 생성기는 규칙을 어긋나게 해서
 * 오답을 만드는데, 우연히 정답과 같은 그림이 나오면 정답이 둘인 문제가
 * 출제되고 사용자는 맞는 답을 골랐는데 틀렸다고 나온다.
 */
export function verifyGenerated(gq: GeneratedQuestion): string[] {
  const errors: string[] = [];
  const q = gq.question;
  const at = `[${gq.generatorId}/${gq.seed}]`;

  if (q.choices.length !== 5) {
    errors.push(`${at} IQ 도형·수열 문항은 5지선다여야 하는데 ${q.choices.length}개입니다`);
  }

  if (typeof q.answerIndex !== 'number') {
    errors.push(`${at} answerIndex가 없습니다`);
  } else if (q.answerIndex < 0 || q.answerIndex >= q.choices.length) {
    errors.push(`${at} answerIndex ${q.answerIndex}가 선택지 범위를 벗어납니다`);
  }

  if (!q.explanation || q.explanation.trim().length === 0) {
    errors.push(`${at} 해설이 비어 있습니다`);
  }

  if (!q.prompt || q.prompt.trim().length === 0) {
    errors.push(`${at} 질문이 비어 있습니다`);
  }

  // 선택지끼리 서로 달라야 한다. 도형 문항은 figure로, 수열 문항은 text로 비교한다.
  for (let i = 0; i < q.choices.length; i++) {
    for (let j = i + 1; j < q.choices.length; j++) {
      const a = q.choices[i];
      const b = q.choices[j];
      if (a === undefined || b === undefined) continue;

      if (a.figure !== undefined && b.figure !== undefined) {
        if (figureEquals(a.figure, b.figure)) {
          errors.push(`${at} 선택지 ${i}번과 ${j}번의 도형이 같습니다`);
        }
      } else if (a.text !== undefined && b.text !== undefined) {
        if (a.text === b.text) {
          errors.push(`${at} 선택지 ${i}번과 ${j}번의 값이 같습니다 ("${a.text}")`);
        }
      }
    }
  }

  return errors;
}
```

**Test:** `__tests__/engine/iq/verify.test.ts` — 검증기 자체가 제 일을 하는지 확인한다. 이 테스트가 허술하면 이후 생성기 5종의 안전망이 통째로 가짜가 된다.

```ts
import { verifyGenerated } from '@/engine/iq/verify';
import { shape } from '@/engine/iq/figure';
import type { FigureSpec, GeneratedQuestion, Question } from '@/engine/types';

const fig = (size: number): FigureSpec => ({
  kind: 'single',
  cells: [{ shapes: [shape('circle', { size })] }],
});

function make(overrides: Partial<Question> = {}): GeneratedQuestion {
  const question: Question = {
    id: 'iq-test-1',
    kind: 'scored',
    prompt: '다음에 올 도형은?',
    choices: [0.2, 0.4, 0.6, 0.8, 1.0].map((s) => ({ figure: fig(s) })),
    answerIndex: 0,
    explanation: '규칙 설명',
    difficulty: 1,
    ...overrides,
  };
  return { question, generatorId: 'test', seed: 1 };
}

describe('verifyGenerated', () => {
  test('올바른 문항은 오류가 없다', () => {
    expect(verifyGenerated(make())).toEqual([]);
  });

  test('선택지가 5개가 아니면 잡는다', () => {
    const gq = make({ choices: [{ figure: fig(0.2) }, { figure: fig(0.4) }] });
    expect(verifyGenerated(gq).some((e) => e.includes('5지선다'))).toBe(true);
  });

  test('answerIndex가 없으면 잡는다', () => {
    const gq = make();
    const q = { ...gq.question };
    delete (q as { answerIndex?: number }).answerIndex;
    expect(verifyGenerated({ ...gq, question: q }).some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('answerIndex가 범위를 벗어나면 잡는다', () => {
    expect(verifyGenerated(make({ answerIndex: 5 })).some((e) => e.includes('범위'))).toBe(true);
  });

  test('해설이 비면 잡는다', () => {
    expect(verifyGenerated(make({ explanation: '  ' })).some((e) => e.includes('해설'))).toBe(true);
  });

  test('질문이 비면 잡는다', () => {
    expect(verifyGenerated(make({ prompt: '' })).some((e) => e.includes('질문'))).toBe(true);
  });

  test('도형이 같은 선택지 두 개를 잡는다', () => {
    const gq = make({
      choices: [fig(0.2), fig(0.4), fig(0.6), fig(0.8), fig(0.2)].map((f) => ({ figure: f })),
    });
    expect(verifyGenerated(gq).some((e) => e.includes('도형이 같습니다'))).toBe(true);
  });

  test('값이 같은 텍스트 선택지 두 개를 잡는다', () => {
    const gq = make({
      choices: [{ text: '3' }, { text: '6' }, { text: '12' }, { text: '24' }, { text: '6' }],
    });
    expect(verifyGenerated(gq).some((e) => e.includes('값이 같습니다'))).toBe(true);
  });

  test('오류 메시지에 생성기 id와 시드가 들어간다', () => {
    const gq = { ...make({ explanation: '' }), generatorId: 'rotation', seed: 4242 };
    const errors = verifyGenerated(gq);
    expect(errors.some((e) => e.includes('rotation') && e.includes('4242'))).toBe(true);
  });
});
```

**`src/engine/iq/generators/index.ts`**

```ts
import type { Difficulty, GeneratedQuestion } from '../../types';

export interface Generator {
  readonly id: string;
  readonly difficulty: Difficulty;
  /** 같은 시드는 항상 같은 문항을 만든다. 정답 유일성은 생성기가 보장한다. */
  generate(seed: number): GeneratedQuestion;
}

/** Task 4·5에서 채워진다. */
export const GENERATORS: readonly Generator[] = [];
```

**`src/engine/iq/generators/rotation.ts`**

규칙: 3×3 격자를 **왼쪽 위에서 오른쪽 아래로 읽는 순서**로 훑으면서 삼각형이 매 칸 일정 각도씩 시계방향으로 돈다. 마지막 칸이 빈 칸이다.

**삼각형만 쓴다.** 원은 회전이 안 보이고, 마름모·정사각형은 90° 배수에서 자기 자신이 되어 화면상 정답과 같은 오답이 만들어진다.

```ts
import { mulberry32, pickInt } from '../../rng';
import { shape } from '../figure';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question } from '../../types';
import type { Generator } from './index';

const STEPS = [90, 180, 270] as const;

function cellAt(rotation: number): CellSpec {
  // 회전이 보이는 도형은 삼각형뿐이다. 원·마름모·정사각형은
  // 90° 배수에서 자기 자신이 되어 정답과 구분 불가능한 오답을 만든다.
  return { shapes: [shape('triangle', { rotation: ((rotation % 360) + 360) % 360 })] };
}

function single(rotation: number): FigureSpec {
  return { kind: 'single', cells: [cellAt(rotation)] };
}

export const rotationGenerator: Generator = {
  id: 'rotation',
  difficulty: 1,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const step = STEPS[pickInt(rand, 0, STEPS.length - 1)] ?? 90;
    const start = STEPS[pickInt(rand, 0, STEPS.length - 1)] ?? 0;

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(cellAt(start + step * i));
    }

    const answerRotation = ((start + step * 8) % 360 + 360) % 360;

    // 오답은 정답에서 90·180·270° 어긋난 것. 삼각형이라 넷 다 다르게 보인다.
    const wrongRotations = [90, 180, 270].map((d) => (answerRotation + d) % 360);
    const options = [answerRotation, ...wrongRotations];

    // 선택지 순서를 시드로 섞는다. 정답이 항상 1번이면 안 된다(계획 1의 교훈).
    const order = [0, 1, 2, 3].sort(() => rand() - 0.5);
    // sort의 비교 함수는 안정성이 보장되지 않으므로 명시적으로 섞는다
    const shuffled: number[] = [];
    const pool = [...options];
    while (pool.length > 0) {
      const idx = pickInt(rand, 0, pool.length - 1);
      const [taken] = pool.splice(idx, 1);
      if (taken !== undefined) shuffled.push(taken);
    }
    // 5지선다를 채우기 위해 한 각도를 더 넣는다 — 45° 어긋난 것(삼각형에서 명확히 다름)
    const extra = (answerRotation + 45) % 360;
    const finalOptions = [...shuffled];
    finalOptions.splice(pickInt(rand, 0, finalOptions.length), 0, extra);

    const answerIndex = finalOptions.indexOf(answerRotation);

    const question: Question = {
      id: `iq-rotation-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: finalOptions.map((r) => ({ figure: single(r) })),
      answerIndex,
      explanation:
        `왼쪽 위에서 오른쪽 아래로 한 칸씩 갈 때마다 삼각형이 시계방향으로 ${step}°씩 돕니다. ` +
        `첫 칸이 ${((start % 360) + 360) % 360}°이므로 아홉 번째 칸은 ${answerRotation}° 회전한 모양입니다.`,
      difficulty: 1,
    };

    return { question, generatorId: 'rotation', seed };
  },
};
```

> **구현자 주의:** 위 코드의 `order` 변수와 `sort(() => rand() - 0.5)` 줄은 **의도적으로 남겨둔 잘못된 접근**이다. 비교 함수가 무작위를 돌려주는 `sort`는 균등한 셔플이 아니고 엔진마다 결과가 다르다. **그 두 줄을 지우고** 아래의 명시적 셔플만 쓸 것. 이미 `src/engine/rng.ts`에 `shuffle`이 있으니 그걸 쓰는 게 더 낫다 — 직접 판단해서 정리하고, 무엇을 왜 바꿨는지 보고할 것.

**Test:** `__tests__/engine/iq/rotation.test.ts`

```ts
import { rotationGenerator } from '@/engine/iq/generators/rotation';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

describe('rotationGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    const a = rotationGenerator.generate(1234);
    const b = rotationGenerator.generate(1234);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('다른 시드는 다른 문항을 만든다', () => {
    const a = rotationGenerator.generate(1);
    const b = rotationGenerator.generate(2);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = rotationGenerator.generate(7);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const gq = rotationGenerator.generate(seed);
      const errors = verifyGenerated(gq);
      if (errors.length > 0) {
        throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
      }
    }
  });

  test('시드 500개에서 정답이 항상 1번에 오지는 않는다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(rotationGenerator.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('정답 선택지의 도형이 규칙이 예측하는 모양과 일치한다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      // 여덟 번째 칸(index 7)과 아홉 번째 칸의 관계가 나머지 칸 간격과 같아야 한다
      const first = cells[0]?.shapes[0]?.rotation ?? 0;
      const second = cells[1]?.shapes[0]?.rotation ?? 0;
      const step = ((second - first) % 360 + 360) % 360;
      const expected = ((first + step * 8) % 360 + 360) % 360;
      const answer = question.choices[question.answerIndex ?? 0]?.figure;
      expect(answer).toBeDefined();
      expect(
        figureEquals(answer!, { kind: 'single', cells: [{ shapes: [{ ...cells[0]!.shapes[0]!, rotation: expected }] }] })
      ).toBe(true);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });
});
```

**마지막 테스트 두 개가 이 태스크의 핵심이다.** "검증을 통과한다"만으로는 부족하다 — 정답이 **규칙이 예측하는 그 모양**인지까지 봐야 한다. 검증기는 선택지가 서로 다른지만 알지, 정답으로 표시된 게 실제로 규칙에 맞는 답인지는 모른다.

### Task 4 — 개수 증감 · 채움 교대 생성기

**재분할 안내:** 원래 4종을 한 태스크로 묶었으나 생성기 하나가 구현+테스트 120줄이라 480줄짜리 리뷰가 된다. 규칙마다 오답 전략이 달라 한 리뷰어가 다 보기 어렵다. **Task 4는 2종, Task 4b가 나머지 2종**(3분배·크기 진행)을 맡는다.

**Files:**
- Create: `src/engine/iq/generators/count.ts`, `src/engine/iq/generators/fill.ts`
- Modify: `src/engine/iq/generators/index.ts` (레지스트리에 등록)
- Test: `__tests__/engine/iq/count.test.ts`, `__tests__/engine/iq/fill.test.ts`

**모든 생성기가 반드시 갖춰야 하는 테스트 — Task 3 리뷰에서 확정**

`verifyGenerated`는 선택지 5개가 서로 다른지만 안다. **정답 표시가 엉뚱한 선택지에 붙어도 통과한다.** "오답은 모두 정답과 다르다" 테스트도 마찬가지 — 생성값들이 항상 서로 다르므로 표시가 어디에 붙든 통과한다.

따라서 각 생성기는 **"예측 대조" 테스트**를 반드시 가진다:

> 문제 도형(관찰 가능한 출력)에서 규칙을 역산해 정답을 **독립적으로** 계산하고, 생성기가 표시한 정답과 대조한다.

생성기 내부 변수를 다시 읽으면 동어반복이라 아무것도 증명하지 못한다. 격자에 실제로 그려진 칸들에서 역산할 것.

---

**`src/engine/iq/generators/count.ts`**

규칙: 격자의 행·열을 따라 오른쪽·아래로 갈수록 점 개수가 일정하게 늘어난다. 칸 (r,c)의 개수는 `start + (r + c) * step`.

```ts
import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question } from '../../types';
import type { Generator } from './index';

/** 점 개수별 배치. 최대 9개까지 겹치지 않게 놓는다. */
const DOT_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [0.5, 0.5],
  [0.28, 0.28],
  [0.72, 0.72],
  [0.72, 0.28],
  [0.28, 0.72],
  [0.5, 0.22],
  [0.5, 0.78],
  [0.22, 0.5],
  [0.78, 0.5],
];

function dots(n: number): CellSpec {
  const count = Math.max(0, Math.min(n, DOT_POSITIONS.length));
  return {
    shapes: DOT_POSITIONS.slice(0, count).map(([x, y]) =>
      // size 0.18 = 반지름 0.09. 위 배치의 최소 중심간 거리가 0.228이므로
      // 어느 조합도 겹치지 않는다. 0.2 이상으로 올리면 간격이 사라진다.
      shape('circle', { x, y, size: 0.18, filled: true })
    ),
  };
}

function single(n: number): FigureSpec {
  return { kind: 'single', cells: [dots(n)] };
}

export const countGenerator: Generator = {
  id: 'count',
  difficulty: 1,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const start = pickInt(rand, 1, 3);
    const step = 1;

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3);
      const c = i % 3;
      cells.push(dots(start + (r + c) * step));
    }

    const answer = start + 4 * step; // (2,2)칸

    // 오답은 개수만 어긋난 것. ±1, ±2 — 전부 1 이상이고 서로 다르다.
    const options = shuffle([answer, answer - 2, answer - 1, answer + 1, answer + 2], rand);
    const answerIndex = options.indexOf(answer);

    const question: Question = {
      id: `iq-count-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((n) => ({ figure: single(n) })),
      answerIndex,
      explanation:
        `오른쪽으로 한 칸, 아래로 한 칸 갈 때마다 점이 ${step}개씩 늘어납니다. ` +
        `첫 칸이 ${start}개이므로 마지막 칸은 ${answer}개입니다.`,
      difficulty: 1,
    };

    return { question, generatorId: 'count', seed };
  },
};
```

**Test:** `__tests__/engine/iq/count.test.ts`

```ts
import { countGenerator } from '@/engine/iq/generators/count';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

describe('countGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    expect(JSON.stringify(countGenerator.generate(77))).toBe(
      JSON.stringify(countGenerator.generate(77))
    );
  });

  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = countGenerator.generate(5);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(countGenerator.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  test('시드 500개에서 정답 위치가 고정되어 있지 않다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(countGenerator.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('모든 선택지의 점 개수가 1개 이상이다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = countGenerator.generate(seed);
      for (const c of question.choices) {
        expect(c.figure?.cells[0]?.shapes.length ?? 0).toBeGreaterThanOrEqual(1);
      }
    }
  });

  // ★ 예측 대조 — 이 생성기의 정답 오표시를 잡는 유일한 테스트
  test('표시된 정답이 격자에서 역산한 개수와 일치한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = countGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      const c00 = cells[0]?.shapes.length ?? 0;   // (0,0)
      const c01 = cells[1]?.shapes.length ?? 0;   // (0,1)
      const step = c01 - c00;
      const expected = c00 + 4 * step;            // (2,2)

      const marked = question.choices[question.answerIndex ?? -1]?.figure;
      expect(marked).toBeDefined();
      expect(marked!.cells[0]?.shapes.length).toBe(expected);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = countGenerator.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });
});
```

---

**`src/engine/iq/generators/fill.ts`**

규칙: **열마다 도형 종류가 바뀌고, 행마다 채움이 번갈아 나온다.** 두 축이 독립적이라 마지막 칸을 맞히려면 둘 다 읽어야 한다.

채움만으로는 상태가 둘뿐이라 5지선다를 못 만든다. 그래서 종류와 채움의 **조합**을 선택지로 쓴다.

**회전은 쓰지 않는다** — 이 생성기는 원·사각형도 쓰므로 회전을 구분 기준으로 삼으면 화면상 같은 오답이 나온다.

```ts
import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question, ShapeKind } from '../../types';
import type { Generator } from './index';

const KINDS: readonly ShapeKind[] = ['circle', 'square', 'triangle'];

interface Combo {
  readonly kind: ShapeKind;
  readonly filled: boolean;
}

function cellOf(combo: Combo): CellSpec {
  return { shapes: [shape(combo.kind, { filled: combo.filled, size: 0.62 })] };
}

function single(combo: Combo): FigureSpec {
  return { kind: 'single', cells: [cellOf(combo)] };
}

function comboKey(c: Combo): string {
  return `${c.kind}:${c.filled ? 1 : 0}`;
}

export const fillGenerator: Generator = {
  id: 'fill',
  difficulty: 2,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const kindOffset = pickInt(rand, 0, KINDS.length - 1);
    const startFilled = rand() < 0.5;

    const comboAt = (r: number, c: number): Combo => ({
      kind: KINDS[(kindOffset + c) % KINDS.length] as ShapeKind,
      filled: (r % 2 === 0) === startFilled,
    });

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(cellOf(comboAt(Math.floor(i / 3), i % 3)));
    }

    const answer = comboAt(2, 2);

    // 오답 4개는 무작위로 뽑지 않고 **어긴 규칙별로 하나씩** 구성한다.
    // 후보 5개 중 4개를 무작위로 뽑으면 가장 교육적인 오답이 빠질 수 있다.
    //  (a) 종류는 맞고 채움만 틀림 → 열 규칙만 읽고 행 규칙을 놓친 사람이 고른다
    //  (b) 채움은 맞고 종류만 틀림 (2개) → 행 규칙만 읽고 열 규칙을 놓친 사람이 고른다
    //  (c) 둘 다 틀림 (1개) → 아무 규칙도 못 읽은 경우
    const otherKinds = KINDS.filter((k) => k !== answer.kind);
    const bothWrong = otherKinds.map((k) => ({ kind: k, filled: !answer.filled }));
    const wrong: Combo[] = [
      { kind: answer.kind, filled: !answer.filled },
      ...otherKinds.map((k) => ({ kind: k, filled: answer.filled })),
      bothWrong[pickInt(rand, 0, bothWrong.length - 1)] as Combo,
    ];
    const options = shuffle([answer, ...wrong], rand);
    const answerIndex = options.findIndex((o) => comboKey(o) === comboKey(answer));

    const kindNames: Record<ShapeKind, string> = {
      circle: '원',
      square: '사각형',
      triangle: '삼각형',
      diamond: '마름모',
    };

    const question: Question = {
      id: `iq-fill-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `열마다 도형이 ${KINDS.map((k) => kindNames[k]).join('→')} 순서로 바뀌고, ` +
        `행마다 색이 번갈아 칠해집니다. 마지막 칸은 ${kindNames[answer.kind]}이고 ` +
        `${answer.filled ? '색이 칠해진' : '비어 있는'} 모양입니다.`,
      difficulty: 2,
    };

    return { question, generatorId: 'fill', seed };
  },
};
```

**Test:** `__tests__/engine/iq/fill.test.ts` — `count.test.ts`와 같은 일곱 가지를 갖추되, 예측 대조는 이 규칙에 맞게 쓴다.

```ts
import { fillGenerator } from '@/engine/iq/generators/fill';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

describe('fillGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    expect(JSON.stringify(fillGenerator.generate(31))).toBe(
      JSON.stringify(fillGenerator.generate(31))
    );
  });

  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = fillGenerator.generate(9);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(fillGenerator.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  test('시드 500개에서 정답 위치가 고정되어 있지 않다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(fillGenerator.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('회전을 구분 기준으로 쓰지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = fillGenerator.generate(seed);
      for (const c of question.choices) {
        for (const s of c.figure?.cells[0]?.shapes ?? []) {
          expect(s.rotation).toBe(0);
        }
      }
    }
  });

  // 오답 구성이 규칙별 하나씩인지 확인한다. 이 테스트가 없으면
  // 무작위 slice로 되돌아가도 아무도 눈치채지 못한다.
  test('오답은 종류만 틀림 2개, 채움만 틀림 1개, 둘 다 틀림 1개다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const ai = question.answerIndex ?? -1;
      const a = question.choices[ai]?.figure?.cells[0]?.shapes[0];
      expect(a).toBeDefined();

      let kindOnly = 0;
      let fillOnly = 0;
      let both = 0;
      question.choices.forEach((c, i) => {
        if (i === ai) return;
        const s = c.figure?.cells[0]?.shapes[0];
        const kindWrong = s?.kind !== a!.kind;
        const fillWrong = s?.filled !== a!.filled;
        if (kindWrong && fillWrong) both++;
        else if (kindWrong) kindOnly++;
        else if (fillWrong) fillOnly++;
      });
      expect({ kindOnly, fillOnly, both }).toEqual({ kindOnly: 2, fillOnly: 1, both: 1 });
    }
  });

  // ★ 예측 대조 — 열의 종류 주기와 행의 채움 교대를 격자에서 역산한다
  test('표시된 정답이 격자에서 역산한 종류·채움과 일치한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      // (2,2)의 종류는 (0,2)와 같은 열이므로 같다. 채움은 (0,2)와 (1,2)의 교대에서 역산한다.
      const kindAtCol2 = cells[2]?.shapes[0]?.kind;
      const fillRow0 = cells[2]?.shapes[0]?.filled;
      const fillRow1 = cells[5]?.shapes[0]?.filled;
      expect(fillRow0).not.toBe(fillRow1); // 행마다 교대라는 전제 확인
      const expectedFilled = fillRow0; // 행 0과 행 2는 같은 상태

      const marked = question.choices[question.answerIndex ?? -1]?.figure;
      expect(marked).toBeDefined();
      const s = marked!.cells[0]?.shapes[0];
      expect(s?.kind).toBe(kindAtCol2);
      expect(s?.filled).toBe(expectedFilled);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });
});
```

**레지스트리 등록** — `src/engine/iq/generators/index.ts`의 `GENERATORS`에 `rotationGenerator`, `countGenerator`, `fillGenerator`를 넣는다. 순환 참조를 피하기 위해 `Generator` 인터페이스 선언과 레지스트리를 같은 파일에 두되, 각 생성기가 `./index`에서 타입만 import하는 현재 구조를 유지한다. 타입 전용 import이므로 런타임 순환은 생기지 않는다 — `import type { Generator } from './index'`인지 확인할 것.

---

### 모든 생성기 태스크의 공통 요구 (Task 4b·5가 상속)

Task 4 리뷰에서 확정. 생성기가 지켜야 할 규칙은 네 종류이고, **각각 따로 테스트한다.**
넷 중 하나만 빠져도 그 규칙은 무방비다 — Task 4에서 실제로 네 가지가 전부 무방비인 채
241개 테스트를 통과했고, 리뷰어가 뮤테이션으로 하나씩 증명했다.

| # | 지켜야 할 것 | 빠졌을 때 |
|---|---|---|
| ① | **정답 표시** — 그려진 격자에서 규칙을 역산해 대조(★ 예측 대조) | 정답이 엉뚱한 선택지에 붙어도 통과 |
| ② | **그림의 시각적 유효성** — 겹침 없음, 좌표·크기 범위 안 | **사용자에게 도달한다** (아래) |
| ③ | **해설 내용** — 실제 사용한 규칙과 값을 말하는가 | 규칙이 바뀌어도 해설이 옛말을 계속함 |
| ④ | **레지스트리 등록** — `GENERATORS`에 들어 있는가 | 생성기가 조용히 출제에서 빠짐 |

**②가 왜 사용자에게 도달하는가:** 점 두 개가 같은 좌표에 그려지면 화면엔 6개인데 정답은 7개다.
맞게 센 사람이 틀렸다고 나온다. `cellEquals`는 "도형 개수가 다르니 다른 그림"이라 판정하므로
정답 유일성 검사로는 **절대** 못 잡는다. 배치표를 쓰는 생성기는 모든 쌍의 거리를 계산해
도형 지름보다 큰지 검사할 것. 지름은 테스트에 상수로 쓰지 말고 **생성된 도형의 `size`에서 가져온다** —
생성기에서 크기를 바꾸면 테스트도 같이 따라와야 한다.

**③의 검사도 역산으로.** 생성기 내부 변수를 다시 읽으면 동어반복이다. ★ 예측 대조와 같은 방식으로
`question.figure.cells`에서 값을 다시 구해 해설 문자열이 그 값을 담고 있는지 본다.

**⑤ "A가 B를 정한다" 규칙은 양쪽을 다 검사한다.** (Task 4b 리뷰에서 추가)

생성기의 규칙은 거의 다 "행이 종류를 정한다", "열이 크기를 정한다" 꼴이다. 이건 **두 가지 주장**이다:
같은 A 안에서는 B가 일정하고, **다른 A끼리는 B가 다르다.** 뒤쪽을 빠뜨리기 쉽다.

Task 4b의 `size.ts`에서 `KINDS[(r + kindOffset) % 3]`를 `KINDS[kindOffset]`로 바꾸면
격자 전체가 한 종류가 되어 "행이 종류를 정한다"는 전제가 통째로 무너지는데,
**9개 테스트와 레지스트리 테스트 3개가 전부 초록불이었다.** 앞쪽 주장만 검사하고 있었기 때문이다.

**⑥ 해설은 재계산하지 말고 그려진 격자에서 읽는다.** (Task 4b 리뷰에서 추가)

`distribute`는 격자를 `comboAt(r, c)` 루프로 채운 뒤, 해설을 만들 때 `comboAt(2,0)`·`comboAt(2,1)`을
**다시 호출**했다. 그래서 격자 채우는 루프만 바뀌면 해설이 다른 격자를 설명하게 된다.
리뷰어가 루프를 전치시켜봤더니 10개 테스트가 전부 초록불이었다.

→ 해설의 근거 값은 **이미 채운 `cells` 배열에서 읽는다.** 그러면 해설이 그려진 격자와
   구조적으로 어긋날 수 없다. 테스트를 추가하는 것보다 이 편이 낫다 — 버그를 잡는 게 아니라
   표현 불가능하게 만든다.
→ ★ 예측 대조가 "정답을 격자에서 역산한다"와 같은 원리다. 같은 원리를 해설에도 적용한다.

**⑦ 속성이 문항 안에서 일관되는지 본다.** `filled` 같은 "그냥 보기 설정" 속성도
**격자와 선택지가 같은 값**이어야 한다. 전역으로 뒤집는 건 미관 결정이라 테스트로 못박지 않지만,
일부만 뒤집히면 `filled`가 뜻하지 않은 구분 기준이 되어 **정답과 채움만 다른 선택지**가 생길 수 있다.
전역 변경은 자유롭게 두고 부분 불일치만 잡는 형태로 쓸 것.

**불변식은 그것이 성립하는 모든 경로에서 검사한다.** Task 4의 `fill`은 "회전을 안 쓴다"를
선택지에서만 확인하고 있었다. 격자에만 회전을 주입하는 뮤테이션은 8개 테스트를 전부 통과했다.
격자와 선택지가 같은 헬퍼를 쓰기 때문에 우연히 성립했을 뿐이다. 경로가 갈라지는 순간 무력해진다.

---

### Task 4b — 3분배 · 크기 진행 생성기

**Files:**
- Create: `src/engine/iq/generators/distribute.ts`, `src/engine/iq/generators/size.ts`
- Modify: `src/engine/iq/generators/index.ts` (레지스트리 등록)
- Test: `__tests__/engine/iq/distribute.test.ts`, `__tests__/engine/iq/size.test.ts`

위의 **공통 요구 ①~④를 두 생성기가 각각** 갖춘다. ②(시각적 유효성)는 여기서 겹침이 아니라
**크기 구분 가능성**으로 나타난다 — 한 셀에 도형이 하나뿐이라 겹칠 일은 없다.

**크기 상수는 두 생성기가 공유한다.** `size.ts`에 정의하고 `distribute.ts`가 import한다.

```ts
/** 화면에서 확실히 구분되는 세 단계. 인접 간격 0.2 — 최소 요구치 0.12의 1.6배. */
export const SIZES = [0.3, 0.5, 0.7] as const;
```

> **왜 3단계뿐인가 (되돌리지 말 것):** 9칸을 단조 증가시키려면 8번 커져야 하는데,
> 허용 범위 0.25~0.85의 폭은 0.6이라 한 단계가 0.075가 된다. 이건 화면에서 구분이 안 된다.
> 기계는 0.01 차이도 "다른 도형"으로 판정하므로 **자동 검사로는 절대 안 잡힌다.**
> 회전 함정과 같은 종류다. 그래서 크기는 **행이나 열 안에서만** 진행하고 9칸을 관통하지 않는다.

---

**`src/engine/iq/generators/distribute.ts`** — 난이도 3

규칙: **각 줄에 세 종류가 한 번씩, 세 크기도 한 번씩.** 종류와 크기가 서로 독립인 그레코-라틴 방진이라
9칸의 (종류, 크기) 조합이 전부 다르다. 레이븐 행렬의 고전적 형태다.

```ts
import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import { SIZES } from './size';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question, ShapeKind } from '../../types';
import type { Generator } from './index';

const KINDS: readonly ShapeKind[] = ['circle', 'square', 'triangle'];

interface Combo {
  readonly kind: ShapeKind;
  readonly size: number;
}

function cellOf(c: Combo): CellSpec {
  return { shapes: [shape(c.kind, { size: c.size, filled: false })] };
}

function single(c: Combo): FigureSpec {
  return { kind: 'single', cells: [cellOf(c)] };
}

function comboKey(c: Combo): string {
  return `${c.kind}:${c.size}`;
}

export const distributeGenerator: Generator = {
  id: 'distribute',
  difficulty: 3,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const kindOffset = pickInt(rand, 0, 2);
    const sizeOffset = pickInt(rand, 0, 2);

    // 두 라틴 방진이 서로 직교한다: (r+c)와 (r+2c)는 mod 3에서 9쌍이 전부 다르다.
    // 그래서 종류와 크기가 상관관계를 갖지 않고, 둘 다 읽어야 풀린다.
    const comboAt = (r: number, c: number): Combo => ({
      kind: KINDS[(r + c + kindOffset) % 3] as ShapeKind,
      size: SIZES[(r + 2 * c + sizeOffset) % 3] as number,
    });

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(cellOf(comboAt(Math.floor(i / 3), i % 3)));
    }

    const answer = comboAt(2, 2);

    // 오답은 어긴 규칙별로 하나씩 — fill.ts와 같은 원칙.
    //  (a) 종류는 맞고 크기만 틀림 (1개): 종류 줄만 읽은 사람
    //  (b) 크기는 맞고 종류만 틀림 (2개): 크기 줄만 읽은 사람. 마지막 줄에 이미 있는 종류다
    //  (c) 둘 다 틀림 (1개)
    const otherKinds = KINDS.filter((k) => k !== answer.kind);
    const otherSizes = SIZES.filter((s) => s !== answer.size);
    const wrong: Combo[] = [
      { kind: answer.kind, size: otherSizes[pickInt(rand, 0, otherSizes.length - 1)] as number },
      ...otherKinds.map((k) => ({ kind: k, size: answer.size })),
      {
        kind: otherKinds[pickInt(rand, 0, otherKinds.length - 1)] as ShapeKind,
        size: otherSizes[pickInt(rand, 0, otherSizes.length - 1)] as number,
      },
    ];
    const options = shuffle([answer, ...wrong], rand);
    const answerIndex = options.findIndex((o) => comboKey(o) === comboKey(answer));

    const kindNames: Record<ShapeKind, string> = {
      circle: '원', square: '사각형', triangle: '삼각형', diamond: '마름모',
    };
    const sizeName = (s: number): string =>
      s === SIZES[0] ? '작은' : s === SIZES[1] ? '중간' : '큰';

    const rowKinds = [comboAt(2, 0), comboAt(2, 1)].map((c) => kindNames[c.kind]);
    const rowSizes = [comboAt(2, 0), comboAt(2, 1)].map((c) => sizeName(c.size));

    const question: Question = {
      id: `iq-distribute-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `가로 한 줄에는 원·사각형·삼각형이 한 번씩, 크기도 작은·중간·큰 것이 한 번씩 나옵니다. ` +
        `마지막 줄에는 이미 ${rowKinds.join('과 ')}이 있으므로 빈 칸은 ${kindNames[answer.kind]}이고, ` +
        `${rowSizes.join('·')} 크기가 이미 나왔으므로 ${sizeName(answer.size)} 크기입니다.`,
      difficulty: 3,
    };

    return { question, generatorId: 'distribute', seed };
  },
};
```

**Test:** `__tests__/engine/iq/distribute.test.ts`

공통 요구 ①~③에 더해, **그레코-라틴 성질 자체**를 검사한다. 이게 무너지면 문제에 정답이 둘이 되거나
아예 풀 수 없는 문제가 된다.

```ts
import { distributeGenerator } from '@/engine/iq/generators/distribute';
import { SIZES } from '@/engine/iq/generators/size';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

const G = distributeGenerator;
const kindAt = (q: ReturnType<typeof G.generate>['question'], i: number) =>
  q.figure?.cells[i]?.shapes[0]?.kind;
const sizeAt = (q: ReturnType<typeof G.generate>['question'], i: number) =>
  q.figure?.cells[i]?.shapes[0]?.size;

describe('distributeGenerator', () => {
  test('시드 50개에서 같은 시드가 같은 문항을 만든다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(G.generate(seed))).toBe(JSON.stringify(G.generate(seed)));
    }
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(G.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  test('시드 500개에서 정답 위치가 고정되어 있지 않다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(G.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  // 규칙 자체의 무결성 — 이게 깨지면 정답이 둘이거나 풀 수 없는 문제가 나온다
  test('모든 행과 열에 세 종류·세 크기가 정확히 한 번씩 나온다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      // 빈 칸(8번)은 정답으로 메워서 완성된 격자로 본다
      const full = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
        kind: kindAt(question, i),
        size: sizeAt(question, i),
      }));
      const ans = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      full.push({ kind: ans?.kind, size: ans?.size });

      for (let line = 0; line < 3; line++) {
        const row = [0, 1, 2].map((c) => full[line * 3 + c]);
        const col = [0, 1, 2].map((r) => full[r * 3 + line]);
        for (const group of [row, col]) {
          expect(new Set(group.map((g) => g?.kind)).size).toBe(3);
          expect(new Set(group.map((g) => g?.size)).size).toBe(3);
        }
      }
    }
  });

  // ★ 직교성 — 위 테스트만으로는 부족하다. 구현 중에 실제로 확인됐다.
  // 종류와 크기를 **따로** 검사하면 두 라틴 방진이 서로 직교하지 않아도 통과한다.
  // 크기 공식을 (r+2c)에서 (r+c)로 바꾸면 종류와 크기가 완전히 상관되어
  // 9칸에 조합이 3개밖에 안 남는데(문제가 퇴화한다), 위 테스트는 초록불이었다.
  test('완성된 격자의 (종류, 크기) 조합 9개가 전부 다르다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const pairs = [0, 1, 2, 3, 4, 5, 6, 7].map(
        (i) => `${kindAt(question, i)}:${sizeAt(question, i)}`
      );
      const ans = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      pairs.push(`${ans?.kind}:${ans?.size}`);
      expect(new Set(pairs).size).toBe(9);
    }
  });

  // ② 시각적 유효성 — 크기가 화면에서 구분되는가
  test('쓰이는 크기는 세 단계뿐이고 서로 0.12 이상 벌어져 있다', () => {
    const used = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      for (let i = 0; i < 9; i++) {
        const s = sizeAt(question, i);
        if (s !== undefined) used.add(s);
      }
      for (const c of question.choices) {
        const s = c.figure?.cells[0]?.shapes[0]?.size;
        if (s !== undefined) used.add(s);
      }
    }
    const sorted = [...used].sort((a, b) => a - b);
    expect(sorted).toEqual([...SIZES].sort((a, b) => a - b));
    for (let i = 1; i < sorted.length; i++) {
      expect((sorted[i] as number) - (sorted[i - 1] as number)).toBeGreaterThanOrEqual(0.12);
    }
    expect(sorted[0] as number).toBeGreaterThanOrEqual(0.25);
    expect(sorted[sorted.length - 1] as number).toBeLessThanOrEqual(0.85);
  });

  test('오답은 종류만 틀림 2개, 크기만 틀림 1개, 둘 다 틀림 1개다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const ai = question.answerIndex ?? -1;
      const a = question.choices[ai]?.figure?.cells[0]?.shapes[0];
      expect(a).toBeDefined();
      let kindOnly = 0, sizeOnly = 0, both = 0;
      question.choices.forEach((c, i) => {
        if (i === ai) return;
        const s = c.figure?.cells[0]?.shapes[0];
        const kw = s?.kind !== a!.kind;
        const sw = s?.size !== a!.size;
        if (kw && sw) both++; else if (kw) kindOnly++; else if (sw) sizeOnly++;
      });
      expect({ kindOnly, sizeOnly, both }).toEqual({ kindOnly: 2, sizeOnly: 1, both: 1 });
    }
  });

  // ★ ① 예측 대조 — 마지막 줄에 빠진 종류·크기를 격자에서 직접 구한다.
  // 생성기의 (r+c)%3 공식을 다시 쓰지 않는다. 라틴 방진이면 "줄에 없는 값"이 곧 답이다.
  test('표시된 정답이 마지막 줄에서 빠진 종류·크기와 일치한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const rowKinds = [kindAt(question, 6), kindAt(question, 7)];
      const rowSizes = [sizeAt(question, 6), sizeAt(question, 7)];
      const missingKind = (['circle', 'square', 'triangle'] as const).find(
        (k) => !rowKinds.includes(k)
      );
      const missingSize = SIZES.find((s) => !rowSizes.includes(s));
      expect(missingKind).toBeDefined();
      expect(missingSize).toBeDefined();

      const marked = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      expect(marked?.kind).toBe(missingKind);
      expect(marked?.size).toBe(missingSize);
    }
  });

  // ③ 해설 내용
  test('해설이 격자에서 역산한 종류를 실제로 언급한다', () => {
    const names: Record<string, string> = { circle: '원', square: '사각형', triangle: '삼각형' };
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const rowKinds = [kindAt(question, 6), kindAt(question, 7)];
      const missingKind = (['circle', 'square', 'triangle'] as const).find(
        (k) => !rowKinds.includes(k)
      );
      const text = question.explanation ?? '';
      // 정답 종류를 말해야 하고, 마지막 줄에 이미 있는 두 종류도 근거로 들어야 한다
      expect(text).toContain(names[missingKind as string] as string);
      for (const k of rowKinds) {
        expect(text).toContain(names[k as string] as string);
      }
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });
});
```

> **해설 테스트에 대한 주의:** `사각형`은 `원`을 포함하지 않지만 한글 부분문자열 함정을 조심할 것.
> 이 세 이름은 서로의 부분문자열이 아니므로 `toContain`이 안전하다. 나중에 `마름모`를 추가하면
> 다시 확인할 것.

---

**`src/engine/iq/generators/size.ts`** — 난이도 2

규칙: **행이 종류를 정하고, 열이 크기를 정한다.** 왼쪽에서 오른쪽으로 갈수록 커진다.
`fill.ts`와 축이 반대이고(거긴 열=종류, 행=채움) 변하는 속성도 다르므로 헷갈리지 않는다.

```ts
import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question, ShapeKind } from '../../types';
import type { Generator } from './index';

/** 화면에서 확실히 구분되는 세 단계. 인접 간격 0.2 — 최소 요구치 0.12의 1.6배. */
export const SIZES = [0.3, 0.5, 0.7] as const;

const KINDS: readonly ShapeKind[] = ['circle', 'square', 'triangle'];

interface Combo {
  readonly kind: ShapeKind;
  readonly size: number;
}

function cellOf(c: Combo): CellSpec {
  return { shapes: [shape(c.kind, { size: c.size, filled: true })] };
}

function single(c: Combo): FigureSpec {
  return { kind: 'single', cells: [cellOf(c)] };
}

function comboKey(c: Combo): string {
  return `${c.kind}:${c.size}`;
}

export const sizeGenerator: Generator = {
  id: 'size',
  difficulty: 2,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const kindOffset = pickInt(rand, 0, 2);
    // 커지는 방향인가 작아지는 방향인가. 두 방향 다 나와야 "오른쪽=큼"을 외우는 걸 막는다.
    const ascending = rand() < 0.5;

    const comboAt = (r: number, c: number): Combo => ({
      kind: KINDS[(r + kindOffset) % 3] as ShapeKind,
      size: (ascending ? SIZES[c] : SIZES[2 - c]) as number,
    });

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(cellOf(comboAt(Math.floor(i / 3), i % 3)));
    }

    const answer = comboAt(2, 2);

    const otherKinds = KINDS.filter((k) => k !== answer.kind);
    const otherSizes = SIZES.filter((s) => s !== answer.size);
    const wrong: Combo[] = [
      // 크기만 틀림 2개 — 크기가 이 문제의 핵심 규칙이므로 오답도 여기에 몰아준다
      ...otherSizes.map((s) => ({ kind: answer.kind, size: s })),
      { kind: otherKinds[pickInt(rand, 0, otherKinds.length - 1)] as ShapeKind, size: answer.size },
      {
        kind: otherKinds[pickInt(rand, 0, otherKinds.length - 1)] as ShapeKind,
        size: otherSizes[pickInt(rand, 0, otherSizes.length - 1)] as number,
      },
    ];
    const options = shuffle([answer, ...wrong], rand);
    const answerIndex = options.findIndex((o) => comboKey(o) === comboKey(answer));

    const kindNames: Record<ShapeKind, string> = {
      circle: '원', square: '사각형', triangle: '삼각형', diamond: '마름모',
    };

    const question: Question = {
      id: `iq-size-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `가로 줄마다 도형 종류가 정해져 있고, 오른쪽으로 갈수록 ` +
        `${ascending ? '커집니다' : '작아집니다'}. ` +
        `마지막 줄은 ${kindNames[answer.kind]}이고, 세 번째 칸이므로 ` +
        `${ascending ? '가장 큰' : '가장 작은'} 크기입니다.`,
      difficulty: 2,
    };

    return { question, generatorId: 'size', seed };
  },
};
```

**Test:** `__tests__/engine/iq/size.test.ts`

`distribute.test.ts`와 같은 여덟 가지를 갖추되 이 규칙에 맞게 쓴다. 특히 다른 점 세 가지:

```ts
  // 두 방향이 다 나와야 한다. 한 방향만 나오면 "오른쪽=큼"을 외워도 다 맞는다.
  test('시드 500개에서 커지는 방향과 작아지는 방향이 둘 다 나온다', () => {
    const directions = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const s0 = sizeAt(question, 0) as number;
      const s1 = sizeAt(question, 1) as number;
      directions.add(s1 > s0 ? 'up' : 'down');
    }
    expect(directions.size).toBe(2);
  });

  // ★ ① 예측 대조 — 첫 줄의 두 칸에서 등차를 읽어 셋째 칸을 독립 계산한다.
  // "줄에 없는 값"이 아니라 "진행을 이어간 값"으로 구해야 단조성까지 검사된다.
  test('표시된 정답 크기가 줄의 진행을 이어간 값이다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      // 마지막 줄(6,7)의 간격을 읽어 8번 칸을 예측한다
      const s6 = sizeAt(question, 6) as number;
      const s7 = sizeAt(question, 7) as number;
      const expected = s7 + (s7 - s6);
      const marked = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      expect(marked?.size).toBeCloseTo(expected, 10);
      // 종류는 그 줄에서 일정하다
      expect(marked?.kind).toBe(kindAt(question, 6));
      expect(kindAt(question, 7)).toBe(kindAt(question, 6));
    }
  });

  // ③ 해설 내용 — 방향을 실제로 맞게 말하는가
  test('해설의 방향 서술이 격자의 실제 방향과 일치한다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const ascending = (sizeAt(question, 1) as number) > (sizeAt(question, 0) as number);
      const text = question.explanation ?? '';
      if (ascending) {
        expect(text).toContain('커집니다');
        expect(text).not.toContain('작아집니다');
      } else {
        expect(text).toContain('작아집니다');
        expect(text).not.toContain('커집니다');
      }
    }
  });
```

나머지(결정성 50시드, `verifyGenerated` 500시드, 정답 위치 분산, 크기 3단계·간격 0.12,
오답 구성 `{ sizeOnly: 2, kindOnly: 1, both: 1 }`, 오답≠정답)는 `distribute.test.ts`와 같은 형태로 쓴다.

**레지스트리 등록** — `GENERATORS`에 `distributeGenerator`와 `sizeGenerator`를 추가한다.

`__tests__/engine/iq/generators.test.ts`는 이미 **디스크에서 생성기 모듈을 발견하는 방식**이다
(Task 4 재리뷰에서 하드코딩 목록을 교체했다). 그래서 등록을 빠뜨리면 **자동으로 빨간불이 된다.**
테스트 파일에 새 생성기를 손으로 추가할 필요가 없고, 추가해서도 안 된다.

발견은 export의 **모양**(`id`·`difficulty`·`generate` 보유)으로 거르므로, `size.ts`가 `SIZES` 상수를
함께 내보내도 문제없다. 이 케이스는 Task 4 라운드 2에서 미리 확인했다.

### Task 5 — 수열 생성기

**Files:**
- Create: `src/engine/iq/generators/sequence.ts`
- Modify: `src/engine/iq/generators/index.ts` (레지스트리 등록 — 발견 방식이면 자동)
- Test: `__tests__/engine/iq/sequence.test.ts`

도형이 아니라 숫자다. `figure` 없이 `choices[].text`를 쓰고, `prompt`에 수열을 적는다.
공통 요구 ②(시각적 유효성)는 여기서 **숫자 크기**로 나타난다 — 등비·제곱은 금방 자릿수가
폭발해서 선택지 버튼이 화면을 넘친다. 아래 파라미터 범위는 그걸 계산해서 정한 값이다.

**규칙 5종과 파라미터 범위** (전부 결과가 1~9999에 들어오도록 계산해둔 값이다)

| 규칙 | 파라미터 | 보여줄 항 수 | 정답의 최댓값 |
|---|---|---|---|
| 등차(증가) | `start` 2~20, `step` 2~12 | 6 | 20+6·12 = 92 |
| 등차(감소) | `start` 80~99, `step` -12~-2 | 6 | 최소 80-72 = 8 (**음수 안 나옴**) |
| 등비 | `start` 1~4, `ratio` 2~3 | 5 | 4·3⁵ = 972 |
| 피보나치 | `a` 1~6, `b` 1~6 | 6 | 78 |
| 교대 | 두 등차 각각 `start` 2~15, `step` 2~8, **`stepA ≠ stepB`** | 6 | 15+3·8 = 39 |
| 제곱 | `(n+k)²`, `k` 0~3 | 6 | 10² = 100 |

> **등비의 항 수가 5인 이유:** 6개를 보여주면 정답이 `4·3⁶ = 2916`이 되고, "한 단계 더 간" 오답이
> `8748`이 된다. 거기서 한 단계만 더 늘리면 다섯 자리가 되어 버튼을 넘친다. 5항이 안전한 상한이다.

**오답 만들기 — 공용 헬퍼로 통일한다**

수열은 규칙마다 "그럴듯한 오답"이 다르다. 그런데 규칙별 오답이 서로 겹치거나 정답과 같아질 수
있어서, 매번 손으로 처리하면 빠뜨린다. 헬퍼 하나로 모은다.

```ts
/**
 * 규칙에서 나온 "그럴듯한 오답" 후보를 받아 정답과 다른 4개를 고른다.
 * 후보가 모자라면 정답 ±k로 채운다 — 교육적이진 않지만 5지선다는 채워야 한다.
 * 상한(9999)을 넘는 값은 버린다. 선택지 버튼이 화면을 넘치기 때문이다.
 */
export function pickDistractors(
  answer: number,
  candidates: readonly number[],
  rand: () => number
): number[] {
  const MAX = 9999;
  const ok = (n: number): boolean => Number.isInteger(n) && n >= 1 && n <= MAX;

  const out: number[] = [];
  const seen = new Set<number>([answer]);
  for (const c of candidates) {
    if (out.length === 4) break;
    if (!ok(c) || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  // 부족분은 정답 근처 값으로 채운다. 1부터 차례로 늘려가며 위아래를 번갈아 본다.
  for (let k = 1; out.length < 4; k++) {
    for (const cand of [answer + k, answer - k]) {
      if (out.length === 4) break;
      if (!ok(cand) || seen.has(cand)) continue;
      seen.add(cand);
      out.push(cand);
    }
    if (k > MAX) throw new Error(`오답을 채울 수 없습니다: answer=${answer}`);
  }
  return shuffle(out, rand);
}
```

**규칙별 오답 후보** — 각각 특정한 오해에서 나온 값이라 순서가 곧 우선순위다.

```ts
// 등차: 한 칸 덜 감 / 두 칸 감 / 계산 실수(±1)
[last, answer + step, answer + 1, answer - 1]

// 등비: 곱하는 대신 더함 / 한 칸 덜 감 / 한 칸 더 감
[last + ratio, last, answer * ratio, answer + last]

// 피보나치: 마지막 항의 2배로 착각 / 한 칸 덜 감 / 두 항 차이를 더함
[last * 2, last, last + (last - prev), answer + prev]

// 교대: 같은 줄이 아니라 바로 앞 항에 규칙을 적용 / 다른 줄의 다음 값
[last + stepA, last + stepB, answer + stepA, answer - stepA]

// 제곱: 마지막 제곱수 + n / 한 칸 덜 감 / 제곱 대신 곱셈 실수
[last + base, last, (base + 2) ** 2, answer + base]
```

**중요:** 이 후보들이 정답과 같아지는 조합이 실제로 존재한다. 예를 들어 등차에서 `step === 1`이면
`answer + 1`과 다음 항이 겹친다. 그래서 위 표에서 **모든 `step`의 하한이 2**다.
`pickDistractors`가 중복을 걸러주므로 안전하지만, 걸러진 만큼 교육적인 오답이 근처 숫자로
대체된다는 뜻이기도 하다. **시드 500개에서 "채우기로 대체된 비율"을 측정하는 테스트를 넣어
20%를 넘지 않는지 본다.** 넘으면 파라미터 범위가 잘못된 것이다.

**문항 형태**

```ts
prompt: `다음 수열에서 ?에 들어갈 수는?\n\n${terms.join(', ')}, ?`,
choices: options.map((n) => ({ text: String(n) })),
```

`figure`는 넣지 않는다. `QuizRunner`는 이미 텍스트 선택지를 그리므로 Task 7에서 따로 할 일이 없다.

**해설** — 규칙마다 수식이 보이게 쓴다. 값은 전부 실제 사용한 파라미터에서 만든다.

```
등차(증가): `앞의 수에 ${step}씩 더해집니다. ${last} + ${step} = ${answer}.`
등차(감소): `앞의 수에서 ${-step}씩 빠집니다. ${last} - ${-step} = ${answer}.`
           ← 방향에 맞춰 문구를 바꾼다. 음수 step을 그대로 끼우면 "41 + -9 = 32"가 나온다.
등비: `앞의 수에 ${ratio}씩 곱해집니다. ${last} × ${ratio} = ${answer}.`
피보나치: `앞의 두 수를 더하면 다음 수가 됩니다. ${prev} + ${last} = ${answer}.`
교대: `한 칸 건너뛴 수끼리 묶어서 보세요. ${a0}, ${a1}, ${a2}는 ${stepA}씩 늘어납니다. 다음은 ${answer}.`
제곱: `1², 2², 3² … 제곱수입니다. ${base}² = ${answer}.`
```

**Test:** `__tests__/engine/iq/sequence.test.ts`

공통 요구 ①③④를 갖추고, ②는 숫자 범위로 대체한다.

```ts
  // ② 화면에 들어가는가
  test('제시된 항과 선택지가 모두 1~9999 정수다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const nums = [...termsOf(question), ...question.choices.map((c) => Number(c.text))];
      for (const n of nums) {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(9999);
      }
    }
  });

  // ★ ① 예측 대조 — 제시된 항에서 규칙을 역산해 다음 항을 독립 계산한다.
  // 생성기의 파라미터를 읽지 않는다. 다섯 규칙 중 어느 것인지도 항들만 보고 판정한다.
  test('표시된 정답이 제시된 항에서 역산한 다음 항과 일치한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const t = termsOf(question);
      const marked = Number(question.choices[question.answerIndex ?? -1]?.text);
      expect(marked).toBe(predictNext(t));
    }
  });

  // 다섯 규칙이 전부 나오는가. 하나가 죽어도 나머지로 통과해버리면 안 된다.
  test('시드 500개에서 다섯 규칙이 모두 출제된다', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      seen.add(classify(termsOf(G.generate(seed).question)));
    }
    expect(seen).toEqual(
      new Set(['arithmetic', 'geometric', 'fibonacci', 'alternating', 'square'])
    );
  });

  // 채우기 오답이 너무 많으면 파라미터 범위가 잘못된 것이다
  test('교육적 오답이 근처 숫자로 대체된 비율이 20% 미만이다', () => {
    let filled = 0;
    let total = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const answer = Number(question.choices[question.answerIndex ?? -1]?.text);
      for (const c of question.choices) {
        const n = Number(c.text);
        if (n === answer) continue;
        total++;
        if (Math.abs(n - answer) <= 2) filled++;  // ±1·±2는 채우기로 나온 값
      }
    }
    expect(filled / total).toBeLessThan(0.2);
  });
```

`predictNext`와 `classify`는 **테스트 파일 안에** 둔다. 생성기가 쓰는 코드를 재사용하면
동어반복이 되어 예측 대조의 의미가 사라진다. `classify`는 항들만 보고 판정한다:
연속 차가 일정하면 등차, 연속 비가 일정하면 등비, `t[i] = t[i-1] + t[i-2]`면 피보나치,
전부 완전제곱수면 제곱, 한 칸 건너뛴 값들의 차가 일정하면 교대.

**규칙끼리 겹치는 문제 — 실제로 하나 있다**

다섯 규칙 대부분은 서로 배타적이다(제곱수열은 등차도 등비도 아니고, 피보나치는 차가 일정하지 않다).
그런데 **등차수열은 항상 교대수열이기도 하다.** 한 칸 건너뛴 항들만 모으면 공차가 두 배인
등차수열 두 개가 되기 때문이다. 5, 8, 11, 14, 17, 20은 "3씩 증가"이면서 동시에
"5, 11, 17은 6씩 / 8, 14, 20은 6씩"이다.

반대 방향의 퇴화도 있다. 교대수열의 두 공차가 같고(`stepA === stepB`)
그 값이 두 시작값 차이의 두 배이면, 결과가 그냥 하나의 등차수열이 된다.
그러면 해설이 "한 칸 건너뛴 수끼리 묶어서 보세요"라고 말하는데 화면엔 평범한 등차수열이 있다.
정답은 어느 쪽으로 봐도 같으므로 **틀린 답이 나가지는 않지만 해설이 사람을 헷갈리게 한다.**

→ **생성기 쪽 가드: 교대 규칙은 `stepA !== stepB`를 강제한다.** 그러면 하나의 등차수열로
   퇴화할 수 없다. (`start1 !== start2`도 함께 요구하면 더 확실하다.)
→ **`classify` 판정 순서: 제곱 → 피보나치 → 등비 → 등차 → 교대.**
   등차가 교대보다 **먼저** 와야 한다 — 그 반대는 위에서 본 대로 오분류다.
   나머지 순서는 서로 배타적이라 상관없지만 고정해두면 나중에 규칙을 추가할 때 기준이 된다.

**순서에 의존하는 대신 겹침 자체를 검사한다.** 판정 순서는 사람이 지켜야 하는 규칙이라 잊힌다.
겹침이 없다는 것 자체를 테스트로 박아두는 편이 낫다:

```ts
  // 한 수열이 두 규칙에 동시에 해당하면 해설이 설명하는 규칙과
  // 사용자가 읽어낸 규칙이 달라질 수 있다. 교대의 stepA !== stepB 가드가 이걸 막는다.
  test('어떤 시드에서도 두 규칙에 동시에 해당하지 않는다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const t = termsOf(G.generate(seed).question);
      const matches = ALL_RULES.filter((r) => r.matches(t));
      if (matches.length !== 1) {
        throw new Error(`seed ${seed}: ${matches.map((r) => r.id).join('+')} — ${t.join(',')}`);
      }
    }
  });
```

`ALL_RULES`는 테스트 파일 안의 판정기 목록이다(`{ id, matches(terms) }`). `classify`는
이 목록을 순서대로 훑는 얇은 함수가 된다. 위 테스트가 통과하면 **순서가 무의미해지므로**
판정 순서를 잘못 잡는 실수 자체가 사라진다.

### Task 6 — IQ 출제·채점·급수

**Files:**
- Create: `src/engine/iq/assembleIq.ts`, `src/engine/iq/iqScore.ts`
- Modify: `src/content/grades.json` (`iq-default` 테이블), `src/content/registry.ts` (`IQ_DRAW`, 가용성 계산), `tools/validate-content.ts` (생성형 풀 검증)
- Test: `__tests__/engine/iq/assembleIq.test.ts`, `__tests__/engine/iq/iqScore.test.ts`

**Interfaces:**
- Consumes: `GENERATORS`(`./generators`), `verifyGenerated`(`./verify`), `hashSeed`·`mulberry32`(`../rng`), `gradeFor`(`../grade`), `getGradeBands`(`@/content/registry`)
- Produces: `assembleIq(seed, config): GeneratedQuestion[]`, `IQ_DRAW: IqDrawConfig`, `scoreIq(questions, answers, bands): IqResult`

---

**IQ는 정적 풀이 없다 — 여기서 배선 두 곳이 조용히 빠진다**

다른 시험은 `POOLS`에 JSON 배열로 들어 있는데 IQ는 시드에서 생성한다. 그래서 `registry.ts`의
기존 배선 두 개가 **IQ만 건너뛴다.** 둘 다 고칠 것:

1. `CATEGORIES`의 `available: categoryHasPool('iq')`는 `POOLS`를 보므로 **영원히 false**다.
   홈 화면에서 IQ 카드가 계속 잠겨 있게 된다. → `available: GENERATORS.length > 0`으로 바꾼다.
   손으로 뒤집는 `true`가 아니라 **계산된 값**이어야 한다는 기존 원칙은 그대로다.
2. `tools/validate-content.ts`는 `POOLS`를 순회한다. IQ는 거기 없으므로 **릴리스 게이트가
   가장 큰 문항 공급원을 전혀 검사하지 않는다.** → CLI에 생성형 검증을 추가한다:
   각 생성기를 시드 1~200으로 돌려 `verifyGenerated`가 빈 배열을 주는지 본다.
   실패하면 생성기 id와 시드를 찍고 종료 코드 1.

`POOLS`에 IQ를 넣지는 않는다. 20문항이 시드마다 달라서 정적 배열로 표현할 수 없고,
억지로 넣으면 `POOL_SCORING`·`getPool` 계약이 다 흐려진다.

---

**`src/engine/iq/assembleIq.ts`**

```ts
import { hashSeed, mulberry32, shuffle } from '../rng';
import { GENERATORS } from './generators';
import type { Difficulty, GeneratedQuestion } from '../types';

export interface IqDrawConfig {
  readonly questionCount: number;
  /** 난이도별 목표 개수. 합이 questionCount와 다르면 questionCount가 우선한다. */
  readonly difficultyMix: Partial<Record<Difficulty, number>>;
}

/** 같은 퍼즐이 한 세트에 두 번 나오지 않게 하기 위한 재시도 한도. */
const MAX_ATTEMPTS_PER_SLOT = 40;

/** 문항을 "같은 퍼즐인가"로 비교하는 키. 선택지 순서는 무시한다. */
function puzzleKey(gq: GeneratedQuestion): string {
  const q = gq.question;
  return q.figure ? `${gq.generatorId}|${JSON.stringify(q.figure)}` : `${gq.generatorId}|${q.prompt}`;
}

/**
 * 시드에서 IQ 한 세트를 만든다. 같은 시드는 항상 같은 세트를 준다.
 *
 * 선택지는 **여기서 섞지 않는다** — 생성기가 이미 자기 rng로 섞는다.
 * (`assemble()`이 정적 풀에 대해 하는 일을 생성기가 대신하고 있다.)
 */
export function assembleIq(seed: number, config: IqDrawConfig): GeneratedQuestion[] {
  if (GENERATORS.length === 0) {
    throw new Error('등록된 생성기가 없습니다');
  }

  const rand = mulberry32(seed);
  const byDifficulty = new Map<Difficulty, typeof GENERATORS>();
  for (const d of [1, 2, 3] as const) {
    byDifficulty.set(d, GENERATORS.filter((g) => g.difficulty === d));
  }

  // 난이도별 목표를 먼저 채우고, 남으면 전체에서 채운다.
  const slots: Difficulty[] = [];
  for (const d of [1, 2, 3] as const) {
    const want = config.difficultyMix[d] ?? 0;
    // 그 난이도에 생성기가 하나도 없으면 자리를 만들지 않는다.
    // 만들면 아래 루프가 영원히 못 채운다.
    if ((byDifficulty.get(d) ?? []).length === 0) continue;
    for (let i = 0; i < want && slots.length < config.questionCount; i++) slots.push(d);
  }
  const anyDifficulty = [1, 2, 3].filter(
    (d) => (byDifficulty.get(d as Difficulty) ?? []).length > 0
  ) as Difficulty[];
  while (slots.length < config.questionCount) {
    slots.push(anyDifficulty[slots.length % anyDifficulty.length] as Difficulty);
  }

  const out: GeneratedQuestion[] = [];
  const seen = new Set<string>();

  shuffle(slots, rand).forEach((difficulty, i) => {
    const pool = byDifficulty.get(difficulty) as typeof GENERATORS;
    // 같은 난이도 안에서는 생성기를 돌아가며 쓴다. 그 난이도에 생성기가 하나뿐이면
    // 그 하나가 전부를 맡는다 — 시드가 달라 문항은 서로 다르다.
    const gen = pool[i % pool.length] as (typeof GENERATORS)[number];

    // 같은 퍼즐이 두 번 나오면 앱이 고장난 것처럼 보인다.
    // 생성기의 파라미터 공간이 좁아서(회전은 9가지뿐) 실제로 자주 부딪힌다.
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_SLOT; attempt++) {
      const gq = gen.generate(hashSeed(`${seed}:${gen.id}:${i}:${attempt}`));
      const key = puzzleKey(gq);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(gq);
        return;
      }
    }
    throw new Error(
      `생성기 ${gen.id}가 ${MAX_ATTEMPTS_PER_SLOT}번 시도에도 새 퍼즐을 못 만들었습니다 ` +
        `(seed=${seed}, slot=${i}). 파라미터 공간이 출제 수보다 좁습니다.`
    );
  });

  return out;
}
```

> **왜 중복 방지가 필요한가:** `rotation`은 step 3가지 × start 3가지 = **서로 다른 퍼즐이 9개뿐**이다.
> 20문항 중 여러 개가 난이도 1을 맡으면 시드만 달리해서는 같은 퍼즐이 반복된다.
> 사용자에게는 앱이 고장난 것으로 보인다. 자동 검사가 안 잡는 종류가 아니라 **안 짜면 안 잡히는** 종류다.

> **왜 그 난이도에 생성기가 없으면 자리를 안 만드는가:** 만들면 채울 방법이 없어
> `while` 루프가 끝나지 않거나 잘못된 난이도로 채워진다. 지금은 세 난이도에 다 생성기가 있지만,
> 생성기를 하나 지우는 순간 무한 루프가 되는 코드는 남기지 않는다.

**`registry.ts`에 추가**

```ts
/** IQ 고사 출제 설정. 난이도별 목표 개수의 합이 questionCount와 같아야 한다. */
export const IQ_DRAW: IqDrawConfig = {
  questionCount: 20,
  difficultyMix: { 1: 7, 2: 7, 3: 6 },
};
```

`CATEGORIES`의 iq 항목에서 `questionCount: 20`을 `IQ_DRAW.questionCount`로 바꾼다 —
두 곳에 20을 적어두면 갈라진다.

---

**`src/engine/iq/iqScore.ts`**

```ts
import { gradeFor } from '../grade';
import { scoreTest } from '../score';
import type { Answer, ScoredResult } from '../score';
import type { GradeBand, Question } from '../types';

/**
 * 이 문구는 결과 타입의 **필수 필드**다. 선택 필드로 두면 화면이 빼먹어도 타입이 통과한다.
 * 실제 지능검사가 아닌 것을 점수처럼 보여주는 이상, 문구가 빠진 화면은 그 자체로 결함이다.
 */
export const IQ_DISCLAIMER =
  '이 점수는 실제 지능검사 결과가 아닙니다. 표준화된 규준 표본 없이 정답률을 ' +
  '점수 구간에 그대로 대응시킨 값이라, 재미로만 봐주세요.';

/** 정답률 0%가 70, 100%가 145. 사이는 선형. */
export const IQ_SCORE_MIN = 70;
export const IQ_SCORE_MAX = 145;

export interface IqResult extends ScoredResult {
  /** 추정 점수. 규준 표본 근거 없음 — IQ_DISCLAIMER를 함께 보여줄 것. */
  readonly estimatedScore: number;
  /** 화면이 반드시 함께 표시해야 하는 문구. 필수 필드다. */
  readonly disclaimer: string;
}

export function estimateIqScore(percent: number): number {
  const clamped = Math.max(0, Math.min(100, percent));
  return Math.round(IQ_SCORE_MIN + (clamped / 100) * (IQ_SCORE_MAX - IQ_SCORE_MIN));
}

export function scoreIq(
  questions: readonly Question[],
  answers: readonly Answer[],
  bands: readonly GradeBand[]
): IqResult {
  const base = scoreTest(questions, answers, bands);
  return {
    ...base,
    estimatedScore: estimateIqScore(base.percent),
    disclaimer: IQ_DISCLAIMER,
  };
}
```

> **`disclaimer`를 왜 결과에 넣는가:** 화면에서 문자열 상수를 import해 쓰게 하면
> 새 화면(공유 카드, 오답노트 헤더)이 그걸 빼먹어도 아무것도 실패하지 않는다.
> 결과 객체가 들고 다니면 점수를 꺼낼 때 문구도 같이 손에 들어온다.
> **Task 7은 점수를 표시하는 모든 자리에 이 문구를 함께 표시한다.**

**`grades.json`에 추가할 `iq-default`**

```json
"iq-default": {
  "bands": [
    { "min": 95, "grade": 1, "title": "머리에 CPU 들었나" },
    { "min": 85, "grade": 2, "title": "패턴이 그냥 보인다" },
    { "min": 75, "grade": 3, "title": "눈치가 남다르다" },
    { "min": 65, "grade": 4, "title": "평균 위는 확실하다" },
    { "min": 55, "grade": 5, "title": "딱 중간, 안정적" },
    { "min": 45, "grade": 6, "title": "절반은 감으로" },
    { "min": 35, "grade": 7, "title": "도형은 원래 어렵다" },
    { "min": 20, "grade": 8, "title": "찍기의 장인" },
    { "min": 0, "grade": 9, "title": "다음 판이 진짜다" }
  ]
}
```

`gradeTableId('iq', 'default')`가 `'iq-default'`를 주므로 키 형식은 기존 것과 같다.

---

**Test: `__tests__/engine/iq/assembleIq.test.ts`**

```ts
  test('같은 시드는 같은 세트를 만든다', () => {
    for (let seed = 1; seed <= 30; seed++) {
      expect(JSON.stringify(assembleIq(seed, IQ_DRAW)))
        .toBe(JSON.stringify(assembleIq(seed, IQ_DRAW)));
    }
  });

  test('요청한 개수만큼 나온다', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(assembleIq(seed, IQ_DRAW)).toHaveLength(IQ_DRAW.questionCount);
    }
  });

  // ★ 한 세트에 같은 퍼즐이 두 번 나오면 앱이 고장난 것처럼 보인다
  test('시드 200개에서 한 세트 안에 같은 퍼즐이 두 번 나오지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = assembleIq(seed, IQ_DRAW);
      const keys = set.map((gq) =>
        gq.question.figure
          ? `${gq.generatorId}|${JSON.stringify(gq.question.figure)}`
          : `${gq.generatorId}|${gq.question.prompt}`
      );
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  // ★★ 계획 1에서 출시 직전까지 갔던 결함: 정답이 전부 1번
  test('시드 200개에서 정답 위치가 다섯 자리에 고루 퍼진다', () => {
    const counts = [0, 0, 0, 0, 0];
    for (let seed = 1; seed <= 200; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) {
        counts[gq.question.answerIndex as number] =
          (counts[gq.question.answerIndex as number] as number) + 1;
      }
    }
    const total = counts.reduce((a, b) => a + b, 0);
    for (const c of counts) {
      // 균등이면 20%. 12%~28%면 충분히 고르다.
      expect(c / total).toBeGreaterThan(0.12);
      expect(c / total).toBeLessThan(0.28);
    }
  });

  test('모든 문항이 verifyGenerated를 통과한다', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) {
        const errors = verifyGenerated(gq);
        if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
      }
    }
  });

  test('난이도 분포가 설정과 일치한다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const set = assembleIq(seed, IQ_DRAW);
      for (const d of [1, 2, 3] as const) {
        expect(set.filter((gq) => gq.question.difficulty === d)).toHaveLength(
          IQ_DRAW.difficultyMix[d] as number
        );
      }
    }
  });

  test('모든 생성기가 출제에 실제로 쓰인다', () => {
    const used = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) used.add(gq.generatorId);
    }
    expect(used.size).toBe(GENERATORS.length);
  });

  // 오답노트가 (generatorId, seed)만 저장하고 나중에 문항을 복원한다.
  // 그 전제가 성립하는지 여기서 못박는다.
  test('generatorId와 seed로 같은 문항을 복원할 수 있다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) {
        const gen = GENERATORS.find((g) => g.id === gq.generatorId);
        expect(gen).toBeDefined();
        expect(JSON.stringify(gen!.generate(gq.seed))).toBe(JSON.stringify(gq));
      }
    }
  });
```

**Test: `__tests__/engine/iq/iqScore.test.ts`**

```ts
  test('정답률 0%는 70점, 100%는 145점이다', () => {
    expect(estimateIqScore(0)).toBe(70);
    expect(estimateIqScore(100)).toBe(145);
  });

  test('정답률이 오르면 점수도 오른다', () => {
    for (let p = 1; p <= 100; p++) {
      expect(estimateIqScore(p)).toBeGreaterThanOrEqual(estimateIqScore(p - 1));
    }
  });

  test('범위를 벗어난 정답률도 70~145에 갇힌다', () => {
    expect(estimateIqScore(-50)).toBe(70);
    expect(estimateIqScore(500)).toBe(145);
    expect(estimateIqScore(Number.NaN)).toBeGreaterThanOrEqual(70);
  });

  // ★ 점수만 있고 문구가 없는 결과는 만들 수 없어야 한다
  test('결과에 항상 안내 문구가 들어 있다', () => {
    const r = scoreIq([], [], getGradeBands('iq-default'));
    expect(r.disclaimer).toBe(IQ_DISCLAIMER);
    expect(r.disclaimer.length).toBeGreaterThan(0);
  });

  test('안내 문구가 실제 지능검사가 아님을 밝힌다', () => {
    // 문구를 마케팅 문장으로 바꿔치기하는 걸 막는다
    expect(IQ_DISCLAIMER).toContain('실제 지능검사');
    expect(IQ_DISCLAIMER).toContain('규준 표본');
  });

  test('빈 응답이어도 크래시하지 않고 최하 급수를 준다', () => {
    const r = scoreIq([], [], getGradeBands('iq-default'));
    expect(r.total).toBe(0);
    expect(r.grade).toBe(9);
    expect(r.estimatedScore).toBe(70);
  });
```

`NaN` 케이스 주의: `Math.max(0, Math.min(100, NaN))`은 `NaN`이다. `estimateIqScore`가
`Number.isFinite`로 먼저 걸러 0으로 취급하도록 쓸 것 — 위 테스트가 그걸 요구한다.

### Task 7 — IQ 화면 4종 + `QuizRunner` 도형 지원

**Files:**
- Modify: `src/ui/QuizRunner.tsx` (도형 지원 추가, 기존 텍스트 경로는 그대로)
- Create: `app/test/iq/intro.tsx`, `quiz.tsx`, `result.tsx`, `review.tsx`
- Create: `src/engine/iq/questionId.ts`
- Test: `__tests__/ui/QuizRunner.figure.test.tsx`, `__tests__/engine/iq/questionId.test.ts`

**기존 화면을 먼저 읽을 것:** `app/test/dialect/{intro,quiz,result,review}.tsx`가 정답형 시험의
표준 형태다. IQ도 정답형이므로 구조가 거의 같다. 색만 `colors.iq` 계열로 바꾸고
출제 호출을 `assembleIq`로 바꾼다. `app/test/dialect/quiz.tsx`는 6줄짜리 껍데기다 —
IQ도 그만큼 얇아야 한다.

---

**1. `QuizRunner` 도형 지원**

지금은 `<Text>{c.text ?? ''}</Text>`만 그린다. 두 곳을 넓힌다:

- 문제 도형: `current.figure`가 있으면 프롬프트 아래에 `<SvgFigure spec={current.figure} size={280} testID="question-figure" />`
- 선택지: `c.figure`가 있으면 텍스트 대신 `<SvgFigure spec={c.figure} size={96} testID={`choice-figure-${i}`} />`

**기존 텍스트 경로를 건드리지 말 것.** 사투리·성격·심리 화면이 전부 이 컴포넌트를 쓰고 있고,
그 세 시험에는 `figure`가 없다. `figure`가 없으면 지금과 완전히 같게 동작해야 한다.

> **접근성 — 이게 이 태스크에서 제일 빠뜨리기 쉬운 것.**
> 도형 선택지에는 글자가 하나도 없다. 지금 코드는 `<Text>`의 내용이 스크린리더가 읽을 거리인데,
> 도형 선택지는 그게 빈 문자열이 된다. **TalkBack 사용자에게는 버튼 다섯 개가 전부 무명이 된다.**
> → 도형 선택지 `Pressable`에 `accessibilityLabel={`${i + 1}번 보기`}`를 준다.
> → 문제 도형에는 `accessibilityLabel="문제 도형"`. 도형 자체를 말로 설명할 수는 없지만
>    "여기 그림이 있다"는 것은 알려야 한다.
> 자동 검사로는 안 잡히고 실기기에서도 TalkBack을 켜야 보인다. Task 8 검증 항목에 넣는다.

**Test: `__tests__/ui/QuizRunner.figure.test.tsx`**

```tsx
  test('figure가 있는 선택지는 도형을 그린다', () => { /* getByTestId('choice-figure-0') */ });
  test('figure가 없는 선택지는 지금처럼 텍스트를 그린다', () => { /* 회귀 방지 */ });
  test('도형 선택지에도 접근성 이름이 붙는다', () => {
    // getByLabelText('1번 보기') — 이름 없는 버튼이 나가는 걸 막는다
  });
  test('문제에 figure가 있으면 문제 도형을 그린다', () => { /* question-figure */ });
```

> **SVG 안의 글자는 `getByText`로 못 찾는다.** RNTL 14.0.1의 `HOST_TEXT_NAMES`가
> `['Text','RCTText']`로 하드코딩돼 있어 `react-native-svg`의 텍스트는 구조적으로 검색 대상이 아니다.
> **`testID`로 단언한다.** `UNSAFE_getByProps`는 라이브러리 내부 prop 이름에 의존하므로 쓰지 않는다.
> 계획 3 Task 2에서 이미 부딪혔던 벽이다.

---

**2. `src/engine/iq/questionId.ts` — 오답노트를 위한 계약**

세션 저장소는 `Question[]`만 들고 있고 `generatorId`·`seed`는 버린다. 그런데 오답노트(계획 4)는
문항 전체가 아니라 **그 두 값만 저장해서 나중에 복원**하는 설계다. 지금 그 계약을 못박아둔다.

```ts
/** 생성기가 만드는 문항 id 형식: `iq-<generatorId>-<seed>` */
export function iqQuestionId(generatorId: string, seed: number): string {
  return `iq-${generatorId}-${seed}`;
}

/** 형식에 안 맞으면 undefined. 호출부가 폴백을 준비한다. */
export function parseIqQuestionId(
  id: string
): { generatorId: string; seed: number } | undefined {
  const m = /^iq-([a-z]+)-(\d+)$/.exec(id);
  if (m === null) return undefined;
  return { generatorId: m[1] as string, seed: Number(m[2]) };
}
```

**여섯 생성기가 전부 `iqQuestionId()`를 쓰도록 고친다.** 지금은 각자 템플릿 문자열을 쓰고 있어서
형식이 갈라질 수 있다. 파싱하는 쪽과 만드는 쪽이 같은 함수를 보게 만든다 —
Task 4b에서 배운 "재계산하지 말고 만들어진 것에서 읽는다"와 같은 원리다.

**Test:**
```ts
  test('만든 id를 다시 파싱하면 원래 값이 나온다', () => { /* 왕복 */ });
  test('형식에 안 맞는 id는 undefined를 준다', () => {
    expect(parseIqQuestionId('dialect-gs-01')).toBeUndefined();
    expect(parseIqQuestionId('iq-rotation-')).toBeUndefined();
    expect(parseIqQuestionId('iq--123')).toBeUndefined();
  });

  // ★ 실제 출제된 문항 전부가 이 계약을 지키는가.
  // 생성기 하나가 형식을 벗어나면 그 문항만 오답노트에서 조용히 사라진다.
  test('assembleIq가 내는 모든 문항 id를 파싱해 원래 문항을 복원할 수 있다', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) {
        const parsed = parseIqQuestionId(gq.question.id);
        expect(parsed).toBeDefined();
        expect(parsed!.generatorId).toBe(gq.generatorId);
        expect(parsed!.seed).toBe(gq.seed);
        const gen = GENERATORS.find((g) => g.id === parsed!.generatorId);
        expect(JSON.stringify(gen!.generate(parsed!.seed))).toBe(JSON.stringify(gq));
      }
    }
  });
```

---

**3. 화면 4종**

**`intro.tsx`** — `dialect/intro.tsx`와 같은 형태지만 지역 선택이 없다. 안내 문구 + 응시 버튼.

```ts
const begin = () => {
  const seed = hashSeed(`iq:${Date.now()}`);
  const generated = assembleIq(seed, IQ_DRAW);
  start('iq', 'default', seed, generated.map((g) => g.question));
  router.push('/test/iq/quiz');
};
```

인트로에 **추정 점수가 실제 지능검사가 아니라는 것을 미리 밝힌다.** 결과에서 처음 보는 것보다
응시 전에 아는 편이 정직하다. `IQ_DISCLAIMER`를 그대로 쓴다.

**`quiz.tsx`** — `dialect/quiz.tsx`와 같은 6줄. `resultRoute="/test/iq/result"`, `accent`만 IQ 색.

**`result.tsx`** — `dialect/result.tsx`를 따르되 두 가지가 추가된다:
- 급수 합격증(`Certificate`) 위/아래에 **추정 점수**
- **`result.disclaimer`를 반드시 함께 표시한다.** `IQ_DISCLAIMER` 상수를 import하지 말고
  `scoreIq()`가 돌려준 객체의 필드를 쓴다 — 그래야 점수를 꺼낼 때 문구가 같이 손에 들어온다.

```tsx
  <Text testID="iq-score">{result.estimatedScore}</Text>
  <Text testID="iq-disclaimer">{result.disclaimer}</Text>
```

**Test:** `점수를 보여주는 화면은 안내 문구도 보여준다` — `testID` 두 개가 **같이** 존재하는지 본다.
점수만 있고 문구가 없는 화면이 나가는 걸 막는 유일한 장치다.

**`review.tsx`** — `dialect/review.tsx`를 따르되 도형이 들어간다. 문항마다:
- 문제 도형 (`SvgFigure`, `testID={`review-question-${i}`}`)
- **내가 고른 것**과 **정답**을 나란히 (`review-chosen-${i}`, `review-answer-${i}`)
- 해설 텍스트

미응답(`chosenIndex === -1`)이면 "고른 것" 자리에 도형 대신 "응답 없음"을 쓴다.
`chosenIndex`가 선택지 범위를 벗어나는 경우도 같게 처리한다 — 세션이 깨졌을 때 크래시하지 않게.

---

**4. 홈 화면 배선 확인**

Task 6이 `CATEGORIES`의 iq `available`을 `GENERATORS.length > 0`으로 바꿨을 것이다.
이 태스크에서 **실제로 홈에서 IQ 카드를 눌러 인트로까지 가는지** 확인한다.
`route: '/test/iq/intro'`가 이미 적혀 있으므로 파일만 생기면 열린다.

기존 홈 화면 테스트가 "available이 false인 카드는 눌러도 안 열린다"를 검사하고 있다면,
IQ가 이제 true가 되므로 **그 테스트가 다른 카테고리를 쓰도록** 고쳐야 할 수 있다.
테스트를 지우지 말고 아직 준비 안 된 카테고리(mz)로 대상을 옮길 것.

### Task 8 — 릴리스 빌드 + 실기기 검증

**이 태스크는 코드를 쓰지 않는다.** 앞의 일곱 태스크가 자동 검사로 증명할 수 없다고
명시적으로 미뤄둔 것들을 사람이 확인하는 자리다. 계획 1에서 **96개 테스트 + tsc 클린 +
릴리스 APK 빌드 성공 + 권한 감사 통과 상태로 "모든 문제의 정답이 1번"인 앱**이 만들어졌고,
계획서에 적어둔 "실기기에서 한 판 끝까지 플레이"를 건너뛴 게 직접적 원인이었다.
30초면 드러났을 결함이다.

**빌드 검증(`aapt2 dump`, 테스트 개수)은 "안 깨졌다"는 증거지 "동작한다"는 증거가 아니다.**

**빌드 환경:** `docs/build-notes.md` 참조. 특히 `TEMP`/`TMP`가 ASCII 경로
(`C:\workAndroid\tmp-ascii`)여야 한다 — 한글이 섞이면 AGP가 UTF-8로 쓴 배치 파일을
cmd.exe가 시스템 코드페이지로 읽어 바이트 오프셋이 밀리면서 줄 앞 글자가 잘린다.

**기기:**

| 시리얼 | 모델 | Android |
|---|---|---|
| R3CN50JXF9E | SM-G988N (S20 Ultra) | 13 (SDK 33) |
| RF9Y101ZZPB | SM-A165N (A16) | **16 (SDK 36)** |

두 대 다 다른 세션과 공유 중이다. 매 단계 `dumpsys window | grep mCurrentFocus`로
포그라운드를 확인하고, 긴 조작 시퀀스는 짧게 나눠서 진행할 것.
스크린샷은 `adb shell screencap` + `adb pull`로 가져온다 — PowerShell의 `>` 리다이렉션은
BOM을 붙여 PNG를 깨뜨린다.

---

**A. 자동으로 확인할 것**

- [ ] `npx jest` 전체 통과, `npx tsc --noEmit` 클린, `npm run validate:content` 통과
- [ ] 릴리스 APK 빌드 성공
- [ ] `aapt2 dump permissions`로 **사용자 노출 권한 0개** 확인.
      유일하게 허용되는 것은 `com.testmin.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`
      (androidx.core가 넣는 signature 수준 권한). 그 외에 뭐가 하나라도 있으면 실패다.
- [ ] 설치한 APK의 빌드 시각이 최신 커밋보다 **나중**인지 확인.
      계획 1에서 수정 전 APK를 설치해놓고 "고쳐졌다"고 판단한 적이 있다.

**B. 기계가 원리상 못 잡는 것 — 사람이 화면을 봐야 한다**

앞 태스크들이 "이건 자동으로 못 잡는다"고 명시하며 여기로 미룬 항목들이다.

- [ ] **회전 오답이 정말 달라 보이는가.** `cellEquals`는 `rotation`이 다르면 다른 도형이라
      판정하지만 **원은 아무리 돌려도 똑같이 보인다.** 마름모는 90°가 자기 자신, 정사각형도
      90° 배수는 구분 불가. 그래서 회전 기반 생성기는 삼각형만 쓰게 제한했다.
      → 회전 문항 몇 개를 눈으로 보고, 선택지 다섯 개가 **화면에서** 서로 다른지 확인.
- [ ] **크기 3단계가 화면에서 구분되는가.** 기계는 0.01 차이도 "다른 도형"이라 판정한다.
      `SIZES = [0.3, 0.5, 0.7]`로 잡은 근거가 실기기에서 성립하는지 본다.
      → `size`·`distribute` 문항에서 작은/중간/큰 것이 한눈에 구분되는지.
- [ ] **점이 겹치지 않는가.** `count` 문항에서 점 개수를 **직접 세어** 정답과 맞는지 확인.
      배치표의 최소 중심간 거리는 0.228, 점 지름은 0.18이라 계산상 안 겹치지만,
      실제 렌더링에서 획 두께(`STROKE = 4`)가 더해진다. 계산에 안 들어간 값이다.
- [ ] **도형 선택지에 스크린리더 이름이 붙었는가.** TalkBack을 켜고 IQ 문항 화면에서
      선택지 다섯 개를 훑는다. "1번 보기"처럼 읽혀야 한다. **글자가 없는 버튼이라
      이름이 없으면 다섯 개가 전부 무명으로 읽힌다.** 자동 검사로도, TalkBack을
      안 켜면 실기기에서도 안 보인다.
- [ ] **해설이 실제 규칙을 설명하는가.** 문항 5개 이상에서 해설을 읽고,
      화면의 격자를 보며 그 설명이 맞는지 대조한다. 테스트는 해설이 특정 값을
      포함하는지만 안다. **말이 되는지는 사람만 안다.**
- [ ] **20문항 안에 같은 퍼즐이 두 번 나오지 않는가.** 끝까지 풀면서 확인.
      `count`는 서로 다른 퍼즐이 6개뿐이라 이 검사가 실질적이다.

**C. 제품 약속 확인**

- [ ] **추정 점수 옆에 안내 문구가 실제로 보이는가.** 결과 화면에서 점수와
      "실제 지능검사 결과가 아닙니다…"가 **같은 화면에** 있는지. 스크롤해야 보이면
      그것도 문제다 — 점수를 본 사람이 문구를 안 보고 나갈 수 있다.
- [ ] 인트로에도 같은 안내가 있는지.
- [ ] 급수 합격증이 그려지고 칭호가 나오는지.
- [ ] 해설 화면에 **문제 도형과 정답 도형이 나란히** 보이는지. 미응답 문항은
      "응답 없음"으로 나오는지.

**D. 안드로이드 15/16 대응 — 사용자가 명시적으로 요구한 것**

> "안드로이드 15 16 최신안드로이드도 대응하게해 뒤로가기버튼이나 시간 있는대
> 오버레이되서 가리지않도록"

**Android 16 기기(RF9Y101ZZPB)에서 확인한다.** Android 15부터 edge-to-edge가 강제라
`android:fitsSystemWindows`나 안전 영역 처리가 빠지면 콘텐츠가 시스템 바 밑으로 들어간다.

- [ ] 상단 상태바(시계·배터리)가 앱 콘텐츠에 가려지지 않는가
- [ ] 하단 내비게이션 바(뒤로가기)가 가려지지 않는가 — 특히 **문항 화면의 마지막 선택지**와
      **결과 화면의 버튼**. `QuizRunner`는 `insets.bottom`을 `paddingBottom`에 더하고 있는데
      IQ 문항은 도형 때문에 세로가 길어져서 이 자리가 처음으로 실제 시험대에 오른다.
- [ ] 제스처 내비게이션과 3버튼 내비게이션 **양쪽** 확인
- [ ] 가로 모드로 돌렸을 때 도형이 잘리지 않는가
- [ ] Android 13 기기에서도 같은 화면들이 정상인지(회귀 확인)

**E. 재현성**

- [ ] 같은 시드로 두 번 들어가면 같은 문제가 나오는가.
      오답노트(계획 4)가 `(generatorId, seed)`만 저장해 복원하는 설계의 전제다.
      → 개발 빌드에서 시드를 고정해 두 번 응시하고 문항이 같은지 대조.

**F. 못 한 항목은 미완으로 남긴다**

실기기 확인이 불가능한 항목이 있으면 **조용히 체크하지 말고** 무엇을 왜 못 했는지 적는다.
"빌드가 통과했으니 됐다"는 계획 1에서 이미 한 번 틀린 판단이다.

---

## 계획 3 완료 조건

- [ ] `npx jest` 전체 통과
- [ ] `npx tsc --noEmit` 타입 에러 0개
- [ ] `npm run validate:content` 통과
- [ ] 각 생성기가 시드 500개에서 정답 유일성을 만족
- [ ] release APK에 사용자 노출 권한 0개
- [ ] **실기기에서 IQ 고사를 끝까지 풀고 도형·급수·해설 확인**

## 다음 계획

- **계획 4** — 기록, 오답노트, 결과 카드 이미지 공유, 딥링크 도전장
- **계획 5** — 문항 확장(사투리 6지역·MZ·심리 3종·IQ 언어유추), 서명키, AAB, 스토어 등록
