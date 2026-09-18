// The only door from the interface into content. `loadContent` gives the engine
// the full, validated content; `publicContent` gives components the player-facing
// view, with every hidden field removed.

export { loadContent } from "./load";
export { publicContent } from "./public";
export type { PublicAdviser, PublicChoice, PublicContent, PublicEnding, PublicScenario } from "./public";
