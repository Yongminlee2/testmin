/** 기기의 현지 날짜를 UTC 일련번호로 바꿔 DST와 시각에 흔들리지 않게 한다. */
export function localDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
}

/** 같은 날짜에는 같은 항목, 다음 날에는 다음 항목을 고른다. */
export function dailyPick<T>(items: readonly T[], date: Date): T | undefined {
  if (items.length === 0) return undefined;
  const index = ((localDayNumber(date) % items.length) + items.length) % items.length;
  return items[index];
}
