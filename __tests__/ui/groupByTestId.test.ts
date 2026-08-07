import { groupByTestId } from '@/ui/groupByTestId';

interface Item {
  readonly testId: string;
  readonly label: string;
}

function item(testId: string, label: string): Item {
  return { testId, label };
}

describe('groupByTestId', () => {
  test('빈 목록은 빈 그룹 목록을 준다', () => {
    expect(groupByTestId<Item>([])).toEqual([]);
  });

  test('testId별로 묶고, 그룹 순서는 목록에 처음 나온 순서를 따른다', () => {
    const items = [item('iq', 'a'), item('dialect', 'b'), item('iq', 'c')];
    const groups = groupByTestId(items);
    expect(groups.map((g) => g.testId)).toEqual(['iq', 'dialect']);
  });

  test('같은 testId 안에서는 원래 순서를 그대로 유지한다', () => {
    const items = [item('iq', 'a'), item('iq', 'b'), item('iq', 'c')];
    const groups = groupByTestId(items);
    expect(groups).toEqual([
      { testId: 'iq', items: [item('iq', 'a'), item('iq', 'b'), item('iq', 'c')] },
    ]);
  });

  test('서로 다른 testId의 항목은 각자의 그룹에만 들어간다', () => {
    const items = [item('iq', 'a'), item('dialect', 'b'), item('iq', 'c'), item('dialect', 'd')];
    const groups = groupByTestId(items);
    expect(groups).toEqual([
      { testId: 'iq', items: [item('iq', 'a'), item('iq', 'c')] },
      { testId: 'dialect', items: [item('dialect', 'b'), item('dialect', 'd')] },
    ]);
  });
});
