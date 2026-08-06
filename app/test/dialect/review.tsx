import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { useSession } from '@/store/session';
import { scoreTest } from '@/engine/score';
import { getGradeBands, gradeTableId } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function ReviewScreen() {
  const router = useRouter();
  const { questions, answers, variant } = useSession();

  if (questions.length === 0 || variant === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          해설할 문항이 없습니다
        </Text>
      </View>
    );
  }

  const result = scoreTest(questions, answers, getGradeBands(gradeTableId('dialect', variant)));
  const wrongById = new Map(result.wrong.map((w) => [w.questionId, w]));

  return (
    <>
      <Stack.Screen options={{ title: '해설' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {questions.map((q, i) => {
          const wrong = wrongById.get(q.id);
          const answerIndex = q.answerIndex ?? 0;

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

              <Text style={styles.line} maxFontSizeMultiplier={font.maxScale}>
                정답: {q.choices[answerIndex]?.text ?? ''}
              </Text>

              {wrong ? (
                <Text style={styles.line} maxFontSizeMultiplier={font.maxScale}>
                  내가 고른 답:{' '}
                  {wrong.chosenIndex >= 0
                    ? q.choices[wrong.chosenIndex]?.text ?? ''
                    : '응답 없음'}
                </Text>
              ) : null}

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
