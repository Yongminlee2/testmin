import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { colors, font, space } from '@/ui/tokens';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.version} maxFontSizeMultiplier={font.maxScale}>
        테스트의 민족 v{appVersion}
      </Text>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        이 앱의 모든 테스트는 오락을 목적으로 만들어졌으며{'\n'}
        임상적·진단적 검사가 아닙니다.
      </Text>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        모든 문항은 자체 제작했습니다.
      </Text>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        글꼴: Black Han Sans, Noto Sans KR{'\n'}
        (SIL Open Font License 1.1)
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
    gap: space.lg,
  },
  version: { fontSize: font.size.lead, fontFamily: font.family.black, color: colors.ink },
  text: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
