/**
 * IQ 문항 id의 계약. 세션 저장소는 Question[]만 들고 있고 generatorId·seed는
 * 버린다. 오답노트(계획 4)는 문항 전체가 아니라 이 두 값만 저장해서 나중에
 * 복원하는 설계라, 만드는 쪽과 읽는 쪽이 같은 형식을 봐야 한다.
 */

/** 생성기가 만드는 문항 id 형식: `iq-<generatorId>-<seed>` */
export function iqQuestionId(generatorId: string, seed: number): string {
  return `iq-${generatorId}-${seed}`;
}

/** 형식에 안 맞으면 undefined. 호출부가 폴백을 준비한다. */
export function parseIqQuestionId(
  id: string
): { generatorId: string; seed: number } | undefined {
  // generatorId를 [a-z]+로 좁혀둔다 — 숫자나 하이픈이 들어간 generatorId(예: 'rotate2')를
  // 등록하면 이 정규식이 그 문항의 id를 파싱하지 못해 오답노트에서 조용히 사라진다.
  // 그래도 이 범위를 넓히지 않는 이유는, questionId.test.ts의 100-seed round-trip
  // 테스트가 GENERATORS를 직접 순회하며 "만든 id를 파싱해 원래 문항을 복원할 수 있는가"를
  // 검사하고 있어서다 — 그런 generatorId가 등록되는 순간 그 테스트가 즉시 실패한다.
  // 정규식을 느슨하게 "고치거나" 그 round-trip 테스트를 지우면 이 안전망이 없어진다.
  const m = /^iq-([a-z]+)-(\d+)$/.exec(id);
  if (m === null) return undefined;
  return { generatorId: m[1] as string, seed: Number(m[2]) };
}
