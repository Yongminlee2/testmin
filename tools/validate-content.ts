/// <reference types="node" />
import { AXES, type GradeTable, type Question } from '../src/engine/types';
import type { PoolScoring } from '../src/content/registry';
import { verifyGenerated } from '../src/engine/iq/verify';
import type { Generator } from '../src/engine/iq/generators';
import { puzzleKey, computeGeneratorDemand } from '../src/engine/iq/assembleIq';
import type { IqDrawConfig } from '../src/engine/iq/assembleIq';

export interface ScoredValidationOptions {
  /** 텍스트 문항은 4, IQ 도형·수열은 5 */
  readonly expectedChoiceCount: number;
}

/** 정답형 문항 묶음을 검사하고 사람이 읽을 수 있는 오류 목록을 돌려준다. */
export function validateScoredQuestions(
  questions: readonly Question[],
  opts: ScoredValidationOptions
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const q of questions) {
    const at = `[${q.id}]`;

    if (seen.has(q.id)) errors.push(`${at} 문항 ID가 중복됩니다`);
    seen.add(q.id);

    if (q.choices.length !== opts.expectedChoiceCount) {
      errors.push(
        `${at} 선택지 개수가 ${q.choices.length}개입니다 (규격 ${opts.expectedChoiceCount}개)`
      );
    }

    if (typeof q.answerIndex !== 'number') {
      errors.push(`${at} answerIndex가 없습니다`);
    } else if (q.answerIndex < 0 || q.answerIndex >= q.choices.length) {
      errors.push(
        `${at} answerIndex ${q.answerIndex}가 선택지 범위(0~${q.choices.length - 1})를 벗어납니다`
      );
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push(`${at} 해설이 비어 있습니다`);
    }

    if (!q.prompt || q.prompt.trim().length === 0) {
      errors.push(`${at} 질문이 비어 있습니다`);
    }

    const texts: string[] = [];
    q.choices.forEach((c, i) => {
      const text = (c.text ?? '').trim();
      if (text.length === 0 && c.figure === undefined) {
        errors.push(`${at} ${i}번 선택지가 비어 있습니다`);
        return;
      }
      if (texts.includes(text)) {
        errors.push(`${at} 선택지 텍스트가 중복됩니다: "${text}"`);
      }
      texts.push(text);
    });

    if (q.distractorNotes && q.distractorNotes.length !== q.choices.length) {
      errors.push(
        `${at} distractorNotes 길이(${q.distractorNotes.length})가 선택지 수(${q.choices.length})와 다릅니다`
      );
    }
  }

  return errors;
}

/**
 * 축 합계형 리커트 선택지가 지켜야 할 두 가지 표준 순서.
 * 방향(부호)이 아니라 "순서"에 척도의 의미가 담겨 있으므로 —
 * [1,2,-1,-2]처럼 개별 가중치는 유효 범위 안이어도 순서가 뒤섞이면
 * 척도가 조용히 뒤집힌다. 두 표준 순서만 허용한다.
 */
const CANONICAL_AXIS_WEIGHTS: readonly (readonly number[])[] = [
  [2, 1, -1, -2],
  [-2, -1, 1, 2],
];

/**
 * 축 합계형(personality) 문항 묶음을 검사한다. 정답이 없으므로 answerIndex 대신
 * axis·weight 순서·선택지 라벨 일관성을 본다.
 */
export function validateAxisQuestions(
  questions: readonly Question[],
  opts: ScoredValidationOptions
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  let canonicalLabels: readonly string[] | undefined;

  for (const q of questions) {
    const at = `[${q.id}]`;

    if (seen.has(q.id)) errors.push(`${at} 문항 ID가 중복됩니다`);
    seen.add(q.id);

    if (q.choices.length !== opts.expectedChoiceCount) {
      errors.push(
        `${at} 선택지 개수가 ${q.choices.length}개입니다 (규격 ${opts.expectedChoiceCount}개)`
      );
    }

    if (!q.axis || !(AXES as readonly string[]).includes(q.axis)) {
      errors.push(`${at} axis가 없거나 유효하지 않습니다: ${q.axis ?? '(없음)'}`);
    }

    if (typeof q.answerIndex === 'number') {
      errors.push(`${at} 축 합계형 문항에 answerIndex가 있습니다 (정답이 없는 시험입니다)`);
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push(`${at} 해설이 비어 있습니다`);
    }

    if (!q.prompt || q.prompt.trim().length === 0) {
      errors.push(`${at} 질문이 비어 있습니다`);
    }

    const labels = q.choices.map((c) => (c.text ?? '').trim());
    labels.forEach((text, i) => {
      if (text.length === 0) {
        errors.push(`${at} ${i}번 선택지가 비어 있습니다`);
      }
    });

    if (canonicalLabels === undefined) {
      canonicalLabels = labels;
    } else if (
      labels.length !== canonicalLabels.length ||
      labels.some((text, i) => text !== canonicalLabels?.[i])
    ) {
      errors.push(
        `${at} 선택지 라벨이 앞선 문항과 순서/내용이 다릅니다: [${labels.join(', ')}] ` +
          `(기준: [${canonicalLabels.join(', ')}])`
      );
    }

    const weights = q.choices.map((c) => c.weight);
    const isCanonicalOrder = CANONICAL_AXIS_WEIGHTS.some(
      (v) => v.length === weights.length && v.every((w, i) => w === weights[i])
    );
    if (!isCanonicalOrder) {
      errors.push(
        `${at} 선택지 weight 순서가 표준이 아닙니다: [${weights.join(', ')}] ` +
          `(허용: [2,1,-1,-2] 또는 [-2,-1,1,2])`
      );
    }
  }

  return errors;
}

/**
 * 득표형(심리 테스트) 문항 묶음을 검사한다. weight 대신 choice.typeId로 표를 던진다.
 * 유형별 득표 균형 검사는 여기 두지 않는다 — 그 검사는 유형 목록 자체를 아는
 * 콘텐츠별 jest 테스트(예: psych.test.ts)의 몫이다.
 */
export function validateVoteQuestions(
  questions: readonly Question[],
  opts: ScoredValidationOptions
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const q of questions) {
    const at = `[${q.id}]`;

    if (seen.has(q.id)) errors.push(`${at} 문항 ID가 중복됩니다`);
    seen.add(q.id);

    if (q.choices.length !== opts.expectedChoiceCount) {
      errors.push(
        `${at} 선택지 개수가 ${q.choices.length}개입니다 (규격 ${opts.expectedChoiceCount}개)`
      );
    }

    if (typeof q.answerIndex === 'number') {
      errors.push(`${at} 득표형 문항에 answerIndex가 있습니다 (정답이 없는 시험입니다)`);
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push(`${at} 해설이 비어 있습니다`);
    }

    if (!q.prompt || q.prompt.trim().length === 0) {
      errors.push(`${at} 질문이 비어 있습니다`);
    }

    const typeIds: string[] = [];
    q.choices.forEach((c, i) => {
      const text = (c.text ?? '').trim();
      if (text.length === 0) {
        errors.push(`${at} ${i}번 선택지가 비어 있습니다`);
      }
      if (typeof c.weight === 'number') {
        errors.push(`${at} ${i}번 선택지에 weight가 있습니다 (득표형은 weight를 쓰지 않습니다)`);
      }
      if (!c.typeId || c.typeId.trim().length === 0) {
        errors.push(`${at} ${i}번 선택지에 typeId가 없습니다`);
      } else {
        typeIds.push(c.typeId);
      }
    });

    if (new Set(typeIds).size !== typeIds.length) {
      errors.push(`${at} 선택지의 typeId가 중복됩니다: [${typeIds.join(', ')}]`);
    }
  }

  return errors;
}

/**
 * 정답 위치가 한쪽으로 쏠리지 않았는지 검사한다.
 * 손으로 366문항을 다 확인할 수 없으니, 특정 인덱스가 40%를 넘으면 실패시킨다.
 * (예: 15문항 전부 answerIndex 0이면 100% — 반드시 걸린다.)
 */
export function validateAnswerDistribution(
  poolId: string,
  questions: readonly Question[]
): string[] {
  const errors: string[] = [];
  const scorable = questions.filter((q) => typeof q.answerIndex === 'number');
  if (scorable.length === 0) return errors;

  const counts = new Map<number, number>();
  for (const q of scorable) {
    const idx = q.answerIndex as number;
    counts.set(idx, (counts.get(idx) ?? 0) + 1);
  }

  const threshold = scorable.length * 0.4;
  for (const [idx, count] of counts) {
    if (count > threshold) {
      const pct = Math.round((count / scorable.length) * 100);
      errors.push(
        `[${poolId}] 정답 위치 ${idx}번이 ${count}/${scorable.length}문항(${pct}%)을 차지합니다 — 40%를 넘습니다`
      );
    }
  }

  return errors;
}

/** 급수 테이블이 0~100%를 빈틈없이 덮는지 검사한다. */
export function validateGradeTable(id: string, table: GradeTable): string[] {
  const errors: string[] = [];
  const at = `[${id}]`;
  const bands = table.bands;

  if (bands.length === 0) {
    errors.push(`${at} 급수 밴드가 비어 있습니다`);
    return errors;
  }

  for (let i = 1; i < bands.length; i++) {
    if ((bands[i] as { min: number }).min >= (bands[i - 1] as { min: number }).min) {
      errors.push(`${at} 급수 밴드가 min 기준 내림차순이 아닙니다 (${i}번째)`);
      break;
    }
  }

  if ((bands[0] as { min: number }).min !== 100) {
    errors.push(`${at} 최상 밴드의 min이 100이 아닙니다`);
  }
  if ((bands[bands.length - 1] as { min: number }).min !== 0) {
    errors.push(`${at} 최하 밴드의 min이 0%가 아닙니다`);
  }

  for (const b of bands) {
    if (!b.title || b.title.trim().length === 0) {
      errors.push(`${at} ${b.grade}급의 칭호가 비어 있습니다`);
    }
  }

  return errors;
}

/** 정답형 문항의 규격 선택지 개수. 텍스트 문항은 4, IQ 도형·수열은 5. */
function expectedChoiceCountFor(testId: string): number {
  return testId === 'iq' ? 5 : 4;
}

/**
 * POOLS를 순회하며 각 풀의 채점 방식(POOL_SCORING)에 맞는 검사를 돌린다.
 * 풀은 있는데 채점 방식이 등록되지 않은 경우 조용히 건너뛰지 않고 그 자체를
 * 오류로 낸다 — 등록 누락이 "검증 안 됨"으로 새는 구멍을 막기 위해서다.
 */
export function validateAllPools(
  pools: Record<string, readonly Question[]>,
  poolScoring: Record<string, PoolScoring>
): { errors: string[]; totalQuestions: number } {
  const errors: string[] = [];
  let totalQuestions = 0;

  for (const [poolId, questions] of Object.entries(pools)) {
    const [testId] = poolId.split(':');
    totalQuestions += questions.length;

    const scoring = poolScoring[poolId];
    if (scoring === undefined) {
      errors.push(
        `[${poolId}] POOL_SCORING에 채점 방식이 등록되어 있지 않습니다 — 검증할 수 없습니다`
      );
      continue;
    }

    const opts = { expectedChoiceCount: expectedChoiceCountFor(testId ?? '') };

    if (scoring === 'axis') {
      errors.push(...validateAxisQuestions(questions, opts));
    } else if (scoring === 'vote') {
      errors.push(...validateVoteQuestions(questions, opts));
    } else {
      errors.push(
        ...validateScoredQuestions(questions, opts),
        ...validateAnswerDistribution(poolId, questions)
      );
    }
  }

  return { errors, totalQuestions };
}

/**
 * IQ는 POOLS에 없다 — 시드에서 생성하기 때문에 정적 배열로 못 담는다.
 * 그래서 validateAllPools(POOLS 순회)는 IQ를 영원히 건너뛴다. 여기서 등록된
 * 생성기를 직접 시드 1~200으로 돌려 verifyGenerated로 검사한다 — 앱의 가장 큰
 * 문항 공급원이 릴리스 게이트를 그냥 통과하는 구멍을 막는다.
 *
 * 오류 메시지는 verifyGenerated가 이미 `[생성기id/시드]` 형식으로 붙여 주므로
 * 여기서 다시 접두사를 만들지 않는다.
 */
export function validateGenerators(
  generators: readonly Generator[],
  seedCount = 200
): { errors: string[]; totalGenerated: number } {
  const errors: string[] = [];
  let totalGenerated = 0;

  for (const gen of generators) {
    for (let seed = 1; seed <= seedCount; seed++) {
      totalGenerated += 1;
      errors.push(...verifyGenerated(gen.generate(seed)));
    }
  }

  return { errors, totalGenerated };
}

/**
 * 생성기 하나가 실제로 만들어낼 수 있는 서로 다른 퍼즐이 몇 개인지 시드
 * seedCount개로 추정한다. puzzleKey는 assembleIq의 중복 방지와 같은 기준을
 * 쓴다 — 여기서 "다르다"고 세는 기준이 실제 출제에서 "다르다"고 인정하는
 * 기준과 어긋나면 이 용량 수치 자체가 무의미해진다.
 */
export function measureGeneratorCapacity(gen: Generator, seedCount = 1000): number {
  const seen = new Set<string>();
  for (let seed = 1; seed <= seedCount; seed++) {
    seen.add(puzzleKey(gen.generate(seed)));
  }
  return seen.size;
}

/**
 * validateGenerators(생성기 각각이 유효한 문항을 내는가)와는 다른 종류의
 * 구멍을 잡는다: 생성기 각각은 멀쩡해도, IQ_DRAW 같은 출제 설정이 한 세트당
 * 요구하는 슬롯 수(수요)가 그 생성기의 실측 퍼즐 용량 이상이면 assembleIq는
 * 재시도를 다 써도 새 퍼즐을 못 찾아 예외를 던진다 — count 생성기가 원래
 * 퍼즐 3종뿐이고 IQ_DRAW가 정확히 3슬롯을 요구해서(용량==수요, 여유 0)
 * 실제로 벌어졌던 결함이다.
 *
 * 그래서 등호가 아니라 **엄격히 큼(capacity > demand)**을 요구한다 — 용량이
 * 수요와 같기만 해도 재시도로 새 퍼즐을 못 찾는 시드가 반드시 나온다.
 * 이 검사가 없으면 IQ_DRAW를 바꾸는 순간(질문 수↑, 특정 난이도 배분↑)
 * validate:content는 여전히 통과한 채로 실제 출제에서만 assembleIq가
 * 터진다 — 릴리스 게이트가 못 보는 사각지대였다.
 */
export function validateGeneratorCapacity(
  generators: readonly Generator[],
  config: IqDrawConfig,
  seedCount = 1000
): string[] {
  const errors: string[] = [];
  const demand = computeGeneratorDemand(config, generators);

  for (const gen of generators) {
    const need = demand.get(gen.id) ?? 0;
    if (need === 0) continue;

    const capacity = measureGeneratorCapacity(gen, seedCount);
    if (capacity <= need) {
      errors.push(
        `[생성기 ${gen.id}] 용량(서로 다른 퍼즐 ${capacity}개)이 한 세트당 필요한 ` +
          `슬롯 수(${need}개)보다 크지 않습니다 — 용량이 수요보다 반드시 커야 합니다`
      );
    }
  }

  return errors;
}

/** CLI 진입점. 문제가 있으면 exit 1. */
async function main(): Promise<void> {
  // registry.ts가 실제 콘텐츠 인벤토리다 — 파일 경로를 직접 나열하지 않고
  // 여기 등록된 풀을 그대로 순회한다. 새 지역/카테고리가 POOLS에 추가되면
  // 이 스크립트를 고치지 않아도 자동으로 검증 대상이 된다.
  const { POOLS, POOL_SCORING, IQ_DRAW } = await import('../src/content/registry');
  const { GENERATORS } = await import('../src/engine/iq/generators');
  const grades = (await import('../src/content/grades.json')).default as unknown as Record<
    string,
    GradeTable
  >;

  const { errors: poolErrors, totalQuestions } = validateAllPools(POOLS, POOL_SCORING);
  const { errors: generatorErrors, totalGenerated } = validateGenerators(GENERATORS);
  const capacityErrors = validateGeneratorCapacity(GENERATORS, IQ_DRAW);
  const errors = [
    ...poolErrors,
    ...generatorErrors,
    ...capacityErrors,
    ...Object.entries(grades).flatMap(([id, table]) => validateGradeTable(id, table)),
  ];

  if (errors.length > 0) {
    console.error(`콘텐츠 검증 실패 — ${errors.length}건`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  console.log(
    `콘텐츠 검증 통과 — 문항 ${totalQuestions}개, 생성형 검증 ${totalGenerated}건, ` +
      `생성기 용량 검사 ${GENERATORS.length}종, 급수 테이블 ${Object.keys(grades).length}개`
  );
}

if (require.main === module) {
  void main();
}
