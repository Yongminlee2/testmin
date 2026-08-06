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
