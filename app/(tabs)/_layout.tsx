import { Tabs } from 'expo-router';
import { colors, font } from '@/ui/tokens';

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
      <Tabs.Screen name="index" options={{ title: '응시' }} />
      <Tabs.Screen name="records" options={{ title: '성적표' }} />
      <Tabs.Screen name="notes" options={{ title: '오답노트' }} />
      <Tabs.Screen name="settings" options={{ title: '설정' }} />
    </Tabs>
  );
}
