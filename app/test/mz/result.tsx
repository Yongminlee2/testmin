import { useEffect, useRef } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
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
import {
  MZ_DRAW,
  getGradeBands,
  getPool,
  gradeTableId,
} from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function MzResultScreen() {
  const router = useRouter();
  const { questions, answers, variant, seed } = useSession();
  const start = useSession((s) => s.start);
  const insets = useSafeAreaInsets();

  const bands = variant === null ? [] : getGradeBands(gradeTableId('mz', variant));
  const result =
    questions.length === 0 || variant === null ? null : scoreTest(questions, answers, bands);

  // 채점 직후 성적표에 딱 한 번만 기록한다. ref 가드가 없으면 재렌더될 때마다
  // (예: 다른 상태 변화로 이 화면이 다시 그려질 때) 같은 응시가 중복 저장된다.
  const savedRef = useRef(false);
  const cardRef = useRef<View>(null);
  useEffect(() => {
    if (savedRef.current || result === null || variant === null) return;
    savedRef.current = true;
    void useHistory.getState().saveResult({
      testId: 'mz',
      variant,
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
  }, [result, variant, seed]);

  if (result === null || variant === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const retry = () => {
    const pool = getPool('mz', variant);
    const nextSeed = hashSeed(`mz:${Date.now()}`);
    const next = assemble(pool, nextSeed, {
      count: MZ_DRAW.questionCount,
      difficultyMix: MZ_DRAW.difficultyMix,
      excludeIds: questions.map((q) => q.id),
    });
    start('mz', variant, nextSeed, next);
    router.replace('/test/mz/quiz');
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
        <View ref={cardRef} collapsable={false}>
          <Certificate
            label="MZ 고사"
            grade={result.grade}
            title={result.title}
            detail={`${result.total}문항 중 ${result.correct}문항 정답`}
            note={
              result.wrong.length === 0
                ? '틀린 문항이 없습니다.'
                : `틀린 문항은 ${result.wrong.length}개예요. 전체 문항 해설을 확인해보세요.`
            }
          />
        </View>

        <ShareButton targetRef={cardRef} dialogTitle="MZ 고사" />

        {result.wrong.length > 0 ? (
          <Button
            label="✎ 문항별 해설 보기"
            onPress={() => router.push('/test/mz/review')}
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
