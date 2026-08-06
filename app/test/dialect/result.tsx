import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Certificate } from '@/ui/Certificate';
import { Button } from '@/ui/Button';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { scoreTest } from '@/engine/score';
import { assemble } from '@/engine/assemble';
import { hashSeed } from '@/engine/rng';
import {
  DIALECT_DRAW,
  DIALECT_REGIONS,
  getGradeBands,
  getPool,
  gradeTableId,
} from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function ResultScreen() {
  const router = useRouter();
  const { questions, answers, variant } = useSession();
  const start = useSession((s) => s.start);
  const insets = useSafeAreaInsets();

  if (questions.length === 0 || variant === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const bands = getGradeBands(gradeTableId('dialect', variant));
  const result = scoreTest(questions, answers, bands);
  const regionTitle =
    DIALECT_REGIONS.find((r) => r.id === variant)?.title ?? variant;

  const retry = () => {
    const pool = getPool('dialect', variant);
    const seed = hashSeed(`dialect:${variant}:${Date.now()}`);
    const next = assemble(pool, seed, {
      count: DIALECT_DRAW.questionCount,
      difficultyMix: DIALECT_DRAW.difficultyMix,
      excludeIds: questions.map((q) => q.id),
    });
    start('dialect', variant, seed, next);
    router.replace('/test/dialect/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '채점 완료', headerBackVisible: false }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: space.xxl + insets.bottom },
        ]}
      >
        <Certificate
          label={`사투리고사 · ${regionTitle}`}
          grade={result.grade}
          title={result.title}
          detail={`${result.total}문항 중 ${result.correct}문항 정답`}
          note={
            result.wrong.length === 0
              ? '틀린 문항이 없습니다.'
              : `틀린 ${result.wrong.length}문항의 해설을 확인해보세요.`
          }
        />

        {result.wrong.length > 0 ? (
          <Button
            label={`✎ 틀린 ${result.wrong.length}문항 해설 보기`}
            onPress={() => router.push('/test/dialect/review')}
            testID="go-review"
          />
        ) : null}

        <Button
          label="↻ 다시 응시"
          color={colors.coral}
          onPress={retry}
          testID="retry"
        />
        <Button
          label="홈으로"
          onPress={() => router.dismissAll()}
          testID="go-home"
        />

        <AdSlot />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: { fontSize: font.size.body, fontFamily: font.family.bold, color: colors.muted },
});
