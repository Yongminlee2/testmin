import { rotationGenerator } from '@/engine/iq/generators/rotation';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

describe('rotationGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    const a = rotationGenerator.generate(1234);
    const b = rotationGenerator.generate(1234);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('다른 시드는 다른 문항을 만든다', () => {
    const a = rotationGenerator.generate(1);
    const b = rotationGenerator.generate(2);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = rotationGenerator.generate(7);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  // 리뷰(Task 1 이후) — cellAt()의 주석은 "회전이 보이는 도형은 삼각형뿐"이라고
  // 명시하지만 그걸 강제하는 테스트가 없었다. 원(circle)은 SvgFigure가 회전
  // transform을 주지 않으므로(회전해도 픽셀이 같다) kind를 circle로 바꿔도
  // rotation 숫자 필드는 여전히 다 다르므로 verifyGenerated·figureEquals 계열
  // 검사를 전부 통과한다 — 그런데도 화면에는 9칸과 5선택지가 전부 같은
  // 그림으로 보이는 채로 릴리스 게이트를 통과하게 된다(count.ts의 M16과 같은
  // 결함군). count.test.ts의 "회전을 구분 기준으로 쓰지 않는다"처럼 격자
  // (figure.cells)와 선택지(choices) 양쪽 경로를 다 훑는다 — 격자 생성 경로만
  // 바꾸고 choices만 따로 만드는 뮤테이션은 choices만 보는 검사로는 못 잡는다.
  test('격자와 선택지의 도형이 항상 삼각형이다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = rotationGenerator.generate(seed);
      for (const cell of question.figure?.cells ?? []) {
        for (const s of cell.shapes) {
          expect(s.kind).toBe('triangle');
        }
      }
      for (const c of question.choices) {
        for (const cell of c.figure?.cells ?? []) {
          for (const s of cell.shapes) {
            expect(s.kind).toBe('triangle');
          }
        }
      }
    }
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const gq = rotationGenerator.generate(seed);
      const errors = verifyGenerated(gq);
      if (errors.length > 0) {
        throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
      }
    }
  });

  test('시드 500개에서 정답이 항상 1번에 오지는 않는다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(rotationGenerator.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('정답 선택지의 도형이 규칙이 예측하는 모양과 일치한다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      // 여덟 번째 칸(index 7)과 아홉 번째 칸의 관계가 나머지 칸 간격과 같아야 한다
      const first = cells[0]?.shapes[0]?.rotation ?? 0;
      const second = cells[1]?.shapes[0]?.rotation ?? 0;
      const step = ((second - first) % 360 + 360) % 360;
      const expected = ((first + step * 8) % 360 + 360) % 360;
      const answer = question.choices[question.answerIndex ?? 0]?.figure;
      expect(answer).toBeDefined();
      expect(
        figureEquals(answer!, { kind: 'single', cells: [{ shapes: [{ ...cells[0]!.shapes[0]!, rotation: expected }] }] })
      ).toBe(true);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });

  // 리뷰 I-5 — count·fill·size·distribute·sequence는 모두 "해설이 역산한 값을
  // 언급한다" 계열 테스트를 갖는데, rotation(공통 요구 확정 이전에 만들어진
  // 첫 생성기)에는 없었다. 해설의 첫 칸 각도를 start에서 start+90으로 바꿔
  // 그럴듯하지만 틀린 값을 찍어도(M13) 다른 테스트가 못 잡는다.
  //
  // 생성기 내부 변수(start·step)를 다시 읽으면 동어반복이므로, "정답 선택지의
  // 도형이 규칙이 예측하는 모양과 일치한다" 테스트와 같은 방식으로 그려진
  // 격자(cells[0]·cells[1])에서 첫 칸 각도와 회전 폭을 독립적으로 역산한다.
  test('해설이 격자에서 역산한 시작 각도·회전 폭을 실제로 언급한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      const first = cells[0]?.shapes[0]?.rotation ?? 0;
      const second = cells[1]?.shapes[0]?.rotation ?? 0;
      const step = ((second - first) % 360 + 360) % 360;
      const answerRotation = ((first + step * 8) % 360 + 360) % 360;

      const explanation = question.explanation ?? '';
      expect(explanation).toContain(`시계방향으로 ${step}°씩 돕니다`);
      expect(explanation).toContain(`첫 칸이 ${first}°이므로`);
      expect(explanation).toContain(`${answerRotation}° 회전한 모양입니다`);
    }
  });

  // Task 1(용량 넓히기) — start를 STEPS(90/180/270)에서 뽑던 시절엔 0°가
  // 시작 각도로 전혀 나오지 않았다. STARTS(45° 배수 8가지)로 바꾼 뒤
  // 0°를 포함한 8가지가 실제로 다 나오는지 확인한다.
  test('시드 500개에서 시작 각도 8가지가 모두 나온다', () => {
    const starts = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const first = question.figure?.cells[0]?.shapes[0]?.rotation ?? -1;
      starts.add(first);
    }
    expect(starts.size).toBe(8);
  });

  // Task 1 증거 — 넓힌 뒤 실측 퍼즐 가짓수가 24(step 3가지 × start 8가지)여야
  // 한다. puzzleKey(JSON 전체 비교)를 쓰지 않고, 격자에서 직접 역산한
  // (첫 칸 각도, 두 번째 칸과의 차이)로 퍼즐을 식별한다 — 이 쌍이 곧
  // (start, step)이므로 서로 다른 (start, step) 조합 수와 정확히 대응한다.
  test('서로 다른 퍼즐이 24가지다', () => {
    const puzzles = new Set<string>();
    for (let seed = 1; seed <= 1000; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      const first = cells[0]?.shapes[0]?.rotation ?? 0;
      const second = cells[1]?.shapes[0]?.rotation ?? 0;
      const step = ((second - first) % 360 + 360) % 360;
      puzzles.add(`${first},${step}`);
    }
    expect(puzzles.size).toBe(24);
  });
});
