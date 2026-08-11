import {
  BottomTabBar,
  type BottomTabBarButtonProps,
  type BottomTabBarProps,
} from 'expo-router/build/react-navigation/bottom-tabs';
import { PlatformPressable } from 'expo-router/build/react-navigation/elements';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type ColorValue,
} from 'react-native';
import { colors, font } from '@/ui/tokens';
import {
  WIDE_TAB_BAR_MAX_WIDTH,
  tabBarMetrics,
  tabBarVisualMetrics,
  type TabBarVisualMetrics,
} from '@/ui/tabBarMetrics';
import { TabBarIcon, type TabBarIconName } from '@/ui/TabBarIcon';

function icon(name: TabBarIconName, metrics: TabBarVisualMetrics) {
  return ({ focused, color }: { readonly focused: boolean; readonly color: ColorValue }) => (
    <TabBarIcon
      name={name}
      focused={focused}
      color={color}
      size={metrics.iconSize}
      wrapWidth={metrics.iconWrapWidth}
      wrapHeight={metrics.iconWrapHeight}
    />
  );
}

/** 하단 탭 자체에도 마우스 hover와 터치 press 피드백을 준다. */
function TabButton({
  style,
  onHoverIn,
  onHoverOut,
  onPressIn,
  onPressOut,
  onFocus,
  onBlur,
  ...props
}: BottomTabBarButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <PlatformPressable
      {...props}
      pressColor="rgba(255,212,59,0.26)"
      pressOpacity={1}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        style,
        styles.tabButton,
        hovered && styles.tabButtonHovered,
        pressed && styles.tabButtonPressed,
        focused && styles.tabButtonFocused,
      ]}
    />
  );
}

/**
 * 둥근 탭 바와 안드로이드 시스템 내비게이션 영역을 하나의 배경 선반으로 감싼다.
 * 시스템이 하단 inset을 0으로 잘못 보고하는 구형 기기에서도 최소 여백을 유지한다.
 */
function FloatingTabBar(props: BottomTabBarProps) {
  const metrics = tabBarMetrics(props.insets.bottom);

  return (
    <View
      testID="tab-bar-safe-shelf"
      pointerEvents="box-none"
      style={[
        styles.safeShelf,
        {
          paddingTop: metrics.topGap,
          paddingBottom: metrics.bottomGap,
        },
      ]}
    >
      <View pointerEvents="box-none" style={styles.barFrame}>
        <BottomTabBar
          {...props}
          insets={{ ...props.insets, bottom: 0 }}
        />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { width: viewportWidth } = useWindowDimensions();
  const visual = tabBarVisualMetrics(viewportWidth, Platform.OS === 'web');

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: font.family.black },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarButton: TabButton,
        tabBarAllowFontScaling: false,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          ...styles.tabBar,
          height: visual.contentHeight,
          paddingBottom: visual.verticalPadding,
          paddingTop: visual.verticalPadding,
        },
        tabBarLabelStyle: {
          ...styles.tabBarLabel,
          fontSize: visual.labelFontSize,
          lineHeight: visual.labelLineHeight,
        },
        tabBarItemStyle: {
          ...styles.tabBarItem,
          minHeight: visual.itemMinHeight,
        },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '응시',
          headerShown: false,
          tabBarIcon: icon('exam', visual),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: '성적표', tabBarIcon: icon('records', visual) }}
      />
      <Tabs.Screen
        name="notes"
        options={{ title: '오답노트', tabBarIcon: icon('notes', visual) }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '설정', tabBarIcon: icon('settings', visual) }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safeShelf: {
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
  },
  barFrame: {
    width: '100%',
    maxWidth: WIDE_TAB_BAR_MAX_WIDTH,
    alignSelf: 'center',
  },
  tabBar: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 2,
    elevation: 3,
  },
  tabBarLabel: {
    fontFamily: font.family.bold,
    marginTop: 1,
  },
  tabBarItem: {
    paddingVertical: 1,
  },
  tabButton: {
    borderRadius: 16,
    cursor: 'pointer',
    marginHorizontal: 3,
  },
  tabButtonHovered: {
    backgroundColor: 'rgba(255,212,59,0.16)',
  },
  tabButtonPressed: {
    backgroundColor: 'rgba(255,212,59,0.28)',
    transform: [{ scale: 0.97 }],
  },
  tabButtonFocused: {
    outlineColor: colors.sky,
    outlineOffset: -2,
    outlineStyle: 'solid',
    outlineWidth: 3,
  },
});
