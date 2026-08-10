import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useHistory } from '@/store/history';
import { colors, font } from '@/ui/tokens';
import { APP_CONTENT_MAX_WIDTH } from '@/ui/layoutMetrics';
import { Button } from '@/ui/Button';

void SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cream,
    card: colors.cream,
  },
};

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <View style={errorStyles.screen}>
        <Text style={errorStyles.eyebrow}>잠깐만요</Text>
        <Text style={errorStyles.title}>시험지가 잠깐 엉켰습니다</Text>
        <Text style={errorStyles.body}>
          기록은 기기에 그대로 있습니다. 다시 펼치면 대부분 바로 돌아옵니다.
        </Text>
        <Button label="시험지 다시 펼치기" color={colors.yellow} onPress={() => void retry()} />
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  // 원본 Noto Sans KR은 한자 약 2만 자까지 담은 전체 CJK 폰트라 굵기당 5.9MB다.
  // 세 굵기를 시작할 때 다 파싱하는 동안 아래 `return null`이 화면을 안 그려서
  // 앱이 눈에 띄게 늦게 떴다. tools/subset-fonts.py로 한자·가나를 걷어낸
  // 서브셋(굵기당 2.7MB)을 assets/fonts에 두고 그것만 싣는다.
  // 폰트를 다시 만들려면 그 스크립트를 실행할 것 — node_modules에서 직접
  // import하면 18.6MB짜리 원본으로 되돌아간다.
  const [fontsLoaded, fontError] = useFonts({
    BlackHanSans_400Regular: require('../assets/fonts/BlackHanSans_400Regular.ttf'),
    NotoSansKR_500Medium: require('../assets/fonts/NotoSansKR_500Medium.ttf'),
    NotoSansKR_700Bold: require('../assets/fonts/NotoSansKR_700Bold.ttf'),
    NotoSansKR_900Black: require('../assets/fonts/NotoSansKR_900Black.ttf'),
  });

  useEffect(() => {
    // 폰트 로딩이 실패해도 시스템 폰트로 앱을 띄운다. 스플래시에 갇히면 안 된다.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // 성적표·오답노트 탭이 그려지기 전에 저장된 기록을 미리 읽어 둔다.
    // load()는 절대 throw하지 않는다(storage.ts가 실패를 이미 삼켰다) — 깨진
    // 데이터 때문에 앱이 스플래시에 갇히거나 죽는 일은 없다.
    void useHistory.getState().load();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.cream },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontFamily: font.family.black },
            contentStyle: {
              backgroundColor: colors.cream,
              ...(Platform.OS === 'web'
                ? {
                    width: '100%',
                    maxWidth: APP_CONTENT_MAX_WIDTH,
                    alignSelf: 'center' as const,
                  }
                : {}),
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const errorStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: colors.cream,
  },
  eyebrow: {
    color: colors.coral,
    fontSize: 13,
    fontFamily: font.family.black,
    textAlign: 'center',
  },
  title: {
    marginTop: 6,
    color: colors.ink,
    fontSize: 24,
    lineHeight: 34,
    fontFamily: font.family.display,
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    marginBottom: 22,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: font.family.body,
    textAlign: 'center',
  },
});
