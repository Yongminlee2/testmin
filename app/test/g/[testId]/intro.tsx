import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/ui/Button';
import { getPool, getScoredTest } from '@/content/registry';
import { useSession } from '@/store/session';
import { assemble } from '@/engine/assemble';
import { hashSeed } from '@/engine/rng';
import { categoryColor, colors, font, space } from '@/ui/tokens';

/**
 * 고정 문항 고사의 공용 인트로.
 *
 * 시험마다 화면 네 벌을 복사하면 고사를 하나 늘릴 때 파일이 네 개씩 늘어난다.
 * 대신 SCORED_TESTS 표를 읽는 라우트 한 벌만 두고 testId로 갈라 쓴다.
 * 새 고사는 문항 JSON + 레지스트리 한 줄이면 끝난다.
 */
export default function ScoredIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const start = useSession((s) => s.start);
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const meta = getScoredTest(testId ?? '');

  if (meta === undefined) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          없는 시험입니다
        </Text>
      </View>
    );
  }

  const begin = () => {
    const seed = hashSeed(`${meta.id}:${Date.now()}`);
    const questions = assemble(getPool(meta.id, 'default'), seed, {
      count: meta.draw.questionCount,
      difficultyMix: meta.draw.difficultyMix,
    });
    start(meta.id, 'default', seed, questions);
    router.push(`/test/g/${meta.id}/quiz`);
  };

  return (
    <>
      <Stack.Screen options={{ title: meta.title }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <Text style={styles.heading} maxFontSizeMultiplier={font.maxScale}>
          {meta.heading}
        </Text>
        <Text style={styles.body} maxFontSizeMultiplier={font.maxScale}>
          {meta.draw.questionCount}문항이 나옵니다. 시간 제한은 없습니다.
        </Text>
        <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
          {meta.note}
        </Text>
        <Button
          label="응시하기 →"
          color={categoryColor[meta.colorKey]}
          onPress={begin}
          testID="begin"
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg },
  heading: {
    fontSize: font.size.title,
    fontFamily: font.family.black,
    color: colors.ink,
    lineHeight: font.size.title * 1.4,
    marginBottom: space.lg,
  },
  body: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.ink,
    lineHeight: font.size.body * 1.5,
    marginBottom: space.md,
  },
  note: {
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.muted,
    lineHeight: font.size.caption * 1.6,
    marginBottom: space.xl,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: { fontSize: font.size.body, fontFamily: font.family.bold, color: colors.muted },
});
