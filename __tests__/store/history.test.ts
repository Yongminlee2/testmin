import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHistory, restoreQuestion } from '@/store/history';
import type { WrongNote } from '@/engine/notes';
import { GENERATORS } from '@/engine/iq/generators';
import { getPool } from '@/content/registry';

// storage.ts가 실제로 쓰는 키. 저장 형태(.v1 접미사로 버전 매김)를 그대로
// 검증하려면 storage.ts와 같은 문자열을 알아야 한다 — export되어 있지 않으므로
// 브리프에 명시된 값을 그대로 쓴다.
const KEY_RECORDS = 'testmin.records.v1';
const KEY_NOTES = 'testmin.notes.v1';

beforeEach(async () => {
  await AsyncStorage.clear();
  useHistory.setState({ records: [], notes: [], loaded: false });
});

describe('useHistory.load', () => {
  test('저장된 게 없으면 빈 목록이고 loaded는 true가 된다', async () => {
    await useHistory.getState().load();
    const s = useHistory.getState();
    expect(s.records).toEqual([]);
    expect(s.notes).toEqual([]);
    expect(s.loaded).toBe(true);
  });

  test('저장된 값을 파싱해서 채운다', async () => {
    const rec = {
      id: 'r1',
      testId: 'dialect',
      variant: 'gyeongsang',
      seed: 1,
      completedAt: 1000,
      result: { kind: 'scored', correct: 5, total: 12, grade: 4, title: '4급' },
    };
    await AsyncStorage.setItem(KEY_RECORDS, JSON.stringify([rec]));
    await useHistory.getState().load();
    expect(useHistory.getState().records).toEqual([rec]);
  });

  test('저장 데이터가 깨져 있어도 크래시하지 않고 빈 목록을 준다', async () => {
    // JSON.parse가 실패하는 문자열을 그대로 넣는다 — storage.ts가 이 단계에서
    // 이미 null로 바꿔주지만, load()가 그 결과를 어떻게 다루는지까지 확인한다.
    await AsyncStorage.setItem(KEY_RECORDS, 'not-json{{{');
    await AsyncStorage.setItem(KEY_NOTES, JSON.stringify([1, 2, { id: 'x' }]));

    await expect(useHistory.getState().load()).resolves.not.toThrow();

    const s = useHistory.getState();
    expect(s.records).toEqual([]);
    expect(s.notes).toEqual([]);
  });
});

describe('useHistory.saveResult', () => {
  test('scored 결과를 records 맨 앞에 추가하고 저장소에도 반영한다', async () => {
    await useHistory.getState().saveResult({
      testId: 'dialect',
      variant: 'gyeongsang',
      seed: 42,
      result: { kind: 'scored', correct: 10, total: 12, grade: 2, title: '2급' },
    });

    const s = useHistory.getState();
    expect(s.records).toHaveLength(1);
    expect(s.records[0]?.testId).toBe('dialect');
    expect(s.records[0]?.result).toEqual({ kind: 'scored', correct: 10, total: 12, grade: 2, title: '2급' });

    // AsyncStorage에도 실제로 쓰였는지 — 재부팅 시나리오를 흉내낸다.
    const raw = await AsyncStorage.getItem(KEY_RECORDS);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toHaveLength(1);
  });

  test('wrong이 있으면 오답노트에도 반영된다', async () => {
    const generated = GENERATORS[0]?.generate(7);
    if (generated === undefined) throw new Error('테스트 전제: IQ 생성기가 있어야 한다');
    const answerIndex = generated.question.answerIndex as number;
    const chosenIndex = answerIndex === 0 ? 1 : 0;
    await useHistory.getState().saveResult({
      testId: 'iq',
      variant: 'default',
      seed: 7,
      result: { kind: 'scored', correct: 1, total: 2, grade: 5, title: '5급', estimatedScore: 100 },
      wrong: [{ questionId: generated.question.id, chosenIndex, answerIndex }],
      questions: [generated.question],
    });

    const s = useHistory.getState();
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0]?.questionId).toBe(generated.question.id);
    expect(s.notes[0]?.choiceOrder).toBe('canonical');

    const raw = await AsyncStorage.getItem(KEY_NOTES);
    expect(JSON.parse(raw as string)).toHaveLength(1);
  });

  test('wrong이 없는 결과(axis·vote)는 오답노트를 건드리지 않는다', async () => {
    const generated = GENERATORS[0]?.generate(7);
    if (generated === undefined) throw new Error('테스트 전제: IQ 생성기가 있어야 한다');
    const answerIndex = generated.question.answerIndex as number;
    const chosenIndex = answerIndex === 0 ? 1 : 0;
    await useHistory.getState().saveResult({
      testId: 'iq',
      variant: 'default',
      seed: 7,
      result: { kind: 'scored', correct: 1, total: 2, grade: 5, title: '5급' },
      wrong: [{ questionId: generated.question.id, chosenIndex, answerIndex }],
      questions: [generated.question],
    });
    await useHistory.getState().saveResult({
      testId: 'personality',
      variant: 'default',
      seed: 8,
      result: { kind: 'axis', code: 'ENFP', nickname: '자유로운 영혼' },
    });

    expect(useHistory.getState().notes).toHaveLength(1);
    expect(useHistory.getState().records).toHaveLength(2);
  });

  test('같은 문항을 다시 틀리면 오답노트가 갱신되고 쌓이지 않는다', async () => {
    const question = getPool('dialect', 'gyeongsang')[0];
    if (question === undefined) throw new Error('테스트 전제: 경상도 문항이 있어야 한다');
    const answerIndex = question.answerIndex as number;
    const firstWrong = answerIndex === 0 ? 1 : 0;
    const secondWrong = [0, 1, 2, 3].find(
      (index) => index !== answerIndex && index !== firstWrong
    );
    if (secondWrong === undefined) throw new Error('테스트 전제: 오답 선택지가 2개 이상이어야 한다');
    await useHistory.getState().saveResult({
      testId: 'dialect',
      variant: 'gyeongsang',
      seed: 1,
      result: { kind: 'scored', correct: 0, total: 1, grade: 9, title: '9급' },
      wrong: [{ questionId: question.id, chosenIndex: firstWrong, answerIndex }],
      questions: [question],
    });
    await useHistory.getState().saveResult({
      testId: 'dialect',
      variant: 'gyeongsang',
      seed: 2,
      result: { kind: 'scored', correct: 0, total: 1, grade: 9, title: '9급' },
      wrong: [{ questionId: question.id, chosenIndex: secondWrong, answerIndex }],
      questions: [question],
    });

    const notes = useHistory.getState().notes;
    expect(notes).toHaveLength(1);
    expect(notes[0]?.chosenIndex).toBe(secondWrong);
  });
});

describe('useHistory.clearAll', () => {
  test('상태와 저장소를 모두 비운다', async () => {
    await useHistory.getState().saveResult({
      testId: 'dialect',
      variant: 'gyeongsang',
      seed: 1,
      result: { kind: 'scored', correct: 1, total: 1, grade: 1, title: '1급' },
      wrong: [],
      questions: [],
    });
    await useHistory.getState().clearAll();

    expect(useHistory.getState().records).toEqual([]);
    expect(useHistory.getState().notes).toEqual([]);

    const rawRecords = await AsyncStorage.getItem(KEY_RECORDS);
    expect(JSON.parse(rawRecords as string)).toEqual([]);
  });
});

describe('restoreQuestion', () => {
  test('IQ 오답을 questionId만으로 복원하면 원래 문항과 같다', () => {
    const gen = GENERATORS[0];
    if (gen === undefined) throw new Error('테스트 전제: 생성기가 최소 1개 등록되어 있어야 한다');

    const generated = gen.generate(999);
    const note: WrongNote = {
      testId: 'iq',
      variant: 'default',
      questionId: generated.question.id,
      chosenIndex: 0,
      answerIndex: 1,
      addedAt: Date.now(),
    };

    const restored = restoreQuestion(note);
    expect(restored).toEqual(generated.question);
  });

  test('정적 풀 오답은 id로 찾아 복원한다', () => {
    const pool = getPool('dialect', 'gyeongsang');
    const first = pool[0];
    if (first === undefined) throw new Error('테스트 전제: 경상도 풀에 문항이 있어야 한다');

    const note: WrongNote = {
      testId: 'dialect',
      variant: 'gyeongsang',
      questionId: first.id,
      chosenIndex: 0,
      answerIndex: first.answerIndex ?? 0,
      addedAt: Date.now(),
    };

    expect(restoreQuestion(note)).toEqual(first);
  });

  test('없는 생성기를 가리키면 undefined를 주고 크래시하지 않는다', () => {
    const note: WrongNote = {
      testId: 'iq',
      variant: 'default',
      questionId: 'iq-doesnotexist-5',
      chosenIndex: 0,
      answerIndex: 1,
      addedAt: Date.now(),
    };
    expect(() => restoreQuestion(note)).not.toThrow();
    expect(restoreQuestion(note)).toBeUndefined();
  });

  test('형식이 깨진 IQ questionId는 undefined를 준다', () => {
    const note: WrongNote = {
      testId: 'iq',
      variant: 'default',
      questionId: 'not-an-iq-id',
      chosenIndex: 0,
      answerIndex: 1,
      addedAt: Date.now(),
    };
    expect(restoreQuestion(note)).toBeUndefined();
  });

  test('풀에 없는 questionId는 undefined를 준다', () => {
    const note: WrongNote = {
      testId: 'dialect',
      variant: 'gyeongsang',
      questionId: 'dialect-gs-9999-does-not-exist',
      chosenIndex: 0,
      answerIndex: 0,
      addedAt: Date.now(),
    };
    expect(restoreQuestion(note)).toBeUndefined();
  });
});
