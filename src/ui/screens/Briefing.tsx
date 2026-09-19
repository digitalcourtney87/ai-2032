import { SCENARIO_PLATES } from "../art/plates";
import { BriefingContent } from "../components/BriefingContent";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  onContinue: () => void;
}

/** Step 1 of the turn: the situation, the evidence, four adviser positions, and who backs which option. */
export function Briefing({ view, scenario, onContinue }: Props) {
  const plate = SCENARIO_PLATES[scenario.id];

  return (
    <div className="space-y-6">
      {plate && <Figure {...plate} />}
      <BriefingContent view={view} scenario={scenario} />
      <Button onClick={onContinue}>Continue to your forecast</Button>
    </div>
  );
}
