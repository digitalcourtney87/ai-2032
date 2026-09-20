// Private session: the game, decision snapshots and the last completed turn.
// Raw state stays inside this module and useGame; screens never import it.

import { createGame, displayed, reduce, type Action, type Content, type DisplayedState, type GameState, type Track } from "../engine";

export interface CompletedTurn {
  turn: number;
  scenarioId: string;
  before: DisplayedState;
  after: DisplayedState;
}

export interface Session {
  game: GameState | null;
  completed: CompletedTurn | null;
  decisionStates: GameState[];
}

export interface GameSession {
  empty(): Session;
  start(seedCode: string): Session;
  apply(session: Session, actions: Action[]): Session;
  forecast(session: Session, value: number): Session;
  buyInfo(session: Session): Session;
  decide(session: Session, choiceId: string): Session;
  completeNonFinal(session: Session, track: Track): Session;
  completeFinal(session: Session, choiceId: string): Session;
}

const EMPTY: Session = { game: null, completed: null, decisionStates: [] };

function step(session: Session, action: Action, content: Content): Session {
  const game = session.game;
  if (!game) return session;
  const decisionStates = action.type === "DECIDE" ? [...session.decisionStates, game] : session.decisionStates;
  if (action.type !== "ADVANCE") {
    return { ...session, game: reduce(game, action, content), decisionStates };
  }
  const before = displayed(game);
  const scenarioId = before.current?.scenarioId;
  if (!scenarioId) throw new Error("ADVANCE needs a turn in progress");
  const next = reduce(game, action, content);
  return {
    game: next,
    decisionStates,
    completed: { turn: before.turn, scenarioId, before, after: displayed(next) },
  };
}

export function createSession(content: Content): GameSession {
  const apply = (session: Session, actions: Action[]): Session => {
    let current = session;
    for (const action of actions) current = step(current, action, content);
    return current;
  };

  return {
    empty: () => EMPTY,
    start: (seedCode) => ({ game: createGame(seedCode, content), completed: null, decisionStates: [] }),
    apply,
    forecast: (session, value) => apply(session, [{ type: "FORECAST", value }]),
    buyInfo: (session) => apply(session, [{ type: "BUY_INFO" }]),
    decide: (session, choiceId) => apply(session, [{ type: "DECIDE", choiceId }]),
    completeNonFinal: (session, track) => apply(session, [{ type: "INVEST", track }, { type: "ADVANCE" }]),
    completeFinal: (session, choiceId) => apply(session, [{ type: "DECIDE", choiceId }, { type: "ADVANCE" }]),
  };
}
