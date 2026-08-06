/// <reference types="node" />
import { AXES, type GradeTable, type Question } from '../src/engine/types';

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

/** 유형형(축 합계 방식) 문항 묶음을 검사한다. 정답이 없으므로 answerIndex 대신 axis·weight를 본다. */
export function validateTypedQuestions(
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

    if (!q.axis || !(AXES as readonly string[]).includes(q.axis)) {
      errors.push(`${at} axis가 없거나 유효하지 않습니다: ${q.axis ?? '(없음)'}`);
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push(`${at} 해설이 비어 있습니다`);
    }

    if (!q.prompt || q.prompt.trim().length === 0) {
      errors.push(`${at} 질문이 비어 있습니다`);
    }

    q.choices.forEach((c, i) => {
      const text = (c.text ?? '').trim();
      if (text.length === 0) {
        errors.push(`${at} ${i}번 선택지가 비어 있습니다`);
      }
      if (typeof c.weight !== 'number' || c.weight === 0 || Math.abs(c.weight) > 2) {
        errors.push(`${at} ${i}번 선택지의 weight가 유효하지 않습니다: ${String(c.weight)}`);
      }
    });
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

/** CLI 진입점. 문제가 있으면 exit 1. */
async function main(): Promise<void> {
  // registry.ts가 실제 콘텐츠 인벤토리다 — 파일 경로를 직접 나열하지 않고
  // 여기 등록된 풀을 그대로 순회한다. 새 지역/카테고리가 POOLS에 추가되면
  // 이 스크립트를 고치지 않아도 자동으로 검증 대상이 된다.
  const { POOLS } = await import('../src/content/registry');
  const grades = (await import('../src/content/grades.json')).default as unknown as Record<
    string,
    GradeTable
  >;

  const errors: string[] = [];
  let totalQuestions = 0;

  for (const [poolId, questions] of Object.entries(POOLS)) {
    const [testId] = poolId.split(':');
    totalQuestions += questions.length;

    if (questions[0]?.kind === 'typed') {
      errors.push(
        ...validateTypedQuestions(questions, {
          expectedChoiceCount: expectedChoiceCountFor(testId ?? ''),
        })
      );
    } else {
      errors.push(
        ...validateScoredQuestions(questions, {
          expectedChoiceCount: expectedChoiceCountFor(testId ?? ''),
        }),
        ...validateAnswerDistribution(poolId, questions)
      );
    }
  }

  errors.push(
    ...Object.entries(grades).flatMap(([id, table]) => validateGradeTable(id, table))
  );

  if (errors.length > 0) {
    console.error(`콘텐츠 검증 실패 — ${errors.length}건`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  console.log(
    `콘텐츠 검증 통과 — 문항 ${totalQuestions}개, 급수 테이블 ${Object.keys(grades).length}개`
  );
}

if (require.main === module) {
  void main();
}
