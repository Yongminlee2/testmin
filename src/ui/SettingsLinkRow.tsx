import type { ComponentProps } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { notify } from './dialog';
import { InteractivePressable } from './InteractivePressable';
import { colors, font, space } from './tokens';

interface Props {
  readonly icon: ComponentProps<typeof Feather>['name'];
  readonly label: string;
  readonly detail?: string;
  readonly href: string;
  readonly testID?: string;
}

export function SettingsLinkRow({ icon, label, detail, href, testID }: Props) {
  const open = async () => {
    try {
      await Linking.openURL(href);
    } catch {
      notify('페이지를 열지 못했습니다', '잠시 뒤 다시 시도해주세요.');
    }
  };

  return (
    <InteractivePressable
      testID={testID}
      accessibilityRole="link"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      accessibilityHint="외부 브라우저에서 엽니다"
      onPress={() => void open()}
      style={styles.row}
    >
      <View style={styles.iconWrap}>
        <Feather name={icon} size={18} color={colors.ink} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
          {label}
        </Text>
        {detail ? (
          <Text style={styles.detail} maxFontSizeMultiplier={font.maxScale}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Feather name="external-link" size={17} color={colors.muted} />
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(17,17,17,0.18)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.cream,
  },
  copy: { flex: 1 },
  label: {
    color: colors.ink,
    fontFamily: font.family.bold,
    fontSize: font.size.body,
    lineHeight: 20,
  },
  detail: {
    marginTop: 1,
    color: colors.muted,
    fontFamily: font.family.body,
    fontSize: font.size.caption,
    lineHeight: 16,
  },
});
