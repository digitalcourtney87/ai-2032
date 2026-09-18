import { useState, type FormEvent } from "react";
import { COVER } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { newSeedCode } from "../format";
import { overrideCount } from "../useGame";
import { Facilitator } from "./Facilitator";

interface Props {
  /** A seed code carried in the URL, for workshop play. */
  initialSeed: string | null;
  onStart: (seedCode: string) => void;
}

export function Title({ initialSeed, onStart }: Props) {
  const [seed, setSeed] = useState(initialSeed ?? "");
  const facilitator = new URLSearchParams(window.location.search).get("facilitator") === "1";

  function submit(event: FormEvent) {
    event.preventDefault();
    onStart(seed.trim() || newSeedCode());
  }

  return (
    <div>
      <Figure src={COVER.src} figure={COVER.figure} caption={COVER.caption} state="720pt" className="mb-6" />
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">A decision game</p>
      <h1 className="mt-2 text-4xl">AI 2032</h1>
      <p className="mt-6 text-lg">
        You are Director of the UK Frontier Technology Risk Unit, reporting to the Prime Minister and the National Security Council
        from 2026 to 2032. Your unit coordinates; it does not command departments, regulators or foreign laboratories.
      </p>
      <p className="mt-4">
        How do you govern a technology whose capabilities develop faster than your ability to understand their consequences?
        Over eight decisions you will forecast, buy information, choose and invest. The world you are governing has hidden facts
        that your evidence only partly reveals, and outcomes are drawn from stated probabilities. Good decisions can end badly.
      </p>
      <p className="mt-4 text-sm text-muted">About 25 minutes. There is no correct AI policy to find.</p>

      {overrideCount > 0 && (
        <p className="mt-6 border border-ink p-3 text-sm" role="note">
          <span className="font-semibold">This session uses edited assumptions.</span> A facilitator has changed {overrideCount} of the
          game&rsquo;s probabilities. The debrief shows every number in use.
        </p>
      )}

      <form onSubmit={submit} className="mt-8">
        <div className="grid grid-cols-1 gap-2 border-y border-rule py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
          <label htmlFor="seed" className="font-mono text-xs font-medium uppercase tracking-wider">
            Seed code <span className="font-sans font-normal normal-case tracking-normal text-muted">(optional)</span>
          </label>
          <input
            id="seed"
            aria-describedby="seed-help"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="For example K7Q2-M9XD"
            className="block w-full max-w-xs border border-rule bg-paper px-3 py-2 font-mono uppercase tracking-wider"
          />
        </div>
        <p id="seed-help" className="mt-2 text-sm text-muted">
          Everyone who enters the same code plays the same world and faces the same dice, so a group can compare decisions
          afterwards. Leave it blank for a new world.
        </p>
        <Button type="submit" className="mt-5">
          Begin
        </Button>
      </form>

      {facilitator && <Facilitator seedCode={seed} />}

      <p className="mt-10 border-t border-rule pt-4 text-xs text-muted">
        The Frontier Technology Risk Unit and its advisers are fictional. This game is not endorsed by any government body.
        Every probability in it is a design assumption, not a forecast, and is published at the end of the game.
      </p>
    </div>
  );
}
