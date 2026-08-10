import { dailyPick, localDayNumber } from '@/engine/dailyPick';

describe('dailyPick', () => {
  it('keeps the same item throughout the local day', () => {
    const items = ['a', 'b', 'c'];
    const morning = new Date(2026, 7, 10, 1, 5);
    const night = new Date(2026, 7, 10, 23, 55);

    expect(dailyPick(items, morning)).toBe(dailyPick(items, night));
    expect(localDayNumber(morning)).toBe(localDayNumber(night));
  });

  it('rotates to the next item on the next day', () => {
    const items = ['a', 'b', 'c', 'd'];
    const first = new Date(2026, 7, 10, 12);
    const next = new Date(2026, 7, 11, 12);
    const firstIndex = items.indexOf(dailyPick(items, first) ?? '');
    const nextIndex = items.indexOf(dailyPick(items, next) ?? '');

    expect(nextIndex).toBe((firstIndex + 1) % items.length);
  });

  it('returns undefined for an empty list', () => {
    expect(dailyPick([], new Date(2026, 7, 10))).toBeUndefined();
  });
});
