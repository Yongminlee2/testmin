import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { colors, radius } from './tokens';

export type TabBarIconName = 'exam' | 'records' | 'notes' | 'settings';

interface Props {
  readonly name: TabBarIconName;
  readonly focused: boolean;
  readonly color: ColorValue;
}

const iconName = {
  exam: 'pencil-outline',
  records: 'trophy-outline',
  notes: 'book-open-page-variant-outline',
  settings: 'cog-outline',
} as const;

/** 익숙한 도형과 일정한 선 굵기를 쓰는 Material Community Icons 기반 탭 아이콘. */
export function TabBarIcon({ name, focused, color }: Props) {
  return (
    <View style={[styles.wrap, focused && styles.focused]}>
      <MaterialCommunityIcons
        accessible={false}
        name={iconName[name]}
        size={18}
        color={focused ? colors.ink : color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  focused: { backgroundColor: colors.yellow },
});
