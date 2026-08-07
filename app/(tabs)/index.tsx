import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { AdSlot } from '@/ui/AdSlot';
import { CATEGORIES } from '@/content/registry';
import { attachParticle } from '@/engine/korean';
import { categoryColor, colors, font, space } from '@/ui/tokens';

export default function HomeScreen() {
  const router = useRouter();
  // 이 화면은 헤더를 끄고 브랜드 제목이 그 역할을 대신한다((tabs)/_layout.tsx 참고).
  // 헤더가 없으면 상태바 밑으로 콘텐츠가 파고들므로 상단 안전영역을 직접 넣는다.
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
      testID="home-scroll"
    >
      <Text style={styles.brand} maxFontSizeMultiplier={font.maxScale}>
        테스트의 민족
      </Text>
      <Text style={styles.brandSub} maxFontSizeMultiplier={font.maxScale}>
        오늘도 응시하셨습니다
      </Text>

      {CATEGORIES.map((c) => (
        <Pressable
          key={c.id}
          testID={`category-${c.id}`}
          accessibilityRole="button"
          onPress={() => {
            if (!c.available) {
              Alert.alert('준비 중입니다', `${attachParticle(c.title, '은', '는')} 다음 업데이트에 열립니다.`);
              return;
            }
            router.push(c.route);
          }}
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
