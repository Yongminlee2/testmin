import { Alert, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecordRow } from '@/ui/RecordRow';
import { Button } from '@/ui/Button';
import { groupByTestId } from '@/ui/groupByTestId';
import { useHistory } from '@/store/history';
import type { RecordResult, TestRecord } from '@/engine/records';
import { IQ_DISCLAIMER } from '@/engine/iq/iqScore';
import { CATEGORIES, DIALECT_REGIONS, PSYCH_TESTS } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "2026.08.07 14:23" 형태로 응시 일시를 보여준다. */
function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 그룹 헤더에 쓰는 시험 이름. 등록 안 된 testId면 그 값 자체를 보여준다(크래시 방지). */
function categoryTitle(testId: string): string {
  return CATEGORIES.find((c) => c.id === testId)?.title ?? testId;
}

/** 지역·하위테스트가 있는 시험(사투리·심리)은 줄에 그 이름까지 덧붙인다. */
function testName(rec: TestRecord): string {
  const base = categoryTitle(rec.testId);
  if (rec.testId === 'dialect') {
    const region = DIALECT_REGIONS.find((r) => r.id === rec.variant)?.title;
    return region ? `${base} · ${region}` : base;
  }
  if (rec.testId === 'psych') {
    const sub = PSYCH_TESTS.find((t) => t.id === rec.variant)?.title;
    return sub ? `${base} · ${sub}` : base;
  }
  return base;
}

/**
 * 채점 방식별 한 줄 요약.
 * - 정답형: "8급 · 찍기의 장인 · 20문항 중 5개"
 * - 축 합계형: "ENFP · <별명>"
 * - 득표형: "<유형 이름>"
 * IQ 추정 점수는 여기 섞지 않는다 — 안내 문구와 한 쌍으로 화면이 따로 그린다.
 */
function summaryLine(result: RecordResult): string {
  switch (result.kind) {
    case 'scored':
      return `${result.grade}급 · ${result.title} · ${result.total}문항 중 ${result.correct}개`;
    case 'axis':
      return `${result.code} · ${result.nickname}`;
    case 'vote':
      return result.typeName;
  }
}

export default function RecordsScreen() {
  const records = useHistory((s) => s.records);
  const insets = useSafeAreaInsets();

  if (records.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
          아직 기록이 없습니다.{'\n'}응시하면 여기에 쌓입니다.
        </Text>
      </View>
    );
  }

  const groups = groupByTestId(records);
  // IQ 추정 점수가 화면 어딘가에 하나라도 있으면 안내 문구를 한 번 보여준다 —
  // scoreIq()가 결과 화면에서 점수와 문구를 한 타입으로 묶어 강제하는 것과 같은 규칙을,
  // 저장된 기록을 읽는 이 화면에서는 여기서 직접 챙긴다.
  const hasIqScore = records.some(
    (r) => r.result.kind === 'scored' && r.result.estimatedScore !== undefined
  );

  const confirmClear = () => {
    Alert.alert('기록을 지울까요?', '삭제하면 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '지우기',
        style: 'destructive',
        onPress: () => {
          void useHistory.getState().clearAll();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
    >
      {groups.map((group) => (
        <View key={group.testId} style={styles.group}>
          <Text style={styles.groupTitle} maxFontSizeMultiplier={font.maxScale}>
            {categoryTitle(group.testId)}
          </Text>
          {group.items.map((rec) => (
            <RecordRow key={rec.id} testID={`record-${rec.id}`}>
              <Text style={styles.rowTitle} maxFontSizeMultiplier={font.maxScale}>
                {testName(rec)}
              </Text>
              <Text style={styles.rowDate} maxFontSizeMultiplier={font.maxScale}>
                {formatDateTime(rec.completedAt)}
              </Text>
              <Text style={styles.rowSummary} maxFontSizeMultiplier={font.maxScale}>
                {summaryLine(rec.result)}
              </Text>
              {rec.result.kind === 'scored' && rec.result.estimatedScore !== undefined ? (
                <Text
                  testID={`record-iq-score-${rec.id}`}
                  style={styles.rowIqScore}
                  maxFontSizeMultiplier={font.maxScale}
                >
                  추정 점수 {rec.result.estimatedScore}
                </Text>
              ) : null}
            </RecordRow>
          ))}
        </View>
      ))}

      {hasIqScore ? (
        <Text
          testID="records-iq-disclaimer"
          style={styles.disclaimer}
          maxFontSizeMultiplier={font.maxScale}
        >
          {IQ_DISCLAIMER}
        </Text>
      ) : null}

      <Button label="기록 지우기" color={colors.coral} onPress={confirmClear} testID="clear-all" />
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
  rowTitle: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.ink,
  },
  rowDate: {
    fontSize: font.size.caption,
    fontFamily: font.family.body,
    color: colors.muted,
    marginTop: 2,
  },
  rowSummary: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.ink,
    marginTop: space.xs,
  },
  rowIqScore: {
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.muted,
    marginTop: 2,
  },
  disclaimer: {
    fontSize: font.size.caption,
    fontFamily: font.family.body,
    color: colors.muted,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: space.sm,
    marginBottom: space.lg,
  },
});
