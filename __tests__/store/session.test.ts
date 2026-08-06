import { useSession } from '@/store/session';

const questions = [
  { id: 'a', kind: 'scored' as const, prompt: 'a', choices: [{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }], answerIndex: 0, explanation: 'x', difficulty: 1 as const },
  { id: 'b', kind: 'scored' as const, prompt: 'b', choices: [{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }], answerIndex: 1, explanation: 'x', difficulty: 1 as const },
];

beforeEach(() => {
  useSession.getState().reset();
});

describe('useSession', () => {
  test('시작하면 문항이 담기고 응답은 비어 있다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 123, questions);
    const s = useSession.getState();
    expect(s.testId).toBe('dialect');
    expect(s.variant).toBe('gyeongsang');
    expect(s.seed).toBe(123);
    expect(s.questions).toHaveLength(2);
    expect(s.answers).toEqual([]);
  });

  test('답을 고르면 순서대로 쌓인다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 123, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 2);
    expect(useSession.getState().answers).toEqual([
      { questionId: 'a', chosenIndex: 0 },
      { questionId: 'b', chosenIndex: 2 },
    ]);
  });

  test('같은 문항에 다시 답하면 덮어쓴다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 123, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('a', 3);
    expect(useSession.getState().answers).toEqual([{ questionId: 'a', chosenIndex: 3 }]);
  });

  test('reset하면 비워진다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 123, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().reset();
    expect(useSession.getState().questions).toEqual([]);
    expect(useSession.getState().answers).toEqual([]);
    expect(useSession.getState().testId).toBeNull();
  });
});
