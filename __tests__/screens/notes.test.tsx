import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import NotesScreen from '../../app/(tabs)/notes';
import { useHistory } from '@/store/history';
import { GENERATORS } from '@/engine/iq/generators';
import { getPool } from '@/content/registry';
import type { WrongNote } from '@/engine/notes';

beforeEach(() => {
  useHistory.setState({ records: [], notes: [], loaded: true });
});

describe('NotesScreen', () => {
  test('틀린 문제가 없으면 기존 빈 상태 문구가 나온다', async () => {
    await render(<NotesScreen />);
    expect(screen.getByText('틀린 문제가 없습니다. 응시하면 여기에 모입니다.')).toBeTruthy();
  });

  test('복원 실패한 오답 항목만 있으면 빈 상태 문구가 나온다(자리를 남기지 않는다)', async () => {
    const note: WrongNote = {
      testId: 'iq',
      variant: 'default',
      questionId: 'iq-doesnotexist-5',
      chosenIndex: 0,
      answerIndex: 1,
      addedAt: 1000,
    };
    useHistory.setState({ records: [], notes: [note], loaded: true });

    await render(<NotesScreen />);
    expect(screen.getByText('틀린 문제가 없습니다. 응시하면 여기에 모입니다.')).toBeTruthy();
  });

  test('복원 실패한 항목은 목록에 나오지 않는다(복원 가능한 항목과 섞여 있어도)', async () => {
    const pool = getPool('dialect', 'gyeongsang');
    const first = pool[0];
    if (first === undefined) throw new Error('테스트 전제: 경상도 풀에 문항이 있어야 한다');

    const goodNote: WrongNote = {
      testId: 'dialect',
      variant: 'gyeongsang',
      questionId: first.id,
      chosenIndex: 1,
      answerIndex: first.answerIndex ?? 0,
      addedAt: 1000,
    };
    const badNote: WrongNote = {
      testId: 'dialect',
      variant: 'gyeongsang',
      questionId: 'dialect-gs-9999-없음',
      chosenIndex: 0,
      answerIndex: 0,
      addedAt: 2000,
    };
    useHistory.setState({ records: [], notes: [badNote, goodNote], loaded: true });

    await render(<NotesScreen />);
    expect(screen.getByText(first.prompt)).toBeTruthy();
    expect(screen.queryByText('틀린 문제가 없습니다. 응시하면 여기에 모입니다.')).toBeNull();
    // 복원 가능한 항목 하나만 목록에 실제로 그려졌는지까지 못박는다 — 실패한 항목이
    // 자리를 차지하며 같이 그려지는 회귀를 잡으려면 "좋은 항목이 보인다"만으로는 부족하다.
    expect(screen.getAllByTestId(/^note-row-/)).toHaveLength(1);
  });

  test('펼치기 전에는 해설이 보이지 않는다', async () => {
    const pool = getPool('dialect', 'gyeongsang');
    const first = pool[0];
    if (first === undefined) throw new Error('테스트 전제: 경상도 풀에 문항이 있어야 한다');

    const note: WrongNote = {
      testId: 'dialect',
      variant: 'gyeongsang',
      questionId: first.id,
      chosenIndex: 1,
      answerIndex: first.answerIndex ?? 0,
      addedAt: 1000,
    };
    useHistory.setState({ records: [], notes: [note], loaded: true });

    await render(<NotesScreen />);
    expect(screen.queryByText(first.explanation ?? '')).toBeNull();
  });

  test('텍스트 오답은 펼치면 문제·내가 고른 것·정답·해설을 글자로 보여준다', async () => {
    const pool = getPool('dialect', 'gyeongsang');
    const first = pool[0];
    if (first === undefined) throw new Error('테스트 전제: 경상도 풀에 문항이 있어야 한다');
    const answerIndex = first.answerIndex ?? 0;
    const wrongIndex = answerIndex === 0 ? 1 : 0;

    const note: WrongNote = {
      testId: 'dialect',
      variant: 'gyeongsang',
      questionId: first.id,
      chosenIndex: wrongIndex,
      answerIndex,
      addedAt: 1000,
    };
    useHistory.setState({ records: [], notes: [note], loaded: true });

    const key = `dialect:gyeongsang:${first.id}`;
    await render(<NotesScreen />);
    await fireEvent.press(screen.getByTestId(`note-row-${key}`));

    expect(screen.getByText(first.explanation ?? '')).toBeTruthy();
    expect(screen.getByTestId(`note-chosen-${key}`)).toBeTruthy();
    expect(screen.getByTestId(`note-answer-${key}`)).toBeTruthy();
    const chosenText = first.choices[wrongIndex]?.text ?? '';
    const answerText = first.choices[answerIndex]?.text ?? '';
    expect(screen.getByText(chosenText)).toBeTruthy();
    expect(screen.getByText(answerText)).toBeTruthy();
  });

  test('도형 오답은 펼치면 문제·내가 고른 것·정답을 도형으로 보여준다', async () => {
    const gen = GENERATORS.find((g) => g.id === 'rotation');
    if (gen === undefined) throw new Error('테스트 전제: rotation 생성기가 등록되어 있어야 한다');
    const generated = gen.generate(999);
    const answerIndex = generated.question.answerIndex ?? 0;
    const wrongIndex = answerIndex === 0 ? 1 : 0;

    const note: WrongNote = {
      testId: 'iq',
      variant: 'default',
      questionId: generated.question.id,
      chosenIndex: wrongIndex,
      answerIndex,
      addedAt: 1000,
    };
    useHistory.setState({ records: [], notes: [note], loaded: true });

    const key = `iq:default:${generated.question.id}`;
    await render(<NotesScreen />);
    expect(screen.getByTestId(`note-preview-figure-${key}`)).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`note-row-${key}`));

    expect(screen.queryByTestId(`note-preview-figure-${key}`)).toBeNull();
    expect(screen.getByTestId(`note-question-figure-${key}`)).toBeTruthy();
    expect(screen.getByTestId(`note-chosen-${key}`)).toBeTruthy();
    expect(screen.getByTestId(`note-answer-${key}`)).toBeTruthy();
    expect(screen.getByText(generated.question.explanation ?? '')).toBeTruthy();
  });
});
