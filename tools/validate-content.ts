/// <reference types="node" />
import { AXES, type GeneratedQuestion, type GradeTable, type Question } from '../src/engine/types';
import type { PoolScoring } from '../src/content/registry';
import { verifyGenerated } from '../src/engine/iq/verify';
import type { Generator } from '../src/engine/iq/generators';
import { puzzleKey, computeGeneratorDemand, assembleIq } from '../src/engine/iq/assembleIq';
import type { IqDrawConfig } from '../src/engine/iq/assembleIq';
import { parseIqQuestionId } from '../src/engine/iq/questionId';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

/**
 * 리뷰 I-6 — 게이트가 IQ에 대해 실제로 도는 것은 validateGenerators(생성기가
 * 시드 1~200에서 유효한 문항을 내는가)와 validateGeneratorCapacity(용량이
 * 수요보다 큰가)뿐이다. 둘 다 생성기 **하나**를 시드 하나로 돌린 결과만 본다
 * — 실제 출제 함수인 assembleIq의 **출력**(한 세트 20문항, 여러 세트)을 보는
 * 검사가 없다. 그래서 다음 세 가지가 게이트를 그냥 통과한다.
 *
 * ① 정답 위치 분포 — validateAnswerDistribution은 이미 구현되어 있고 POOLS
 *    풀에는 잘 동작하는데, IQ는 POOLS에 없으므로 이 앱의 최대 문항 공급원
 *    (한 세트 20문항)에는 영원히 안 닿는다. 계획 1에서 출시 직전까지 갔던
 *    "정답이 전부 1번"이 여기 안 걸리면 게이트가 못 잡는다(M1).
 *
 *    **생성기별로 나눠서 검사한다 — 전체를 하나로 합쳐서 보면 안 된다.**
 *    I-1이 잡은 바로 그 함정이 여기서도 그대로 재현된다: sequence는 한
 *    세트 20슬롯 중 2슬롯만 받으므로, sequence 혼자 정답을 전부 1번에
 *    고정해도 IQ 전체를 한 풀로 합치면 그 지분이 10%대로 묻혀 40% 임계값을
 *    영원히 못 넘는다(세트를 더 많이 모아도 지분 자체가 안 바뀌므로 시드
 *    수를 늘리는 것으로는 해결되지 않는다). `iq:<generatorId>`별로 쪼개서
 *    validateAnswerDistribution을 따로 불러야 이 뮤테이션이 잡힌다.
 * ② 격자 구조 — figure.kind가 'grid'면 9칸이어야 하고 blankIndex가 있어야
 *    한다. 없으면(M3) 격자 9칸이 전부 그려져 정답이 그대로 인쇄된 문항이
 *    통과한다. (blankIndex가 "있는지"까지만 본다 — 그 값이 실제로 정답 칸을
 *    가리키는지는 생성기별 jest 테스트의 몫이다(I-2). 여기서 "8번이어야
 *    한다"고 못박으면 이 게이트 검사가 특정 관례에 결합돼 버린다. 그래서
 *    M4(blankIndex 8→0)처럼 값이 있지만 틀린 경우는 이 검사 하나만으로는
 *    안 잡힌다 — I-2의 jest 테스트가 그 층을 담당한다.)
 * ③ 문항 id 계약 — iqQuestionId로 만든 id가 parseIqQuestionId로 되돌아와야
 *    한다. 안 돌아오면(M12) 오답노트(계획 4)에서 그 문항이 조용히 사라지는데,
 *    jest(questionId.test.ts의 100시드 왕복 테스트)는 잡아도 게이트는 못 잡았다.
 *
 * IQ는 POOLS에 추가하지 않는다(시드에서 생성하므로 정적 배열로 못 담는다) —
 * 대신 assembleIq를 시드 여러 개로 직접 돌려 같은 종류의 검사를 적용한다.
 */
export function validateIqQuestions(generated: readonly GeneratedQuestion[]): string[] {
  const errors: string[] = [];
  const questionsByGenerator = new Map<string, Question[]>();

  for (const gq of generated) {
    const bucket = questionsByGenerator.get(gq.generatorId) ?? [];
    bucket.push(gq.question);
    questionsByGenerator.set(gq.generatorId, bucket);

    const fig = gq.question.figure;
    if (fig !== undefined && fig.kind === 'grid') {
      if (fig.cells.length !== 9) {
        errors.push(
          `[${gq.question.id}] 격자 칸 수가 ${fig.cells.length}개입니다 (9칸이어야 합니다)`
        );
      }
      if (fig.blankIndex === undefined) {
        errors.push(`[${gq.question.id}] blankIndex가 없습니다 — 정답 칸이 가려지지 않습니다`);
      }
    }

    const parsed = parseIqQuestionId(gq.question.id);
    if (parsed === undefined) {
      errors.push(
        `[${gq.question.id}] 문항 id가 iq-<generatorId>-<seed> 형식이 아닙니다 — ` +
          `오답노트가 이 문항을 복원하지 못합니다`
      );
    } else if (parsed.generatorId !== gq.generatorId || parsed.seed !== gq.seed) {
      errors.push(
        `[${gq.question.id}] 문항 id를 파싱한 값(${parsed.generatorId}, ${parsed.seed})이 ` +
          `실제 생성기·시드(${gq.generatorId}, ${gq.seed})와 다릅니다`
      );
    }
  }

  for (const [generatorId, questions] of questionsByGenerator) {
    errors.push(...validateAnswerDistribution(`iq:${generatorId}`, questions));
  }

  return errors;
}

/**
 * validateIqQuestions를 실제 출제 함수 assembleIq의 출력에 적용한다. 시드
 * 1..seedCount로 만든 세트를 모두 모아 한 번에 검사한다 — 정답 위치 분포는
 * 세트 하나(20문항)로는 유의미하게 못 보고, 여러 세트를 모아야 40% 임계값이
 * 뜻을 갖는다.
 */
export function validateIqAssembly(config: IqDrawConfig, seedCount = 100): string[] {
  const generated: GeneratedQuestion[] = [];
  for (let seed = 1; seed <= seedCount; seed++) {
    generated.push(...assembleIq(seed, config));
  }
  return validateIqQuestions(generated);
}

/** CLI 진입점. 문제가 있으면 exit 1. */

/**
 * 번들 폰트가 콘텐츠의 모든 글자를 갖고 있는지 확인한다.
 *
 * 폰트를 서브셋해서 한자·가나를 걷어냈기 때문에(tools/subset-fonts.py),
 * 새 문항에 폰트에 없는 글자를 넣으면 화면에 두부(□)로 뜬다. 자동 검사로
 * 잡지 않으면 실기기에서 눈으로 보기 전까지 아무도 모른다.
 *
 * 폰트 파일의 cmap을 직접 읽어 대조하므로, 서브셋 스크립트를 다시 안 돌린
 * 경우도 여기서 걸린다.
 */
export function validateFontCoverage(
  pools: Record<string, readonly Question[]>,
  fontPath: string
): string[] {
  const buf = readFileSync(fontPath);
  const covered = readCmap(buf);
  if (covered.size === 0) return [`[폰트] ${fontPath}에서 글자표(cmap)를 읽지 못했습니다`];

  const missing = new Map<string, string>();
  for (const [poolId, questions] of Object.entries(pools)) {
    for (const q of questions) {
      const texts = [q.prompt, q.explanation ?? '', ...q.choices.map((c) => c.text ?? '')];
      for (const t of texts) {
        for (const ch of t) {
          const cp = ch.codePointAt(0) ?? 0;
          // 이모지는 시스템 이모지 폰트가 그리므로 번들 폰트에 없어도 된다.
          if (cp >= 0x1f000 || cp === 0x20 || cp === 0x0a) continue;
          if (!covered.has(cp) && !missing.has(ch)) missing.set(ch, poolId);
        }
      }
    }
  }

  return [...missing.entries()].map(
    ([ch, poolId]) =>
      `[폰트] '${ch}'(U+${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase()})가 번들 폰트에 없습니다 ` +
      `— ${poolId}에서 쓰였습니다. python tools/subset-fonts.py를 다시 실행하세요`
  );
}

/** TrueType cmap에서 지원 코드포인트를 모은다. format 4와 12만 다룬다. */
function readCmap(buf: Buffer): Set<number> {
  const out = new Set<number>();
  const numTables = buf.readUInt16BE(4);
  let cmapOff = 0;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (buf.toString('ascii', rec, rec + 4) === 'cmap') cmapOff = buf.readUInt32BE(rec + 8);
  }
  if (cmapOff === 0) return out;

  const n = buf.readUInt16BE(cmapOff + 2);
  for (let i = 0; i < n; i++) {
    const sub = cmapOff + buf.readUInt32BE(cmapOff + 4 + i * 8 + 4);
    const format = buf.readUInt16BE(sub);
    if (format === 4) {
      const segX2 = buf.readUInt16BE(sub + 6);
      const ends = sub + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const ranges = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = buf.readUInt16BE(ends + s * 2);
        const start = buf.readUInt16BE(starts + s * 2);
        if (start === 0xffff) continue;
        const delta = buf.readInt16BE(deltas + s * 2);
        const rangeOff = buf.readUInt16BE(ranges + s * 2);
        for (let c = start; c <= end && c !== 0x10000; c++) {
          let gid: number;
          if (rangeOff === 0) gid = (c + delta) & 0xffff;
          else {
            const gi = ranges + s * 2 + rangeOff + (c - start) * 2;
            if (gi + 1 >= buf.length) continue;
            const g = buf.readUInt16BE(gi);
            gid = g === 0 ? 0 : (g + delta) & 0xffff;
          }
          if (gid !== 0) out.add(c);
        }
      }
    } else if (format === 12) {
      const groups = buf.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g++) {
        const go = sub + 16 + g * 12;
        const start = buf.readUInt32BE(go);
        const end = buf.readUInt32BE(go + 4);
        for (let c = start; c <= end; c++) out.add(c);
      }
    }
  }
  return out;
}

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

  const IQ_ASSEMBLY_SEED_COUNT = 100;

  const { errors: poolErrors, totalQuestions } = validateAllPools(POOLS, POOL_SCORING);
  const { errors: generatorErrors, totalGenerated } = validateGenerators(GENERATORS);
  const capacityErrors = validateGeneratorCapacity(GENERATORS, IQ_DRAW);
  const iqAssemblyErrors = validateIqAssembly(IQ_DRAW, IQ_ASSEMBLY_SEED_COUNT);
  const fontErrors = validateFontCoverage(
    POOLS,
    join(__dirname, '..', 'assets', 'fonts', 'NotoSansKR_500Medium.ttf')
  );
  const errors = [
    ...poolErrors,
    ...generatorErrors,
    ...capacityErrors,
    ...iqAssemblyErrors,
    ...fontErrors,
    ...Object.entries(grades).flatMap(([id, table]) => validateGradeTable(id, table)),
  ];

  if (errors.length > 0) {
    console.error(`콘텐츠 검증 실패 — ${errors.length}건`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  console.log(
    `콘텐츠 검증 통과 — 문항 ${totalQuestions}개, 생성형 검증 ${totalGenerated}건, ` +
      `생성기 용량 검사 ${GENERATORS.length}종, ` +
      `IQ 출제(assembleIq) 검증 ${IQ_DRAW.questionCount * IQ_ASSEMBLY_SEED_COUNT}건, ` +
      `급수 테이블 ${Object.keys(grades).length}개, 폰트 글자 커버리지 확인`
  );
}

if (require.main === module) {
  void main();
}
