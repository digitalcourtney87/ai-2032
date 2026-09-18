// The world-seed draw (spec Section 6): a profile first, then five latent facts
// from that profile's odds. Each draw is keyed, so a facilitator who edits one
// fact's odds does not disturb the others.

import { keyedUniform } from "./rng";
import type { GameConfig, Profile, SeedFact, WorldSeed } from "./types";

const PROFILES: Profile[] = ["benign", "contested", "hard"];

export const SEED_FACTS: SeedFact[] = [
  "cyberOffenceLed",
  "bioUpliftReal",
  "sandbaggingStrategic",
  "labourShockStructural",
  "foreignPostureOpen",
];

function drawProfile(seed: number, config: GameConfig): Profile {
  const total = PROFILES.reduce((sum, profile) => sum + config.profiles[profile].weight, 0);
  let remaining = keyedUniform(seed, "world:profile") * total;
  for (const profile of PROFILES) {
    remaining -= config.profiles[profile].weight;
    if (remaining < 0) return profile;
  }
  return "hard";
}

/** `forcedProfile` lets counterfactual reruns draw fresh worlds inside one profile. */
export function drawWorld(seed: number, config: GameConfig, forcedProfile?: Profile): WorldSeed {
  const profile = forcedProfile ?? drawProfile(seed, config);
  const odds = config.profiles[profile].facts;
  const fact = (name: SeedFact) => keyedUniform(seed, `world:fact:${name}`) * 100 < odds[name];
  return {
    seed,
    profile,
    cyberOffenceLed: fact("cyberOffenceLed"),
    bioUpliftReal: fact("bioUpliftReal"),
    sandbaggingStrategic: fact("sandbaggingStrategic"),
    labourShockStructural: fact("labourShockStructural"),
    foreignPostureOpen: fact("foreignPostureOpen"),
  };
}
