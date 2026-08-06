import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { useSession } from '@/store/session';
import { getPsychTest } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function PsychReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { questions, answers, variant } = useSession();
  const test = variant ? getPsychTest(variant) : undefined;

  if (questions.length === 0 || test === undefined) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          해설할 문항이 없습니다
        </Text>
      </View>
    );
  }

  const chosenById = new Map(answers.map((a) => [a.questionId, a.chosenIndex]));
  const nameById = new Map(test.types.map((t) => [t.id, t.name]));

  return (
    <>
      <Stack.Screen options={{ title: '해설' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        {questions.map((q, i) => {
          const chosenIndex = chosenById.get(q.id) ?? -1;
          const choice = chosenIndex >= 0 ? q.choices[chosenIndex] : undefined;
          const votedName = choice?.typeId ? nameById.get(choice.typeId) : undefined;

          return (
            <Card key={q.id} style={styles.card}>
              <View style={styles.head}>
                <Badge label={`${i + 1}번`} />
                {votedName ? <Badge label={votedName} color={colors.sky} /> : null}
              </View>

              <Text style={styles.prompt} maxFontSizeMultiplier={font.maxScale}>
                {q.prompt}
              </Text>

              <Text style={styles.line} maxFontSizeMultiplier={font.maxScale}>
                내 선택: {choice?.text ?? '응답 없음'}
              </Text>

              {votedName ? (
                <Text style={styles.line} maxFontSizeMultiplier={font.maxScale}>
                  이 선택은 &quot;{votedName}&quot;에 한 표를 줬습니다
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
  content: { padding: space.lg },
  card: { marginBottom: space.md },
  head: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  prompt: {
    fontSize: font.size.lead,
    lineHeight: font.size.lead * 1.5,
    fontFamily: font.family.black,
    color: colors.ink,
    marginBottom: space.sm,
  },
  line: {
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.5,
    fontFamily: font.family.bold,
    color: colors.ink,
    marginBottom: 2,
  },
  why: {
    marginTop: space.sm,
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.6,
    fontFamily: font.family.body,
    color: colors.muted,
  },
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
