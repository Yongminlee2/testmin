import { addRecord, parseRecords, MAX_RECORDS } from '@/engine/records';
import type { RecordResult, TestRecord } from '@/engine/records';

function scored(overrides: Partial<TestRecord> = {}): TestRecord {
  const result: RecordResult = {
    kind: 'scored',
    correct: 8,
    total: 12,
    grade: 3,
    title: '3급',
  };
  return {
    id: 'r1',
    testId: 'dialect',
    variant: 'gyeongsang',
    seed: 123,
    completedAt: 1000,
    result,
    ...overrides,
  };
}

function axisRecord(overrides: Partial<TestRecord> = {}): TestRecord {
  const result: RecordResult = { kind: 'axis', code: 'ENFP', nickname: '자유로운 영혼' };
  return {
    id: 'r2',
    testId: 'personality',
    variant: 'default',
    seed: 456,
    completedAt: 2000,
    result,
    ...overrides,
  };
}

function voteRecord(overrides: Partial<TestRecord> = {}): TestRecord {
  const result: RecordResult = { kind: 'vote', typeId: 'romantic', typeName: '로맨티스트' };
  return {
    id: 'r3',
    testId: 'psych',
    variant: 'love',
    seed: 789,
    completedAt: 3000,
    result,
    ...overrides,
  };
}

describe('parseRecords', () => {
  test('저장 데이터가 깨져 있어도 빈 목록을 주고 throw 하지 않는다', () => {
    const badInputs: unknown[] = [
      null,
      undefined,
      0,
      'x',
      [],
      [1, 2],
      [{}],
      [{ id: 'a' }],
      '{"broken":',
    ];
    for (const bad of badInputs) {
      expect(() => parseRecords(bad)).not.toThrow();
      expect(Array.isArray(parseRecords(bad))).toBe(true);
    }
  });

  test('항목 하나가 망가져도 나머지는 살아남는다', () => {
    const good1 = scored({ id: 'good-1' });
    const good2 = axisRecord({ id: 'good-2' });
    const broken = { id: 'broken', testId: 'dialect' }; // completedAt, result 없음
    const raw = [good1, broken, good2];

    const parsed = parseRecords(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed.map((r) => r.id)).toEqual(['good-1', 'good-2']);
  });

  test('정상 데이터는 그대로 복원된다 (scored/axis/vote 세 가지 모두)', () => {
    const raw = [scored(), axisRecord(), voteRecord()];
    // JSON 왕복을 거쳐도(AsyncStorage에 실제로 저장되는 경로와 동일) 안전해야 한다.
    const roundTripped = JSON.parse(JSON.stringify(raw));
    const parsed = parseRecords(roundTripped);
    expect(parsed).toEqual(raw);
  });

  test('result.kind가 없거나 알 수 없는 값이면 그 항목만 버린다', () => {
    const withNoKind = { ...scored({ id: 'no-kind' }), result: { correct: 1 } };
    const withUnknownKind = { ...scored({ id: 'unknown-kind' }), result: { kind: 'mystery' } };
    const good = scored({ id: 'good' });
    const parsed = parseRecords([withNoKind, withUnknownKind, good]);
    expect(parsed).toEqual([good]);
  });

  test('result 내부 필드가 잘못된 타입이면 그 항목만 버린다', () => {
    const badScored = { ...scored({ id: 'bad' }), result: { kind: 'scored', correct: 'many', total: 12, grade: 3, title: '3급' } };
    const good = scored({ id: 'good' });
    const parsed = parseRecords([badScored, good]);
    expect(parsed).toEqual([good]);
  });

  test('배열이 아닌 값(객체 하나)이 오면 빈 배열을 준다', () => {
    expect(parseRecords(scored())).toEqual([]);
  });
});

describe('addRecord', () => {
  test('새 기록이 맨 앞에 들어간다', () => {
    const list = [scored({ id: 'old' })];
    const next = addRecord(list, scored({ id: 'new' }));
    expect(next.map((r) => r.id)).toEqual(['new', 'old']);
  });

  test('상한을 넘으면 오래된 것부터 버린다', () => {
    let list: TestRecord[] = [];
    const total = MAX_RECORDS + 10;
    for (let i = 0; i < total; i++) {
      list = addRecord(list, scored({ id: `r${i}`, completedAt: i }));
    }

    expect(list).toHaveLength(MAX_RECORDS);
    // 최신 우선: 마지막에 넣은 것이 맨 앞
    expect(list[0]?.id).toBe(`r${total - 1}`);
    // 가장 오래된 10개(r0~r9)는 버려졌다
    for (let i = 0; i < 10; i++) {
      expect(list.find((r) => r.id === `r${i}`)).toBeUndefined();
    }
    // r10부터는 살아있다
    expect(list.find((r) => r.id === 'r10')).toBeDefined();
  });

  test('원본 배열을 변형하지 않는다', () => {
    const list = [scored({ id: 'a' })] as const;
    const before = [...list];
    addRecord(list, scored({ id: 'b' }));
    expect(list).toEqual(before);
  });
});
