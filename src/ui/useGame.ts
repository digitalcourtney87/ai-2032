// The bridge between React and the engine. `useReducer` wraps the private session
// (handoff Section 2: no state library). Raw game state stays inside the session
// module and this hook: components receive only `displayed(state)` (handoff invariant 3).

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  displayed,
  type Action,
  type CounterfactualResult,
  type OptionEstimate,
} from "../engine";
import { assumptionsOf, countOverrides, loadContent, publicContent, resolveEffectiveConfiguration } from "../content";
import { createDebriefCalculations, isCalculationCancelled, type DebriefCalculations } from "./debrief/calculations";
// eslint-disable-next-line no-restricted-imports -- this hook is the session owner
import { createSession, type Session } from "./session";

// Content is validated once, when the module loads. Malformed content fails loudly here.
// A facilitator's edits arrive in the URL beside the seed code (DECISIONS.md, decision 7),
// so the page and everyone it is shared with play the same edited assumptions.
const bundled = loadContent();
/** The published assumptions before any facilitator edit, so the editor can show what changed. */
export const defaults = assumptionsOf(bundled);
const resolved = resolveEffectiveConfiguration(new URLSearchParams(window.location.search).get("cfg"), bundled);
export const overrides = resolved.overrides;
export const overrideCount = countOverrides(overrides);
const content = resolved.content;
export const pub = publicContent(content);
/** The hidden half of the content. Imported by debrief screens only. */
export const published = assumptionsOf(content);

/** Rollouts per option for the "sound decision" verdict, and reruns per what-if (spec Section 11). */
const SOUND_ROLLOUTS = 300;
export const WHAT_IF_RUNS = 1000;

type SessionEvent = { type: "START"; seedCode: string } | { type: "RESET" } | { type: "ENGINE"; actions: Action[] };

const sessionApi = createSession(content);

function sessionReducer(session: Session, event: SessionEvent): Session {
  switch (event.type) {
    case "START":
      return sessionApi.start(event.seedCode);
    case "RESET":
      return sessionApi.empty();
    case "ENGINE":
      return sessionApi.apply(session, event.actions);
  }
}

/** For each decision, in order: every open option's expected ending score, best first. */
export type Rankings = OptionEstimate[][];
export type SoundnessStatus = "idle" | "loading" | "ready" | "error";
export interface SoundnessState {
  status: SoundnessStatus;
  rankings: Rankings | null;
}
export interface WhatIfAnswer {
  result: CounterfactualResult;
  milliseconds: number;
}

/** What a What-if label needs about one decision: capital then, and the options that cost more than it. */
export interface UnaffordableAt {
  capital: number;
  options: { id: string; cost: number }[];
}

function newCalculations() {
  return createDebriefCalculations({ overrides });
}

const IDLE_SOUNDNESS: SoundnessState = { status: "idle", rankings: null };
const LOADING_SOUNDNESS: SoundnessState = { status: "loading", rankings: null };
const ERROR_SOUNDNESS: SoundnessState = { status: "error", rankings: null };

export function useGame() {
  const [session, dispatch] = useReducer(sessionReducer, sessionApi.empty());
  const [soundness, setSoundness] = useState<SoundnessState>(IDLE_SOUNDNESS);
  const [soundnessEpoch, setSoundnessEpoch] = useState(0);
  const calculations = useRef<DebriefCalculations | null>(null);
  const sessionToken = useRef(0);

  const currentCalculations = () => {
    calculations.current ??= newCalculations();
    return calculations.current;
  };

  const replaceCalculations = () => {
    calculations.current?.dispose();
    calculations.current = newCalculations();
  };

  useEffect(() => {
    currentCalculations();
    return () => {
      calculations.current?.dispose();
      calculations.current = null;
    };
  }, []);

  // When the game ends, judge every decision off the main thread.
  const over = session.game?.phase === "debrief";
  useEffect(() => {
    if (!over) return;
    const token = sessionToken.current;
    let cancelled = false;
    void currentCalculations().soundness(session.decisionStates, SOUND_ROLLOUTS).then(
      (rankings) => {
        if (!cancelled && token === sessionToken.current) setSoundness({ status: "ready", rankings });
      },
      (error) => {
        if (cancelled || token !== sessionToken.current || isCalculationCancelled(error)) return;
        setSoundness(ERROR_SOUNDNESS);
      },
    );
    return () => { cancelled = true; };
  }, [over, session.decisionStates, soundnessEpoch]);

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
  const start = useCallback((seedCode: string) => {
    sessionToken.current += 1;
    setSoundness(IDLE_SOUNDNESS);
    replaceCalculations();
    dispatch({ type: "START", seedCode });
  }, []);
  const reset = useCallback(() => {
    sessionToken.current += 1;
    setSoundness(IDLE_SOUNDNESS);
    replaceCalculations();
    dispatch({ type: "RESET" });
  }, []);
  const retrySoundness = useCallback(() => {
    setSoundness(LOADING_SOUNDNESS);
    setSoundnessEpoch((epoch) => epoch + 1);
  }, []);
  const act = useCallback((...actions: Action[]) => dispatch({ type: "ENGINE", actions }), []);

  const whatIf = useCallback(async (changeAt: number, newChoiceId: string): Promise<WhatIfAnswer> => {
    const game = session.game;
    if (!game || game.phase !== "debrief") throw new Error("What-if reruns open with the debrief");
    return currentCalculations().whatIf({
      history: game.history, changeAt, newChoiceId, runs: WHAT_IF_RUNS,
      profile: game.world.profile, baseSeed: game.world.seed,
    });
  }, [session.game]);

  const comparison: SoundnessState = over && soundness.status === "idle" ? LOADING_SOUNDNESS : soundness;
  return {
    view,
    before: session.completed?.before ?? null,
    completed: session.completed,
    soundness: comparison,
    retrySoundness,
    start,
    reset,
    act,
    whatIf,
    unaffordable,
  };
}
