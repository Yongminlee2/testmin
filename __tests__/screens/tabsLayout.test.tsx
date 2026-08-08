import React from 'react';
import { render } from '@testing-library/react-native';
import TabsLayout from '../../app/(tabs)/_layout';
import { MIN_TAB_BAR_BOTTOM_GAP, TAB_BAR_CONTENT_HEIGHT } from '@/ui/tabBarMetrics';

let mockCapturedOptions: Record<string, unknown> | undefined;

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Tabs = ({ screenOptions, children }: { screenOptions: Record<string, unknown>; children: React.ReactNode }) => {
    mockCapturedOptions = screenOptions;
    return React.createElement(View, null, children);
  };
  Tabs.Screen = () => null;
  return { Tabs };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('TabsLayout 하단 안전영역', () => {
  beforeEach(() => {
    mockCapturedOptions = undefined;
  });

  test('기기가 bottom inset을 0으로 줘도 탭 라벨 아래 최소 공간을 적용한다', async () => {
    await render(<TabsLayout />);

    expect(mockCapturedOptions).toBeDefined();
    expect(mockCapturedOptions?.tabBarStyle).toMatchObject({
      height: TAB_BAR_CONTENT_HEIGHT + MIN_TAB_BAR_BOTTOM_GAP,
      paddingBottom: MIN_TAB_BAR_BOTTOM_GAP,
    });
    expect(mockCapturedOptions?.tabBarLabelStyle).toMatchObject({ lineHeight: 16 });
    expect(mockCapturedOptions?.tabBarAllowFontScaling).toBe(false);
  });
});
