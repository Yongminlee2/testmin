import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { AdSlot } from '@/ui/AdSlot';
import { CATEGORIES } from '@/content/registry';
import { categoryColor, colors, font, space } from '@/ui/tokens';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
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
              Alert.alert('준비 중입니다', `${c.title}은(는) 다음 업데이트에 열립니다.`);
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
  brand: { fontSize: font.size.display, fontFamily: font.family.black, color: colors.ink },
  brandSub: {
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.muted,
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  card: { marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  emoji: { fontSize: 24 },
  title: { fontSize: font.size.lead, fontFamily: font.family.black, color: colors.ink },
  subtitle: {
    fontSize: font.size.caption,
    fontFamily: font.family.body,
    color: colors.muted,
    marginTop: 2,
  },
});
