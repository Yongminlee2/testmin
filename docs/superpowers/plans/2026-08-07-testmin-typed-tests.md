# 테스트의 민족 — 계획 2: 유형형 테스트 (성격 16유형 · 심리) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 폰에서 성격 16유형 고사와 심리 테스트를 실제로 풀고, 4글자 코드 + 자체 별명이 담긴 유형 카드와 문항별 해설을 받는 상태까지 만든다.

**Architecture:** 계획 1이 만든 정답형 파이프라인(`assemble` → `scoreTest` → 합격증)과 나란히 유형형 파이프라인을 세운다. 유형형 채점은 두 방식으로 갈린다 — 성격은 **축 합계 방식**, 심리는 **최다 득표 방식**. 둘 다 `src/engine/typeScore.ts`의 별도 함수이며 React를 모른다. 화면은 계획 1의 `test/dialect/*` 구조를 그대로 따라간다.

**Tech Stack:** 계획 1과 동일 — Expo SDK 57 (RN 0.86.2), TypeScript strict, Expo Router, Zustand, Jest + jest-expo + @testing-library/react-native

**선행 계획:** `docs/superpowers/plans/2026-08-06-testmin-foundation.md` (완료)
**설계 문서:** `docs/superpowers/specs/2026-08-06-testmin-design.md`

## Global Constraints

계획 1에서 이어지는 제약. 전부 그대로 유효하다.

- 패키지명 `com.testmin.app`, 앱 이름 `테스트의 민족`
- `minSdkVersion 24`, `compileSdkVersion 36`, `targetSdkVersion 36`, `buildToolsVersion 37.0.0`
- **사용자 노출 권한 0개.** 예외는 `androidx.core`의 `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` 하나뿐
- `expo-updates` 설치 금지
- 라이트 모드 고정
- **`src/engine/**`는 `react`, `react-native`, `expo*`를 import하지 않는다**
- **어떤 스타일도 `fontFamily`와 `fontWeight`를 동시에 지정하지 않는다.** 굵기는 패밀리로 (`'900'`→`family.black`, `'800'`/`'700'`→`family.bold`, `'600'`→`family.body`)
- 큰 글자(`family.display`, `family.black` at ≥19px)에는 **반드시 `lineHeight`를 준다.** 안 주면 안드로이드에서 글자 위가 잘린다
- 화면에 `SafeAreaView`를 넣지 않는다. `useSafeAreaInsets()`로 하단 여백만 더한다 (Android 15+ edge-to-edge 대응)
- **"MBTI"를 어디에도 쓰지 않는다.** 16Personalities의 유형 별명(옹호자·중재자 등)도 쓰지 않는다. 실제 검사지 문항을 인용하지 않는다
- 커밋 메시지는 한국어, 마지막 줄 정확히 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- 프로젝트 경로 ASCII 유지 (`C:\workAndroid\TestMin`)

## 개발 환경 (계획 1에서 확정, 재조사 금지)

Gradle 명령과 **같은 셸 호출**에서 전부 설정할 것. 셸 상태는 툴 호출 간 유지되지 않는다.

    JAVA_HOME        = C:\Program Files\Android\Android Studio\jbr
    ANDROID_HOME     = C:\workAndroid\android-sdk-ascii
    ANDROID_SDK_ROOT = C:\workAndroid\android-sdk-ascii
    GRADLE_USER_HOME = C:\workAndroid\gradle-home-ascii
    TEMP             = C:\workAndroid\tmp-ascii
    TMP              = C:\workAndroid\tmp-ascii

`TEMP`/`TMP`는 선택이 아니다. 자세한 이유는 `docs/build-notes.md`.

## 테스트 환경 함정 (계획 1에서 확인, 재조사 금지)

1. `@testing-library/react-native@14.0.1`의 `render`/`fireEvent.press`는 **async** — `await` 필수
2. `jest.mock()` 팩토리는 **`mock` 접두사가 붙은 외부 변수만** 참조 가능. `const push = jest.fn()`은 파싱조차 안 됨 → `mockPush`. 단 팩토리가 돌려주는 객체의 **키는 `push`/`replace` 그대로** 유지
3. `StyleSheet.absoluteFillObject`는 RN 0.86.2에 없음 → `absoluteFill`
4. `experiments.typedRoutes`는 OFF 유지
5. 화면 테스트는 `SafeAreaProvider` 없이 렌더되므로 `jest.setup.js`의 `react-native-safe-area-context` 목이 필요 (이미 설정돼 있음)

---

## 이 계획의 핵심 설계 결정

### 왜 채점 방식이 두 개인가

**성격 16유형 — 축 합계 방식.** 네 개의 축(E/I·S/N·T/F·J/P) 각각에 대해 문항 응답의 가중치를 더하고, 합계의 부호로 글자를 정한다. 축마다 독립적이므로 16가지 조합이 전부 나올 수 있다.

**심리 테스트 — 최다 득표 방식.** 5개 유형 중 하나로 분류한다. 각 선택지가 특정 유형에 1표를 던지고 최다 득표가 결과다. 축이 없으므로 조합이 아니라 배타적 분류다.

두 방식을 하나로 억지로 합치면 양쪽 다 어색해진다. 별도 함수로 두고 각각 테스트한다.

### 유형형 문항은 선택지를 섞지 않는다

계획 1의 `assemble`은 정답형 문항의 선택지를 섞는다(정답이 항상 1번인 결함을 막기 위해). **유형형 문항은 `answerIndex`가 없으므로 이미 그 경로를 타지 않는다.** 이건 우연이 아니라 필수다 — 성격 문항의 선택지는 "매우 그렇다 / 그렇다 / 아니다 / 전혀 아니다" 순서 자체가 의미를 갖는 리커트 척도라, 섞으면 사용자가 읽을 수 없게 된다. 이 불변식을 깨지 말 것.

### 동점 처리를 명시적으로 정한다

축당 6문항, 가중치 `-2|-1|+1|+2`(중립 없음)여도 합계 0이 나올 수 있다. **동점이면 해당 축의 마지막 응답 방향으로 결정**하고, 결과 화면에 "이 축은 거의 반반입니다"를 표시한다. 조용히 한쪽으로 넘기면 사용자가 두 번 풀었을 때 이유 없이 결과가 바뀐 것처럼 보인다.

심리 테스트의 동점은 **뒤쪽 문항에서 득표한 유형 우선**. 뒤쪽에 변별력 높은 문항을 배치한다.

---

## File Structure

```
src/
  engine/
    types.ts              (수정) TypedResult·AxisScore 등 유형형 타입 추가
    typeScore.ts          (신규) scoreByAxis / scoreByVote
    assembleTyped.ts      (신규) 축별 문항 수를 강제하는 출제
  content/
    registry.ts           (수정) 성격·심리 풀과 draw 설정 등록, available 자동 도출
    personality.json      (신규) 축당 8문항 = 32문항
    typeNames.json        (신규) 16유형 자체 별명·설명
    psych/
      love.json           (신규) 연애 성향 12문항 · 5유형
      stress.json         (신규) 스트레스 반응 12문항 · 5유형
      comm.json           (신규) 소통 유형 12문항 · 5유형
  ui/
    TypeCard.tsx          (신규) 유형 결과 카드 (합격증의 유형형 대응)
    AxisBar.tsx           (신규) 축별 치우침 막대
app/
  test/personality/
    intro.tsx quiz.tsx result.tsx review.tsx    (신규)
  test/psych/
    intro.tsx quiz.tsx result.tsx review.tsx    (신규, 종류 선택 포함)
tools/
  validate-content.ts     (수정) 유형형 검증 규칙 추가
```

**경계 원칙 유지:** `src/engine`은 여전히 순수 TypeScript. `typeScore.ts`는 `./types`만 import한다.

---

### Task 1: 유형형 타입 정의

**Files:**
- Modify: `src/engine/types.ts`
- Test: 없음 (타입 전용 — 다음 태스크의 테스트가 컴파일로 검증)

**Interfaces:**
- Consumes: 기존 `Choice`, `Question`
- Produces: `Axis`, `AxisScore`, `AxisResult`, `VoteResult`, `TypeNameEntry`

- [ ] **Step 1: 타입 추가**

`src/engine/types.ts` 끝에 추가한다. 기존 타입은 건드리지 않는다.

```ts
/** 성격 16유형의 네 축. 각 축의 음수 방향이 첫 글자, 양수 방향이 둘째 글자. */
export const AXES = ['EI', 'SN', 'TF', 'JP'] as const;
export type AxisKey = (typeof AXES)[number];

/** 축별 글자 매핑. weight 합계가 음수면 negative, 양수면 positive. */
export const AXIS_LETTERS: Record<AxisKey, { negative: string; positive: string }> = {
  EI: { negative: 'I', positive: 'E' },
  SN: { negative: 'S', positive: 'N' },
  TF: { negative: 'T', positive: 'F' },
  JP: { negative: 'J', positive: 'P' },
};

export interface AxisScore {
  readonly axis: AxisKey;
  /** 가중치 합계 */
  readonly total: number;
  /** 이 축에서 나온 글자 */
  readonly letter: string;
  /** 0~100. 50이면 완전히 반반 */
  readonly percent: number;
  /** 합계가 0이라 마지막 응답으로 결정했는가 */
  readonly wasTie: boolean;
}

export interface AxisResult {
  /** 예: "ENFP" */
  readonly code: string;
  readonly axes: readonly AxisScore[];
}

export interface VoteResult {
  /** 최다 득표 유형의 id */
  readonly typeId: string;
  /** typeId → 득표수 */
  readonly tally: Readonly<Record<string, number>>;
  /** 동점이라 뒤쪽 문항 우선 규칙으로 결정했는가 */
  readonly wasTie: boolean;
}

/** 16유형 별명 데이터 한 항목 */
export interface TypeNameEntry {
  readonly code: string;
  /** 자체 창작 별명. 16Personalities 유형명 금지 */
  readonly nickname: string;
  readonly description: string;
  readonly emoji: string;
}
```

- [ ] **Step 2: 타입체크**

```bash
cd /c/workAndroid/TestMin && npx tsc --noEmit
```

Expected: 에러 0개

- [ ] **Step 3: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: 유형형 채점 타입 정의

축 방식(성격 16유형)과 득표 방식(심리)의 결과 타입,
축별 글자 매핑, 동점 여부 플래그를 정의한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: 축 합계 채점 (성격 16유형)

**Files:**
- Create: `src/engine/typeScore.ts`
- Test: `__tests__/engine/typeScore.axis.test.ts`

**Interfaces:**
- Consumes: `AxisKey`, `AXES`, `AXIS_LETTERS`, `AxisScore`, `AxisResult`, `Question` (Task 1)
- Produces: `scoreByAxis(questions, answers): AxisResult`

**동작 규칙:**
1. 각 문항의 `axis`와 선택된 `choice.weight`를 축별로 합산한다
2. 합계 < 0 → negative 글자, > 0 → positive 글자
3. 합계 === 0 → **해당 축 마지막 응답의 weight 부호**로 결정, `wasTie: true`
4. 마지막 응답도 없으면(축에 응답이 하나도 없으면) negative 글자, `wasTie: true`
5. `percent`는 `50 + (total / maxPossible) * 50`을 0~100으로 자른 값. `maxPossible`은 그 축 문항 수 × 2
6. 코드는 `AXES` 순서대로 이어붙인다 (EI → SN → TF → JP)

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/engine/typeScore.axis.test.ts`:

```ts
import { scoreByAxis } from '@/engine/typeScore';
import type { Question } from '@/engine/types';
import type { Answer } from '@/engine/score';

function q(id: string, axis: string, weights: number[]): Question {
  return {
    id,
    kind: 'typed',
    prompt: `${id} 문항`,
    choices: weights.map((w) => ({ text: `w${w}`, weight: w })),
    axis,
    difficulty: 1,
  };
}

/** 축당 2문항짜리 최소 세트 */
function makeSet(): Question[] {
  return [
    q('ei1', 'EI', [2, 1, -1, -2]),
    q('ei2', 'EI', [2, 1, -1, -2]),
    q('sn1', 'SN', [2, 1, -1, -2]),
    q('sn2', 'SN', [2, 1, -1, -2]),
    q('tf1', 'TF', [2, 1, -1, -2]),
    q('tf2', 'TF', [2, 1, -1, -2]),
    q('jp1', 'JP', [2, 1, -1, -2]),
    q('jp2', 'JP', [2, 1, -1, -2]),
  ];
}

/** 모든 문항에 같은 선택지 인덱스로 답한다 */
function answerAll(questions: Question[], index: number): Answer[] {
  return questions.map((x) => ({ questionId: x.id, chosenIndex: index }));
}

describe('scoreByAxis', () => {
  test('모든 축에서 양수를 고르면 ENFP', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 0)); // weight +2
    expect(r.code).toBe('ENFP');
  });

  test('모든 축에서 음수를 고르면 ISTJ', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 3)); // weight -2
    expect(r.code).toBe('ISTJ');
  });

  test('코드는 항상 네 글자이고 축 순서를 지킨다', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 0));
    expect(r.code).toHaveLength(4);
    expect(r.axes.map((a) => a.axis)).toEqual(['EI', 'SN', 'TF', 'JP']);
  });

  test('축 합계가 0이면 그 축의 마지막 응답 방향으로 결정하고 wasTie를 세운다', () => {
    const qs = makeSet();
    // EI만 +2, -2 → 합계 0, 마지막 응답이 -2이므로 I
    const answers: Answer[] = [
      { questionId: 'ei1', chosenIndex: 0 }, // +2
      { questionId: 'ei2', chosenIndex: 3 }, // -2
      ...answerAll(qs.slice(2), 0),
    ];
    const r = scoreByAxis(qs, answers);
    const ei = r.axes.find((a) => a.axis === 'EI');
    expect(ei?.total).toBe(0);
    expect(ei?.wasTie).toBe(true);
    expect(ei?.letter).toBe('I');
    expect(r.code.startsWith('I')).toBe(true);
  });

  test('동점이 아니면 wasTie는 false', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 0));
    expect(r.axes.every((a) => a.wasTie)).toBe(false);
  });

  test('한 축에 응답이 하나도 없으면 negative 글자와 wasTie', () => {
    const qs = makeSet();
    const answers = answerAll(qs, 0).filter((a) => !a.questionId.startsWith('jp'));
    const r = scoreByAxis(qs, answers);
    const jp = r.axes.find((a) => a.axis === 'JP');
    expect(jp?.wasTie).toBe(true);
    expect(jp?.letter).toBe('J');
  });

  test('percent는 0~100 범위이고 완전 치우침이면 100', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 0));
    for (const a of r.axes) {
      expect(a.percent).toBeGreaterThanOrEqual(0);
      expect(a.percent).toBeLessThanOrEqual(100);
    }
    expect(r.axes[0]!.percent).toBe(100);
  });

  test('완전 반반이면 percent는 50', () => {
    const qs = makeSet();
    const answers: Answer[] = [
      { questionId: 'ei1', chosenIndex: 0 },
      { questionId: 'ei2', chosenIndex: 3 },
      ...answerAll(qs.slice(2), 0),
    ];
    const r = scoreByAxis(qs, answers);
    expect(r.axes.find((a) => a.axis === 'EI')?.percent).toBe(50);
  });

  test('문항이 하나도 없으면 예외 없이 네 글자를 돌려준다', () => {
    const r = scoreByAxis([], []);
    expect(r.code).toHaveLength(4);
    expect(r.axes).toHaveLength(4);
  });

  test('16개 코드가 모두 도달 가능하다', () => {
    const qs = makeSet();
    const seen = new Set<string>();
    // 각 축을 독립적으로 +/- 조합
    for (let mask = 0; mask < 16; mask++) {
      const answers: Answer[] = qs.map((x, i) => {
        const axisIndex = Math.floor(i / 2);
        const positive = (mask >> axisIndex) & 1;
        return { questionId: x.id, chosenIndex: positive ? 0 : 3 };
      });
      seen.add(scoreByAxis(qs, answers).code);
    }
    expect(seen.size).toBe(16);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/typeScore.axis.test.ts
```

Expected: FAIL — `Cannot find module '@/engine/typeScore'`

- [ ] **Step 3: 구현**

`src/engine/typeScore.ts`:

```ts
import { AXES, AXIS_LETTERS, type AxisKey, type AxisResult, type AxisScore, type Question } from './types';
import type { Answer } from './score';

/**
 * 축 합계 방식 채점 (성격 16유형).
 * 축별로 선택지 가중치를 더하고 부호로 글자를 정한다.
 * 합계가 0이면 그 축의 마지막 응답 방향을 따르고 wasTie를 세운다.
 */
export function scoreByAxis(
  questions: readonly Question[],
  answers: readonly Answer[]
): AxisResult {
  const chosenById = new Map<string, number>();
  for (const a of answers) chosenById.set(a.questionId, a.chosenIndex);

  const axes: AxisScore[] = AXES.map((axis) => {
    const inAxis = questions.filter((q) => q.axis === axis);

    let total = 0;
    let count = 0;
    let lastWeight = 0;

    for (const q of inAxis) {
      const chosenIndex = chosenById.get(q.id);
      if (chosenIndex === undefined || chosenIndex < 0) continue;
      const weight = q.choices[chosenIndex]?.weight;
      if (typeof weight !== 'number') continue;
      total += weight;
      count += 1;
      lastWeight = weight;
    }

    const letters = AXIS_LETTERS[axis];
    const wasTie = total === 0;
    const direction = wasTie ? lastWeight : total;
    const letter = direction > 0 ? letters.positive : letters.negative;

    // 축에 응답이 하나도 없으면 count가 0이라 percent 계산이 0으로 나눠진다.
    const maxPossible = count * 2;
    const percent =
      maxPossible === 0 ? 50 : Math.round(Math.min(100, Math.max(0, 50 + (Math.abs(total) / maxPossible) * 50)));

    return { axis, total, letter, percent, wasTie };
  });

  return { code: axes.map((a) => a.letter).join(''), axes };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/typeScore.axis.test.ts && npx tsc --noEmit
```

Expected: PASS (10 tests), 타입 에러 0개

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: 축 합계 방식 채점 (성격 16유형)

축별 가중치 합계의 부호로 네 글자를 만든다.
합계 0이면 마지막 응답 방향을 따르고 wasTie를 세워
결과 화면이 '거의 반반'임을 알릴 수 있게 한다.
16개 코드가 전부 도달 가능함을 테스트로 고정.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: 최다 득표 채점 (심리 테스트)

**Files:**
- Modify: `src/engine/typeScore.ts`
- Test: `__tests__/engine/typeScore.vote.test.ts`

**Interfaces:**
- Consumes: `VoteResult`, `Question` (Task 1)
- Produces: `scoreByVote(questions, answers): VoteResult`

**동작 규칙:**
1. 각 선택지의 `typeId`에 1표씩 더한다
2. 최다 득표 유형이 결과
3. 동점이면 **뒤쪽 문항에서 득표한 유형 우선** (문항 순서를 뒤에서부터 훑어 동점자 중 처음 만나는 것)
4. `tally`에는 등장한 모든 유형의 득표수를 담는다 (0표 유형 포함)
5. 응답이 하나도 없으면 예외 없이 첫 유형을 돌려주고 `wasTie: true`

`Choice`에 `typeId`가 필요하다. Task 1의 타입에 추가한다:

```ts
// src/engine/types.ts 의 Choice 인터페이스에 추가
  /** 득표 방식 전용: 이 선택지가 표를 던지는 유형 id */
  readonly typeId?: string;
```

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/engine/typeScore.vote.test.ts`:

```ts
import { scoreByVote } from '@/engine/typeScore';
import type { Question } from '@/engine/types';
import type { Answer } from '@/engine/score';

const TYPES = ['a', 'b', 'c', 'd', 'e'];

function q(id: string, typeIds: string[]): Question {
  return {
    id,
    kind: 'typed',
    prompt: `${id} 문항`,
    choices: typeIds.map((t) => ({ text: t, typeId: t })),
    difficulty: 1,
  };
}

describe('scoreByVote', () => {
  test('최다 득표 유형을 돌려준다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd']), q('2', ['a', 'b', 'c', 'd']), q('3', ['a', 'b', 'c', 'd'])];
    const answers: Answer[] = [
      { questionId: '1', chosenIndex: 0 },
      { questionId: '2', chosenIndex: 0 },
      { questionId: '3', chosenIndex: 1 },
    ];
    const r = scoreByVote(qs, answers, TYPES);
    expect(r.typeId).toBe('a');
    expect(r.tally['a']).toBe(2);
    expect(r.tally['b']).toBe(1);
    expect(r.wasTie).toBe(false);
  });

  test('tally에는 0표 유형도 포함된다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd'])];
    const r = scoreByVote(qs, [{ questionId: '1', chosenIndex: 0 }], TYPES);
    expect(Object.keys(r.tally).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(r.tally['e']).toBe(0);
  });

  test('동점이면 뒤쪽 문항에서 득표한 유형이 이긴다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd']), q('2', ['a', 'b', 'c', 'd'])];
    const answers: Answer[] = [
      { questionId: '1', chosenIndex: 0 }, // a
      { questionId: '2', chosenIndex: 1 }, // b
    ];
    const r = scoreByVote(qs, answers, TYPES);
    expect(r.typeId).toBe('b');
    expect(r.wasTie).toBe(true);
  });

  test('미응답 문항은 표를 던지지 않는다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd']), q('2', ['a', 'b', 'c', 'd'])];
    const r = scoreByVote(qs, [{ questionId: '1', chosenIndex: 0 }], TYPES);
    expect(r.tally['a']).toBe(1);
    expect(Object.values(r.tally).reduce((s, n) => s + n, 0)).toBe(1);
  });

  test('응답이 하나도 없으면 예외 없이 첫 유형과 wasTie를 돌려준다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd'])];
    const r = scoreByVote(qs, [], TYPES);
    expect(r.typeId).toBe('a');
    expect(r.wasTie).toBe(true);
  });

  test('chosenIndex가 -1이면 표를 던지지 않는다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd'])];
    const r = scoreByVote(qs, [{ questionId: '1', chosenIndex: -1 }], TYPES);
    expect(Object.values(r.tally).reduce((s, n) => s + n, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/typeScore.vote.test.ts
```

Expected: FAIL — `scoreByVote is not a function`

- [ ] **Step 3: 구현**

`src/engine/typeScore.ts`에 추가한다:

```ts
import type { VoteResult } from './types';

/**
 * 최다 득표 방식 채점 (심리 테스트).
 * 선택지마다 typeId에 1표. 동점이면 뒤쪽 문항에서 득표한 유형이 이긴다
 * (뒤쪽에 변별력 높은 문항을 배치한다는 전제).
 */
export function scoreByVote(
  questions: readonly Question[],
  answers: readonly Answer[],
  typeIds: readonly string[]
): VoteResult {
  const chosenById = new Map<string, number>();
  for (const a of answers) chosenById.set(a.questionId, a.chosenIndex);

  const tally: Record<string, number> = {};
  for (const t of typeIds) tally[t] = 0;

  /** 각 유형이 마지막으로 득표한 문항 순번. 동점 판정에 쓴다. */
  const lastVotedAt: Record<string, number> = {};

  questions.forEach((q, i) => {
    const chosenIndex = chosenById.get(q.id);
    if (chosenIndex === undefined || chosenIndex < 0) return;
    const typeId = q.choices[chosenIndex]?.typeId;
    if (typeId === undefined) return;
    tally[typeId] = (tally[typeId] ?? 0) + 1;
    lastVotedAt[typeId] = i;
  });

  let best = typeIds[0] ?? '';
  let bestCount = -1;
  let bestAt = -1;
  let tied = false;

  for (const t of typeIds) {
    const count = tally[t] ?? 0;
    const at = lastVotedAt[t] ?? -1;
    if (count > bestCount) {
      best = t;
      bestCount = count;
      bestAt = at;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
      if (at > bestAt) {
        best = t;
        bestAt = at;
      }
    }
  }

  return { typeId: best, tally, wasTie: tied };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/typeScore && npx tsc --noEmit
```

Expected: PASS (전체 16 tests), 타입 에러 0개

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: 최다 득표 방식 채점 (심리 테스트)

선택지마다 유형에 1표. 동점이면 뒤쪽 문항 득표 우선.
tally에 0표 유형도 담아 결과 화면이 분포를 보여줄 수 있게 한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: 축 균형 출제

**Files:**
- Create: `src/engine/assembleTyped.ts`
- Test: `__tests__/engine/assembleTyped.test.ts`

**Interfaces:**
- Consumes: `mulberry32`, `shuffle` (계획 1), `Question`, `AxisKey`, `AXES`
- Produces: `assembleByAxis(pool, seed, { perAxis, excludeIds? }): Question[]`

**동작 규칙 — 정답형 `assemble`과 다른 점:**
1. **축별로 정확히 `perAxis`개씩** 뽑는다. 난이도가 아니라 축이 강제 대상이다
2. 어떤 축이 부족하면 **다른 축에서 채우지 않는다.** 축 균형이 깨진 결과는 무의미하므로, 부족하면 그 축은 있는 만큼만 넣고 `console.warn`을 남긴다
3. **선택지를 섞지 않는다.** 유형형 선택지는 리커트 척도라 순서가 의미를 갖는다
4. 반환 배열은 **축이 섞이도록** 시드로 셔플한다 (같은 축 문항이 연속으로 나오면 사용자가 패턴을 읽는다)
5. `excludeIds`는 정답형과 같은 후순위 규칙

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/engine/assembleTyped.test.ts`:

```ts
import { assembleByAxis } from '@/engine/assembleTyped';
import type { Question } from '@/engine/types';

function q(id: string, axis: string): Question {
  return {
    id,
    kind: 'typed',
    prompt: id,
    choices: [
      { text: '매우 그렇다', weight: 2 },
      { text: '그렇다', weight: 1 },
      { text: '아니다', weight: -1 },
      { text: '전혀 아니다', weight: -2 },
    ],
    axis,
    difficulty: 1,
  };
}

const pool: readonly Question[] = [
  ...Array.from({ length: 8 }, (_, i) => q(`ei${i}`, 'EI')),
  ...Array.from({ length: 8 }, (_, i) => q(`sn${i}`, 'SN')),
  ...Array.from({ length: 8 }, (_, i) => q(`tf${i}`, 'TF')),
  ...Array.from({ length: 8 }, (_, i) => q(`jp${i}`, 'JP')),
];

describe('assembleByAxis', () => {
  test('축별로 정확히 perAxis개씩 뽑는다', () => {
    const out = assembleByAxis(pool, 1, { perAxis: 6 });
    expect(out).toHaveLength(24);
    for (const axis of ['EI', 'SN', 'TF', 'JP']) {
      expect(out.filter((x) => x.axis === axis)).toHaveLength(6);
    }
  });

  test('같은 시드는 같은 구성을 준다', () => {
    const a = assembleByAxis(pool, 42, { perAxis: 6 });
    const b = assembleByAxis(pool, 42, { perAxis: 6 });
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });

  test('다른 시드는 다른 구성을 준다', () => {
    const a = assembleByAxis(pool, 1, { perAxis: 6 });
    const b = assembleByAxis(pool, 2, { perAxis: 6 });
    expect(a.map((x) => x.id)).not.toEqual(b.map((x) => x.id));
  });

  test('중복 없이 뽑는다', () => {
    const out = assembleByAxis(pool, 5, { perAxis: 6 });
    expect(new Set(out.map((x) => x.id)).size).toBe(24);
  });

  test('선택지를 섞지 않는다 — 리커트 순서가 유지된다', () => {
    const out = assembleByAxis(pool, 7, { perAxis: 6 });
    for (const x of out) {
      expect(x.choices.map((c) => c.text)).toEqual([
        '매우 그렇다',
        '그렇다',
        '아니다',
        '전혀 아니다',
      ]);
      expect(x.choices.map((c) => c.weight)).toEqual([2, 1, -1, -2]);
    }
  });

  test('같은 축 문항이 전부 연속으로 나오지는 않는다', () => {
    const out = assembleByAxis(pool, 9, { perAxis: 6 });
    const axesInOrder = out.map((x) => x.axis);
    // 앞의 6개가 전부 같은 축이면 셔플이 안 된 것
    expect(new Set(axesInOrder.slice(0, 6)).size).toBeGreaterThan(1);
  });

  test('축이 부족하면 다른 축에서 채우지 않고 경고한다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const thin: readonly Question[] = [
      q('ei0', 'EI'),
      q('ei1', 'EI'),
      ...Array.from({ length: 8 }, (_, i) => q(`sn${i}`, 'SN')),
      ...Array.from({ length: 8 }, (_, i) => q(`tf${i}`, 'TF')),
      ...Array.from({ length: 8 }, (_, i) => q(`jp${i}`, 'JP')),
    ];
    const out = assembleByAxis(thin, 3, { perAxis: 6 });
    expect(out.filter((x) => x.axis === 'EI')).toHaveLength(2);
    expect(out.filter((x) => x.axis === 'SN')).toHaveLength(6);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('excludeIds에 있는 문항은 후순위로 밀린다', () => {
    const exclude = pool.filter((x) => x.axis === 'EI').slice(0, 2).map((x) => x.id);
    const out = assembleByAxis(pool, 11, { perAxis: 6, excludeIds: exclude });
    expect(out.filter((x) => exclude.includes(x.id))).toHaveLength(0);
  });

  test('빈 풀에서는 빈 배열을 주고 예외를 던지지 않는다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(assembleByAxis([], 1, { perAxis: 6 })).toEqual([]);
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/assembleTyped.test.ts
```

Expected: FAIL — `Cannot find module '@/engine/assembleTyped'`

- [ ] **Step 3: 구현**

`src/engine/assembleTyped.ts`:

```ts
import { mulberry32, shuffle } from './rng';
import { AXES, type Question } from './types';

export interface AssembleTypedOptions {
  /** 각 축에서 뽑을 문항 수 */
  readonly perAxis: number;
  /** 최근에 나온 문항 ID. 완전 배제가 아니라 후순위로 민다. */
  readonly excludeIds?: readonly string[];
}

/**
 * 축 균형 출제 (성격 16유형).
 *
 * 정답형 assemble과 의도적으로 다른 점:
 * - 축이 부족해도 다른 축에서 채우지 않는다. 축 균형이 깨진 결과는 무의미하다.
 * - 선택지를 섞지 않는다. 리커트 척도는 순서 자체가 의미를 갖는다.
 */
export function assembleByAxis(
  pool: readonly Question[],
  seed: number,
  options: AssembleTypedOptions
): Question[] {
  const { perAxis, excludeIds } = options;
  if (pool.length === 0) {
    console.warn('[assembleByAxis] 문항 풀이 비어 있습니다');
    return [];
  }

  const rand = mulberry32(seed);
  const recent = new Set(excludeIds ?? []);
  const picked: Question[] = [];

  for (const axis of AXES) {
    const inAxis = pool.filter((q) => q.axis === axis);
    const fresh = shuffle(inAxis.filter((q) => !recent.has(q.id)), rand);
    const stale = shuffle(inAxis.filter((q) => recent.has(q.id)), rand);
    const ordered = [...fresh, ...stale];

    if (ordered.length < perAxis) {
      console.warn(
        `[assembleByAxis] ${axis} 축 문항이 부족합니다: ${ordered.length}개로 ${perAxis}개를 출제하려 합니다. 다른 축에서 채우지 않습니다.`
      );
    }

    picked.push(...ordered.slice(0, perAxis));
  }

  return shuffle(picked, rand);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/assembleTyped.test.ts && npx tsc --noEmit
```

Expected: PASS (9 tests), 타입 에러 0개

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: 축 균형 출제

축별로 정확히 N개씩 뽑고, 부족해도 다른 축에서 채우지 않는다.
선택지는 섞지 않는다 - 리커트 척도는 순서가 의미를 갖는다.
반환 순서만 섞어 같은 축이 연속으로 나오지 않게 한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: 16유형 별명 데이터

**Files:**
- Create: `src/content/typeNames.json`
- Test: `__tests__/content/typeNames.test.ts`

**Interfaces:**
- Consumes: `TypeNameEntry` (Task 1)
- Produces: 16개 코드 전부에 대한 별명·설명·이모지

**상표 정책 — 이 태스크의 핵심 제약:**
16Personalities의 유형 별명(옹호자, 중재자, 주인공, 활동가, 논리술사, 변론가, 통솔자, 사업가, 수호자, 물류전문가, 경영자, 집정관, 예술가, 모험가, 만능재주꾼, 거장)을 **하나도 쓰지 않는다.** 아래 별명은 전부 자체 창작이며 코믹 톤이다. 문자 그대로 옮길 것.

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/content/typeNames.test.ts`:

```ts
import typeNames from '@/content/typeNames.json';
import type { TypeNameEntry } from '@/engine/types';

const entries = typeNames as unknown as TypeNameEntry[];

/** 16Personalities의 유형명. 하나라도 쓰면 상표 위험. */
const FORBIDDEN = [
  '옹호자', '중재자', '주인공', '활동가',
  '논리술사', '변론가', '통솔자', '사업가',
  '수호자', '물류전문가', '경영자', '집정관',
  '예술가', '모험가', '만능재주꾼', '거장',
];

describe('16유형 별명', () => {
  test('16개 코드가 모두 있고 중복이 없다', () => {
    expect(entries).toHaveLength(16);
    expect(new Set(entries.map((e) => e.code)).size).toBe(16);
  });

  test('모든 코드가 네 글자이고 각 자리가 유효하다', () => {
    for (const e of entries) {
      expect(e.code).toMatch(/^[EI][SN][TF][JP]$/);
    }
  });

  test('별명·설명·이모지가 비어 있지 않다', () => {
    for (const e of entries) {
      expect(e.nickname.trim().length).toBeGreaterThan(0);
      expect(e.description.trim().length).toBeGreaterThan(0);
      expect(e.emoji.trim().length).toBeGreaterThan(0);
    }
  });

  test('16Personalities 유형명을 쓰지 않는다', () => {
    const all = JSON.stringify(entries);
    for (const word of FORBIDDEN) {
      expect(all).not.toContain(word);
    }
  });

  test('"MBTI"라는 단어를 쓰지 않는다', () => {
    expect(JSON.stringify(entries)).not.toContain('MBTI');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/content/typeNames.test.ts
```

Expected: FAIL — `Cannot find module '@/content/typeNames.json'`

- [ ] **Step 3: 데이터 작성**

`src/content/typeNames.json` — 아래를 그대로 옮긴다. 한글 문자열은 한 글자도 바꾸지 않는다.

```json
[
  { "code": "INTJ", "nickname": "혼자 다 계획해놓고 말 안 하는 사람", "description": "머릿속에 3년치 계획이 있는데 공유는 안 합니다. 물어보면 그제야 완성본이 나옵니다.", "emoji": "♟️" },
  { "code": "INTP", "nickname": "생각만 하다 하루 끝나는 사람", "description": "질문 하나에 꼬리를 열두 개 답니다. 결론은 내일 냅니다.", "emoji": "🌀" },
  { "code": "ENTJ", "nickname": "회의 안 잡으면 불안한 사람", "description": "모이면 일단 역할부터 나눕니다. 놀러 가서도 일정표가 있습니다.", "emoji": "📋" },
  { "code": "ENTP", "nickname": "일단 반박부터 하고 보는 사람", "description": "동의하면서도 반대 의견을 냅니다. 재미있어서 그럽니다.", "emoji": "🎲" },
  { "code": "INFJ", "nickname": "속으로 다 알면서 모른 척하는 사람", "description": "분위기를 제일 먼저 읽고 제일 늦게 말합니다.", "emoji": "🕯️" },
  { "code": "INFP", "nickname": "머릿속 세계가 더 바쁜 사람", "description": "가만히 있는 것처럼 보이지만 안에서는 대서사시가 돌아갑니다.", "emoji": "🌙" },
  { "code": "ENFJ", "nickname": "남 챙기다 자기 일 밀리는 사람", "description": "모두의 안부를 먼저 묻습니다. 자기 밥은 나중에 먹습니다.", "emoji": "🤲" },
  { "code": "ENFP", "nickname": "판 벌이고 수습 안 하는 사람", "description": "아이디어는 열 개, 완성은 한 개. 그래도 분위기는 항상 살립니다.", "emoji": "🎉" },
  { "code": "ISTJ", "nickname": "규칙이 곧 평화인 사람", "description": "정해진 대로 하면 아무 문제가 없다고 믿습니다. 대체로 맞습니다.", "emoji": "📐" },
  { "code": "ISFJ", "nickname": "말없이 다 해놓는 사람", "description": "티 안 내고 챙깁니다. 없어져 봐야 존재를 압니다.", "emoji": "🧺" },
  { "code": "ESTJ", "nickname": "안 시켜도 정리하는 사람", "description": "어수선한 걸 못 봅니다. 남의 책상까지 정리합니다.", "emoji": "🗂️" },
  { "code": "ESFJ", "nickname": "단톡방 공지 담당", "description": "모임 날짜를 세 번 확인시킵니다. 덕분에 모임이 성사됩니다.", "emoji": "📣" },
  { "code": "ISTP", "nickname": "말보다 손이 먼저인 사람", "description": "설명 듣는 것보다 뜯어보는 게 빠릅니다.", "emoji": "🔧" },
  { "code": "ISFP", "nickname": "조용히 취향이 확실한 사람", "description": "주장은 안 하는데 절대 양보도 안 합니다.", "emoji": "🎨" },
  { "code": "ESTP", "nickname": "일단 지르고 보는 사람", "description": "고민하는 시간에 이미 해버립니다. 수습도 빠릅니다.", "emoji": "🏍️" },
  { "code": "ESFP", "nickname": "어디 가든 사진 찍는 사람", "description": "지금 이 순간이 제일 중요합니다. 기록은 덤입니다.", "emoji": "📸" }
]
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/content/typeNames.test.ts && npx tsc --noEmit
```

Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "콘텐츠: 16유형 자체 별명

16Personalities 유형명을 쓰지 않고 전부 새로 지었다.
금지어 목록을 테스트로 고정해 나중에 실수로 섞여 들어가는 걸 막는다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6 이후 — 개요

여기부터는 계획 1에서 확립된 패턴을 그대로 따르므로, 각 태스크의 전체 코드는 해당 태스크 착수 시점에 이 문서에 채워 넣는다. 지금 확정된 것은 범위와 인터페이스다.

### Task 6 — 성격 문항 32개 (축당 8개)

**Files:** Create `src/content/personality.json`, `__tests__/content/personality.test.ts`

**문항 설계 — 리커트 척도**

모든 문항이 **같은 4선택지**를 쓴다. 진술문에 얼마나 동의하는지를 묻는 방식이다.

```
매우 그렇다  weight +2
그렇다       weight +1
아니다       weight -1
전혀 아니다  weight -2
```

가중치의 **부호는 선택지가 아니라 진술문이 결정**한다. 예를 들어 EI 축에서 "처음 보는 사람에게 먼저 말을 건다"는 E 방향 진술이므로 위 순서 그대로 `[2, 1, -1, -2]`를 쓰고, "생각을 정리한 뒤에 말한다"는 I 방향 진술이므로 **뒤집어서** `[-2, -1, 1, 2]`를 쓴다. 이렇게 해야 한쪽으로만 답하는 사용자(전부 "매우 그렇다")가 자동으로 한쪽 극단에 몰리지 않는다.

**축별로 정방향 4개 · 역방향 4개**를 배치한다. 이 균형이 깨지면 응답 편향이 결과에 그대로 새어 들어간다.

**Test:** `__tests__/content/personality.test.ts`

```ts
import personality from '@/content/personality.json';
import { AXES } from '@/engine/types';
import type { Question } from '@/engine/types';

const questions = personality as unknown as Question[];
const LIKERT = ['매우 그렇다', '그렇다', '아니다', '전혀 아니다'];

describe('성격 16유형 문항', () => {
  test('32문항이고 ID가 규칙을 지키며 중복이 없다', () => {
    expect(questions).toHaveLength(32);
    for (const q of questions) expect(q.id).toMatch(/^pers-\d{4}$/);
    expect(new Set(questions.map((q) => q.id)).size).toBe(32);
  });

  test('모든 문항이 typed이고 유효한 축을 갖는다', () => {
    for (const q of questions) {
      expect(q.kind).toBe('typed');
      expect(AXES).toContain(q.axis);
    }
  });

  test('축마다 정확히 8문항', () => {
    for (const axis of AXES) {
      expect(questions.filter((q) => q.axis === axis)).toHaveLength(8);
    }
  });

  test('모든 문항이 같은 리커트 선택지 문구를 같은 순서로 쓴다', () => {
    for (const q of questions) {
      expect(q.choices.map((c) => c.text)).toEqual(LIKERT);
    }
  });

  test('가중치는 정방향 [2,1,-1,-2] 또는 역방향 [-2,-1,1,2] 둘 중 하나다', () => {
    for (const q of questions) {
      const w = q.choices.map((c) => c.weight);
      const forward = JSON.stringify(w) === JSON.stringify([2, 1, -1, -2]);
      const reverse = JSON.stringify(w) === JSON.stringify([-2, -1, 1, 2]);
      expect(forward || reverse).toBe(true);
    }
  });

  test('축마다 정방향 4개·역방향 4개로 균형이 잡혀 있다', () => {
    for (const axis of AXES) {
      const inAxis = questions.filter((q) => q.axis === axis);
      const forward = inAxis.filter((q) => q.choices[0]?.weight === 2);
      expect(forward).toHaveLength(4);
    }
  });

  test('모든 문항에 어느 축을 재는지 설명이 있다', () => {
    for (const q of questions) {
      expect((q.explanation ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  test('정답형 필드가 섞여 있지 않다', () => {
    for (const q of questions) {
      expect(q.answerIndex).toBeUndefined();
    }
  });
});
```

**Content:** `src/content/personality.json` — 아래를 그대로 옮긴다. 한글은 한 글자도 바꾸지 않는다.

선택지는 모든 문항이 동일하므로, 정방향(`F`)과 역방향(`R`) 두 벌만 존재한다.

```
정방향 F: [{"text":"매우 그렇다","weight":2},{"text":"그렇다","weight":1},{"text":"아니다","weight":-1},{"text":"전혀 아니다","weight":-2}]
역방향 R: [{"text":"매우 그렇다","weight":-2},{"text":"그렇다","weight":-1},{"text":"아니다","weight":1},{"text":"전혀 아니다","weight":2}]
```

| id | axis | 방향 | prompt | explanation |
|---|---|---|---|---|
| pers-0001 | EI | F | 처음 보는 사람들 사이에서도 먼저 말을 건다. | 낯선 자리에서 먼저 다가가는지를 봅니다. 에너지가 밖으로 향하는 쪽(E)의 특징입니다. |
| pers-0002 | EI | F | 여러 명이 모인 자리에 다녀오면 기운이 난다. | 사람을 만난 뒤 충전되는지 소모되는지를 봅니다. 충전되면 E 쪽입니다. |
| pers-0003 | EI | F | 주말에 약속이 없으면 허전하다. | 혼자 있는 시간을 비는 시간으로 느끼는지를 봅니다. |
| pers-0004 | EI | F | 모임에서 대화를 주도하는 편이다. | 말을 꺼내는 쪽인지 받는 쪽인지를 봅니다. |
| pers-0005 | EI | R | 혼자 있는 시간이 없으면 금방 지친다. | 회복이 혼자일 때 일어나는지를 봅니다. 그렇다면 안으로 향하는 쪽(I)입니다. |
| pers-0006 | EI | R | 전화보다 문자가 편하다. | 즉석 대화보다 정리할 틈이 있는 소통을 선호하는지를 봅니다. |
| pers-0007 | EI | R | 생각을 정리한 뒤에 말하는 편이다. | 말하면서 생각하는지, 생각하고 말하는지를 봅니다. |
| pers-0008 | EI | R | 낯선 자리에서는 먼저 분위기를 살핀다. | 뛰어드는 쪽인지 살피는 쪽인지를 봅니다. |
| pers-0009 | SN | F | 일단 큰 그림부터 그리고 세부는 나중에 채운다. | 전체 구조를 먼저 보는지를 봅니다. 직관 쪽(N)의 특징입니다. |
| pers-0010 | SN | F | '만약에'로 시작하는 상상을 자주 한다. | 지금 없는 가능성에 마음이 가는지를 봅니다. |
| pers-0011 | SN | F | 남들이 못 본 연결고리를 찾아내는 편이다. | 떨어져 있는 것들을 엮어 보는 성향을 봅니다. |
| pers-0012 | SN | F | 설명할 때 비유를 자주 쓴다. | 사실을 그대로 옮기는지, 다른 것에 빗대는지를 봅니다. |
| pers-0013 | SN | R | 설명서를 끝까지 읽고 시작한다. | 주어진 정보를 순서대로 다루는지를 봅니다. 감각 쪽(S)의 특징입니다. |
| pers-0014 | SN | R | 직접 만져보고 확인해야 믿는다. | 경험한 것과 추론한 것 중 무엇을 더 믿는지를 봅니다. |
| pers-0015 | SN | R | 과거에 해본 방식이 제일 안전하다고 생각한다. | 검증된 방법과 새로운 방법 중 어느 쪽에 무게를 두는지를 봅니다. |
| pers-0016 | SN | R | 구체적인 숫자와 사실이 있어야 마음이 놓인다. | 근거의 형태가 구체적이어야 하는지를 봅니다. |
| pers-0017 | TF | F | 누가 속상해하면 이유보다 마음이 먼저 쓰인다. | 상황보다 사람의 상태에 먼저 반응하는지를 봅니다. 감정 쪽(F)입니다. |
| pers-0018 | TF | F | 칭찬을 들으면 하루가 달라진다. | 관계에서 오는 신호가 자신에게 얼마나 크게 작용하는지를 봅니다. |
| pers-0019 | TF | F | 분위기가 나빠지면 내가 나서서 풀려고 한다. | 조화가 깨졌을 때 개입하는 쪽인지를 봅니다. |
| pers-0020 | TF | F | 거절할 때 상대가 상처받을까 봐 오래 고민한다. | 결정에 상대의 감정이 얼마나 개입하는지를 봅니다. |
| pers-0021 | TF | R | 결정할 때 논리적으로 옳은지를 먼저 따진다. | 판단의 첫 기준이 일관성인지를 봅니다. 사고 쪽(T)입니다. |
| pers-0022 | TF | R | 틀린 건 틀렸다고 말해주는 게 도움이라고 생각한다. | 정확함과 부드러움 중 무엇을 먼저 두는지를 봅니다. |
| pers-0023 | TF | R | 감정적인 호소보다 근거가 설득력 있다. | 무엇에 설득되는지를 봅니다. |
| pers-0024 | TF | R | 공정한 게 친절한 것보다 중요하다. | 원칙과 배려가 부딪힐 때 어느 쪽을 택하는지를 봅니다. |
| pers-0025 | JP | F | 마감이 닥쳐야 집중이 된다. | 압박이 있어야 움직이는지를 봅니다. 인식 쪽(P)의 특징입니다. |
| pers-0026 | JP | F | 계획이 바뀌어도 별로 신경 쓰이지 않는다. | 변화에 드는 비용을 어떻게 느끼는지를 봅니다. |
| pers-0027 | JP | F | 선택지를 오래 열어두는 편이다. | 빨리 닫는 쪽인지 열어두는 쪽인지를 봅니다. |
| pers-0028 | JP | F | 그때그때 끌리는 대로 하는 게 재미있다. | 즉흥과 계획 중 어느 쪽에서 즐거움을 얻는지를 봅니다. |
| pers-0029 | JP | R | 여행 가기 전에 일정을 다 짜둔다. | 미리 정해두는 것이 편한지를 봅니다. 판단 쪽(J)입니다. |
| pers-0030 | JP | R | 할 일 목록을 만들고 지워나가는 게 좋다. | 마무리에서 만족을 얻는지를 봅니다. |
| pers-0031 | JP | R | 물건은 제자리에 있어야 마음이 편하다. | 정돈된 상태가 심리적 안정과 연결되는지를 봅니다. |
| pers-0032 | JP | R | 약속 시간보다 미리 도착한다. | 시간을 다루는 방식을 봅니다. |

각 항목은 다음 형태의 JSON 객체가 된다.

```json
{
  "id": "pers-0001",
  "kind": "typed",
  "prompt": "처음 보는 사람들 사이에서도 먼저 말을 건다.",
  "choices": [
    { "text": "매우 그렇다", "weight": 2 },
    { "text": "그렇다", "weight": 1 },
    { "text": "아니다", "weight": -1 },
    { "text": "전혀 아니다", "weight": -2 }
  ],
  "axis": "EI",
  "explanation": "낯선 자리에서 먼저 다가가는지를 봅니다. 에너지가 밖으로 향하는 쪽(E)의 특징입니다.",
  "difficulty": 1,
  "source": "자체 창작 — 융 이론의 외향/내향 축"
}
```

**검증기 확장** (`tools/validate-content.ts`): `validateTypedQuestions(questions, { axes, expectedChoiceCount })` 를 추가한다. 검사 항목 — 모든 문항에 유효한 `axis`가 있는가, `answerIndex`가 없는가, 선택지 가중치가 정방향/역방향 두 벌 중 하나인가, 축당 문항 수가 출제 요구치 이상인가, **축마다 정·역이 균형인가**, ID 중복이 없는가, 설명이 비어 있지 않은가.

### Task 7 — 심리 테스트: 연애 성향

**범위 조정:** 원래 3종(연애·스트레스·소통)을 한 태스크로 묶었으나, 문항 36개 + 유형 15개는 한 검증 단위로 너무 크다. **연애 성향 1종만** 먼저 만들어 화면까지 끝까지 도는 것을 확인하고, 나머지 2종은 같은 틀에 콘텐츠만 붓는 별도 태스크(Task 7b)로 뺀다.

**Files:** Create `src/content/psych/love.json`, `__tests__/content/psych.test.ts`

**구조**

파일 하나가 테스트 하나를 담는다. 유형 정의와 문항이 같은 파일에 있다 — 심리 테스트는 유형이 테스트마다 완전히 다르므로 `typeNames.json` 같은 공용 파일로 뺄 이유가 없다.

```json
{
  "id": "love",
  "title": "연애 성향",
  "types": [ { "id": "...", "name": "...", "emoji": "...", "description": "..." } ],
  "questions": [ { "id": "...", "kind": "typed", "prompt": "...", "choices": [...], "explanation": "...", "difficulty": 1 } ]
}
```

**득표 균등** — 12문항 × 4선택지 = 48표 기회를 5유형에 나눈다. 완전 균등은 불가능하므로 **10/10/10/9/9**로 배분하고, 검증에서 최대-최소 차이가 1 이하인지 확인한다. 한 유형이 구조적으로 적게 등장하면 그 결과는 사실상 나오지 않는다.

**동점 규칙과 문항 순서** — `scoreByVote`는 동점 시 **뒤쪽 문항에서 득표한 유형**을 택한다. 따라서 뒤쪽 4문항(9~12번)에 변별력이 높은 문항을 배치한다. 이건 데이터 설계 제약이지 코드가 강제하는 게 아니므로, 문항 순서를 바꾸면 동점 처리 결과가 달라진다는 점을 기억할 것.

**5유형**

| id | 이름 | 이모지 | 설명 |
|---|---|---|---|
| flame | 직진형 | 🔥 | 좋으면 바로 말합니다. 재는 시간이 아까운 쪽입니다. |
| slow | 신중형 | 🌱 | 확신이 서야 움직입니다. 대신 한번 시작하면 오래갑니다. |
| giver | 헌신형 | 🎁 | 받는 것보다 주는 게 편합니다. 가끔 자기를 잊습니다. |
| space | 거리형 | 🪟 | 각자의 시간이 있어야 관계가 편안합니다. |
| wave | 파도형 | 🌊 | 감정의 진폭이 큽니다. 좋을 땐 아주 좋습니다. |

**Test:** `__tests__/content/psych.test.ts`

```ts
import love from '@/content/psych/love.json';

interface PsychType { id: string; name: string; emoji: string; description: string }
interface PsychChoice { text: string; typeId: string }
interface PsychQuestion {
  id: string; kind: string; prompt: string;
  choices: PsychChoice[]; explanation: string; difficulty: number;
}
interface PsychTest { id: string; title: string; types: PsychType[]; questions: PsychQuestion[] }

const tests: PsychTest[] = [love as unknown as PsychTest];

describe.each(tests.map((t) => [t.id, t] as const))('심리 테스트 %s', (_id, test) => {
  test('유형이 5개이고 id가 중복되지 않는다', () => {
    expect(test.types).toHaveLength(5);
    expect(new Set(test.types.map((t) => t.id)).size).toBe(5);
  });

  test('모든 유형에 이름·이모지·설명이 있다', () => {
    for (const t of test.types) {
      expect(t.name.trim().length).toBeGreaterThan(0);
      expect(t.emoji.trim().length).toBeGreaterThan(0);
      expect(t.description.trim().length).toBeGreaterThan(0);
    }
  });

  test('문항이 12개이고 id가 중복되지 않는다', () => {
    expect(test.questions).toHaveLength(12);
    expect(new Set(test.questions.map((q) => q.id)).size).toBe(12);
  });

  test('모든 문항이 typed이고 선택지가 4개다', () => {
    for (const q of test.questions) {
      expect(q.kind).toBe('typed');
      expect(q.choices).toHaveLength(4);
    }
  });

  test('한 문항 안에서 같은 유형에 두 번 투표하지 않는다', () => {
    for (const q of test.questions) {
      expect(new Set(q.choices.map((c) => c.typeId)).size).toBe(4);
    }
  });

  test('모든 선택지의 typeId가 정의된 유형 중 하나다', () => {
    const ids = new Set(test.types.map((t) => t.id));
    for (const q of test.questions) {
      for (const c of q.choices) expect(ids.has(c.typeId)).toBe(true);
    }
  });

  test('유형별 득표 기회가 균등하다 (최대-최소 차이 1 이하)', () => {
    const counts = new Map<string, number>();
    for (const t of test.types) counts.set(t.id, 0);
    for (const q of test.questions) {
      for (const c of q.choices) counts.set(c.typeId, (counts.get(c.typeId) ?? 0) + 1);
    }
    const values = [...counts.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });

  test('모든 문항에 해설이 있고 선택지 텍스트가 비어 있지 않다', () => {
    for (const q of test.questions) {
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      for (const c of q.choices) expect(c.text.trim().length).toBeGreaterThan(0);
    }
  });

  test('정답형 필드가 섞여 있지 않다', () => {
    for (const q of test.questions) {
      expect((q as unknown as Record<string, unknown>)['answerIndex']).toBeUndefined();
    }
  });
});
```

**Content:** `src/content/psych/love.json` — 아래 표를 JSON으로 옮긴다. 각 문항의 선택지는 표에 적힌 순서 그대로, `typeId`는 괄호 안의 값.

문항 id는 `love-01` … `love-12`.

| # | prompt | 선택지 1 | 선택지 2 | 선택지 3 | 선택지 4 | explanation |
|---|---|---|---|---|---|---|
| 01 | 마음에 드는 사람이 생겼습니다. 먼저 하는 일은? | 일단 연락처부터 묻는다 (flame) | 한동안 지켜본다 (slow) | 뭘 좋아하는지 알아본다 (giver) | 굳이 티 내지 않는다 (space) | 호감이 생겼을 때의 첫 행동이 관계를 시작하는 속도를 보여줍니다. |
| 02 | 상대에게 답장이 늦게 옵니다. | 무슨 일 있나 바로 물어본다 (wave) | 바쁜가 보다 하고 둔다 (space) | 부담됐나 되짚어본다 (slow) | 기다렸다가 더 다정하게 답한다 (giver) | 불확실한 상황에서 나오는 반응이 애착의 방식을 드러냅니다. |
| 03 | 데이트 계획은 보통? | 떠오르는 대로 즉흥적으로 (flame) | 미리 다 정해둔다 (slow) | 상대가 좋아할 곳 위주로 (giver) | 각자 편한 걸로 맞춘다 (space) | 함께하는 시간을 설계하는 방식을 봅니다. |
| 04 | 싸운 다음 날 아침. | 먼저 연락한다 (flame) | 정리될 때까지 시간을 둔다 (space) | 내가 뭘 잘못했나 생각한다 (giver) | 하루 종일 마음이 오르내린다 (wave) | 갈등 직후의 행동이 관계를 복구하는 방식입니다. |
| 05 | 상대가 힘들어 보입니다. | 당장 달려간다 (flame) | 뭐가 필요한지 묻는다 (giver) | 말 걸 때까지 기다린다 (space) | 같이 기분이 가라앉는다 (wave) | 상대의 감정에 개입하는 거리감을 봅니다. |
| 06 | 연애할 때 제일 힘든 건? | 미지근한 반응 (flame) | 확신이 안 서는 상태 (slow) | 내 마음을 몰라줄 때 (giver) | 감정이 요동칠 때 (wave) | 무엇을 견디기 어려워하는지가 성향의 축입니다. |
| 07 | 기념일은? | 크게 챙긴다 (flame) | 조용히 둘이서 (slow) | 상대가 감동할 준비를 한다 (giver) | 굳이 안 챙겨도 된다 (space) | 관계를 표현하는 방식과 강도를 봅니다. |
| 08 | 상대의 친구 모임에 초대받았습니다. | 좋다, 바로 간다 (flame) | 어떤 자리인지 먼저 묻는다 (slow) | 뭘 사 갈지 고민한다 (giver) | 잘 보여야 한다는 생각에 긴장된다 (wave) | 관계를 넓히는 것에 대한 태도를 봅니다. |
| 09 | 연락 빈도에 대한 생각은? | 하루에도 여러 번이 자연스럽다 (wave) | 필요할 때만 하면 된다 (space) | 상대 리듬에 맞춘다 (giver) | 정해두는 게 편하다 (slow) | 연락은 연애 성향에서 가장 자주 부딪히는 지점입니다. |
| 10 | 상대에게 서운한 일이 생겼습니다. | 그 자리에서 말한다 (flame) | 참았다가 나중에 말한다 (slow) | 웬만하면 넘어간다 (giver) | 티가 나버린다 (wave) | 부정적 감정을 다루는 방식이 관계의 지속성을 좌우합니다. |
| 11 | 관계가 안정기에 접어들면? | 새로운 걸 시도하고 싶다 (flame) | 이 편안함이 좋다 (slow) | 가끔 예전의 설렘이 그립다 (wave) | 각자 생활이 살아난다 (space) | 안정된 뒤의 태도가 장기적인 성향을 보여줍니다. |
| 12 | 헤어진 뒤의 나는? | 한동안 크게 흔들린다 (wave) | 시간이 걸려도 천천히 정리한다 (slow) | 곧 다음 사람이 눈에 들어온다 (flame) | 생각보다 담담하다 (space) | 관계가 끝난 뒤의 반응이 감정의 진폭을 보여줍니다. |

**득표 기회 — 계산 완료, 이 분포가 정답이다**

각 문항은 5유형 중 4개에만 투표하므로 문항마다 한 유형이 빠진다. 12문항 × 4선택지 = 48표 기회를 10/10/10/9/9로 나누려면 빠지는 횟수가 2/2/2/3/3이어야 한다.

| 유형 | 등장 문항 | 횟수 |
|---|---|---|
| flame | 01·03·04·05·06·07·08·10·11·12 | **10** |
| slow | 01·02·03·06·07·08·09·10·11·12 | **10** |
| giver | 01·02·03·04·05·06·07·08·09·10 | **10** |
| space | 01·02·03·04·05·07·09·11·12 | **9** |
| wave | 02·04·05·06·08·09·10·11·12 | **9** |

합계 48. 최대−최소 = 1 → 균등 검증 통과.

**구현자에게:** 위 표를 그대로 옮기면 이 분포가 나온다. 직접 다시 세어 보고서에 적고, 균등 테스트가 통과하는 것으로 확인할 것. 숫자가 안 맞으면 표를 잘못 옮긴 것이지 표가 틀린 것이 아니다.

**Task 8 — `TypeCard` · `AxisBar` 컴포넌트**
- `TypeCard`는 계획 1의 `Certificate`와 같은 자리 — 나중에 이미지로 캡처될 대상이므로 화면 상태를 끌고 들어오지 않는다
- `AxisBar`는 축별 치우침을 막대로 표시하고, `wasTie`면 "거의 반반입니다"를 함께 보여준다
- 큰 글자에 `lineHeight` 필수

**Task 9 — 성격 고사 화면 4종**
- `app/test/personality/{intro,quiz,result,review}.tsx`
- 계획 1의 `test/dialect/*` 구조를 그대로 따른다. `useSafeAreaInsets()` 하단 여백 포함
- `registry.ts`의 `CATEGORIES`에서 `personality`의 `available`이 풀 존재로 자동 도출되는지 확인

**Task 10 — 심리 테스트 화면 4종**
- `app/test/psych/{intro,quiz,result,review}.tsx`
- `intro`에서 3종 중 하나를 고른다 (사투리의 지역 선택과 같은 구조)

**Task 11 — 릴리스 빌드 + 실기기 검증**
- 권한이 여전히 하나뿐인지 확인
- **실기기에서 성격 고사와 심리 테스트를 각각 끝까지 풀어본다.** 계획 1에서 이 단계를 건너뛴 탓에 "정답이 항상 1번"이 릴리스까지 통과했다
- 확인할 것: 리커트 선택지 순서가 유지되는가, 16유형 코드가 나오는가, 축 막대가 표시되는가, 심리 결과가 5유형 중 하나로 나오는가, 뒤로가기가 시험 화면을 남기지 않는가

---

## 계획 2 완료 조건

- [ ] `npx jest` 전체 통과
- [ ] `npx tsc --noEmit` 타입 에러 0개
- [ ] `npm run validate:content` 통과 (유형형 규칙 포함)
- [ ] release APK에 사용자 노출 권한 0개
- [ ] **실기기에서 성격 16유형 고사를 끝까지 풀고 유형 카드·해설 확인**
- [ ] **실기기에서 심리 테스트 3종 중 하나를 끝까지 풀고 유형 카드·해설 확인**

## 다음 계획

- **계획 3** — IQ 고사: 도형 생성기 10종, `SvgFigure` 렌더러, IQ 화면
- **계획 4** — 기록, 오답노트, 결과 카드 이미지 공유, 딥링크 도전장
- **계획 5** — 문항 366개 확장, 서명키, AAB, 스토어 등록
