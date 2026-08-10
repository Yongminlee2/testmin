import { useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecordRow } from '@/ui/RecordRow';
import { SvgFigure } from '@/ui/SvgFigure';
import { groupByTestId } from '@/ui/groupByTestId';
import { useHistory, restoreQuestion } from '@/store/history';
import type { WrongNote } from '@/engine/notes';
import type { Choice, Question } from '@/engine/types';
import { CATEGORIES } from '@/content/registry';
import { PageTitle } from '@/ui/PageTitle';
import { colors, font, space } from '@/ui/tokens';

interface Entry {
  readonly key: string;
  readonly testId: string;
  readonly note: WrongNote;
  readonly question: Question;
}

function noteKey(note: WrongNote): string {
  return `${note.testId}:${note.variant}:${note.questionId}`;
}

/**
 * 복원에 성공한 오답만 남긴다. restoreQuestion이 undefined를 주면(오래된 콘텐츠가
 * 가리키는 생성기·문항이 더 이상 없음) 그 항목은 통째로 건너뛴다 — 자리만 차지하는
 * 빈 줄을 남기지 않는다.
 */
function buildEntries(notes: readonly WrongNote[]): Entry[] {
  const out: Entry[] = [];
  for (const note of notes) {
    const question = restoreQuestion(note);
    if (question === undefined) continue;
    out.push({ key: noteKey(note), testId: note.testId, note, question });
  }
  return out;
}

function categoryTitle(testId: string): string {
  return CATEGORIES.find((c) => c.id === testId)?.title ?? testId;
}

interface ChoiceCellProps {
  readonly choice: Choice | undefined;
  readonly testID: string;
  /**
   * 도형일 때 스크린 리더에 읽어줄 이름. QuizRunner(src/ui/QuizRunner.tsx)가 문제·선택지
   * 도형에 accessibilityLabel을 붙이는 것과 같은 이유다 — <SvgFigure>는 그림만 그리고
   * 글자를 하나도 남기지 않으므로, 이름이 없으면 화면 리더 사용자는 이 칸에 뭐가
   * 있는지 전혀 알 수 없다.
   */
  readonly accessibilityLabel: string;
}

/**
 * app/test/iq/review.tsx의 ChoiceCell과 같은 모양(도형/텍스트/응답없음)에 도형
 * 접근성 이름만 더한 버전이다. review.tsx는 고치지 않고 오답노트에서만 적용한다.
 */
function ChoiceCell({ choice, testID, accessibilityLabel }: ChoiceCellProps) {
  if (choice === undefined) {
    return (
      <Text testID={testID} style={styles.line} maxFontSizeMultiplier={font.maxScale}>
        응답 없음
      </Text>
    );
  }
  if (choice.figure) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel}>
        <SvgFigure spec={choice.figure} size={80} testID={testID} />
      </View>
    );
  }
  return (
    <Text testID={testID} style={styles.line} maxFontSizeMultiplier={font.maxScale}>
      {choice.text ?? ''}
    </Text>
  );
}

function NoteEntryRow({ entry }: { readonly entry: Entry }) {
  const [open, setOpen] = useState(false);
  const { note, question, key } = entry;

  // noUncheckedIndexedAccess 아래에서도 review.tsx와 같은 이유로 가드를 남겨둔다:
  // 미응답(-1)과 범위 밖 인덱스는 둘 다 "선택지 없음"이라는 의도를 코드에 그대로 적는다.
  const chosenChoice =
    note.chosenIndex >= 0 && note.chosenIndex < question.choices.length
      ? question.choices[note.chosenIndex]
      : undefined;
  const answerChoice = question.choices[note.answerIndex];

  return (
    <RecordRow onPress={() => setOpen((v) => !v)} expanded={open} testID={`note-row-${key}`}>
      <View style={styles.promptRow}>
        {!open && question.figure ? (
          <View
            style={styles.previewFigure}
            accessible
            accessibilityLabel="문제 도형 미리보기"
          >
            <SvgFigure spec={question.figure} size={56} testID={`note-preview-figure-${key}`} />
          </View>
        ) : null}
        <Text
          style={styles.prompt}
          numberOfLines={open ? undefined : 2}
          maxFontSizeMultiplier={font.maxScale}
        >
          {question.prompt}
        </Text>
      </View>

      {open ? (
        <View style={styles.detail}>
          {question.figure ? (
            <View style={styles.questionFigure} accessible accessibilityLabel="문제 도형">
              <SvgFigure spec={question.figure} size={160} testID={`note-question-figure-${key}`} />
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
                내가 고른 것
              </Text>
              <ChoiceCell
                choice={chosenChoice}
                testID={`note-chosen-${key}`}
                accessibilityLabel="내가 고른 도형"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
                정답
              </Text>
              <ChoiceCell
                choice={answerChoice}
                testID={`note-answer-${key}`}
                accessibilityLabel="정답 도형"
              />
            </View>
          </View>

          <Text style={styles.why} maxFontSizeMultiplier={font.maxScale}>
            {question.explanation ?? ''}
          </Text>
        </View>
      ) : null}
    </RecordRow>
  );
}

export default function NotesScreen() {
  const notes = useHistory((s) => s.notes);
  const insets = useSafeAreaInsets();

  const entries = buildEntries(notes);

  if (entries.length === 0) {
    return (
      <View style={styles.wrap}>
        <PageTitle title="오답노트" />
        <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
          틀린 문제가 없습니다.{'\n'}응시하면 여기에 모입니다.
        </Text>
      </View>
    );
  }

  const groups = groupByTestId(entries);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
    >
      <PageTitle title="오답노트" />
      {groups.map((group) => (
        <View key={group.testId} style={styles.group}>
          <Text style={styles.groupTitle} maxFontSizeMultiplier={font.maxScale}>
            {categoryTitle(group.testId)}
          </Text>
          {group.items.map((entry) => (
            <NoteEntryRow key={entry.key} entry={entry} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  text: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  group: { marginBottom: space.lg },
  groupTitle: {
    fontSize: font.size.lead,
    fontFamily: font.family.black,
    color: colors.ink,
    marginBottom: space.sm,
  },
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  previewFigure: { width: 64, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  prompt: {
    flex: 1,
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.ink,
    lineHeight: 20,
  },
  detail: { marginTop: space.sm },
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
});
