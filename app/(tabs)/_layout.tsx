import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { colors, font } from '@/ui/tokens';

/**
 * 탭 아이콘은 이모지 한 글자로만 그린다. 번들 한글 폰트(Black Han Sans,
 * Noto Sans KR)에는 이모지 글리프가 없어서 fontFamily를 지정하면 빈 네모(tofu)가
 * 뜬다 — 그래서 이 Text에는 커스텀 fontFamily를 절대 주지 않는다.
 */
function TabIcon({ emoji }: { readonly emoji: string }) {
  return <Text style={styles.icon}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: font.family.black },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopWidth: 2.5,
          borderTopColor: colors.ink,
        },
        tabBarLabelStyle: { fontFamily: font.family.bold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '응시', tabBarIcon: () => <TabIcon emoji="📝" /> }}
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
