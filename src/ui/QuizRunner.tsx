import { useEffect, useRef, useState } from 'react';
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
  const scrollRef = useRef<ScrollView>(null);

  // 문항이 바뀌면 스크롤을 맨 위로 되돌린다 — ScrollView는 이전 문항의 스크롤
  // 오프셋을 그대로 들고 있어서, 안 하면 다음 문제 도형보다 아래에 떨어진 채로
  // 시작한다(IQ 문항처럼 화면보다 콘텐츠가 길 때 실기기에서 눈에 띔).
  // 빈 상태(questions.length === 0)에서는 ScrollView 자체가 렌더되지 않아
  // scrollRef.current가 null이므로 optional chaining으로 안전하게 건너뛴다.
  // 훅 순서를 규칙대로 유지하기 위해 아래 이른 반환보다 위에 둔다.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

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

  const figureChoices = current.choices.some((c) => c.figure !== undefined);

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
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
    >
      <Badge label={`${index + 1} / ${questions.length}`} color={accent} />

      <Text style={styles.prompt} maxFontSizeMultiplier={font.maxScale}>
        {current.prompt}
      </Text>

      {current.figure ? (
        <View style={styles.questionFigure} accessible accessibilityLabel="문제 도형">
          <SvgFigure spec={current.figure} size={220} testID="question-figure" />
        </View>
      ) : null}

      {/* 도형 선택지를 한 줄에 하나씩 쌓으면 4~5개가 화면을 넘겨, 고르려면 매번
          스크롤해야 한다. 2열로 깔면 문제 도형까지 한 화면에 들어온다.
          글자 선택지는 길이가 제각각이라 그대로 세로로 쌓는다. */}
      <View style={figureChoices ? styles.grid : undefined}>
        {current.choices.map((c, i) => (
          <Pressable
            key={`${current.id}-${i}`}
            testID={`choice-${i}`}
            accessibilityRole="button"
            style={figureChoices ? styles.gridItem : undefined}
            // 도형 선택지는 글자가 없어 <Text>가 읽을 거리를 못 준다 — TalkBack이
            // "버튼"만 읽고 넘어가지 않게 이름을 직접 준다. 텍스트 선택지는
            // undefined를 넘겨 기존 동작(자식 Text에서 이름을 얻는다)을 그대로 둔다.
            accessibilityLabel={c.figure ? `${i + 1}번 보기` : undefined}
            onPress={() => choose(i)}
          >
            <Card style={c.figure ? styles.figureChoice : styles.choice}>
              {c.figure ? (
                <SvgFigure spec={c.figure} size={88} testID={`choice-figure-${i}`} />
              ) : (
                <Text style={styles.choiceText} maxFontSizeMultiplier={font.maxScale}>
                  {c.text ?? ''}
                </Text>
              )}
            </Card>
          </Pressable>
        ))}
      </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%' },
  choice: { marginBottom: space.md },
  figureChoice: { marginBottom: space.md, alignItems: 'center' },
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
