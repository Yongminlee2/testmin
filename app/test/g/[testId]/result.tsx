import { useEffect, useRef } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Certificate } from '@/ui/Certificate';
import { Button } from '@/ui/Button';
import { ShareButton } from '@/ui/ShareButton';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { useHistory } from '@/store/history';
import { scoreTest } from '@/engine/score';
import { assemble } from '@/engine/assemble';
import { hashSeed } from '@/engine/rng';
import { SCORED_TESTS, getGradeBands, getPool, getScoredTest, gradeTableId } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';
import { gradeComic } from '@/content/resultIllustrations';

export default function ScoredResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { questions, answers, seed } = useSession();
  const start = useSession((s) => s.start);
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const meta = getScoredTest(testId ?? '');

  const bands = meta ? getGradeBands(gradeTableId(meta.id, 'default')) : [];
  const result =
    questions.length === 0 || meta === undefined ? null : scoreTest(questions, answers, bands);

  // 채점 직후 성적표에 딱 한 번만 기록한다. 가드가 없으면 재렌더마다 중복 저장된다.
  const savedRef = useRef(false);
  const cardRef = useRef<View>(null);
  useEffect(() => {
    if (savedRef.current || result === null || meta === undefined) return;
    savedRef.current = true;
    void useHistory.getState().saveResult({
      testId: meta.id,
      variant: 'default',
      seed,
      result: {
        kind: 'scored',
        correct: result.correct,
        total: result.total,
        grade: result.grade,
        title: result.title,
      },
      wrong: result.wrong,
    });
  }, [result, meta, seed]);

  if (result === null || meta === undefined) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const retry = () => {
    const nextSeed = hashSeed(`${meta.id}:${Date.now()}`);
    const next = assemble(getPool(meta.id, 'default'), nextSeed, {
      count: meta.draw.questionCount,
      difficultyMix: meta.draw.difficultyMix,
      excludeIds: questions.map((q) => q.id),
    });
    start(meta.id, 'default', nextSeed, next);
    router.replace(`/test/g/${meta.id}/quiz`);
  };

  return (
    <>
      <Stack.Screen options={{ title: '채점 완료', headerBackVisible: false }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <View ref={cardRef} collapsable={false}>
          <Certificate
            label={meta.title}
            grade={result.grade}
            title={result.title}
            detail={`${result.total}문항 중 ${result.correct}문항 정답`}
            illustration={gradeComic(result.grade)}
            note={
              result.wrong.length === 0
                ? '틀린 문항이 없습니다.'
                : `틀린 문항은 ${result.wrong.length}개예요. 전체 문항 해설을 확인해보세요.`
            }
          />
        </View>

        <ShareButton targetRef={cardRef} dialogTitle={meta.title} />

        <Button
          label="✎ 문항별 해설 보기"
          onPress={() => router.push(`/test/g/${meta.id}/review`)}
          testID="go-review"
        />
        <Button label="↻ 다시 응시" color={colors.coral} onPress={retry} testID="retry" />
        <Button label="홈으로" onPress={() => router.dismissAll()} testID="go-home" />

        <AdSlot />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: { fontSize: font.size.body, fontFamily: font.family.bold, color: colors.muted },
});

/**
 * 정적 웹 내보내기(GitHub Pages)에서 이 동적 경로를 실제 페이지로 만들어 준다.
 * 없으면 [testId] 자리가 그대로 남아, 링크를 직접 열거나 새로고침할 때 404가 난다.
 */
export function generateStaticParams(): Array<Record<string, string>> {
  return SCORED_TESTS.map((t) => ({ testId: t.id }));
}
