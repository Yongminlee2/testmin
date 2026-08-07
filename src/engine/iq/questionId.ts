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
  const m = /^iq-([a-z]+)-(\d+)$/.exec(id);
  if (m === null) return undefined;
  return { generatorId: m[1] as string, seed: Number(m[2]) };
}
