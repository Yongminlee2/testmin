import fs from 'fs';
import path from 'path';
import { GENERATORS } from '@/engine/iq/generators/index';
import { verifyGenerated } from '@/engine/iq/verify';
import type { Difficulty, GeneratedQuestion } from '@/engine/types';

interface GeneratorLike {
  readonly id: string;
  readonly difficulty: Difficulty;
  generate(seed: number): GeneratedQuestion;
}

function isGeneratorLike(value: unknown): value is GeneratorLike {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.difficulty === 'number' &&
    typeof v.generate === 'function'
  );
}

/**
 * 레지스트리 등록 누락은 하드코딩된 목록(예전 버전의 이 테스트)으로는
 * "이 테스트 파일이 이미 아는 생성기가 배열에서 빠졌을 때"만 잡힌다.
 * 실제로 벌어지는 사고는 그 반대 방향이다 — 아무도, 이 테스트조차,
 * 존재를 모르는 새 생성기 모듈. 그래서 디스크에서 모듈을 직접 찾는다.
 *
 * export 이름이나 "이 모듈의 유일한 export인지"에 기대지 않고 모양(shape)으로
 * 걸러낸다 — 다음 태스크의 size.ts는 sizeGenerator 옆에 SIZES 상수도
 * 내보내므로, "유일한 export" 가정은 그 순간 깨진다.
 *
 * 경로는 __dirname에서 상대적으로 계산한다 — process.cwd()를 쓰면
 * jest를 어느 디렉터리에서 실행하느냐에 따라 테스트가 흔들린다.
 */
function discoverGenerators(): GeneratorLike[] {
  const dir = path.resolve(__dirname, '../../../src/engine/iq/generators');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && f !== 'index.ts');

  const found: GeneratorLike[] = [];
  for (const file of files) {
    const mod: Record<string, unknown> = require(path.join(dir, file));
    for (const exported of Object.values(mod)) {
      if (isGeneratorLike(exported)) found.push(exported);
    }
  }
  return found;
}

describe('GENERATORS 레지스트리', () => {
  test('디스크의 모든 생성기 모듈이 레지스트리에 등록되어 있다', () => {
    const discovered = discoverGenerators();
    // 탐색 자체가 헛돌면(경로가 틀리는 등) 아래 루프가 0번 돌고 통과해버린다 —
    // 그러면 "탐색하지 않는 탐색 테스트"가 되어 하드코딩 목록보다 나쁘다.
    expect(discovered.length).toBeGreaterThan(0);

    const registeredIds = new Set(GENERATORS.map((g) => g.id));
    for (const g of discovered) {
      expect(registeredIds.has(g.id)).toBe(true);
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
