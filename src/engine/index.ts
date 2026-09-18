// Public engine API (handoff Section 3). Everything outside src/engine talks to
// the engine through this file and nothing else.
//
// The handoff lists five functions. `soundness` is a sixth, added because the luck
// tags of spec Section 11 need rollouts that none of the five can express
// (DECISIONS.md, B36). `counterfactual` takes one argument more than the handoff
// shows: the world profile and a base seed (B7).

export type * from "./types";
export { createGame, reduce } from "./reduce";
export { displayed } from "./display";
export { simulate } from "./simulate";
export { counterfactual, soundness } from "./counterfactual";
export { luckTag } from "./scoring";
