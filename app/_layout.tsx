import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { BlackHanSans_400Regular } from '@expo-google-fonts/black-han-sans';
// noto-sans-kr의 index.js는 배럴 모듈이라 require()로 9개 굵기를 전부 불러온다.
// Metro는 require를 트리쉐이킹하지 못하므로 index에서 import하면 안 쓰는
// 6개 굵기(약 41MB)까지 APK에 그대로 실린다. 실제로 쓰는 3개만 굵기별
// 서브패스(패키지가 문서로 안내하는 방식)로 가져와 나머지를 배제한다.
import { NotoSansKR_500Medium } from '@expo-google-fonts/noto-sans-kr/500Medium';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';
import { NotoSansKR_900Black } from '@expo-google-fonts/noto-sans-kr/900Black';
import { colors, font } from '@/ui/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BlackHanSans_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
    NotoSansKR_900Black,
  });

  useEffect(() => {
    // 폰트 로딩이 실패해도 시스템 폰트로 앱을 띄운다. 스플래시에 갇히면 안 된다.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: font.family.black },
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
