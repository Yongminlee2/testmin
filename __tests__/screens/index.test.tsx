import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// 두 카테고리(하나는 available, 하나는 아님) — 실제 데이터가 나중에 바뀌어도
// "제 경로로 이동하는가"라는 계약 자체를 검증하기 위해 registry를 직접 통제한다.
jest.mock('@/content/registry', () => ({
  CATEGORIES: [
    {
      id: 'dialect',
      title: '사투리 고사',
      subtitle: '6개 지역 · 골라서 응시',
      emoji: '🗣️',
      colorKey: 'dialect',
      questionCount: 12,
      route: '/test/dialect/intro',
      available: true,
    },
    {
      id: 'iq',
      title: 'IQ 고사',
      subtitle: '도형·수열·유추',
      emoji: '🧠',
      colorKey: 'iq',
      questionCount: 20,
      route: '/test/iq/intro',
      available: false,
    },
  ],
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe('HomeScreen', () => {
  test('응시 가능한 카테고리를 누르면 그 카테고리 자신의 경로로 이동한다', async () => {
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByTestId('category-dialect'));
    expect(mockPush).toHaveBeenCalledWith('/test/dialect/intro');
  });

  test('준비 중인 카테고리를 누르면 이동하지 않고 안내만 뜬다', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByTestId('category-iq'));
    expect(mockPush).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
