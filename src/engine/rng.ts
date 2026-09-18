// The only source of randomness in the game (handoff invariant 2).
//
// Two kinds of draw, both pure functions of their arguments:
//  - sequential: mulberry32 stepped through GameState.rngState;
//  - keyed: a draw fixed by (seed, key), independent of what was drawn before it.
//    Event rolls and briefing signals use keyed draws so that everyone playing a
//    seed faces the same dice whatever they decide (DECISIONS.md, decision 10).

/** FNV-1a over a string, folded with a numeric seed. Returns a uint32. */
export function hashString(text: string, seed = 0): number {
  let hash = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** One step of mulberry32. Returns a value in [0, 1) and the next generator state. */
export function mulberry32(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next };
}

/** A value in [0, 1) fixed by the seed and the key. */
export function keyedUniform(seed: number, key: string): number {
  return mulberry32(hashString(key, seed)).value;
}

/** An integer in [min, max], fixed by the seed and the key. */
export function keyedInt(seed: number, key: string, min: number, max: number): number {
  return min + Math.floor(keyedUniform(seed, key) * (max - min + 1));
}

/** Seed codes are case- and whitespace-insensitive, and reveal nothing about the world. */
export function seedFromCode(seedCode: string): number {
  return hashString(seedCode.trim().toUpperCase());
}
