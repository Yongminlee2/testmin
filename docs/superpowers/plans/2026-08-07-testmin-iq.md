# 테스트의 민족 — 계획 3: IQ 고사 (도형 생성기) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 폰에서 IQ 고사를 실제로 풀고, 급수와 추정 점수, 그리고 문항마다 "왜 이게 답인가"를 규칙에서 자동 도출된 해설로 받는 상태까지 만든다.

**Architecture:** 도형 문항을 데이터로 저장하지 않고 **시드에서 생성**한다. 생성기는 규칙을 코드로 갖고 있고, 같은 규칙에서 문제·정답·해설이 동시에 나온다. 도형은 `FigureSpec`이라는 선언적 스펙으로 표현하고, 렌더링은 `SvgFigure`가 따로 맡는다 — 생성기는 그림 그리는 법을 모른다.

**Tech Stack:** 계획 1·2와 동일 + `react-native-svg`(이미 설치됨)

**선행 계획:** 계획 1(기반+사투리), 계획 2(유형형) — 둘 다 완료, 실기기 검증 완료
**설계 문서:** `docs/superpowers/specs/2026-08-06-testmin-design.md`

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
- 커밋 메시지는 한국어, 마지막 줄 정확히 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

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

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
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

**Task 4 — 규칙 4종 추가**
- `count.ts`(개수 증감), `fill.ts`(채움 교대), `distribute.ts`(3분배), `size.ts`(크기 진행)
- 각 규칙마다 오답 생성 전략이 다르다 — 규칙을 어긴 지점이 서로 달라야 매력적인 오답이 된다

**Task 5 — 수열 생성기**
- `sequence.ts`: 등차·등비·피보나치·교대·제곱. 도형이 아니라 숫자이므로 `figure` 없이 텍스트 선택지
- 해설이 수식으로 나온다: "3, 6, 12, 24 — 앞 항의 2배"

**Task 6 — IQ 출제·채점·급수**
- `assembleIq.ts`: 난이도 분포에 따라 생성기를 골라 20문항 생성
- `grades.json`에 `iq` 급수 테이블
- 추정 점수: 정답률을 평균 100·표준편차 15 구간에 선형 대응(하한 70·상한 145). **규준 표본 근거가 아님을 결과에 명시**

**Task 7 — IQ 화면 4종 + `QuizRunner` 도형 지원**
- `QuizRunner`가 선택지의 `figure`를 감지해 `SvgFigure`를 그리도록 확장. 기존 텍스트 경로는 그대로
- `app/test/iq/{intro,quiz,result,review}.tsx`
- 해설 화면에 문제 도형과 정답 도형을 나란히 보여준다

**Task 8 — 릴리스 빌드 + 실기기 검증**
- 권한 여전히 하나뿐인지
- **실기기에서 IQ 고사를 끝까지 풀고, 도형이 제대로 그려지는지, 해설이 규칙을 설명하는지 확인**
- 같은 시드로 두 번 들어가면 같은 문제가 나오는지(오답노트 복원의 전제)

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
