import { backersLine, whoBacksWhat } from "../copy";
import type { PublicAdviser, PublicChoice, PublicScenario } from "../../content";

interface Props {
  scenario: PublicScenario;
  /** The options open this turn, in the order to show them. */
  options: PublicChoice[];
  advisers: PublicAdviser[];
}

/**
 * The options on the table, each with the advisers who back it, so the
 * disagreement is visible on every turn and not only in a crisis. Text, not
 * colour; no option is marked as the consensus or the answer.
 */
export function AdviserSplit({ scenario, options, advisers }: Props) {
  const rows = whoBacksWhat(scenario, options, advisers);
  return (
    <section aria-label="Who backs what">
      <h2 className="text-sm font-semibold">Who backs what</h2>
      <ul className="mt-2 space-y-3 text-sm">
        {rows.map((row) => (
          <li key={row.id}>
            <p>
              <span className="font-semibold">{row.id}.</span> {row.text}
              {row.prepared && (
                <>
                  {" "}
                  <span className="font-semibold">Open to you because you prepared.</span>
                </>
              )}
            </p>
            <p className="mt-0.5 pl-5">{backersLine(row.backers, row.prepared)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
