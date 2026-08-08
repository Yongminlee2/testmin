import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font } from '@/ui/tokens';
import { tabBarMetrics } from '@/ui/tabBarMetrics';

/**
 * 탭 아이콘은 이모지 한 글자로만 그린다. 번들 한글 폰트(Black Han Sans,
 * Noto Sans KR)에는 이모지 글리프가 없어서 fontFamily를 지정하면 빈 네모(tofu)가
 * 뜬다 — 그래서 이 Text에는 커스텀 fontFamily를 절대 주지 않는다.
 */
function TabIcon({ emoji }: { readonly emoji: string }) {
  return <Text style={styles.icon}>{emoji}</Text>;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBar = tabBarMetrics(insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: font.family.black },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        // 시스템 글자 크기가 큰 기기에서도 네 개 탭의 라벨만 커져 시스템 바와
        // 겹치지 않게 한다. 본문 텍스트는 각 컴포넌트의 maxScale 규칙을 그대로 따른다.
        tabBarAllowFontScaling: false,
        // 보고된 안전영역을 높이와 패딩에 직접 더한다. 구형 Android에서 inset을
        // 잘못 0으로 주는 경우에도 tabBarMetrics가 최소 12dp를 확보한다.
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopWidth: 2.5,
          borderTopColor: colors.ink,
          height: tabBar.height,
          paddingBottom: tabBar.bottomPadding,
          paddingTop: 6,
        },
        // Android 버전별 시스템 폰트 메트릭에 맡기지 않는다. Noto Sans KR의
        // 받침까지 16dp 줄 안에 들어오게 해 내비게이션 바 경계에서 잘리지 않게 한다.
        tabBarLabelStyle: {
          fontFamily: font.family.bold,
          fontSize: 11,
          lineHeight: 16,
        },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '응시',
          // 홈 화면은 본문에 "테스트의 민족" 제목을 이미 갖고 있고, 같은 이름이
          // 하단 탭에도 있다. 헤더까지 두면 같은 말이 화면에 세 번 나오면서
          // 세로 153px을 먹어 첫 카드가 화면의 22% 지점에서야 시작했다.
          headerShown: false,
          tabBarIcon: () => <TabIcon emoji="📝" />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: '성적표', tabBarIcon: () => <TabIcon emoji="📊" /> }}
      />
      <Tabs.Screen
        name="notes"
        options={{ title: '오답노트', tabBarIcon: () => <TabIcon emoji="✏️" /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '설정', tabBarIcon: () => <TabIcon emoji="⚙️" /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 20, lineHeight: 24 },
});
