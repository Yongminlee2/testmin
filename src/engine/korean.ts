/** 한글 음절의 받침 유무. 한글이 아니면 false. */
export function hasFinalConsonant(word: string): boolean {
  const last = word.trim().slice(-1);
  if (last.length === 0) return false;
  const code = last.charCodeAt(0);
  // 가(U+AC00) ~ 힣(U+D7A3)
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/**
 * 받침에 맞는 조사를 붙인다.
 *   attachParticle('고사', '은', '는')  → '고사는'
 *   attachParticle('사투리', '은', '는') → '사투리는'
 *   attachParticle('강원도', '은', '는') → '강원도는'
 */
export function attachParticle(word: string, withFinal: string, withoutFinal: string): string {
  return word + (hasFinalConsonant(word) ? withFinal : withoutFinal);
}
