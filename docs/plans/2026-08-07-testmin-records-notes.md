# 성적표 · 오답노트 Implementation Plan

**Goal:** 응시가 끝나면 결과가 저장되고, 성적표 탭에서 지난 응시를 돌아보고, 오답노트 탭에서 틀린 문항을 해설과 함께 다시 볼 수 있다.

**Architecture:** 저장은 `AsyncStorage` 하나만 쓴다. **오답노트는 문항을 저장하지 않고 참조만 저장한다** — 정적 풀 문항은 `questionId`로 찾고, IQ 도형 문항은 `iq-<생성기>-<시드>`를 파싱해 **다시 생성**한다. 그 계약은 계획 3에서 이미 만들고 테스트까지 해뒀다(`parseIqQuestionId`, 100시드 왕복 테스트).

**Tech Stack:** `@react-native-async-storage/async-storage` (Expo 지원, 사용자 노출 권한 없음)

## Global Constraints

- TypeScript strict + `noUncheckedIndexedAccess`, `tsc --noEmit` 클린
- `src/engine/**`는 순수 TypeScript — React·RN·AsyncStorage import 금지. **저장은 `src/store/`가 맡는다**
- 사용자 노출 문구는 한국어, 파일은 UTF-8
- **한글 파일에 PowerShell 텍스트 치환 금지**
- **사용자 노출 권한 0개 유지** — AsyncStorage는 앱 내부 저장소라 권한이 필요 없다. 릴리스 후 `aapt2 dump permissions`로 재확인
- `__tests__/engine/iq/generators.test.ts` 수정 금지

### 사용자에게 도달하는 실패만 골라 막는다

이 기능의 위험은 계산이 아니라 **저장된 데이터**에 있다. 아래는 전부 사용자가 겪는 형태로 적었다.

| 실패 | 사용자가 겪는 것 | 요구 |
|---|---|---|
| 저장 데이터가 깨짐 | **앱이 켜지자마자 죽는다** | 파싱 실패 시 빈 목록으로 폴백. 절대 throw 금지 |
| 항목 하나가 복원 불가 | 목록 전체가 안 나온다 | 항목 단위로 건너뛴다. 한 개 때문에 나머지를 잃지 않는다 |
| 무한 증가 | 오래 쓰면 느려지고 저장 실패 | 기록 100개·오답 200개 상한, 오래된 것부터 버린다 |
| 생성기/문항이 사라짐 | 오답노트가 죽는다 | 복원 실패 항목은 조용히 제외 |
| 같은 문항 중복 누적 | 같은 문제가 열 번 쌓인다 | `questionId` 기준 중복 제거, 최신 것으로 갱신 |

---

## Task 1 — 저장 계층과 데이터 모델

**Files:**
- Create: `src/engine/records.ts`, `src/engine/notes.ts`, `src/store/storage.ts`, `src/store/history.ts`
- Modify: `app.json`(allowBackup), `app/test/*/result.tsx` 4개(저장 호출)
- Test: `__tests__/engine/records.test.ts`, `__tests__/engine/notes.test.ts`, `__tests__/store/history.test.ts`

### `src/engine/records.ts` — 순수 함수만

```ts
/** 세 채점 방식의 결과를 한 모양으로 담는다. 화면이 kind로 분기한다. */
export type RecordResult =
  | { readonly kind: 'scored'; readonly correct: number; readonly total: number;
      readonly grade: number; readonly title: string; readonly estimatedScore?: number }
  | { readonly kind: 'axis'; readonly code: string; readonly nickname: string }
  | { readonly kind: 'vote'; readonly typeId: string; readonly typeName: string };

export interface TestRecord {
  readonly id: string;
  readonly testId: string;
  readonly variant: string;
  readonly seed: number;
  readonly completedAt: number;   // epoch ms
  readonly result: RecordResult;
}

export const MAX_RECORDS = 100;

/** 새 기록을 앞에 넣고 상한을 넘으면 오래된 것부터 버린다. */
export function addRecord(list: readonly TestRecord[], rec: TestRecord): TestRecord[];

/** 저장된 값이 무엇이든 안전하게 TestRecord[]로 만든다. 못 읽는 항목은 버린다. */
export function parseRecords(raw: unknown): TestRecord[];
```

`parseRecords`가 이 파일의 핵심이다. **`raw`가 문자열이든 null이든 숫자 배열이든 절대 throw 하지 않는다.** 항목마다 필수 필드(`id`·`testId`·`completedAt`·`result.kind`)를 확인하고, 하나라도 없으면 그 항목만 버린다.

### `src/engine/notes.ts` — 참조만 저장

```ts
export interface WrongNote {
  readonly testId: string;
  readonly variant: string;
  /** 정적 풀이면 문항 id, IQ면 `iq-<생성기>-<시드>` */
  readonly questionId: string;
  readonly chosenIndex: number;
  readonly answerIndex: number;
  readonly addedAt: number;
}

export const MAX_NOTES = 200;

/** questionId가 같으면 새 것으로 갈아끼운다 — 같은 문제가 쌓이지 않게. */
export function addNotes(list: readonly WrongNote[], added: readonly WrongNote[]): WrongNote[];
export function parseNotes(raw: unknown): WrongNote[];
```

**문항 복원은 엔진이 아니라 `src/store/history.ts`가 한다.** 정적 풀(`POOLS`)과 생성기 레지스트리를 둘 다 봐야 하는데, 그건 `content/registry`에 의존하므로 순수 엔진에 두면 의존 방향이 뒤집힌다.

```ts
/** 복원 실패하면 undefined. 호출부가 그 항목을 건너뛴다. */
export function restoreQuestion(note: WrongNote): Question | undefined;
```

- `testId === 'iq'` → `parseIqQuestionId(questionId)` → 해당 생성기를 찾아 `generate(seed)`
- 그 외 → `getPool(testId, variant)`에서 `id`로 찾기
- 생성기가 없거나 파싱 실패하거나 풀에 없으면 `undefined`

### `src/store/storage.ts` — AsyncStorage 얇은 래퍼

```ts
const KEY_RECORDS = 'testmin.records.v1';
const KEY_NOTES = 'testmin.notes.v1';
```

키에 `.v1`을 붙인다. 나중에 모양이 바뀌면 키를 올려 **옛 데이터를 조용히 무시**할 수 있다 — 마이그레이션 코드를 안 쓰기 위해서다.

읽기는 `JSON.parse`를 `try/catch`로 감싸고 실패하면 `null`을 준다. 쓰기 실패도 삼킨다(저장 못 해도 앱은 돌아야 한다). **두 경우 다 `console.warn`으로 남긴다.**

### `src/store/history.ts` — Zustand 스토어

`records`, `notes`, `load()`, `saveResult(...)`, `clearAll()`.
앱 시작 시 `load()`를 한 번 부른다(`app/_layout.tsx`).

### 결과 화면 4개에 저장 호출 추가

각 `result.tsx`가 채점 직후 `saveResult`를 부른다. **한 번만 불러야 한다** — 화면이 다시 그려질 때마다 저장하면 기록이 중복된다. `useEffect`에 빈 의존성 배열, 또는 세션 id 기준 가드.

> IQ는 `estimatedScore`도 함께 저장한다. 성적표에서 점수 추이를 보여줄 것이므로.
> **다만 성적표에 점수를 표시하면 안내 문구도 함께 표시해야 한다** — 계획 3에서 정한 규칙이다.

### `app.json` — `allowBackup: false`

`expo.android.allowBackup`을 **명시적으로 `false`**로 둔다.

> **왜:** 안드로이드 기본값은 `true`라 구글 자동 백업이 앱 내부 저장소를 서버로 올린다.
> 이 앱은 `INTERNET` 권한을 아예 제거하고 "네트워크 없이 전부 오프라인 동작"을 표방하는데,
> 백업 에이전트는 앱 권한과 무관하게 동작하므로 **표방하는 것과 실제가 어긋난다.**
> 부수 효과로, 재설치해도 옛 세이브가 살아나 테스트를 헷갈리게 하는 함정도 없어진다.

### 필수 테스트

```ts
// 사용자에게 도달하는 실패만 검사한다
test('저장 데이터가 깨져 있어도 빈 목록을 주고 throw 하지 않는다', () => {
  for (const bad of [null, undefined, 0, 'x', [], [1,2], [{}], [{ id: 'a' }], '{"broken":']) {
    expect(() => parseRecords(bad)).not.toThrow();
    expect(Array.isArray(parseRecords(bad))).toBe(true);
  }
});
test('항목 하나가 망가져도 나머지는 살아남는다', () => { /* 정상 2 + 망가진 1 → 2개 */ });
test('상한을 넘으면 오래된 것부터 버린다', () => { /* MAX_RECORDS + 10 → 100개, 최신 우선 */ });
test('같은 questionId는 쌓이지 않고 갱신된다', () => { /* 같은 문항 3번 → 1개 */ });
test('IQ 오답을 questionId만으로 복원하면 원래 문항과 같다', () => {
  // 계획 3의 왕복 계약이 실제로 오답노트에서 성립하는지
});
test('없는 생성기·없는 문항은 undefined를 주고 크래시하지 않는다', () => {});
```

---

## Task 2 — 성적표 · 오답노트 화면

**Files:** `app/(tabs)/records.tsx`, `app/(tabs)/notes.tsx`, `src/ui/RecordRow.tsx`
**Test:** `__tests__/screens/records.test.tsx`, `__tests__/screens/notes.test.tsx`

두 화면 다 **기존 빈 상태 문구를 유지**한다(기록이 없을 때). 지금 있는 문구가 그대로 나와야 한다.

### 성적표 (`records.tsx`)

시험별로 묶어서 보여준다. 각 줄: 시험 이름 · 응시 일시 · 결과 요약.

- 정답형: `8급 · 찍기의 장인 · 20문항 중 5개` (+ IQ면 `추정 점수 89`)
- 축 합계형: `ENFP · <별명>`
- 득표형: `<유형 이름>`

**IQ 추정 점수를 표시하는 자리에는 안내 문구를 함께 둔다.** 계획 3에서 "점수를 꺼내면 문구가 같이 손에 들어온다"를 결과 타입으로 강제했는데, 성적표는 저장된 값을 읽으므로 그 강제가 닿지 않는다. **화면 하단에 한 번 표시하고, 테스트로 못박는다.**

맨 아래에 `기록 지우기` 버튼(확인 후 삭제).

### 오답노트 (`notes.tsx`)

시험별 묶음. 각 항목을 누르면 펼쳐서 **문제 · 내가 고른 것 · 정답 · 해설**을 보여준다 — 해설 화면과 같은 형태이므로 `app/test/iq/review.tsx`의 표현을 참고한다. 도형 문항은 `SvgFigure`, 텍스트 문항은 글자.

**복원 실패한 항목은 목록에서 빠진다.** 자리만 차지하는 빈 줄을 남기지 않는다.

### 필수 테스트

```ts
test('기록이 없으면 기존 빈 상태 문구가 나온다', () => {});
test('IQ 추정 점수를 보여주는 화면은 안내 문구도 보여준다', () => {
  // 점수 testID와 문구 testID가 함께 있는지 — 계획 3의 규칙을 성적표에도 적용
});
test('복원 실패한 오답 항목은 목록에 나오지 않는다', () => {});
test('도형 오답은 도형으로, 텍스트 오답은 글자로 보여준다', () => {});
```

---

## 완료 조건

- [ ] `npx jest` 전체 통과 (기존 370개 + 신규)
- [ ] `npx tsc --noEmit` 클린
- [ ] `npm run validate:content` 통과
- [ ] 사용자 노출 권한 0개 유지 (AsyncStorage 추가 후 재확인)
- [ ] 실기기 확인은 **사용자가 요청할 때** 진행 — 지금은 하지 않는다
