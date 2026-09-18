// One page with view state, no router (handoff Section 2). The engine decides
// what is legal; this component only decides which screen shows it.

import { useEffect, useRef, useState } from "react";
import { StatusPanel } from "./components/StatusPanel";
import { formatMonth } from "./format";
import { Briefing } from "./screens/Briefing";
import { Debrief } from "./screens/Debrief";
import { Decision } from "./screens/Decision";
import { Forecast } from "./screens/Forecast";
import { Invest } from "./screens/Invest";
import { News } from "./screens/News";
import { Title } from "./screens/Title";
import { pub, useGame } from "./useGame";

/** The interface's own steps. "briefing" and "news" are reading steps the engine has no phase for. */
type Stage = "briefing" | "play" | "news" | "debrief";

const STEPS = ["Briefing", "Forecast", "Decision", "Investment", "Consequences"] as const;

function seedFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("seed");
}

export function App() {
  const { view, before, start, reset, act } = useGame();
  const [stage, setStage] = useState<Stage>("briefing");
  /** The turn and scenario whose consequences the news screen is reporting. */
  const [resolved, setResolved] = useState<{ turn: number; scenarioId: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus to the step heading whenever the step changes, for keyboard and screen-reader users.
  const stepKey = view ? `${view.turn}:${view.phase}:${stage}` : "title";
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [stepKey]);

  if (!view) {
    return (
      <Title
        initialSeed={seedFromUrl()}
        onStart={(seedCode) => {
          // The seed code lives in the URL so a run can be shared and reproduced.
          window.history.replaceState(null, "", `?seed=${encodeURIComponent(seedCode)}`);
          setStage("briefing");
          start(seedCode);
        }}
      />
    );
  }

  if (stage === "debrief") {
    return <Debrief view={view} onRestart={() => { window.history.replaceState(null, "", window.location.pathname); reset(); }} />;
  }

  const reporting = stage === "news" && resolved;
  const scenarioId = reporting ? resolved.scenarioId : view.current?.scenarioId;
  const scenario = scenarioId ? pub.scenarios[scenarioId] : undefined;
  if (!scenario) return null;

  const turn = reporting ? resolved.turn : view.turn;
  const isInterrupt = !pub.sequence.includes(scenario.id);
  const stepIndex = stage === "briefing" ? 0 : stage === "news" ? 4 : view.phase === "forecast" ? 1 : view.phase === "decide" ? 2 : 3;
  const current = view.current;

  function toNews() {
    if (current) setResolved({ turn: view!.turn, scenarioId: current.scenarioId });
    setStage("news");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:bg-paper focus:p-2">
        Skip to the briefing
      </a>
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-4">
        <p className="font-serif text-xl">AI 2032</p>
        <p className="text-sm text-muted">
          Turn {turn} of {pub.totalTurns} &middot; {isInterrupt ? "Unscheduled" : formatMonth(scenario.date)} &middot; Seed{" "}
          <span className="tracking-wider">{view.seedCode}</span>
        </p>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main id="main">
          {scenario.isCrisis && (
            <p className="mb-2 inline-block border border-ink px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">Crisis</p>
          )}
          <h1 ref={heading} tabIndex={-1} className="text-3xl outline-none sm:text-4xl">
            {scenario.title}
          </h1>

          <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Steps in this turn">
            {STEPS.filter((step) => !(step === "Investment" && view.current?.isFinal)).map((step) => {
              const active = STEPS[stepIndex] === step;
              return (
                <li key={step} aria-current={active ? "step" : undefined} className={active ? "border-b-2 border-accent font-semibold" : "text-muted"}>
                  {step}
                </li>
              );
            })}
          </ol>

          <div className="mt-6" key={stepKey}>
            {stage === "briefing" && <Briefing view={view} scenario={scenario} onContinue={() => setStage("play")} />}
            {stage === "play" && view.phase === "forecast" && (
              <Forecast view={view} scenario={scenario} onForecast={(value) => act({ type: "FORECAST", value })} />
            )}
            {stage === "play" && view.phase === "decide" && (
              <Decision
                view={view}
                scenario={scenario}
                onBuyInfo={() => act({ type: "BUY_INFO" })}
                onDecide={(choiceId) => {
                  // The final decision takes no investment, so it resolves at once.
                  if (current?.isFinal) {
                    act({ type: "DECIDE", choiceId }, { type: "ADVANCE" });
                    toNews();
                  } else act({ type: "DECIDE", choiceId });
                }}
              />
            )}
            {stage === "play" && view.phase === "invest" && (
              <Invest view={view} onInvest={(track) => { act({ type: "INVEST", track }, { type: "ADVANCE" }); toNews(); }} />
            )}
            {reporting && (
              <News view={view} resolvedTurn={resolved.turn} onContinue={() => setStage(view.phase === "debrief" ? "debrief" : "briefing")} />
            )}
          </div>
        </main>

        <StatusPanel view={view} before={reporting ? before : null} />
      </div>
    </div>
  );
}
