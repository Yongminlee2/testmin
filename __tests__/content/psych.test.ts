import love from '@/content/psych/love.json';
import stress from '@/content/psych/stress.json';
import comm from '@/content/psych/comm.json';
import recharge from '@/content/psych/recharge.json';
import procrastination from '@/content/psych/procrastination.json';
import travel from '@/content/psych/travel.json';

interface PsychType { id: string; name: string; emoji: string; description: string }
interface PsychChoice { text: string; typeId: string }
interface PsychQuestion {
  id: string; kind: string; prompt: string;
  choices: PsychChoice[]; explanation: string; difficulty: number;
}
interface PsychTest { id: string; title: string; types: PsychType[]; questions: PsychQuestion[] }

const tests: PsychTest[] = [
  love,
  stress,
  comm,
  recharge,
  procrastination,
  travel,
] as unknown as PsychTest[];

describe.each(tests.map((t) => [t.id, t] as const))('심리 테스트 %s', (_id, psychTest) => {
  test('유형이 5개이고 id가 중복되지 않는다', () => {
    expect(psychTest.types).toHaveLength(5);
    expect(new Set(psychTest.types.map((t) => t.id)).size).toBe(5);
  });

  test('모든 유형에 이름·이모지·설명이 있다', () => {
    for (const t of psychTest.types) {
      expect(t.name.trim().length).toBeGreaterThan(0);
      expect(t.emoji.trim().length).toBeGreaterThan(0);
      expect(t.description.trim().length).toBeGreaterThan(0);
    }
  });

  test('문항이 12개이고 id가 중복되지 않는다', () => {
    expect(psychTest.questions).toHaveLength(12);
    expect(new Set(psychTest.questions.map((q) => q.id)).size).toBe(12);
  });

  test('모든 문항이 typed이고 선택지가 4개다', () => {
    for (const q of psychTest.questions) {
      expect(q.kind).toBe('typed');
      expect(q.choices).toHaveLength(4);
    }
  });

  test('한 문항 안에서 같은 유형에 두 번 투표하지 않는다', () => {
    for (const q of psychTest.questions) {
      expect(new Set(q.choices.map((c) => c.typeId)).size).toBe(4);
    }
  });

  test('모든 선택지의 typeId가 정의된 유형 중 하나다', () => {
    const ids = new Set(psychTest.types.map((t) => t.id));
    for (const q of psychTest.questions) {
      for (const c of q.choices) expect(ids.has(c.typeId)).toBe(true);
    }
  });

  test('유형별 득표 기회가 균등하다 (최대-최소 차이 1 이하)', () => {
    const counts = new Map<string, number>();
    for (const t of psychTest.types) counts.set(t.id, 0);
    for (const q of psychTest.questions) {
      for (const c of q.choices) counts.set(c.typeId, (counts.get(c.typeId) ?? 0) + 1);
    }
    const values = [...counts.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });

  test('모든 문항에 해설이 있고 선택지 텍스트가 비어 있지 않다', () => {
    for (const q of psychTest.questions) {
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      for (const c of q.choices) expect(c.text.trim().length).toBeGreaterThan(0);
    }
  });

  test('정답형 필드가 섞여 있지 않다', () => {
    for (const q of psychTest.questions) {
      expect((q as unknown as Record<string, unknown>)['answerIndex']).toBeUndefined();
    }
  });
});
