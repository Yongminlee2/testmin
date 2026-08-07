/**
 * testId 필드를 가진 목록을 testId별로 묶는다. 성적표·오답노트가 똑같이
 * "시험별로 묶어서 보여준다"를 요구해서 여기 하나로 공유한다.
 *
 * 그룹 순서는 목록에 처음 나온 순서를 따르고, 그룹 안에서는 원래 순서를 그대로
 * 유지한다 — 정렬을 새로 하지 않는다. records/notes는 이미 최신순(맨 앞이 최신)으로
 * 정렬돼 있으므로, 이 규칙을 따르면 자연스럽게 "가장 최근에 응시한 시험" 그룹이
 * 먼저 나온다.
 */
export function groupByTestId<T extends { readonly testId: string }>(
  items: readonly T[]
): { readonly testId: string; readonly items: T[] }[] {
  const order: string[] = [];
  const byTestId = new Map<string, T[]>();

  for (const item of items) {
    let bucket = byTestId.get(item.testId);
    if (bucket === undefined) {
      bucket = [];
      byTestId.set(item.testId, bucket);
      order.push(item.testId);
    }
    bucket.push(item);
  }

  return order.map((testId) => ({ testId, items: byTestId.get(testId) ?? [] }));
}
