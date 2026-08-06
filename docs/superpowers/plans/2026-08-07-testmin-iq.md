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

**Task 2 — `SvgFigure` 렌더러**
- `src/ui/SvgFigure.tsx`: `FigureSpec`을 받아 `react-native-svg`로 그린다
- 3×3 격자는 칸 사이 구분선과 빈 칸의 물음표를 그린다
- 네오브루탈 톤에 맞춰 굵은 검정 선, 채움은 라벤더
- 렌더 테스트는 크래시 없이 그려지는지 + 빈 칸 표시가 나오는지 수준

**Task 3 — 생성기 프레임워크 + 회전 규칙**
- `Generator` 인터페이스: `generate(seed) → GeneratedQuestion`
- `rotation.ts`: 행마다 일정 각도 회전. 오답은 각도만 어긋나게 만든다
- **정답 유일성 속성 테스트**(시드 500개)를 여기서 확립하고, 이후 생성기가 전부 같은 테스트를 재사용한다

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
