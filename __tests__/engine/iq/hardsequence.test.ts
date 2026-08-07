import { hardsequenceGenerator } from '@/engine/iq/generators/hardsequence';
import { sequenceGenerator } from '@/engine/iq/generators/sequence';
import { verifyGenerated } from '@/engine/iq/verify';
import type { Question } from '@/engine/types';

const G = hardsequenceGenerator;

/** 화면에 찍힌 수열의 항들을 프롬프트 문자열에서 되읽는다. */
function termsOf(q: Question): number[] {
  const line = (q.prompt.split('\n').pop() ?? '').replace(', ?', '');
  return line.split(', ').map(Number);
}

function answerOf(q: Question): number {
  return Number(q.choices[q.answerIndex ?? -1]?.text);
}

/** 등차·등비인가 — 난이도 2 수열과 같은 수준의 규칙이면 여기 걸린다. */
function isPlain(terms: readonly number[]): boolean {
  const diffs = terms.slice(1).map((t, i) => t - (terms[i] as number));
  const sameDiff = diffs.every((d) => d === diffs[0]);
  const ratios = terms.slice(1).map((t, i) => t / (terms[i] as number));
  const sameRatio = ratios.every((r) => r === ratios[0]);
  return sameDiff || sameRatio;
}

describe('hardsequenceGenerator', () => {
  test('시드 50개에서 같은 시드가 같은 문항을 만든다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(G.generate(seed))).toBe(JSON.stringify(G.generate(seed)));
    }
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(G.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  test('시드 500개에서 정답 위치가 고정되어 있지 않다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(G.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  // ★ 이 생성기의 존재 이유가 곧 이 테스트다. 난이도 2 수열(등차·등비)이 여기서
  // 나오면 "어려운 문제를 넣었다"는 말이 거짓이 된다.
  test('등차·등비처럼 한 번에 보이는 수열은 나오지 않는다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const terms = termsOf(G.generate(seed).question);
      expect(isPlain(terms)).toBe(false);
    }
  });

  // 대조군 — 위 판정이 실제로 판별력이 있는지 확인한다. 난이도 2 생성기에는
  // 등차·등비가 실제로 들어 있으므로, isPlain이 항상 false를 주는 함수라면 여기서 걸린다.
  test('같은 판정을 난이도 2 수열에 걸면 한 번에 보이는 수열이 잡힌다', () => {
    let plain = 0;
    for (let seed = 1; seed <= 200; seed++) {
      if (isPlain(termsOf(sequenceGenerator.generate(seed).question))) plain += 1;
    }
    expect(plain).toBeGreaterThan(0);
  });

  test('모든 항과 선택지가 1 이상 9999 이하의 정수다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const values = [...termsOf(question), ...question.choices.map((c) => Number(c.text))];
      for (const v of values) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(9999);
      }
    }
  });

  test('선택지 다섯 개가 서로 다르다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const texts = G.generate(seed).question.choices.map((c) => c.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  test('해설이 정답 값을 그대로 말한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      expect(question.explanation ?? '').toContain(String(answerOf(question)));
    }
  });

  test('난이도가 3으로 표시된다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(G.generate(seed).question.difficulty).toBe(3);
    }
  });

  // 규칙 4종이 모두 나와야 문제가 단조롭지 않다. 해설 첫 구절로 규칙을 구분한다.
  test('시드 500개에서 규칙 네 가지가 모두 나온다', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const why = G.generate(seed).question.explanation ?? '';
      if (why.startsWith('항의 차이를')) seen.add('secondDiff');
      else if (why.startsWith('앞의 수에')) seen.add('linear');
      else if (why.startsWith('곱하는 수가')) seen.add('risingRatio');
      else seen.add('alternatingOps');
    }
    expect(seen.size).toBe(4);
  });
});
