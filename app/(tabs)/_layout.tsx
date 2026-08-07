import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font } from '@/ui/tokens';

/**
 * 탭 아이콘은 이모지 한 글자로만 그린다. 번들 한글 폰트(Black Han Sans,
 * Noto Sans KR)에는 이모지 글리프가 없어서 fontFamily를 지정하면 빈 네모(tofu)가
 * 뜬다 — 그래서 이 Text에는 커스텀 fontFamily를 절대 주지 않는다.
 */
function TabIcon({ emoji }: { readonly emoji: string }) {
  return <Text style={styles.icon}>{emoji}</Text>;
}

/** 탭바 본체 높이(안전영역 제외). 아이콘 24 + 라벨 14 + 위아래 여백. */
const TAB_BAR_HEIGHT = 58;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: font.family.black },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        // 하단 안전영역을 높이와 패딩에 직접 더한다. 이걸 빼면 시스템
        // 내비게이션 바가 탭바 위에 겹쳐 그려져서 라벨 아랫부분("응시"의 받침)이
        // 잘린다 — 실기기 스크린샷에서 실제로 그렇게 나왔다.
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopWidth: 2.5,
          borderTopColor: colors.ink,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: font.family.bold, fontSize: 11 },
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
