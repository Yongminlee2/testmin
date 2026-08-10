import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { AdSlot } from '@/ui/AdSlot';
import { PageTitle } from '@/ui/PageTitle';
import { CATEGORIES } from '@/content/registry';
import { attachParticle } from '@/engine/korean';
import { dailyPick } from '@/engine/dailyPick';
import { useHistory } from '@/store/history';
import { notify } from '@/ui/dialog';
import { categoryColor, colors, font, space } from '@/ui/tokens';

const DAILY_COPY: Readonly<Record<string, string>> = {
  iq: '뇌를 깨우는 도형 한 판',
  personality: '오늘의 나를 네 글자로 압축',
  mz: '유행어 감별반 긴급 출동',
  dialect: '말끝만 듣고 고향 탐지',
  psych: '마음속 회의록 몰래 열람',
  spelling: '맞춤법 자존심 정기검진',
  purekorean: '사전 구석에서 보물찾기',
  idiom: '네 글자 허세와 지혜 구별',
};

export default function HomeScreen() {
  const router = useRouter();
  // 이 화면은 헤더를 끄고 브랜드 제목이 그 역할을 대신한다((tabs)/_layout.tsx 참고).
  // 헤더가 없으면 상태바 밑으로 콘텐츠가 파고들므로 상단 안전영역을 직접 넣는다.
  const insets = useSafeAreaInsets();
  const records = useHistory((state) => state.records);
  const completedKinds = new Set(records.map((record) => record.testId)).size;
  const today = dailyPick(
    CATEGORIES.filter((category) => category.available),
    new Date()
  );

  const openCategory = (category: (typeof CATEGORIES)[number]) => {
    if (!category.available) {
      notify(
        '준비 중입니다',
        attachParticle(category.title, '은', '는') + ' 다음 업데이트에 열립니다.'
      );
      return;
    }
    router.push(category.route);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
      testID="home-scroll"
    >
      <PageTitle />
      <Text style={styles.brand} maxFontSizeMultiplier={font.maxScale}>
        테스트의 민족
      </Text>
      <Text style={styles.brandSub} maxFontSizeMultiplier={font.maxScale}>
        오늘도 응시하셨습니다
      </Text>

      {today ? (
        <Pressable
          testID="daily-pick"
          accessibilityRole="button"
          accessibilityLabel={
            '오늘의 추천, ' + today.title + ', ' + (DAILY_COPY[today.id] ?? today.subtitle)
          }
          accessibilityHint="추천 고사를 시작합니다"
          onPress={() => openCategory(today)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Card color={categoryColor[today.colorKey]} style={styles.dailyCard}>
            <View style={styles.dailyTopRow}>
              <Text style={styles.dailyEyebrow} maxFontSizeMultiplier={font.maxScale}>
                오늘의 한 판
              </Text>
              <Badge label={String(today.questionCount) + '문'} />
            </View>
            <Text style={styles.dailyTitle} maxFontSizeMultiplier={font.maxScale}>
              {today.title}
            </Text>
            <Text style={styles.dailyCopy} maxFontSizeMultiplier={font.maxScale}>
              {DAILY_COPY[today.id] ?? today.subtitle}
            </Text>
            <Text style={styles.dailyAction} maxFontSizeMultiplier={font.maxScale}>
              시험지 펼치기 →
            </Text>
          </Card>
        </Pressable>
      ) : null}

      <View style={styles.collectionRow} accessibilityRole="summary">
        <Text style={styles.collectionLabel} maxFontSizeMultiplier={font.maxScale}>
          {records.length === 0
            ? '첫 결과를 뽑으면 나만의 결과 도감이 시작됩니다'
            : String(records.length) +
              '번 응시 · ' +
              String(completedKinds) +
              '/' +
              String(CATEGORIES.length) +
              '종 결과 발견'}
        </Text>
      </View>

      {CATEGORIES.map((c) => (
        <Pressable
          key={c.id}
          testID={`category-${c.id}`}
          accessibilityRole="button"
          accessibilityLabel={c.title + ', ' + c.subtitle + ', ' + String(c.questionCount) + '문항'}
          accessibilityHint="고사 안내 화면으로 이동합니다"
          onPress={() => openCategory(c)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Card color={categoryColor[c.colorKey]} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.emoji}>{c.emoji}</Text>
              <View style={styles.grow}>
                <Text style={styles.title} maxFontSizeMultiplier={font.maxScale}>
                  {c.title}
                </Text>
                <Text style={styles.subtitle} maxFontSizeMultiplier={font.maxScale}>
                  {c.available ? c.subtitle : '준비 중'}
                </Text>
              </View>
              <Badge label={`${c.questionCount}문`} />
            </View>
          </Card>
        </Pressable>
      ))}

      <AdSlot />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  brand: {
    fontSize: font.size.display,
    fontFamily: font.family.display,
    lineHeight: 40,
    color: colors.ink,
  },
  brandSub: {
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.muted,
    marginTop: space.xs,
    marginBottom: space.md,
  },
  pressed: { opacity: 0.7 },
  dailyCard: { marginBottom: space.md },
  dailyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  dailyEyebrow: {
    color: colors.ink,
    fontSize: font.size.caption,
    fontFamily: font.family.black,
  },
  dailyTitle: {
    color: colors.ink,
    fontSize: font.size.title,
    lineHeight: 27,
    fontFamily: font.family.display,
  },
  dailyCopy: {
    marginTop: space.xs,
    color: colors.ink,
    fontSize: font.size.body,
    lineHeight: 20,
    fontFamily: font.family.bold,
  },
  dailyAction: {
    marginTop: space.md,
    color: colors.ink,
    fontSize: font.size.caption,
    fontFamily: font.family.black,
    textAlign: 'right',
  },
  collectionRow: {
    marginBottom: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(17,17,17,0.07)',
  },
  collectionLabel: {
    color: colors.muted,
    fontSize: font.size.caption,
    lineHeight: 16,
    fontFamily: font.family.bold,
    textAlign: 'center',
  },
  card: { marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  emoji: { fontSize: 24 },
  title: {
    fontSize: font.size.lead,
    fontFamily: font.family.black,
    lineHeight: 24,
    color: colors.ink,
  },
  subtitle: {
    fontSize: font.size.caption,
    fontFamily: font.family.body,
    color: colors.muted,
    marginTop: 2,
  },
});
