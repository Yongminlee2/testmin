import { figureEquals } from './figure';
import type { GeneratedQuestion } from '../types';

/**
 * 생성된 문항이 출제 가능한 상태인지 검사한다.
 * 사람이 읽을 수 있는 문제 목록을 돌려주고, 비어 있으면 통과.
 *
 * 가장 중요한 검사는 정답 유일성이다. 생성기는 규칙을 어긋나게 해서
 * 오답을 만드는데, 우연히 정답과 같은 그림이 나오면 정답이 둘인 문제가
 * 출제되고 사용자는 맞는 답을 골랐는데 틀렸다고 나온다.
 */
export function verifyGenerated(gq: GeneratedQuestion): string[] {
  const errors: string[] = [];
  const q = gq.question;
  const at = `[${gq.generatorId}/${gq.seed}]`;

  if (q.choices.length !== 5) {
    errors.push(`${at} IQ 도형·수열 문항은 5지선다여야 하는데 ${q.choices.length}개입니다`);
  }

  if (typeof q.answerIndex !== 'number') {
    errors.push(`${at} answerIndex가 없습니다`);
  } else if (q.answerIndex < 0 || q.answerIndex >= q.choices.length) {
    errors.push(`${at} answerIndex ${q.answerIndex}가 선택지 범위를 벗어납니다`);
  }

  if (!q.explanation || q.explanation.trim().length === 0) {
    errors.push(`${at} 해설이 비어 있습니다`);
  }

  if (!q.prompt || q.prompt.trim().length === 0) {
    errors.push(`${at} 질문이 비어 있습니다`);
  }

  // 선택지끼리 서로 달라야 한다. 도형 문항은 figure로, 수열 문항은 text로 비교한다.
  for (let i = 0; i < q.choices.length; i++) {
    for (let j = i + 1; j < q.choices.length; j++) {
      const a = q.choices[i];
      const b = q.choices[j];
      if (a === undefined || b === undefined) continue;

      if (a.figure !== undefined && b.figure !== undefined) {
        if (figureEquals(a.figure, b.figure)) {
          errors.push(`${at} 선택지 ${i}번과 ${j}번의 도형이 같습니다`);
        }
      } else if (a.text !== undefined && b.text !== undefined) {
        if (a.text === b.text) {
          errors.push(`${at} 선택지 ${i}번과 ${j}번의 값이 같습니다 ("${a.text}")`);
        }
      }
    }
  }

  return errors;
}
