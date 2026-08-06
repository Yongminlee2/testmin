import { View, Text, StyleSheet } from 'react-native';
import { colors, font, space } from '@/ui/tokens';

export default function NotesScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        틀린 문제가 없습니다.{'\n'}응시하면 여기에 모입니다.
      </Text>
    </View>
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
});
