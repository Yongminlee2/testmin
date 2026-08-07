import { useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from './Card';
import { Badge } from './Badge';
import { SvgFigure } from './SvgFigure';
import { useSession } from '@/store/session';
import { colors, font, space } from './tokens';

interface Props {
  /** 마지막 문항 뒤 이동할 결과 화면 경로 */
  readonly resultRoute: string;
  /** 진행 배지 색 */
  readonly accent?: string;
}

/**
 * 정답형·유형형 공통 문항 진행 화면.
 * 세션이 비어 있으면 안내를 보여주고, 마지막 문항에서는 replace로 결과로 넘어간다
 * (뒤로가기로 끝난 시험에 재진입할 수 없게).
 */
export function QuizRunner({ resultRoute, accent = colors.yellow }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const questions = useSession((s) => s.questions);
  const answer = useSession((s) => s.answer);
  const [index, setIndex] = useState(0);

  const current = questions[index];

  if (questions.length === 0 || current === undefined) {
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
      router.replace(resultRoute);
      return;
    }
    setIndex(index + 1);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
    >
      <Badge label={`${index + 1} / ${questions.length}`} color={accent} />

      <Text style={styles.prompt} maxFontSizeMultiplier={font.maxScale}>
        {current.prompt}
      </Text>

      {current.figure ? (
        <View style={styles.questionFigure} accessible accessibilityLabel="문제 도형">
          <SvgFigure spec={current.figure} size={280} testID="question-figure" />
        </View>
      ) : null}

      {current.choices.map((c, i) => (
        <Pressable
          key={`${current.id}-${i}`}
          testID={`choice-${i}`}
          accessibilityRole="button"
          // 도형 선택지는 글자가 없어 <Text>가 읽을 거리를 못 준다 — TalkBack이
          // "버튼"만 읽고 넘어가지 않게 이름을 직접 준다. 텍스트 선택지는
          // undefined를 넘겨 기존 동작(자식 Text에서 이름을 얻는다)을 그대로 둔다.
          accessibilityLabel={c.figure ? `${i + 1}번 보기` : undefined}
          onPress={() => choose(i)}
        >
          <Card style={styles.choice}>
            {c.figure ? (
              <SvgFigure spec={c.figure} size={96} testID={`choice-figure-${i}`} />
            ) : (
              <Text style={styles.choiceText} maxFontSizeMultiplier={font.maxScale}>
                {c.text ?? ''}
              </Text>
            )}
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg },
  prompt: {
    fontSize: font.size.title,
    lineHeight: font.size.title * 1.5,
    fontFamily: font.family.black,
    color: colors.ink,
    marginTop: space.md,
    marginBottom: space.lg,
  },
  questionFigure: { alignItems: 'center', marginBottom: space.lg },
  choice: { marginBottom: space.md },
  choiceText: {
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.5,
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
  emptyText: {
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.5,
    fontFamily: font.family.bold,
    color: colors.muted,
  },
});
