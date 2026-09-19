// The bridge between React and the engine. `useReducer` wraps the pure engine
// (handoff Section 2: no state library). The raw GameState never leaves this
// file: components receive only `displayed(state)` (handoff invariant 3).

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  createGame,
  displayed,
  reduce,
  type Action,
  type CounterfactualResult,
  type DisplayedState,
  type GameState,
  type OptionEstimate,
} from "../engine";
import { applyOverrides, assumptionsOf, countOverrides, decodeOverrides, loadContent, publicContent } from "../content";
import type { WorkerRequest, WorkerResponse } from "../workers/counterfactual.worker";

// Content is validated once, when the module loads. Malformed content fails loudly here.
// A facilitator's edits arrive in the URL beside the seed code (DECISIONS.md, decision 7),
// so the page and everyone it is shared with play the same edited assumptions.
const bundled = loadContent();
/** The published assumptions before any facilitator edit, so the editor can show what changed. */
export const defaults = assumptionsOf(bundled);
export const overrides = decodeOverrides(new URLSearchParams(window.location.search).get("cfg"));
export const overrideCount = countOverrides(overrides);
const content = applyOverrides(bundled, overrides);
export const pub = publicContent(content);
/** The hidden half of the content. Imported by debrief screens only. */
export const published = assumptionsOf(content);

/** Rollouts per option for the "sound decision" verdict, and reruns per what-if (spec Section 11). */
const SOUND_ROLLOUTS = 300;
export const WHAT_IF_RUNS = 1000;

interface Session {
  game: GameState | null;
  /** The view just before the last ADVANCE, so the news screen can show what changed. */
  before: DisplayedState | null;
  /** The state at the moment of each decision, for judging it on what was knowable then. */
  decisionStates: GameState[];
}

type SessionAction = { type: "START"; seedCode: string } | { type: "RESET" } | { type: "ENGINE"; actions: Action[] };

const EMPTY: Session = { game: null, before: null, decisionStates: [] };

function sessionReducer(session: Session, event: SessionAction): Session {
  switch (event.type) {
    case "START":
      return { ...EMPTY, game: createGame(event.seedCode, content) };
    case "RESET":
      return EMPTY;
    case "ENGINE": {
      let { game, before, decisionStates } = session;
      if (!game) return session;
      for (const action of event.actions) {
        if (action.type === "ADVANCE") before = displayed(game);
        if (action.type === "DECIDE") decisionStates = [...decisionStates, game];
        game = reduce(game, action, content);
      }
      return { game, before, decisionStates };
    }
  }
}

/** For each decision, in order: every open option's expected ending score, best first. */
export type Rankings = OptionEstimate[][];
export interface WhatIfAnswer {
  result: CounterfactualResult;
  milliseconds: number;
}

/** What a What-if label needs about one decision: capital then, and the options that cost more than it. */
export interface UnaffordableAt {
  capital: number;
  options: { id: string; cost: number }[];
}

type Ask = WorkerRequest extends infer R ? (R extends { id: number } ? Omit<R, "id"> : never) : never;

export function useGame() {
  const [session, dispatch] = useReducer(sessionReducer, EMPTY);
  const [rankings, setRankings] = useState<Rankings | null>(null);
  const worker = useRef<Worker | null>(null);
  const waiting = useRef(new Map<number, (response: WorkerResponse) => void>());
  const nextId = useRef(0);

  const ask = useCallback((request: Ask): Promise<WorkerResponse> => {
    if (!worker.current) {
      worker.current = new Worker(new URL("../workers/counterfactual.worker.ts", import.meta.url), { type: "module" });
      worker.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        waiting.current.get(event.data.id)?.(event.data);
        waiting.current.delete(event.data.id);
      };
      // Messages are handled in order, so every later request sees the facilitator's numbers.
      worker.current.postMessage({ id: nextId.current++, kind: "configure", overrides });
    }
    const id = nextId.current++;
    return new Promise((resolve) => {
      waiting.current.set(id, resolve);
      worker.current!.postMessage({ ...request, id });
    });
  }, []);

  useEffect(() => () => worker.current?.terminate(), []);

  // When the game ends, judge every decision off the main thread.
  const over = session.game?.phase === "debrief";
  useEffect(() => {
    if (!over) return;
    let cancelled = false;
    void ask({ kind: "soundness", decisionStates: session.decisionStates, rollouts: SOUND_ROLLOUTS }).then((response) => {
      if (!cancelled && response.kind === "soundness") setRankings(response.estimates);
    });
    return () => { cancelled = true; };
  }, [over, ask, session.decisionStates]);

  const view = useMemo(() => (session.game ? displayed(session.game) : null), [session.game]);
  // For each decision, the options the player could not afford at the time, so the debrief's What-if can
  // label them instead of hiding them. A replay takes the option when that world's capital can pay;
  // otherwise it substitutes the nearest affordable option (DECISIONS.md, B38, F24).
  const unaffordable = useMemo<UnaffordableAt[]>(
    () => session.decisionStates.map((state) => ({
      capital: state.politicalCapital,
      options: (state.current?.choices ?? []).filter((c) => c.status === "unaffordable").map((c) => ({ id: c.id, cost: c.cost })),
    })),
    [session.decisionStates],
  );
  const start = useCallback((seedCode: string) => { setRankings(null); dispatch({ type: "START", seedCode }); }, []);
  const reset = useCallback(() => { setRankings(null); dispatch({ type: "RESET" }); }, []);
  const act = useCallback((...actions: Action[]) => dispatch({ type: "ENGINE", actions }), []);

  const whatIf = useCallback(async (changeAt: number, newChoiceId: string): Promise<WhatIfAnswer> => {
    const game = session.game;
    if (!game || game.phase !== "debrief") throw new Error("What-if reruns open with the debrief");
    const response = await ask({
      kind: "whatIf", history: game.history, changeAt, newChoiceId, runs: WHAT_IF_RUNS,
      profile: game.world.profile, baseSeed: game.world.seed,
    });
    if (response.kind !== "whatIf") throw new Error(response.kind === "error" ? response.message : "Unexpected reply");
    return { result: response.result, milliseconds: response.milliseconds };
  }, [ask, session.game]);

  return { view, before: session.before, rankings, start, reset, act, whatIf, unaffordable };
}
