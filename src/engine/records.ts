/**
 * 성적표(TestRecord) 데이터 모델과 순수 함수들. React/AsyncStorage에 의존하지 않는다.
 * 저장은 src/store/history.ts + src/store/storage.ts가 맡는다.
 */

/** 세 채점 방식의 결과를 한 모양으로 담는다. 화면이 kind로 분기한다. */
export type RecordResult =
  | {
      readonly kind: 'scored';
      readonly correct: number;
      readonly total: number;
      readonly grade: number;
      readonly title: string;
      /** IQ 전용. 표시하는 화면은 반드시 IQ_DISCLAIMER도 함께 보여줘야 한다 — */
      /** 이 타입은 그 강제를 하지 못한다(계획 3의 IqResult와 달리 disclaimer가 함께 저장되지 않는다). */
      readonly estimatedScore?: number;
    }
  | { readonly kind: 'axis'; readonly code: string; readonly nickname: string }
  | { readonly kind: 'vote'; readonly typeId: string; readonly typeName: string };

export interface TestRecord {
  readonly id: string;
  readonly testId: string;
  readonly variant: string;
  readonly seed: number;
  readonly completedAt: number; // epoch ms
  readonly result: RecordResult;
}

export const MAX_RECORDS = 100;

/** 새 기록을 앞에 넣고 상한을 넘으면 오래된 것부터 버린다. */
export function addRecord(list: readonly TestRecord[], rec: TestRecord): TestRecord[] {
  return [rec, ...list].slice(0, MAX_RECORDS);
}

function isRecordResult(value: unknown): value is RecordResult {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;

  switch (r.kind) {
    case 'scored':
      return (
        typeof r.correct === 'number' &&
        typeof r.total === 'number' &&
        typeof r.grade === 'number' &&
        typeof r.title === 'string' &&
        (r.estimatedScore === undefined || typeof r.estimatedScore === 'number')
      );
    case 'axis':
      return typeof r.code === 'string' && typeof r.nickname === 'string';
    case 'vote':
      return typeof r.typeId === 'string' && typeof r.typeName === 'string';
    default:
      return false;
  }
}

/** 항목 하나를 검사한다. 필수 필드가 하나라도 없거나 타입이 틀리면 undefined. */
function parseOneRecord(value: unknown): TestRecord | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const r = value as Record<string, unknown>;

  if (typeof r.id !== 'string') return undefined;
  if (typeof r.testId !== 'string') return undefined;
  if (typeof r.variant !== 'string') return undefined;
  if (typeof r.seed !== 'number') return undefined;
  if (typeof r.completedAt !== 'number') return undefined;
  if (!isRecordResult(r.result)) return undefined;

  return {
    id: r.id,
    testId: r.testId,
    variant: r.variant,
    seed: r.seed,
    completedAt: r.completedAt,
    result: r.result,
  };
}

/**
 * 저장된 값이 무엇이든 안전하게 TestRecord[]로 만든다. 못 읽는 항목은 버린다.
 * raw가 배열이 아니면(문자열·숫자·null·객체 등) 빈 배열을 준다 — 절대 throw 하지 않는다.
 */
export function parseRecords(raw: unknown): TestRecord[] {
  if (!Array.isArray(raw)) return [];

  const out: TestRecord[] = [];
  for (const item of raw) {
    const rec = parseOneRecord(item);
    if (rec !== undefined) out.push(rec);
  }
  return out;
}
