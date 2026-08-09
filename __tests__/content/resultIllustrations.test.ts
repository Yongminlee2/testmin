import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import typeNames from '@/content/typeNames.json';
import { DIALECT_REGIONS, PSYCH_TESTS } from '@/content/registry';
import {
  gradeComic,
  iqComic,
  personalityComic,
  psychComic,
  resultIllustrationAssetIds,
} from '@/content/resultIllustrations';

describe('결과 전용 일러스트', () => {
  const comics = [
    ...typeNames.map((type) => personalityComic(type.code)),
    ...PSYCH_TESTS.flatMap((test) =>
      test.types.map((type) => psychComic(test.id, type.id))
    ),
    ...['mz', 'spelling', 'purekorean', 'idiom'].flatMap((testId) =>
      Array.from({ length: 9 }, (_, index) => gradeComic(testId, index + 1))
    ),
    ...DIALECT_REGIONS.flatMap((region) =>
      Array.from({ length: 9 }, (_, index) => gradeComic('dialect', index + 1, region.id))
    ),
    iqComic(80),
    iqComic(110),
    iqComic(140),
  ];

  test('모든 테스트×결과 조합 139개가 서로 다른 assetId를 쓴다', () => {
    expect(comics).toHaveLength(139);
    expect(new Set(comics.map((comic) => comic.assetId)).size).toBe(139);
    expect(resultIllustrationAssetIds()).toHaveLength(139);
    expect(new Set(resultIllustrationAssetIds()).size).toBe(139);
  });

  test('실제 WebP 139개의 경로와 파일 내용이 모두 중복되지 않는다', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/content/resultIllustrations.ts'),
      'utf8'
    );
    const files = [...source.matchAll(/require\('([^']+\.webp)'\)/g)].map(
      (match) => match[1]!
    );
    expect(files).toHaveLength(139);
    expect(new Set(files).size).toBe(139);

    const hashes = files.map((file) => {
      const bytes = fs.readFileSync(path.resolve(process.cwd(), 'src/content', file));
      return createHash('sha256').update(bytes).digest('hex');
    });
    expect(new Set(hashes).size).toBe(139);
  });

  test('캡션과 상세 관찰일지도 결과마다 고유하고 비어 있지 않다', () => {
    expect(new Set(comics.map((comic) => comic.caption)).size).toBe(139);
    const stories = comics.map((comic) =>
      [comic.story.habit, comic.story.charm, comic.story.tip].join('|')
    );
    expect(new Set(stories).size).toBe(139);
    for (const comic of comics) {
      expect(comic.accessibilityLabel.length).toBeGreaterThan(8);
      expect(comic.story.habit.length).toBeGreaterThan(20);
      expect(comic.story.charm.length).toBeGreaterThan(20);
      expect(comic.story.tip.length).toBeGreaterThan(20);
    }
  });
});
