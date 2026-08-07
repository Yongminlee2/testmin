import { fillGenerator } from '@/engine/iq/generators/fill';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';
import { puzzleKey } from '@/engine/iq/assembleIq';
import { attachParticle } from '@/engine/korean';

describe('fillGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    // 단일 시드는 불리언/저카디널리티 형태의 난수 유입을 절반 확률로만 잡는다.
    // 여러 시드를 돌려 우연히 일치할 확률을 낮춘다.
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(fillGenerator.generate(seed))).toBe(
        JSON.stringify(fillGenerator.generate(seed))
      );
    }
  });

  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = fillGenerator.generate(9);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(fillGenerator.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  test('시드 500개에서 정답 위치가 고정되어 있지 않다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(fillGenerator.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('회전을 구분 기준으로 쓰지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = fillGenerator.generate(seed);
      // 문제 격자(figure.cells)와 선택지(choices) 둘 다 확인한다.
      // 지금은 둘 다 cellOf()를 거쳐서 우연히 같이 통과할 뿐, 격자 생성 경로만
      // 따로 회전을 주입해도 choices만 보면 못 잡는다 — 리뷰 Important #2.
      for (const cell of question.figure?.cells ?? []) {
        for (const s of cell.shapes) {
          expect(s.rotation).toBe(0);
        }
      }
      for (const c of question.choices) {
        for (const s of c.figure?.cells[0]?.shapes ?? []) {
          expect(s.rotation).toBe(0);
        }
      }
    }
  });

  // 오답 구성이 규칙별 하나씩인지 확인한다. 이 테스트가 없으면
  // 무작위 slice로 되돌아가도 아무도 눈치채지 못한다.
  test('오답은 종류만 틀림 2개, 채움만 틀림 1개, 둘 다 틀림 1개다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const ai = question.answerIndex ?? -1;
      const a = question.choices[ai]?.figure?.cells[0]?.shapes[0];
      expect(a).toBeDefined();

      let kindOnly = 0;
      let fillOnly = 0;
      let both = 0;
      question.choices.forEach((c, i) => {
        if (i === ai) return;
        const s = c.figure?.cells[0]?.shapes[0];
        const kindWrong = s?.kind !== a!.kind;
        const fillWrong = s?.filled !== a!.filled;
        if (kindWrong && fillWrong) both++;
        else if (kindWrong) kindOnly++;
        else if (fillWrong) fillOnly++;
      });
      expect({ kindOnly, fillOnly, both }).toEqual({ kindOnly: 2, fillOnly: 1, both: 1 });
    }
  });

  // ★ 예측 대조 — 종류·채움이 어느 축(행/열)에 있는지부터 격자에서 역산한 뒤
  // 그 축을 따라 정답을 예측한다.
  //
  // Task 4(축 교환) 리뷰 — 이 테스트는 원래 "열이 항상 종류를 맡는다"는
  // 전제로 cells[2]·cells[5](둘 다 열2)만 읽었다. swapped 도입 이후 행이
  // 종류를 맡는 시드가 섞이면서 그 전제가 절반만 참이 되어 곧장 빨간불이
  // 났다 — 축이 바뀌면 검증 대상 셀도 같이 바뀌어야 한다는 걸 실측으로 확인한
  // 사례. 0번·3번 칸(같은 열, 행만 다르다)의 종류가 같은지로 먼저 축을
  // 가려낸다 — fill.ts의 해설 축 판정과 같은 원칙.
  test('표시된 정답이 격자에서 역산한 종류·채움과 일치한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      const kindByColumn = cells[0]?.shapes[0]?.kind === cells[3]?.shapes[0]?.kind;

      // 종류가 고정되는 축에서, 마지막 칸(2,2)과 같은 줄의 값을 직접 읽는다.
      const expectedKind = kindByColumn
        ? cells[2]?.shapes[0]?.kind // 같은 열(0,2) — 종류는 열마다 고정
        : cells[6]?.shapes[0]?.kind; // 같은 행(2,0) — 종류는 행마다 고정

      // 채움은 종류가 고정되지 않는 쪽 축에서 교대한다 — 그 축의 두 값을 비교해
      // 교대를 확인한 다음, 마지막 칸과 같은 짝(0번 위치)의 값을 정답으로 쓴다.
      let expectedFilled: boolean | undefined;
      if (kindByColumn) {
        const fillRow0 = cells[2]?.shapes[0]?.filled; // (0,2)
        const fillRow1 = cells[5]?.shapes[0]?.filled; // (1,2)
        expect(fillRow0).not.toBe(fillRow1); // 행마다 교대라는 전제 확인
        expectedFilled = fillRow0; // 행 0과 행 2는 같은 상태(둘 다 짝수 행)
      } else {
        const fillCol0 = cells[6]?.shapes[0]?.filled; // (2,0)
        const fillCol1 = cells[7]?.shapes[0]?.filled; // (2,1)
        expect(fillCol0).not.toBe(fillCol1); // 열마다 교대라는 전제 확인
        expectedFilled = fillCol0; // 열 0과 열 2는 같은 상태(둘 다 짝수 열)
      }

      const marked = question.choices[question.answerIndex ?? -1]?.figure;
      expect(marked).toBeDefined();
      const s = marked!.cells[0]?.shapes[0];
      expect(s?.kind).toBe(expectedKind);
      expect(s?.filled).toBe(expectedFilled);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });

  // 리뷰 Important #3 — 해설 문자열은 verifyGenerated에서 "비어있지 않은지"만
  // 검사되므로, 계산값과 무관한 문장으로 바뀌어도 다른 테스트가 못 잡는다.
  // 생성기 내부 변수(kindNames, answer 등)를 다시 읽으면 동어반복이므로,
  // ★ 예측 대조와 같은 방식으로 격자에서 종류·채움을 독립적으로 역산해
  // 해설 문자열에 그 한국어 표현이 실제로 들어있는지 확인한다.
  // 리뷰(Task 4 뮤테이션 테스트에서 발견 — distribute.test.ts와 같은 결함) —
  // 이 검사는 원래 "낱말이 해설 어딘가에 있는지"만 봤다. 그런데 해설의 첫
  // 절(`KINDS.map(...).join('→')`)이 이미 종류 세 개를 전부 고정 문구로
  // 나열하므로("원→사각형→삼각형"), 종류 쪽 단순 포함 검사는 마지막 칸의
  // 종류가 틀려도 항상 통과한다. "마지막 칸은 X이고 Y 모양입니다" 절은 고정
  // 문구가 아니라 answer 하나로만 채워지므로, 그 절 전체를 production과 같은
  // attachParticle로 재구성해 한 덩어리로 대조한다.
  test('해설이 격자에서 역산한 종류·채움을 실제로 언급한다', () => {
    const KIND_NAMES_KR: Record<string, string> = {
      circle: '원',
      square: '사각형',
      triangle: '삼각형',
      diamond: '마름모',
    };

    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      // 위 예측 대조 테스트와 같은 방식으로 먼저 축을 가려낸 뒤 값을 읽는다.
      const kindByColumn = cells[0]?.shapes[0]?.kind === cells[3]?.shapes[0]?.kind;
      const expectedKind = kindByColumn ? cells[2]?.shapes[0]?.kind : cells[6]?.shapes[0]?.kind;
      const expectedFilled = kindByColumn
        ? cells[2]?.shapes[0]?.filled
        : cells[6]?.shapes[0]?.filled;
      expect(expectedKind).toBeDefined();

      const kindNameKr = KIND_NAMES_KR[expectedKind as string] as string;
      const fillWording = expectedFilled ? '색이 칠해진' : '비어 있는';

      const explanation = question.explanation ?? '';
      const expectedTail = `마지막 칸은 ${attachParticle(kindNameKr, '이고', '고')} ${fillWording} 모양입니다`;
      expect(explanation).toContain(expectedTail);
    }
  });

  // Task 4(축 교환) — 해설이 실제 축을 말하는지 확인한다. "열이 종류를 맡는지
  // 행이 종류를 맡는지"를 swapped 내부 변수가 아니라 격자(0번·3번 칸)에서
  // 읽어 판별한 다음, 그 축과 반대되는 축 이름이 나오면 실패시킨다. 해설
  // 문구가 한쪽 배치에 고정돼 있으면(예: 항상 "열마다 도형") swapped=true인
  // 시드에서 반드시 빨간불이 난다 — 계획 4가 "가장 위험하다"고 지목한 규칙.
  test('해설이 격자의 실제 축을 말한다', () => {
    let sawColumnKind = false;
    let sawRowKind = false;
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = fillGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      const kindByColumn = cells[0]?.shapes[0]?.kind === cells[3]?.shapes[0]?.kind;
      const explanation = question.explanation ?? '';

      if (kindByColumn) {
        sawColumnKind = true;
        expect(explanation).toContain('열마다 도형이');
        expect(explanation).toContain('행마다 색이');
        expect(explanation).not.toContain('행마다 도형이');
      } else {
        sawRowKind = true;
        expect(explanation).toContain('행마다 도형이');
        expect(explanation).toContain('열마다 색이');
        expect(explanation).not.toContain('열마다 도형이');
      }
    }
    expect(sawColumnKind).toBe(true);
    expect(sawRowKind).toBe(true);
  });

  // Task 4 — 시드 500개에서 두 축 배치(열이 종류를 맡는 배치, 행이 종류를
  // 맡는 배치)가 모두 나오는지 격자에서 직접 확인한다. swapped 내부 변수를
  // 읽지 않고, 0번·3번 칸(같은 열, 행만 다르다)의 종류가 같은지로 판별한다.
  test('시드 500개에서 축 배치 두 가지가 모두 나온다', () => {
    const arrangements = new Set<'columnKind' | 'rowKind'>();
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = fillGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      const kindByColumn = cells[0]?.shapes[0]?.kind === cells[3]?.shapes[0]?.kind;
      arrangements.add(kindByColumn ? 'columnKind' : 'rowKind');
    }
    expect(arrangements).toEqual(new Set(['columnKind', 'rowKind']));
  });

  // Task 4 증거 — 넓힌 뒤 실측 퍼즐 가짓수가 12(kindOffset 3가지 × startFilled
  // 2가지 × swapped 2가지)여야 한다. puzzleKey는 tools/validate-content.ts의
  // measureGeneratorCapacity와 같은 키다 — 릴리스 게이트가 보는 값과 여기 값이
  // 어긋나지 않게 한다.
  test('서로 다른 퍼즐이 12가지다', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 1000; seed++) {
      seen.add(puzzleKey(fillGenerator.generate(seed)));
    }
    expect(seen.size).toBe(12);
  });
});
