// One page with view state, no router (handoff Section 2). The engine decides
// what is legal; this component only decides which screen shows it.

import { useEffect, useRef, useState } from "react";
import { CrisisClock } from "./components/CrisisClock";
import { StatusPanel } from "./components/StatusPanel";
import { formatMonth } from "./format";
import { Briefing } from "./screens/Briefing";
import { Debrief } from "./screens/Debrief";
import { Decision } from "./screens/Decision";
import { Forecast } from "./screens/Forecast";
import { Invest } from "./screens/Invest";
import { News } from "./screens/News";
import { Title } from "./screens/Title";
import { AppShell } from "./shell/AppShell";
import { pub, useGame } from "./useGame";

/** The interface's own steps. "briefing" and "news" are reading steps the engine has no phase for. */
type Stage = "briefing" | "play" | "news" | "debrief";

const STEPS = ["Briefing", "Forecast", "Decision", "Investment", "Consequences"] as const;
const DEBRIEF_STEPS = ["World", "Calibration", "Quality", "Governance", "Unseen", "What if"] as const;

function seedFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("seed");
}

export function App() {
  const { view, before, rankings, start, reset, act, whatIf } = useGame();
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
      <AppShell>
        <Title
          initialSeed={seedFromUrl()}
          onStart={(seedCode) => {
            // The seed code lives in the URL so a run can be shared and reproduced.
            const params = new URLSearchParams(window.location.search);
            params.set("seed", seedCode);
            params.delete("facilitator");
            window.history.replaceState(null, "", `?${params.toString()}`);
            setStage("briefing");
            start(seedCode);
          }}
        />
      </AppShell>
    );
  }

  if (stage === "debrief") {
    return (
      <AppShell
        chrome={{ turn: pub.totalTurns, totalTurns: pub.totalTurns, dateLabel: "October 2032", seedCode: view.seedCode }}
        steps={DEBRIEF_STEPS}
        stepIndex={0}
        stepsLabel="Record contents"
        status={<StatusPanel view={view} />}
      >
        <Debrief
          view={view}
          rankings={rankings}
          whatIf={whatIf}
          onRestart={() => {
            // Play again keeps a facilitator's edited assumptions but drops the seed, for a new world.
            const params = new URLSearchParams(window.location.search);
            params.delete("seed");
            const query = params.toString();
            window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
            reset();
          }}
        />
      </AppShell>
    );
  }

  const reporting = stage === "news" && resolved;
  const scenarioId = reporting ? resolved.scenarioId : view.current?.scenarioId;
  const scenario = scenarioId ? pub.scenarios[scenarioId] : undefined;
  if (!scenario) return null;

  const turn = reporting ? resolved.turn : view.turn;
  const isInterrupt = !pub.sequence.includes(scenario.id);
  const stepIndex = stage === "briefing" ? 0 : stage === "news" ? 4 : view.phase === "forecast" ? 1 : view.phase === "decide" ? 2 : 3;
  const current = view.current;
  // The final decision takes no investment. While the news reports a turn, the engine has already
  // moved on: after the investment of the turn before the final one, `current` is the final turn,
  // and after the final decision it is cleared. So while reporting, the finished game is what marks
  // the final turn.
  const finalTurn = reporting ? view.phase === "debrief" : Boolean(current?.isFinal);
  const visibleSteps = STEPS.filter((step) => !(step === "Investment" && finalTurn));
  const currentStep = STEPS[stepIndex] ?? "Briefing";
  const activeIndex = Math.max(0, visibleSteps.indexOf(currentStep));

  function toNews() {
    if (current) setResolved({ turn: view!.turn, scenarioId: current.scenarioId });
    setStage("news");
  }

  return (
    <AppShell
      skip={{ href: "#main", label: "Skip to the briefing" }}
      chrome={{
        turn,
        totalTurns: pub.totalTurns,
        dateLabel: isInterrupt ? "Unscheduled" : formatMonth(scenario.date),
        seedCode: view.seedCode,
      }}
      steps={visibleSteps}
      stepIndex={activeIndex}
      stepsLabel="Steps in this turn"
      status={<StatusPanel view={view} before={reporting ? before : null} />}
    >
      {scenario.isCrisis && (
        <div className="mb-3">
          <CrisisClock step={stepIndex} />
        </div>
      )}
      <h1 ref={heading} tabIndex={-1} className="text-3xl outline-none sm:text-4xl">
        {scenario.title}
      </h1>

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
          <Invest
            view={view}
            onInvest={(track) => {
              act({ type: "INVEST", track }, { type: "ADVANCE" });
              toNews();
            }}
          />
        )}
        {reporting && (
          <News view={view} resolvedTurn={resolved.turn} onContinue={() => setStage(view.phase === "debrief" ? "debrief" : "briefing")} />
        )}
      </div>
    </AppShell>
  );
}
