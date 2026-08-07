/**
 * 오답노트(WrongNote) 데이터 모델과 순수 함수들. 문항 원문이 아니라 참조만 담는다 —
 * 정적 풀은 questionId로 다시 찾고, IQ는 `iq-<generatorId>-<seed>`에서 재생성한다
 * (계획 3의 왕복 계약, src/engine/iq/questionId.ts). 실제 복원은
 * src/store/history.ts의 restoreQuestion이 한다 — content/registry에 의존하므로
 * 순수 엔진인 여기 두면 의존 방향이 뒤집힌다.
 */

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

/**
 * questionId가 같으면 새 것으로 갈아끼운다 — 같은 문제가 쌓이지 않게.
 * added 안에 questionId가 중복되면 마지막 항목이 이긴다. 결과는 added가
 * 앞쪽(최신)에 오고, 상한을 넘으면 오래된 것부터 버린다.
 */
export function addNotes(
  list: readonly WrongNote[],
  added: readonly WrongNote[]
): WrongNote[] {
  const addedById = new Map<string, WrongNote>();
  for (const n of added) addedById.set(n.questionId, n);
  const dedupedAdded = [...addedById.values()];

  const kept = list.filter((n) => !addedById.has(n.questionId));

  return [...dedupedAdded, ...kept].slice(0, MAX_NOTES);
}

/** 항목 하나를 검사한다. 필수 필드가 하나라도 없거나 타입이 틀리면 undefined. */
function parseOneNote(value: unknown): WrongNote | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const r = value as Record<string, unknown>;

  if (typeof r.testId !== 'string') return undefined;
  if (typeof r.variant !== 'string') return undefined;
  if (typeof r.questionId !== 'string') return undefined;
  if (typeof r.chosenIndex !== 'number') return undefined;
  if (typeof r.answerIndex !== 'number') return undefined;
  if (typeof r.addedAt !== 'number') return undefined;

  return {
    testId: r.testId,
    variant: r.variant,
    questionId: r.questionId,
    chosenIndex: r.chosenIndex,
    answerIndex: r.answerIndex,
    addedAt: r.addedAt,
  };
}

/**
 * 저장된 값이 무엇이든 안전하게 WrongNote[]로 만든다. 못 읽는 항목은 버린다.
 * raw가 배열이 아니면 빈 배열을 준다 — 절대 throw 하지 않는다.
 */
export function parseNotes(raw: unknown): WrongNote[] {
  if (!Array.isArray(raw)) return [];

  const out: WrongNote[] = [];
  for (const item of raw) {
    const n = parseOneNote(item);
    if (n !== undefined) out.push(n);
  }
  return out;
}
