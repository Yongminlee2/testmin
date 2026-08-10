import { ScrollView, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/ui/Button';
import { PageTitle } from '@/ui/PageTitle';
import { getPool, PERSONALITY_DRAW } from '@/content/registry';
import { useSession } from '@/store/session';
import { assembleByAxis } from '@/engine/assembleTyped';
import { hashSeed } from '@/engine/rng';
import { notify } from '@/ui/dialog';
import { colors, font, space } from '@/ui/tokens';

export default function PersonalityIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const start = useSession((s) => s.start);

  const begin = () => {
    const pool = getPool('personality', 'default');
    if (pool.length === 0) {
      notify('준비 중입니다', 'MBTI식 16유형 고사는 다음 업데이트에 열립니다.');
      return;
    }
    const seed = hashSeed(`personality:${Date.now()}`);
    const questions = assembleByAxis(pool, seed, { perAxis: PERSONALITY_DRAW.perAxis });
    start('personality', 'default', seed, questions);
    router.push('/test/personality/quiz');
  };

  return (
    <>
      <PageTitle title="MBTI식 16유형 고사" />
      <Stack.Screen options={{ title: 'MBTI식 16유형 고사' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <Text style={styles.heading} maxFontSizeMultiplier={font.maxScale}>
          24문항으로{'\n'}당신의 네 글자를 찾습니다
        </Text>
        <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
          정답이 없는 시험입니다. 오래 고민하지 말고 먼저 떠오르는 쪽을 고르세요.
          {'\n\n'}
          네 개의 축을 각각 6문항씩 묻습니다. 결과에는 각 축이 얼마나 치우쳤는지도 함께 나옵니다.
          {'\n\n'}
          공식 MBTI 검사가 아닌 재미로 보는 자체 성격 테스트입니다.
        </Text>
        <Button label="응시하기 →" color={colors.lavender} onPress={begin} testID="begin" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg },
  heading: {
    fontSize: font.size.title,
    lineHeight: font.size.title * 1.5,
    fontFamily: font.family.black,
    color: colors.ink,
    marginBottom: space.lg,
  },
  note: {
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.7,
    fontFamily: font.family.body,
    color: colors.muted,
    marginBottom: space.xl,
  },
});
