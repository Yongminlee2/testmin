import { ScrollView, Text, View, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageTitle } from '@/ui/PageTitle';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { SettingsLinkRow } from '@/ui/SettingsLinkRow';
import { confirmDestructive } from '@/ui/dialog';
import { useHistory } from '@/store/history';
import {
  appWebsiteUrl,
  licensesUrl,
  privacyPolicyUrl,
  supportEmail,
  supportUrl,
  termsUrl,
} from '@/appMeta';
import { colors, font, space } from '@/ui/tokens';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const records = useHistory((state) => state.records);
  const notes = useHistory((state) => state.notes);
  const hasLocalData = records.length > 0 || notes.length > 0;

  const clearLocalData = () => {
    confirmDestructive(
      '내 기록을 모두 지울까요?',
      '성적표와 오답노트가 이 기기에서 삭제되며 되돌릴 수 없습니다.',
      '모두 지우기',
      () => void useHistory.getState().clearAll()
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
    >
      <PageTitle title="설정" />

      <Card color={colors.yellow} style={styles.card}>
        <Text style={styles.version} maxFontSizeMultiplier={font.maxScale}>
          테스트의 민족 v{appVersion}
        </Text>
        <Text style={styles.heroText} maxFontSizeMultiplier={font.maxScale}>
          계정도 광고도 분석 도구도 없습니다.{'\n'}
          응시 기록은 이 기기에만 남습니다.
        </Text>
      </Card>

      <SectionTitle title="내 데이터" />
      <Card style={styles.card}>
        <View style={styles.statRow}>
          <Stat label="응시 기록" value={String(records.length) + '개'} />
          <View style={styles.statDivider} />
          <Stat label="오답노트" value={String(notes.length) + '개'} />
        </View>
        <Text style={styles.dataNote} maxFontSizeMultiplier={font.maxScale}>
          서버로 전송하지 않으며 앱을 삭제하면 함께 사라집니다.
        </Text>
        <Button
          label="기기 저장 기록 모두 지우기"
          color={colors.coral}
          disabled={!hasLocalData}
          onPress={clearLocalData}
          testID="clear-local-data"
        />
      </Card>

      <SectionTitle title="안내와 지원" />
      <Card style={styles.card}>
        <SettingsLinkRow
          icon="home"
          label="앱 소개"
          detail="기능과 공식 안내"
          href={appWebsiteUrl}
          testID="open-app-website"
        />
        <SettingsLinkRow
          icon="shield"
          label="개인정보처리방침"
          detail="수집 정보 없음 · 기기 저장 방식"
          href={privacyPolicyUrl}
          testID="open-privacy"
        />
        <SettingsLinkRow
          icon="file-text"
          label="이용 안내"
          detail="오락용 테스트와 결과 해석 범위"
          href={termsUrl}
          testID="open-terms"
        />
        <SettingsLinkRow
          icon="help-circle"
          label="도움말과 문의"
          detail={supportEmail}
          href={supportUrl}
          testID="open-support"
        />
        <SettingsLinkRow
          icon="book-open"
          label="오픈소스 라이선스"
          detail="앱에 사용한 글꼴과 라이선스"
          href={licensesUrl}
          testID="open-licenses"
        />
      </Card>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle} maxFontSizeMultiplier={font.maxScale}>
          재미로 보는 고사입니다
        </Text>
        <Text style={styles.noticeText} maxFontSizeMultiplier={font.maxScale}>
          모든 문항과 결과 문구는 자체 제작했습니다. 심리·성격·IQ 결과는 임상적 진단이나
          공인 검사를 대신하지 않습니다.
        </Text>
      </View>
    </ScrollView>
  );
}

function SectionTitle({ title }: { readonly title: string }) {
  return (
    <Text style={styles.sectionTitle} maxFontSizeMultiplier={font.maxScale}>
      {title}
    </Text>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} maxFontSizeMultiplier={font.maxScale}>
        {value}
      </Text>
      <Text style={styles.statLabel} maxFontSizeMultiplier={font.maxScale}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg },
  card: { marginBottom: space.lg },
  version: {
    fontSize: font.size.title,
    fontFamily: font.family.display,
    lineHeight: 28,
    color: colors.ink,
    textAlign: 'center',
  },
  heroText: {
    marginTop: space.sm,
    fontSize: font.size.body,
    fontFamily: font.family.body,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 21,
  },
  sectionTitle: {
    marginBottom: space.sm,
    fontSize: font.size.lead,
    fontFamily: font.family.black,
    color: colors.ink,
  },
  statRow: { flexDirection: 'row', alignItems: 'stretch', marginBottom: space.md },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(17,17,17,0.2)' },
  statValue: {
    color: colors.ink,
    fontSize: font.size.title,
    lineHeight: 26,
    fontFamily: font.family.black,
  },
  statLabel: {
    marginTop: 2,
    color: colors.muted,
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
  },
  dataNote: {
    marginBottom: space.md,
    color: colors.muted,
    fontSize: font.size.caption,
    lineHeight: 17,
    textAlign: 'center',
    fontFamily: font.family.body,
  },
  notice: { paddingHorizontal: space.sm, paddingBottom: space.lg },
  noticeTitle: {
    color: colors.ink,
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    textAlign: 'center',
  },
  noticeText: {
    marginTop: space.xs,
    color: colors.muted,
    fontSize: font.size.caption,
    fontFamily: font.family.body,
    lineHeight: 17,
    textAlign: 'center',
  },
});
