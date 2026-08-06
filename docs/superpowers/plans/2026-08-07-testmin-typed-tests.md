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

**Task 6 — 성격 문항 32개 (축당 8개)**
- `src/content/personality.json`
- 각 문항은 진술문 + 리커트 4선택지(매우 그렇다 +2 / 그렇다 +1 / 아니다 −1 / 전혀 아니다 −2)
- 축당 8개를 확보해 출제 6개 대비 여유를 둔다
- 문항별 `explanation`은 "이 문항이 어느 축을 재는가"를 설명한다 (정답형의 "왜 이게 답인가"에 대응)
- 검증기에 유형형 규칙 추가: 모든 문항에 `axis`가 있고 유효한가, 선택지 가중치가 `[2,1,-1,-2]`인가, 축당 문항 수가 출제 요구치 이상인가

**Task 7 — 심리 테스트 3종 데이터**
- `src/content/psych/{love,stress,comm}.json`
- 각 12문항 · 5유형 · 문항당 4선택지(각기 다른 유형에 투표)
- 유형별 득표 기회가 균등한지 검증기가 확인 (±1 이내)
- 각 테스트의 5유형 이름·설명은 `typeNames.json`과 별도로 파일 안에 둔다

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
