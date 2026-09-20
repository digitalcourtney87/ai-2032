// The only door from the interface into content. `loadContent` gives the engine
// the full, validated content; `publicContent` gives components the player-facing
// view, with every hidden field removed; `assumptionsOf` publishes the hidden
// half, for the debrief only.

export { loadContent } from "./load";
export { assumptionsOf, publicContent } from "./public";
export type { Assumptions, PublicAdviser, PublicChoice, PublicContent, PublicEnding, PublicRules, PublicScenario } from "./public";
export {
  applyOverrides,
  baseSlots,
  countOverrides,
  decodeOverrides,
  encodeOverrides,
  effectiveWeightsValid,
  IMPOSSIBLE_PROFILE_WEIGHTS,
  resolveEffectiveConfiguration,
} from "./overrides";
export type { Overrides } from "./overrides";
