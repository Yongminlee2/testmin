import { readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const site = 'https://yongminlee2.github.io/testmin';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const pages = (await walk(root))
  .filter((file) => file.endsWith('.html'))
  .map((file) => path.relative(root, file).replaceAll('\\', '/'))
  .filter((file) => file !== '404.html' && file !== '+not-found.html')
  .map((file) => (file === 'index.html' ? '' : `/${file.replace(/\.html$/, '')}`))
  .filter(
    (route) =>
      route === '' ||
      route === '/settings' ||
      (route.endsWith('/intro') && !route.includes('[') && !route.includes('('))
  )
  .sort();

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((route) => `  <url><loc>${site}${route || '/'}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
await writeFile(path.join(root, 'sitemap.xml'), sitemap, 'utf8');

const publisher = process.env.ADSENSE_PUBLISHER_ID?.trim();
const adsPath = path.join(root, 'ads.txt');
if (publisher && /^pub-\d+$/.test(publisher)) {
  await writeFile(adsPath, `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, 'utf8');
} else {
  await rm(adsPath, { force: true });
}

console.log(`웹 부가 파일 생성 완료: sitemap ${pages.length}개 URL, ads.txt ${publisher ? '활성' : '대기'}`);
