import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { SvgFigure } from '@/ui/SvgFigure';
import { useSession } from '@/store/session';
import { scoreIq } from '@/engine/iq/iqScore';
import { getGradeBands, gradeTableId } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';
import type { Choice } from '@/engine/types';

interface ChoiceCellProps {
  readonly choice: Choice | undefined;
  readonly testID: string;
}

/** 선택지 하나를 도형/텍스트로 그린다. choice가 없으면(범위 밖·미응답) "응답 없음". */
function ChoiceCell({ choice, testID }: ChoiceCellProps) {
  if (choice === undefined) {
    return (
      <Text testID={testID} style={styles.line} maxFontSizeMultiplier={font.maxScale}>
        응답 없음
      </Text>
    );
  }
  if (choice.figure) {
    return <SvgFigure spec={choice.figure} size={80} testID={testID} />;
  }
  return (
    <Text testID={testID} style={styles.line} maxFontSizeMultiplier={font.maxScale}>
      {choice.text ?? ''}
    </Text>
  );
}

export default function IqReviewScreen() {
  const router = useRouter();
  const { questions, answers, variant } = useSession();
  const insets = useSafeAreaInsets();

  if (questions.length === 0 || variant === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          해설할 문항이 없습니다
        </Text>
      </View>
    );
  }

  const result = scoreIq(questions, answers, getGradeBands(gradeTableId('iq', variant)));
  const wrongIds = new Set(result.wrong.map((w) => w.questionId));
  const chosenByQuestion = new Map(answers.map((a) => [a.questionId, a.chosenIndex]));

  return (
    <>
      <Stack.Screen options={{ title: '해설' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: space.xxl + insets.bottom },
        ]}
      >
        {questions.map((q, i) => {
          const wrong = wrongIds.has(q.id);
          const answerIndex = q.answerIndex ?? 0;
          const chosenIndex = chosenByQuestion.get(q.id) ?? -1;
          // 미응답(-1)이거나, 세션이 깨져 선택지 범위를 벗어난 값이면
          // choice를 못 찾은 것으로 취급한다 — ChoiceCell이 "응답 없음"으로 그린다.
          const chosenChoice =
            chosenIndex >= 0 && chosenIndex < q.choices.length ? q.choices[chosenIndex] : undefined;
          const answerChoice = q.choices[answerIndex];

          return (
            <Card key={q.id} style={styles.card}>
              <View style={styles.head}>
                <Badge label={`${i + 1}번`} />
                <Badge
                  label={wrong ? '❌ 오답' : '⭕ 정답'}
                  color={wrong ? colors.coral : colors.mint}
                />
              </View>

              <Text style={styles.prompt} maxFontSizeMultiplier={font.maxScale}>
                {q.prompt}
              </Text>

              {q.figure ? (
                <View style={styles.questionFigure}>
                  <SvgFigure spec={q.figure} size={200} testID={`review-question-${i}`} />
                </View>
              ) : null}

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
                    내가 고른 것
                  </Text>
                  <ChoiceCell choice={chosenChoice} testID={`review-chosen-${i}`} />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
                    정답
                  </Text>
                  <ChoiceCell choice={answerChoice} testID={`review-answer-${i}`} />
                </View>
              </View>

              <Text style={styles.why} maxFontSizeMultiplier={font.maxScale}>
                {q.explanation ?? ''}
              </Text>
            </Card>
          );
        })}

        <Button label="결과로 돌아가기" onPress={() => router.back()} testID="back" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  card: { marginBottom: space.md },
  head: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  prompt: {
    fontSize: font.size.lead,
    fontFamily: font.family.black,
    color: colors.ink,
    lineHeight: 24,
    marginBottom: space.sm,
  },
  questionFigure: { alignItems: 'center', marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.md, marginBottom: space.sm },
  col: { flex: 1, alignItems: 'center' },
  label: {
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.muted,
    marginBottom: space.xs,
  },
  line: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.ink,
    marginBottom: 2,
  },
  why: {
    marginTop: space.sm,
    fontSize: font.size.body,
    fontFamily: font.family.body,
    color: colors.muted,
    lineHeight: 21,
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
