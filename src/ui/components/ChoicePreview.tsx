import { Button } from "./Button";
import { NO_STATED_EFFECT, OFFICIALS_EXPECT, PREVIEW_PROMPT, previewCaveat, previewRowText, previewSummary } from "../copy";
import type { ChoicePreview as Preview } from "../preview";

interface Props {
  /** The selected option's preview, or null before anything is selected. */
  preview: Preview | null;
  /** The final decision takes no investment, so the caveat leaves it out. */
  isFinal: boolean;
  onConfirm: () => void;
}

/**
 * What the selected option would cost and what officials expect it to do. It sits
 * after the option group in reading order, so one Tab from "Commission analysis"
 * still lands on the options. The bar (`data-decision-bar`) holds the live summary and
 * the Confirm button; theme.css makes it sticky at the bottom of the viewport whenever
 * the viewport is tall enough, and keeps focus from scrolling under it.
 */
export function ChoicePreview({ preview, isFinal, onConfirm }: Props) {
  // Confirmable only while the live status says so: buying analysis can price a selection out (the Phase 8 fix).
  const confirmId = preview?.status === "available" ? preview.id : null;
  return (
    <>
      <section aria-labelledby="choice-preview-heading" className="border border-rule p-4">
        <h2 id="choice-preview-heading" className="font-semibold">
          {preview ? `If you choose option ${preview.id}` : "Before you choose"}
        </h2>
        {!preview && <p className="mt-1 text-sm">{PREVIEW_PROMPT}</p>}
        {preview && preview.rows.length > 0 && (
          <>
            <p className="mt-1 text-sm">{OFFICIALS_EXPECT}</p>
            <ul className="mt-1 space-y-0.5 font-mono text-sm">
              {preview.rows.map((row) => (
                <li key={row.metric}>{previewRowText(row)}</li>
              ))}
            </ul>
          </>
        )}
        {preview && preview.rows.length === 0 && <p className="mt-1 text-sm">{NO_STATED_EFFECT}</p>}
        <p className="mt-2 text-sm text-muted">{previewCaveat(isFinal)}</p>
      </section>

      <div data-decision-bar className="-mx-4 border-t border-ink bg-paper px-4 py-3 sm:-mx-8 sm:px-8">
        <p aria-live="polite" className="text-sm font-semibold">
          {previewSummary(preview)}
        </p>
        <Button className="mt-2" disabled={confirmId === null} onClick={onConfirm}>
          {confirmId ? `Confirm option ${confirmId}` : "Choose an option"}
        </Button>
      </div>
    </>
  );
}
