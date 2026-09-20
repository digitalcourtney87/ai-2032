// One page with view state, no router (handoff Section 2). The engine decides
// what is legal; this component only decides which screen shows it.

import { useEffect, useRef, useState } from "react";
import { CrisisClock } from "./components/CrisisClock";
import { StatusPanel } from "./components/StatusPanel";
import { PAUSE_HEADING } from "./copy";
import { DEBRIEF_SECTIONS } from "./debrief/sections";
import { formatMonth } from "./format";
import { Briefing } from "./screens/Briefing";
import { Debrief } from "./screens/Debrief";
import { Decision } from "./screens/Decision";
import { FirstDecision } from "./screens/FirstDecision";
import { Forecast } from "./screens/Forecast";
import { Invest } from "./screens/Invest";
import { News } from "./screens/News";
import { Title } from "./screens/Title";
import { AppShell } from "./shell/AppShell";
import { pub, useGame } from "./useGame";

/**
 * The interface's own steps. "briefing" and "news" are reading steps the engine has no phase for.
 * "pause" is the one-time stop after turn 1's news: the five-minute taster (DECISIONS.md section F).
 */
type Stage = "briefing" | "play" | "news" | "pause" | "debrief";

const STEPS = ["Briefing", "Forecast", "Decision", "Investment", "Consequences"] as const;
/** The debrief's rail is a table of contents: one link per section, in reading order. */
const DEBRIEF_STEPS = DEBRIEF_SECTIONS.map((section) => section.rail);
const DEBRIEF_HREFS = DEBRIEF_SECTIONS.map((section) => `#${section.id}`);
const PAUSE_STEPS = ["Taking stock"] as const;

function seedFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("seed");
}

export function App() {
  const { view, before, soundness, retrySoundness, start, reset, act, whatIf, unaffordable } = useGame();
  const [stage, setStage] = useState<Stage>("briefing");
  /** The turn and scenario whose consequences the news screen is reporting. */
  const [resolved, setResolved] = useState<{ turn: number; scenarioId: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus to the step heading whenever the step changes, for keyboard and screen-reader users.
  // Not on a first visit to the title: focusing its h1 by script on load draws the focus ring round
  // "AI 2032" for every visitor. Once any game has started, coming back to the title focuses it.
  const stepKey = view ? `${view.turn}:${view.phase}:${stage}` : "title";
  const started = useRef(false);
  useEffect(() => {
    if (stepKey !== "title") started.current = true;
    if (started.current) heading.current?.focus();
    window.scrollTo(0, 0);
  }, [stepKey]);

  /** "Play a new world" on the debrief, and Back to the start on the pause: keep a facilitator's edited assumptions, drop the seed for a new world. */
  function backToStart() {
    const params = new URLSearchParams(window.location.search);
    params.delete("seed");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    reset();
  }

  if (!view) {
    return (
      <AppShell>
        <Title
          headingRef={heading}
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
        stepIndex={-1}
        stepsLabel="In this debrief"
        stepHrefs={DEBRIEF_HREFS}
      >
        <Debrief
          view={view}
          soundness={soundness}
          onRetrySoundness={retrySoundness}
          whatIf={whatIf}
          unaffordable={unaffordable}
          onRestart={backToStart}
        />
      </AppShell>
    );
  }

  // The pause is not a turn step: it has its own shell, rail and h1, so the next turn's clock and rail are untouched.
  const pausedOn = stage === "pause" && resolved ? pub.scenarios[resolved.scenarioId] : undefined;
  if (pausedOn && resolved && before) {
    return (
      <AppShell
        skip={{ href: "#main", label: "Skip to the main content" }}
        chrome={{ turn: resolved.turn, totalTurns: pub.totalTurns, dateLabel: formatMonth(pausedOn.date), seedCode: view.seedCode }}
        steps={PAUSE_STEPS}
        stepIndex={0}
        stepsLabel="Where you are"
      >
        <h1 ref={heading} tabIndex={-1} className="text-3xl outline-none sm:text-4xl">
          {PAUSE_HEADING}
        </h1>
        <div className="mt-6">
          <FirstDecision
            view={view}
            before={before}
            scenario={pausedOn}
            resolved={resolved}
            onContinue={() => setStage("briefing")}
            onRestart={backToStart}
          />
        </div>
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
      skip={{ href: "#main", label: "Skip to the main content" }}
      chrome={{
        turn,
        totalTurns: pub.totalTurns,
        dateLabel: isInterrupt ? "Unscheduled" : formatMonth(scenario.date),
        seedCode: view.seedCode,
      }}
      steps={visibleSteps}
      stepIndex={activeIndex}
      stepsLabel="Steps in this turn"
      // On the forecast and decision steps the briefing is folded at the foot of the page (BriefingRecap).
      stepHrefs={stage === "play" && (view.phase === "forecast" || view.phase === "decide") ? ["#briefing-recap"] : undefined}
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
          <News
            view={view}
            before={before}
            scenario={scenario}
            resolvedTurn={resolved.turn}
            onContinue={() => setStage(view.phase === "debrief" ? "debrief" : resolved.turn === 1 ? "pause" : "briefing")}
          />
        )}
      </div>
    </AppShell>
  );
}
