import React from 'react';
import { render } from '@testing-library/react-native';
import TabsLayout from '../../app/(tabs)/_layout';
import { TAB_BAR_CONTENT_HEIGHT } from '@/ui/tabBarMetrics';

let mockCapturedOptions: Record<string, unknown> | undefined;

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Tabs = ({
    screenOptions,
    children,
  }: {
    screenOptions: Record<string, unknown>;
    children: React.ReactNode;
  }) => {
    mockCapturedOptions = screenOptions;
    return React.createElement(View, null, children);
  };
  Tabs.Screen = () => null;
  return { Tabs };
});

jest.mock('expo-router/build/react-navigation/bottom-tabs', () => ({
  BottomTabBar: () => null,
}));

describe('TabsLayout 하단 내비게이션', () => {
  beforeEach(() => {
    mockCapturedOptions = undefined;
  });

  test('안전 영역 선반과 가벼운 둥근 탭 바를 사용한다', async () => {
    await render(<TabsLayout />);

    expect(mockCapturedOptions).toBeDefined();
    expect(mockCapturedOptions?.tabBarStyle).toMatchObject({
      height: TAB_BAR_CONTENT_HEIGHT,
      borderRadius: 20,
      borderWidth: 1.5,
      elevation: 3,
    });
    expect(mockCapturedOptions?.tabBarStyle).not.toHaveProperty('marginBottom');
    expect(mockCapturedOptions?.tabBarLabelStyle).toMatchObject({ lineHeight: 13 });
    expect(mockCapturedOptions?.tabBarItemStyle).toMatchObject({ minHeight: 50 });
    expect(mockCapturedOptions?.tabBarAllowFontScaling).toBe(false);
    expect(mockCapturedOptions?.tabBarLabelPosition).toBe('below-icon');
  });
});
