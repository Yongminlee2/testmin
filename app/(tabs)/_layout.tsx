import {
  BottomTabBar,
  type BottomTabBarProps,
} from 'expo-router/build/react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { colors, font } from '@/ui/tokens';
import { TAB_BAR_CONTENT_HEIGHT, tabBarMetrics } from '@/ui/tabBarMetrics';
import { TabBarIcon, type TabBarIconName } from '@/ui/TabBarIcon';

function icon(name: TabBarIconName) {
  return ({ focused, color }: { readonly focused: boolean; readonly color: ColorValue }) => (
    <TabBarIcon name={name} focused={focused} color={color} />
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
      <BottomTabBar
        {...props}
        insets={{ ...props.insets, bottom: 0 }}
      />
    </View>
  );
}

export default function TabsLayout() {
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
        tabBarAllowFontScaling: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '응시',
          headerShown: false,
          tabBarIcon: icon('exam'),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: '성적표', tabBarIcon: icon('records') }}
      />
      <Tabs.Screen
        name="notes"
        options={{ title: '오답노트', tabBarIcon: icon('notes') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '설정', tabBarIcon: icon('settings') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safeShelf: {
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 20,
    height: TAB_BAR_CONTENT_HEIGHT,
    paddingBottom: 4,
    paddingTop: 4,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 2,
    elevation: 3,
  },
  tabBarLabel: {
    fontFamily: font.family.bold,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  tabBarItem: {
    minHeight: 50,
    paddingVertical: 1,
  },
});
