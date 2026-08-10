import { useEffect, useRef } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PsychResultCard } from '@/ui/PsychResultCard';
import { CompatCard } from '@/ui/CompatCard';
import { ShareCompatSummary } from '@/ui/ShareCompatSummary';
import { Button } from '@/ui/Button';
import { ShareButton } from '@/ui/ShareButton';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { useHistory } from '@/store/history';
import { scoreByVote } from '@/engine/typeScore';
import { hashSeed } from '@/engine/rng';
import { getPsychTest } from '@/content/registry';
import { psychComic } from '@/content/resultIllustrations';
import { psychRelationCopy } from '@/content/resultPresentation';
import { colors, font, space } from '@/ui/tokens';

export default function PsychResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { questions, answers, variant, seed } = useSession();
  const start = useSession((s) => s.start);

  const test = variant ? getPsychTest(variant) : undefined;
  const result =
    questions.length === 0 || test === undefined
      ? null
      : scoreByVote(questions, answers, test.types.map((t) => t.id));

  // 채점 직후 성적표에 딱 한 번만 기록한다. ref 가드가 없으면 재렌더될 때마다
  // 같은 응시가 중복 저장된다. 득표형(심리 테스트)도 정답·오답 개념이 없으므로
  // 오답노트에는 아무것도 넘기지 않는다.
  const savedRef = useRef(false);
  const cardRef = useRef<View>(null);
  useEffect(() => {
    if (savedRef.current || result === null || test === undefined || variant === null) return;
    savedRef.current = true;
    const won = test.types.find((t) => t.id === result.typeId);
    void useHistory.getState().saveResult({
      testId: 'psych',
      variant,
      seed,
      result: { kind: 'vote', typeId: result.typeId, typeName: won?.name ?? result.typeId },
    });
  }, [result, test, variant, seed]);

  if (questions.length === 0 || test === undefined || result === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const won = test.types.find((t) => t.id === result.typeId);
  const votes = result.tally[result.typeId] ?? 0;
  const relationCopy = psychRelationCopy(test.id);
  const shareGoodWith = (won?.goodWith ?? []).map((item) => {
    const target = test.types.find((type) => type.id === item.code);
    const comic = psychComic(test.id, item.code);
    return {
      label: target?.name ?? item.code,
      sub: target?.emoji,
      image: comic.source,
      accessibilityLabel: comic.accessibilityLabel,
    };
  });
  const shareHardWith = won
    ? (() => {
        const target = test.types.find((type) => type.id === won.hardWith.code);
        const comic = psychComic(test.id, won.hardWith.code);
        return {
          label: target?.name ?? won.hardWith.code,
          sub: target?.emoji,
          image: comic.source,
          accessibilityLabel: comic.accessibilityLabel,
        };
      })()
    : undefined;

  const retry = () => {
    const nextSeed = hashSeed(`psych:${test.id}:${Date.now()}`);
    start('psych', test.id, nextSeed, test.questions);
    router.replace('/test/psych/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '결과', headerBackVisible: false }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <View ref={cardRef} collapsable={false}>
          <PsychResultCard
            testTitle={test.title}
            typeName={won?.name ?? result.typeId}
            description={won?.description ?? ''}
            illustration={psychComic(test.id, result.typeId)}
            evidence={
              result.wasTie
                ? `12문항 중 ${votes}표 — 다른 유형과 거의 비슷했습니다`
                : `12문항 중 ${votes}표`
            }
          />
          <ShareCompatSummary goodWith={shareGoodWith} hardWith={shareHardWith} />
        </View>

        <ShareButton targetRef={cardRef} dialogTitle={test.title} />

        <CompatCard
          goodWith={(won?.goodWith ?? []).map((g) => ({
            label: test.types.find((t) => t.id === g.code)?.name ?? g.code,
            sub: test.types.find((t) => t.id === g.code)?.emoji,
            why: g.why,
          }))}
          hardWith={
            won
              ? {
                  label: test.types.find((t) => t.id === won.hardWith.code)?.name ?? won.hardWith.code,
                  sub: test.types.find((t) => t.id === won.hardWith.code)?.emoji,
                  why: won.hardWith.why,
                }
              : undefined
          }
          rule={test.compatRule}
          goodHeading={relationCopy.goodHeading}
          hardHeading={relationCopy.hardHeading}
          disclaimer={relationCopy.disclaimer}
        />

        <Button
          label="✎ 문항별 해설 보기"
          onPress={() => router.push('/test/psych/review')}
          testID="go-review"
        />
        <Button label="↻ 다시 하기" color={colors.coral} onPress={retry} testID="retry" />
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
  emptyText: {
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.5,
    fontFamily: font.family.bold,
    color: colors.muted,
  },
});
