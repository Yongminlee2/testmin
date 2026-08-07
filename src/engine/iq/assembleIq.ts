import { hashSeed, mulberry32, shuffle } from '../rng';
import { GENERATORS } from './generators';
import type { Generator } from './generators';
import type { Difficulty, GeneratedQuestion } from '../types';

export interface IqDrawConfig {
  readonly questionCount: number;
  /** 난이도별 목표 개수. 합이 questionCount와 다르면 questionCount가 우선한다. */
  readonly difficultyMix: Partial<Record<Difficulty, number>>;
}

/** 같은 퍼즐이 한 세트에 두 번 나오지 않게 하기 위한 재시도 한도. */
const MAX_ATTEMPTS_PER_SLOT = 40;

/**
 * 문항을 "같은 퍼즐인가"로 비교하는 키. 선택지 순서는 무시한다.
 *
 * assembleIq의 중복 방지뿐 아니라, 생성기 한 종이 실제로 만들 수 있는 "서로
 * 다른 퍼즐이 몇 개인가"를 재는 용량 검사(tools/validate-content.ts의
 * measureGeneratorCapacity)도 같은 키로 세야 한다 — 출제 시점의 "같은 퍼즐"
 * 기준과 릴리스 게이트의 "같은 퍼즐" 기준이 어긋나면 용량 검사가 무의미해진다.
 */
export function puzzleKey(gq: GeneratedQuestion): string {
  const q = gq.question;
  return q.figure ? `${gq.generatorId}|${JSON.stringify(q.figure)}` : `${gq.generatorId}|${q.prompt}`;
}

/**
 * 생성기를 난이도별로 묶는다. assembleIq의 실제 출제와, 용량/수요를 재는
 * computeGeneratorDemand가 이 묶음 하나를 같이 쓴다 — 따로 적으면 언젠가 어긋난다.
 */
export function groupByDifficulty(
  generators: readonly Generator[]
): Map<Difficulty, readonly Generator[]> {
  const byDifficulty = new Map<Difficulty, readonly Generator[]>();
  for (const d of [1, 2, 3] as const) {
    byDifficulty.set(
      d,
      generators.filter((g) => g.difficulty === d)
    );
  }
  return byDifficulty;
}

/**
 * 슬롯을 난이도로만 채운 배열을 만든다(아직 안 섞은 상태). 난이도별 목표를
 * 먼저 채우고, 합이 questionCount에 못 미치면 **생성기가 있는 난이도로만**
 * 나머지를 채운다.
 *
 * 셔플 전 배열이지만 난이도별 슬롯 "개수" 자체는 셔플로 바뀌지 않는다 —
 * 그래서 셔플 없이 이 함수만 불러도 수요 분석(computeGeneratorDemand)에는
 * 정확하다. `anyDifficulty.length > 0` 가드는 assembleIq를 통해서는 항상
 * 만족되지만(GENERATORS가 비면 그 전에 예외를 던진다), 이 함수를 테스트나
 * 용량 분석에서 생성기가 하나도 없는 목록으로 직접 부를 수도 있으니
 * 무한 루프를 막아둔다.
 */
export function planSlots(config: IqDrawConfig, generators: readonly Generator[]): Difficulty[] {
  const byDifficulty = groupByDifficulty(generators);

  const slots: Difficulty[] = [];
  for (const d of [1, 2, 3] as const) {
    const want = config.difficultyMix[d] ?? 0;
    // 그 난이도에 생성기가 하나도 없으면 자리를 만들지 않는다.
    // 만들면 아래 while 루프가 영원히 못 채운다.
    if ((byDifficulty.get(d) ?? []).length === 0) continue;
    for (let i = 0; i < want && slots.length < config.questionCount; i++) slots.push(d);
  }

  const anyDifficulty = [1, 2, 3].filter(
    (d) => (byDifficulty.get(d as Difficulty) ?? []).length > 0
  ) as Difficulty[];
  while (slots.length < config.questionCount && anyDifficulty.length > 0) {
    slots.push(anyDifficulty[slots.length % anyDifficulty.length] as Difficulty);
  }

  return slots;
}

/**
 * slots(난이도 배열, 셔플됐든 안 됐든 상관없다)를 순서대로 훑으며 각 슬롯을
 * 담당할 생성기를 정한다. 같은 난이도 안에서는 **그 난이도에서 몇 번째
 * 등장인가**로 돌아가며 쓴다(라운드로빈) — forEach의 전역 인덱스로 나누면
 * 난이도 슬롯이 20자리 전체에 흩어진 뒤라 홀짝이 사실상 무작위가 되고,
 * 파라미터 공간이 좁은 생성기가 감당 못 할 횟수로 몰릴 수 있다
 * (Task 6 리뷰에서 잡힌 결함 — count가 원래 퍼즐 3종뿐이던 시절 재현됨).
 */
export function assignGenerators(
  slots: readonly Difficulty[],
  generators: readonly Generator[]
): Generator[] {
  const byDifficulty = groupByDifficulty(generators);
  const usedInDifficulty = new Map<Difficulty, number>();

  return slots.map((difficulty) => {
    const pool = byDifficulty.get(difficulty) as readonly Generator[];
    const nth = usedInDifficulty.get(difficulty) ?? 0;
    usedInDifficulty.set(difficulty, nth + 1);
    return pool[nth % pool.length] as Generator;
  });
}

/**
 * config(예: IQ_DRAW) 하나가 각 생성기에 한 세트당 몇 슬롯을 요구하는지 센다.
 * 릴리스 게이트(tools/validate-content.ts의 validateGeneratorCapacity)가 이
 * 수요를 생성기의 실측 퍼즐 용량과 비교해, 파라미터 공간이 좁은 생성기가
 * 감당 못 할 슬롯을 배정받는 조합을 미리 잡는다.
 */
export function computeGeneratorDemand(
  config: IqDrawConfig,
  generators: readonly Generator[]
): Map<string, number> {
  const slots = planSlots(config, generators);
  const assigned = assignGenerators(slots, generators);

  const demand = new Map<string, number>();
  for (const gen of assigned) {
    demand.set(gen.id, (demand.get(gen.id) ?? 0) + 1);
  }
  return demand;
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
  const slots = shuffle(planSlots(config, GENERATORS), rand);
  const assignedGenerators = assignGenerators(slots, GENERATORS);

  const out: GeneratedQuestion[] = [];
  const seen = new Set<string>();

  slots.forEach((_difficulty, i) => {
    const gen = assignedGenerators[i] as Generator;

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
