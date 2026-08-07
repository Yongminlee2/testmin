import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import IqIntroScreen from '../../app/test/iq/intro';
import { useSession } from '@/store/session';
import { IQ_DRAW } from '@/content/registry';
import { IQ_DISCLAIMER } from '@/engine/iq/iqScore';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

beforeEach(() => {
  mockPush.mockClear();
  useSession.getState().reset();
});

describe('IqIntroScreen', () => {
  test('응시하기를 누르면 IQ_DRAW.questionCount개 문항이 세션에 담기고 퀴즈로 이동한다', async () => {
    await render(<IqIntroScreen />);
    await fireEvent.press(screen.getByTestId('begin'));

    const state = useSession.getState();
    expect(state.testId).toBe('iq');
    expect(state.variant).toBe('default');
    expect(state.questions).toHaveLength(IQ_DRAW.questionCount);
    expect(mockPush).toHaveBeenCalledWith('/test/iq/quiz');
  });

  // 응시 전에 이 점수가 실제 지능검사가 아니라는 것을 미리 밝힌다 —
  // 결과 화면에서 처음 보는 것보다 정직하다.
  test('응시 전에 안내 문구를 미리 보여준다', async () => {
    await render(<IqIntroScreen />);
    expect(screen.getByText(IQ_DISCLAIMER)).toBeTruthy();
  });
});
