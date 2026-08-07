import { distributeGenerator } from '@/engine/iq/generators/distribute';
import { SIZES } from '@/engine/iq/generators/size';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';
import { puzzleKey } from '@/engine/iq/assembleIq';
import { attachParticle } from '@/engine/korean';

/** 종류 이름 순서. 격자에 실제로 찍힌 종류에서 라틴 방진 계수를 역산할 때 쓴다. */
const KIND_ORDER = ['circle', 'square', 'triangle'] as const;

const G = distributeGenerator;
const kindAt = (q: ReturnType<typeof G.generate>['question'], i: number) =>
  q.figure?.cells[i]?.shapes[0]?.kind;
const sizeAt = (q: ReturnType<typeof G.generate>['question'], i: number) =>
  q.figure?.cells[i]?.shapes[0]?.size;

describe('distributeGenerator', () => {
  test('시드 50개에서 같은 시드가 같은 문항을 만든다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(G.generate(seed))).toBe(JSON.stringify(G.generate(seed)));
    }
  });

  // 리뷰 I-2 — rotation·count·fill은 이 검사를 갖는데 size·distribute는 없었다.
  // blankIndex는 FigureSpec에서 선택 필드라 tsc도 안 잡는다. 이 검사가 없으면
  // blankIndex를 8→0으로 바꿔도(왼쪽 위가 비고 오른쪽 아래 정답 칸이 그려진다 —
  // 선택지 5개는 여전히 (2,2) 기준이라 묻는 칸과 답하는 칸이 어긋난 풀 수 없는
  // 문항이 된다) 초록불로 남는다. `distribute.test.ts`의 행·열 검사는 cells
  // 배열을 직접 읽어서 blankIndex와 무관하게 통과하므로 이 검사를 대신하지 못한다.
  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = G.generate(5);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
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

  // 규칙 자체의 무결성 — 이게 깨지면 정답이 둘이거나 풀 수 없는 문제가 나온다
  test('모든 행과 열에 세 종류·세 크기가 정확히 한 번씩 나온다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      // 빈 칸(8번)은 정답으로 메워서 완성된 격자로 본다
      const full = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
        kind: kindAt(question, i),
        size: sizeAt(question, i),
      }));
      const ans = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      full.push({ kind: ans?.kind, size: ans?.size });

      for (let line = 0; line < 3; line++) {
        const row = [0, 1, 2].map((c) => full[line * 3 + c]);
        const col = [0, 1, 2].map((r) => full[r * 3 + line]);
        for (const group of [row, col]) {
          expect(new Set(group.map((g) => g?.kind)).size).toBe(3);
          expect(new Set(group.map((g) => g?.size)).size).toBe(3);
        }
      }
    }
  });

  // 그레코-라틴 성질의 핵심 — 9칸의 (종류, 크기) 조합이 전부 달라야 한다.
  // 위의 행·열 검사는 종류와 크기를 각각 따로 세므로, 두 라틴 방진이 직교하지 않고
  // 종류가 크기를 결정해버리는 상관관계(예: 원이면 항상 작음)가 생겨도 못 잡는다.
  // 그러면 규칙 하나만 읽어도 풀리는 문제가 되어 "둘 다 읽어야 풀린다"는 설계 의도가 깨진다.
  test('9칸의 (종류, 크기) 조합이 서로 다르다 (직교성)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const combos = [0, 1, 2, 3, 4, 5, 6, 7].map(
        (i) => `${kindAt(question, i)}:${sizeAt(question, i)}`
      );
      const ans = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      combos.push(`${ans?.kind}:${ans?.size}`);
      expect(new Set(combos).size).toBe(9);
    }
  });

  // ② 시각적 유효성 — 크기가 화면에서 구분되는가
  test('쓰이는 크기는 세 단계뿐이고 서로 0.12 이상 벌어져 있다', () => {
    const used = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      for (let i = 0; i < 9; i++) {
        const s = sizeAt(question, i);
        if (s !== undefined) used.add(s);
      }
      for (const c of question.choices) {
        const s = c.figure?.cells[0]?.shapes[0]?.size;
        if (s !== undefined) used.add(s);
      }
    }
    const sorted = [...used].sort((a, b) => a - b);
    expect(sorted).toEqual([...SIZES].sort((a, b) => a - b));
    for (let i = 1; i < sorted.length; i++) {
      expect((sorted[i] as number) - (sorted[i - 1] as number)).toBeGreaterThanOrEqual(0.12);
    }
    expect(sorted[0] as number).toBeGreaterThanOrEqual(0.25);
    expect(sorted[sorted.length - 1] as number).toBeLessThanOrEqual(0.85);
  });

  test('오답은 종류만 틀림 2개, 크기만 틀림 1개, 둘 다 틀림 1개다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const ai = question.answerIndex ?? -1;
      const a = question.choices[ai]?.figure?.cells[0]?.shapes[0];
      expect(a).toBeDefined();
      let kindOnly = 0, sizeOnly = 0, both = 0;
      question.choices.forEach((c, i) => {
        if (i === ai) return;
        const s = c.figure?.cells[0]?.shapes[0];
        const kw = s?.kind !== a!.kind;
        const sw = s?.size !== a!.size;
        if (kw && sw) both++; else if (kw) kindOnly++; else if (sw) sizeOnly++;
      });
      expect({ kindOnly, sizeOnly, both }).toEqual({ kindOnly: 2, sizeOnly: 1, both: 1 });
    }
  });

  // ★ ① 예측 대조 — 마지막 줄에 빠진 종류·크기를 격자에서 직접 구한다.
  // 생성기의 (r+c)%3 공식을 다시 쓰지 않는다. 라틴 방진이면 "줄에 없는 값"이 곧 답이다.
  test('표시된 정답이 마지막 줄에서 빠진 종류·크기와 일치한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const rowKinds = [kindAt(question, 6), kindAt(question, 7)];
      const rowSizes = [sizeAt(question, 6), sizeAt(question, 7)];
      const missingKind = (['circle', 'square', 'triangle'] as const).find(
        (k) => !rowKinds.includes(k)
      );
      const missingSize = SIZES.find((s) => !rowSizes.includes(s));
      expect(missingKind).toBeDefined();
      expect(missingSize).toBeDefined();

      const marked = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      expect(marked?.kind).toBe(missingKind);
      expect(marked?.size).toBe(missingSize);
    }
  });

  // ③ 해설 내용
  //
  // 리뷰(Task 4 뮤테이션 테스트에서 발견) — 이 검사는 원래 "낱말이 해설
  // 어딘가에 있는지"만 봤다. 그런데 해설의 첫 문장("가로 한 줄에는 원·사각형·
  // 삼각형이 한 번씩...")이 이미 세 종류 이름을 전부 고정 문구로 나열하므로,
  // 이 단순 포함 검사는 뒤 문장의 계산이 틀려도(엉뚱한 종류를 답해도, 마지막
  // 줄에 이미 있는 두 종류를 잘못 들어도) 항상 통과한다 — rowSizes를 잘못된
  // 라틴 방진 공식으로 되돌리는 뮤테이션(크기 쪽)을 넣어 실측으로 확인했다.
  // 같은 구조의 결함이 종류 쪽에도 그대로 있다. "빈 칸은 X이고"와 "이미
  // Y와 Z 있으므로" 절은 고정 문구가 아니라 계산값으로만 채워지므로, 그
  // 절 전체를 production과 같은 attachParticle로 재구성해 한 덩어리
  // 문자열로 대조한다 — 순서·조사까지 다 맞아야 통과한다.
  test('해설이 격자에서 역산한 종류를 실제로 언급한다', () => {
    const names: Record<string, string> = { circle: '원', square: '사각형', triangle: '삼각형' };
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const rowKindIds = [kindAt(question, 6), kindAt(question, 7)];
      const missingKind = (['circle', 'square', 'triangle'] as const).find(
        (k) => !rowKindIds.includes(k)
      );
      const rowKindNames = rowKindIds.map((k) => names[k as string] as string);
      const missingKindName = names[missingKind as string] as string;
      const text = question.explanation ?? '';

      const rowKindsPhrase = `${attachParticle(rowKindNames[0] as string, '과', '와')} ${rowKindNames[1]}`;
      const expectedClause =
        `마지막 줄에는 이미 ${attachParticle(rowKindsPhrase, '이', '가')} 있으므로 빈 칸은 ` +
        `${attachParticle(missingKindName, '이고', '고')}`;
      expect(text).toContain(expectedClause);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });

  // 리뷰 I-3 — "회전은 삼각형에만"의 유일한 방어선이 fill.test.ts였다.
  // distribute도 회전을 규칙으로 쓰지 않으므로 어떤 도형도 회전이 있으면 안
  // 된다. 문제 격자(figure.cells)와 선택지(choices) 양쪽 경로를 다 훑는다 —
  // M7이 정확히 이 구멍이었다: 격자에만 회전을 주입하고 선택지는 그대로
  // 두면(화면상 정답 선택지가 패턴과 안 맞는 문항이 나온다) choices만 보는
  // 검사로는 못 잡는다.
  test('회전을 구분 기준으로 쓰지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      for (const cell of question.figure?.cells ?? []) {
        for (const s of cell.shapes) {
          expect(s.rotation).toBe(0);
        }
      }
      for (const c of question.choices) {
        for (const cell of c.figure?.cells ?? []) {
          for (const s of cell.shapes) {
            expect(s.rotation).toBe(0);
          }
        }
      }
    }
  });

  // filled은 이 문제의 변별 속성이 아니다. 격자 안에서도, 선택지 사이에서도 값이 하나로
  // 통일돼야 한다 — 부분적으로만 바뀌면 filled가 의도치 않은 여분의 구분 속성이 되어
  // 정답과 filled만 다른 오답이 생길 수 있다. 전역적으로 어떤 값을 쓰는지는 고정하지 않는다.
  test('filled은 격자와 선택지 전체에서 하나로 통일되어 있다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const filledValues = new Set<boolean>();
      for (const cell of question.figure?.cells ?? []) {
        const f = cell.shapes[0]?.filled;
        if (f !== undefined) filledValues.add(f);
      }
      for (const c of question.choices) {
        const f = c.figure?.cells[0]?.shapes[0]?.filled;
        if (f !== undefined) filledValues.add(f);
      }
      expect(filledValues.size).toBe(1);
    }
  });

  // Task 4(축 교환) — 두 라틴 방진 (r+c)와 (r+2c) 중 어느 쪽이 종류를 맡는지를
  // swapped 내부 변수가 아니라 격자에서 직접 역산해 두 배치가 모두 나오는지
  // 확인한다. 두 방진은 c가 1 늘 때 종류 인덱스가 (r+c)면 1, (r+2c)면 2씩
  // 바뀐다 — kindOffset은 0번·1번 칸 모두에 똑같이 더해지므로 인덱스 차이를
  // 보면 상쇄되어, kindOffset을 몰라도 어느 공식이 쓰였는지 판별할 수 있다.
  test('시드 500개에서 축 배치(종류를 맡는 라틴 방진) 두 가지가 모두 나온다', () => {
    const cCoefficients = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const i0 = KIND_ORDER.indexOf(kindAt(question, 0) as (typeof KIND_ORDER)[number]);
      const i1 = KIND_ORDER.indexOf(kindAt(question, 1) as (typeof KIND_ORDER)[number]);
      const cCoeff = (((i1 - i0) % 3) + 3) % 3; // (r+c)면 1, (r+2c)면 2
      cCoefficients.add(cCoeff);
    }
    expect(cCoefficients).toEqual(new Set([1, 2]));
  });

  // Task 4 증거 — 넓힌 뒤 실측 퍼즐 가짓수가 18(kindOffset 3가지 × sizeOffset
  // 3가지 × swapped 2가지)이어야 한다. puzzleKey는 tools/validate-content.ts의
  // measureGeneratorCapacity와 같은 키다 — 릴리스 게이트가 보는 값과 여기 값이
  // 어긋나지 않게 한다.
  test('서로 다른 퍼즐이 18가지다', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 1000; seed++) {
      seen.add(puzzleKey(G.generate(seed)));
    }
    expect(seen.size).toBe(18);
  });

  // Task 4 — 해설이 실제 축을 말하는지 확인한다. distribute는 fill·size와 달리
  // 행/열이 뒤집히는 게 아니라 "어느 라틴 방진이 크기를 맡는가"가 뒤집힌다.
  // 해설의 크기 문구는 swapped나 sizeOffset을 다시 읽지 않고 항상 cells(6번·
  // 7번 칸, 이미 그려진 마지막 줄)에서 직접 읽으므로, 어느 공식이 크기를
  // 맡았든 값 자체는 그대로 정확해야 한다 — 그 불변성을 실측으로 확인한다.
  // 해설이 격자 대신 (r+c)/(r+2c) 공식을 다시 불러 계산하도록 되돌리면(84번
  // 줄 주석이 경고하는 바로 그 회귀) 이 테스트가 swapped=true 시드에서 실제
  // 그려진 크기와 어긋나 실패해야 한다.
  //
  // 리뷰(뮤테이션 테스트로 발견) — 처음엔 "각 크기 낱말이 해설 어딘가에
  // 있는지"만 봤다. distribute.ts 91번 줄의 rowSizes를 (r+2c) 고정 공식으로
  // 되돌리는 뮤테이션을 넣어도 이 검사가 초록불로 남는 걸 실측으로 확인했다
  // — 해설 첫 문장이 "크기도 작은·중간·큰 것이 한 번씩"이라며 세 낱말을 이미
  // 고정 문구로 다 나열하기 때문이다(정답 문구의 마지막 조각 sizeName(answer.size)
  // 도 항상 셋 중 하나이므로 missingSize 쪽 검사만으로는 절대 못 걸린다). 이미
  // 나온 두 크기와 정답 크기를 한 절로 묶어 순서까지 대조해야 그 뮤테이션이
  // 실제로 빨간불이 된다.
  test('해설이 격자의 실제 축(마지막 줄에서 역산한 크기)을 말한다', () => {
    const sizeWord = (s: number): string =>
      s === SIZES[0] ? '작은' : s === SIZES[1] ? '중간' : '큰';

    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const rowSizes = [sizeAt(question, 6), sizeAt(question, 7)];
      const missingSize = SIZES.find((s) => !rowSizes.includes(s));
      expect(missingSize).toBeDefined();

      const text = question.explanation ?? '';
      const expectedClause =
        `${rowSizes.map((s) => sizeWord(s as number)).join('·')} 크기가 이미 나왔으므로 ` +
        `${sizeWord(missingSize as number)} 크기입니다`;
      expect(text).toContain(expectedClause);
    }
  });
});
