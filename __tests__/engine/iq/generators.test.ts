import { GENERATORS } from '@/engine/iq/generators/index';
import { rotationGenerator } from '@/engine/iq/generators/rotation';
import { countGenerator } from '@/engine/iq/generators/count';
import { fillGenerator } from '@/engine/iq/generators/fill';
import { verifyGenerated } from '@/engine/iq/verify';

// 리뷰 Important #4 — GENERATORS 배열을 아직 아무도 소비하지 않는다
// (assembleIq는 이후 태스크). 그래서 등록을 빠뜨려도 전체 스위트와 tsc가
// 모두 깨끗하게 통과했다. Task 6이 이 배열을 실제로 쓰기 전까지는
// 이 테스트가 등록 누락을 잡는 유일한 장치다.
describe('GENERATORS 레지스트리', () => {
  // 각 생성기 모듈의 export를 여기 직접 나열한다. 새 생성기를 추가하면
  // 여기에도 추가해야 이 테스트가 계속 의미를 갖는다.
  const ALL_GENERATOR_EXPORTS = [rotationGenerator, countGenerator, fillGenerator];

  test('생성기 모듈이 내보내는 모든 생성기가 레지스트리에 등록되어 있다', () => {
    for (const g of ALL_GENERATOR_EXPORTS) {
      expect(GENERATORS).toContain(g);
    }
  });

  test('레지스트리의 id가 모두 고유하다', () => {
    const ids = GENERATORS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('레지스트리의 각 생성기가 여러 시드에서 검증을 통과한다', () => {
    for (const g of GENERATORS) {
      for (let seed = 1; seed <= 20; seed++) {
        const errors = verifyGenerated(g.generate(seed));
        if (errors.length > 0) {
          throw new Error(`${g.id} seed ${seed}: ${errors.join(' / ')}`);
        }
      }
    }
  });
});
