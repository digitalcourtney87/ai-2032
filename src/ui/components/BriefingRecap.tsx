import { BriefingContent } from "./BriefingContent";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  /** Show the advisers' forecasts: only on the decision step, once the player's own is locked. */
  showForecasts?: boolean;
}

/**
 * The briefing again, folded, at the foot of the forecast and decision steps
 * (observation 6). It sits after the step's own buttons so the keyboard order of
 * the step is unchanged, it adds no h1, and closed it keeps its regions out of the
 * accessibility tree. The step stays mounted, so the slider or selected option
 * survives, and the crisis clock does not rewind.
 */
export function BriefingRecap({ view, scenario, showForecasts = false }: Props) {
  return (
    <details id="briefing-recap" className="border border-rule p-4">
      <summary className="cursor-pointer font-semibold">Look again at the briefing and your advisers</summary>
      <div className="mt-4">
        <BriefingContent view={view} scenario={scenario} showForecasts={showForecasts} />
      </div>
    </details>
  );
}
