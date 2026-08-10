import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { privacyPolicyUrl, supportUrl, termsUrl } from '@/appMeta';
import { colors, font, space } from './tokens';

const links = [
  { label: '개인정보처리방침', url: privacyPolicyUrl },
  { label: '이용 안내', url: termsUrl },
  { label: '문의', url: supportUrl },
] as const;

/** 검색·광고 심사와 웹 방문자를 위한 운영 정보. 네이티브 앱에는 렌더하지 않는다. */
export function WebInfoFooter() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.title} maxFontSizeMultiplier={font.maxScale}>
        재미로 풀고, 이유까지 읽는 테스트
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={font.maxScale}>
        테스트의 민족은 문항·해설·결과 이야기를 직접 구성한 코믹 테스트 모음입니다.
        심리·성격·IQ 결과는 자기 관찰을 위한 오락 콘텐츠이며 공식 검사나 진단을 대신하지
        않습니다.
      </Text>
      <View style={styles.links}>
        {links.map((link) => (
          <Text
            key={link.url}
            accessibilityRole="link"
            onPress={() => void Linking.openURL(link.url)}
            style={styles.link}
            maxFontSizeMultiplier={font.maxScale}
          >
            {link.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.lg,
    marginBottom: space.lg,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(17,17,17,0.18)',
  },
  title: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.lead,
    textAlign: 'center',
  },
  body: {
    marginTop: space.sm,
    color: colors.muted,
    fontFamily: font.family.body,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.7,
    textAlign: 'center',
  },
  links: {
    marginTop: space.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.md,
  },
  link: {
    color: colors.ink,
    fontFamily: font.family.bold,
    fontSize: font.size.caption,
    textDecorationLine: 'underline',
  },
});
