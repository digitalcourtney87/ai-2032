// The bridge between React and the engine. `useReducer` wraps the pure engine
// (handoff Section 2: no state library). The raw GameState never leaves this
// file: components receive only `displayed(state)` (handoff invariant 3).

import { useCallback, useMemo, useReducer } from "react";
import { createGame, displayed, reduce, type Action, type DisplayedState, type GameState } from "../engine";
import { loadContent, publicContent } from "../content";

// Content is validated once, when the module loads. Malformed content fails loudly here.
const content = loadContent();
export const pub = publicContent(content);

interface Session {
  game: GameState | null;
  /** The view just before the last ADVANCE, so the news screen can show what changed. */
  before: DisplayedState | null;
}

type SessionAction = { type: "START"; seedCode: string } | { type: "RESET" } | { type: "ENGINE"; actions: Action[] };

function sessionReducer(session: Session, event: SessionAction): Session {
  switch (event.type) {
    case "START":
      return { game: createGame(event.seedCode, content), before: null };
    case "RESET":
      return { game: null, before: null };
    case "ENGINE": {
      let { game, before } = session;
      if (!game) return session;
      for (const action of event.actions) {
        if (action.type === "ADVANCE") before = displayed(game);
        game = reduce(game, action, content);
      }
      return { game, before };
    }
  }
}

export function useGame() {
  const [session, dispatch] = useReducer(sessionReducer, { game: null, before: null });
  const view = useMemo(() => (session.game ? displayed(session.game) : null), [session.game]);
  const start = useCallback((seedCode: string) => dispatch({ type: "START", seedCode }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const act = useCallback((...actions: Action[]) => dispatch({ type: "ENGINE", actions }), []);
  return { view, before: session.before, start, reset, act };
}
