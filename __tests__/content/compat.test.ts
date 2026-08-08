import typeNames from '@/content/typeNames.json';
import love from '@/content/psych/love.json';
import stress from '@/content/psych/stress.json';
import comm from '@/content/psych/comm.json';
import type { CompatLink } from '@/engine/types';

/**
 * 궁합 데이터(goodWith/hardWith)가 있는 콘텐츠 4벌(성격 16유형 + 심리 3종)을
 * 같은 규칙으로 검증한다. 전에는 이 검증을 세션 안에서 손으로 한 번 하고
 * 끝냈는데, 자동 검사가 없으면 다음에 유형을 추가하거나 코드를 고칠 때
 * "존재하지 않는 유형을 궁합으로 가리킨다"나 "자기 자신과 잘 맞는다고 나온다"
 * 같은 결함이 조용히 들어와도 아무도 못 잡는다.
 */

interface CompatEntry {
  readonly id: string;
  readonly goodWith: readonly CompatLink[];
  readonly hardWith: CompatLink;
}

interface Suite {
  readonly name: string;
  readonly entries: readonly CompatEntry[];
  /** goodWith 배열의 기대 길이. 성격은 2, 심리 5유형도 2(오각형 이웃). */
  readonly goodWithCount: number;
}

const personalityEntries = (typeNames as unknown as Array<{
  code: string;
  goodWith: readonly CompatLink[];
  hardWith: CompatLink;
}>).map((t) => ({ id: t.code, goodWith: t.goodWith, hardWith: t.hardWith }));

function psychEntries(raw: unknown): CompatEntry[] {
  const d = raw as { types: Array<{ id: string; goodWith: CompatLink[]; hardWith: CompatLink }> };
  return d.types.map((t) => ({ id: t.id, goodWith: t.goodWith, hardWith: t.hardWith }));
}

const SUITES: readonly Suite[] = [
  { name: '성격 16유형', entries: personalityEntries, goodWithCount: 2 },
  { name: '심리 · 연애 성향', entries: psychEntries(love), goodWithCount: 2 },
  { name: '심리 · 스트레스 반응', entries: psychEntries(stress), goodWithCount: 2 },
  { name: '심리 · 소통 유형', entries: psychEntries(comm), goodWithCount: 2 },
];

describe.each(SUITES)('$name 궁합 데이터', ({ entries, goodWithCount }) => {
  const ids = new Set(entries.map((e) => e.id));

  test(`모든 유형이 goodWith 정확히 ${goodWithCount}개를 가진다`, () => {
    for (const e of entries) {
      expect(e.goodWith).toHaveLength(goodWithCount);
    }
  });

  test('goodWith·hardWith가 가리키는 코드가 전부 실제 유형이다', () => {
    for (const e of entries) {
      for (const g of e.goodWith) {
        expect(ids.has(g.code)).toBe(true);
      }
      expect(ids.has(e.hardWith.code)).toBe(true);
    }
  });

  // ★ 자기 자신을 궁합 상대로 가리키면 "나와 나는 잘 맞는다"는 무의미한 결과가 나온다.
  test('어떤 유형도 자기 자신을 궁합 상대로 가리키지 않는다', () => {
    for (const e of entries) {
      for (const g of e.goodWith) {
        expect(g.code).not.toBe(e.id);
      }
      expect(e.hardWith.code).not.toBe(e.id);
    }
  });

  test('goodWith 안에서 같은 유형이 중복되지 않는다', () => {
    for (const e of entries) {
      const codes = e.goodWith.map((g) => g.code);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  test('모든 이유(why)가 비어 있지 않고, 한 유형 안에서 서로 다른 문장이다', () => {
    for (const e of entries) {
      const whys = [...e.goodWith.map((g) => g.why), e.hardWith.why];
      for (const why of whys) {
        expect(why.trim().length).toBeGreaterThan(0);
      }
      // 같은 유형의 이유 문장이 토씨 하나 안 틀리고 겹치면 복붙 자리 채우기를 의심한다.
      expect(new Set(whys).size).toBe(whys.length);
    }
  });
});
