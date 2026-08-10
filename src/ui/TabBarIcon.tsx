import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { colors, radius } from './tokens';

export type TabBarIconName = 'exam' | 'records' | 'notes' | 'settings';

interface Props {
  readonly name: TabBarIconName;
  readonly focused: boolean;
  readonly color: ColorValue;
  readonly size?: number;
  readonly wrapWidth?: number;
  readonly wrapHeight?: number;
}

const iconName = {
  exam: 'pencil-outline',
  records: 'trophy-outline',
  notes: 'book-open-page-variant-outline',
  settings: 'cog-outline',
} as const;

/** 익숙한 도형과 일정한 선 굵기를 쓰는 Material Community Icons 기반 탭 아이콘. */
export function TabBarIcon({
  name,
  focused,
  color,
  size = 18,
  wrapWidth = 32,
  wrapHeight = 24,
}: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { width: wrapWidth, height: wrapHeight },
        focused && styles.focused,
      ]}
    >
      <MaterialCommunityIcons
        accessible={false}
        name={iconName[name]}
        size={size}
        color={focused ? colors.ink : color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  focused: { backgroundColor: colors.yellow },
});
