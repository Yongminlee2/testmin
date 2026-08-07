import { hashSeed, mulberry32, shuffle } from '../rng';
import { GENERATORS } from './generators';
import type { Difficulty, GeneratedQuestion } from '../types';

export interface IqDrawConfig {
  readonly questionCount: number;
  /** 난이도별 목표 개수. 합이 questionCount와 다르면 questionCount가 우선한다. */
  readonly difficultyMix: Partial<Record<Difficulty, number>>;
}

/** 같은 퍼즐이 한 세트에 두 번 나오지 않게 하기 위한 재시도 한도. */
const MAX_ATTEMPTS_PER_SLOT = 40;

/** 문항을 "같은 퍼즐인가"로 비교하는 키. 선택지 순서는 무시한다. */
function puzzleKey(gq: GeneratedQuestion): string {
  const q = gq.question;
  return q.figure ? `${gq.generatorId}|${JSON.stringify(q.figure)}` : `${gq.generatorId}|${q.prompt}`;
}

/**
 * 시드에서 IQ 한 세트를 만든다. 같은 시드는 항상 같은 세트를 준다.
 *
 * 선택지는 **여기서 섞지 않는다** — 생성기가 이미 자기 rng로 섞는다.
 * (`assemble()`이 정적 풀에 대해 하는 일을 생성기가 대신하고 있다.)
 */
export function assembleIq(seed: number, config: IqDrawConfig): GeneratedQuestion[] {
  if (GENERATORS.length === 0) {
    throw new Error('등록된 생성기가 없습니다');
  }

  const rand = mulberry32(seed);
  const byDifficulty = new Map<Difficulty, typeof GENERATORS>();
  for (const d of [1, 2, 3] as const) {
    byDifficulty.set(d, GENERATORS.filter((g) => g.difficulty === d));
  }

  // 난이도별 목표를 먼저 채우고, 남으면 전체에서 채운다.
  const slots: Difficulty[] = [];
  for (const d of [1, 2, 3] as const) {
    const want = config.difficultyMix[d] ?? 0;
    // 그 난이도에 생성기가 하나도 없으면 자리를 만들지 않는다.
    // 만들면 아래 루프가 영원히 못 채운다.
    if ((byDifficulty.get(d) ?? []).length === 0) continue;
    for (let i = 0; i < want && slots.length < config.questionCount; i++) slots.push(d);
  }
  const anyDifficulty = [1, 2, 3].filter(
    (d) => (byDifficulty.get(d as Difficulty) ?? []).length > 0
  ) as Difficulty[];
  while (slots.length < config.questionCount) {
    slots.push(anyDifficulty[slots.length % anyDifficulty.length] as Difficulty);
  }

  const out: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  // 난이도별로 몇 번째 슬롯인지 세는 카운터. 생성기 순환은 **이 카운터**로 해야
  // 진짜 라운드로빈이 된다 — forEach의 전역 인덱스로 나누면 난이도 슬롯이 20자리
  // 전체에 흩어진 뒤라 같은 난이도끼리도 홀짝이 사실상 무작위가 되고, 파라미터
  // 공간이 좁은 생성기(count: 시작값 3가지뿐)가 감당 못 할 횟수로 몰릴 수 있다.
  const usedInDifficulty = new Map<Difficulty, number>();

  shuffle(slots, rand).forEach((difficulty, i) => {
    const pool = byDifficulty.get(difficulty) as typeof GENERATORS;
    // 같은 난이도 안에서는 생성기를 돌아가며 쓴다. 그 난이도에 생성기가 하나뿐이면
    // 그 하나가 전부를 맡는다 — 시드가 달라 문항은 서로 다르다.
    const nth = usedInDifficulty.get(difficulty) ?? 0;
    usedInDifficulty.set(difficulty, nth + 1);
    const gen = pool[nth % pool.length] as (typeof GENERATORS)[number];

    // 같은 퍼즐이 두 번 나오면 앱이 고장난 것처럼 보인다.
    // 생성기의 파라미터 공간이 좁아서(회전은 9가지뿐) 실제로 자주 부딪힌다.
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_SLOT; attempt++) {
      const gq = gen.generate(hashSeed(`${seed}:${gen.id}:${i}:${attempt}`));
      const key = puzzleKey(gq);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(gq);
        return;
      }
    }
    throw new Error(
      `생성기 ${gen.id}가 ${MAX_ATTEMPTS_PER_SLOT}번 시도에도 새 퍼즐을 못 만들었습니다 ` +
        `(seed=${seed}, slot=${i}). 파라미터 공간이 출제 수보다 좁습니다.`
    );
  });

  return out;
}
