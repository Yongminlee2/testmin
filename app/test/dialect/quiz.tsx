import { useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { useSession } from '@/store/session';
import { colors, font, space } from '@/ui/tokens';

export default function QuizScreen() {
  const router = useRouter();
  const questions = useSession((s) => s.questions);
  const answer = useSession((s) => s.answer);
  const [index, setIndex] = useState(0);

  if (questions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          응시 중인 시험이 없습니다
        </Text>
      </View>
    );
  }

  const current = questions[index];
  if (current === undefined) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          응시 중인 시험이 없습니다
        </Text>
      </View>
    );
  }

  const choose = (choiceIndex: number) => {
    answer(current.id, choiceIndex);
    if (index + 1 >= questions.length) {
      router.replace('/test/dialect/result');
      return;
    }
    setIndex(index + 1);
  };

  return (
    <>
      <Stack.Screen options={{ title: '사투리 고사', headerBackVisible: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Badge label={`${index + 1} / ${questions.length}`} color={colors.yellow} />

        <Text style={styles.prompt} maxFontSizeMultiplier={font.maxScale}>
          {current.prompt}
        </Text>

        {current.choices.map((c, i) => (
          <Pressable
            key={`${current.id}-${i}`}
            testID={`choice-${i}`}
            accessibilityRole="button"
            onPress={() => choose(i)}
          >
            <Card style={styles.choice}>
              <Text style={styles.choiceText} maxFontSizeMultiplier={font.maxScale}>
                {c.text ?? ''}
              </Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  prompt: {
    fontSize: font.size.title,
    fontFamily: font.family.black,
    color: colors.ink,
    lineHeight: 28,
    marginTop: space.md,
    marginBottom: space.lg,
  },
  choice: { marginBottom: space.md },
  choiceText: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.ink,
    paddingVertical: space.xs,
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
