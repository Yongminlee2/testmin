import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import RecordsScreen from '../../app/(tabs)/records';
import { useHistory } from '@/store/history';
import { IQ_DISCLAIMER } from '@/engine/iq/iqScore';
import type { TestRecord } from '@/engine/records';

function rec(partial: Partial<TestRecord> & Pick<TestRecord, 'testId' | 'variant' | 'result'>): TestRecord {
  return {
    id: `r-${Math.random().toString(36).slice(2, 8)}`,
    seed: 1,
    completedAt: 1_700_000_000_000,
    ...partial,
  };
}

beforeEach(() => {
  useHistory.setState({ records: [], notes: [], loaded: true });
});

describe('RecordsScreen', () => {
  test('기록이 없으면 기존 빈 상태 문구가 나온다', async () => {
    await render(<RecordsScreen />);
    expect(screen.getByText('아직 기록이 없습니다. 응시하면 여기에 쌓입니다.')).toBeTruthy();
  });

  // ★ IQ 추정 점수가 근거 없는 수치라는 걸 안내 문구 없이 보여주면 안 된다.
  // 계획 3에서 결과 화면에 강제했던 규칙을 성적표에도 그대로 못박는다.
  test('IQ 추정 점수를 보여주는 화면은 안내 문구도 보여준다', async () => {
    useHistory.setState({
      records: [
        rec({
          testId: 'iq',
          variant: 'default',
          result: { kind: 'scored', correct: 5, total: 20, grade: 8, title: '찍기의 장인', estimatedScore: 89 },
        }),
      ],
      notes: [],
      loaded: true,
    });

    await render(<RecordsScreen />);
    expect(screen.getByText(/추정 점수 89/)).toBeTruthy();
    expect(screen.getByTestId('records-iq-disclaimer')).toBeTruthy();
    expect(screen.getByText(IQ_DISCLAIMER)).toBeTruthy();
  });

  test('IQ가 아닌 정답형 결과는 급수·칭호·문항수만 보여주고 안내 문구는 없다', async () => {
    useHistory.setState({
      records: [
        rec({
          testId: 'dialect',
          variant: 'gyeongsang',
          result: { kind: 'scored', correct: 5, total: 20, grade: 8, title: '찍기의 장인' },
        }),
      ],
      notes: [],
      loaded: true,
    });

    await render(<RecordsScreen />);
    expect(screen.getByText('8급 · 찍기의 장인 · 20문항 중 5개')).toBeTruthy();
    expect(screen.queryByTestId('records-iq-disclaimer')).toBeNull();
  });

  test('축 합계형 결과는 코드와 별명을 보여준다', async () => {
    useHistory.setState({
      records: [
        rec({
          testId: 'personality',
          variant: 'default',
          result: { kind: 'axis', code: 'ENFP', nickname: '자유로운 영혼' },
        }),
      ],
      notes: [],
      loaded: true,
    });

    await render(<RecordsScreen />);
    expect(screen.getByText('ENFP · 자유로운 영혼')).toBeTruthy();
  });

  test('득표형 결과는 유형 이름을 보여준다', async () => {
    useHistory.setState({
      records: [
        rec({
          testId: 'psych',
          variant: 'love',
          result: { kind: 'vote', typeId: 'flame', typeName: '불꽃형' },
        }),
      ],
      notes: [],
      loaded: true,
    });

    await render(<RecordsScreen />);
    expect(screen.getByText('불꽃형')).toBeTruthy();
  });

  test('기록 지우기 버튼을 누르면 확인 후에만 기록을 지운다', async () => {
    useHistory.setState({
      records: [
        rec({
          testId: 'dialect',
          variant: 'gyeongsang',
          result: { kind: 'scored', correct: 1, total: 1, grade: 1, title: '1급' },
        }),
      ],
      notes: [],
      loaded: true,
    });

    // 확인창을 띄우기만 하고 아무 버튼도 누르지 않은 상태를 흉내낸다 — 이 시점엔
    // 아직 기록이 남아 있어야 한다.
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await render(<RecordsScreen />);
    await fireEvent.press(screen.getByTestId('clear-all'));

    expect(alertSpy).toHaveBeenCalled();
    expect(useHistory.getState().records).toHaveLength(1);

    // 이제 실제로 "지우기" 버튼을 눌렀을 때 전달되는 onPress를 실행해 확정 삭제를 확인한다.
    const buttons = alertSpy.mock.calls[0]?.[2];
    const confirmButton = buttons?.find((b) => b.text === '지우기');
    await act(async () => {
      confirmButton?.onPress?.();
    });

    expect(useHistory.getState().records).toEqual([]);
    alertSpy.mockRestore();
  });
});
