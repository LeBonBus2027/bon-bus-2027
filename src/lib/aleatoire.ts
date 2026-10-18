/** Nombre aléatoire non prédictible dans [0, 1). */
export function tirageCrypto(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;
}

/** Générateur déterministe (mulberry32) : mêmes lignes de bus pour tout le monde. */
export function graine(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

/** Mélange de Fisher-Yates, sans modifier le tableau d'origine. */
export function melanger<T>(liste: readonly T[], tirage: () => number = tirageCrypto): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(tirage() * (i + 1));
    [copie[i], copie[j]] = [copie[j]!, copie[i]!];
  }
  return copie;
}
