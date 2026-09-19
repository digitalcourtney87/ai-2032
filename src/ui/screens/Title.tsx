import { useState, type FormEvent, type Ref } from "react";
import { COVER } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { newSeedCode } from "../format";
import { titlePaceLine } from "../copy";
import { overrideCount, pub } from "../useGame";
import { Facilitator } from "./Facilitator";

interface Props {
  /** A seed code carried in the URL, so friends can play the same world. */
  initialSeed: string | null;
  /** App's step heading, so focus comes back to this h1 after "Play a new world" or Back to the start. */
  headingRef?: Ref<HTMLHeadingElement>;
  onStart: (seedCode: string) => void;
}

/**
 * The opening leads with the dilemma and puts the first decision on the first
 * screen, even on a small phone. The cover, how a turn works and what the game
 * covers sit below it for anyone who wants them first.
 */
export function Title({ initialSeed, onStart, headingRef }: Props) {
  const [seed, setSeed] = useState(initialSeed ?? "");
  const facilitator = new URLSearchParams(window.location.search).get("facilitator") === "1";

  function submit(event: FormEvent) {
    event.preventDefault();
    onStart(seed.trim() || newSeedCode());
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">A decision game</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-4xl outline-none">
        AI 2032
      </h1>
      <p className="mt-5 text-xl">
        AI could make us healthier, wealthier and safer. It could also make serious harm easier. What would you do?
      </p>
      <p className="mt-4">
        You play the Director of the Frontier Technology Risk Unit, a small, fictional UK government team advising the Prime Minister
        on AI from 2026 to 2032. Explore what you think about AI, and discover what might change your mind.
      </p>

      {/* One form: the button uses the seed code in the disclosure below it, if there is one. */}
      <form onSubmit={submit} className="mt-6">
        <Button type="submit">Try your first decision</Button>
        <p className="mt-3 text-sm text-muted">
          {titlePaceLine(pub.totalTurns)}
        </p>
        {overrideCount > 0 && (
          <p className="mt-4 border border-ink p-3 text-sm" role="note">
            <span className="font-semibold">This session uses edited assumptions.</span> A facilitator has changed {overrideCount} of the
            game&rsquo;s probabilities. The debrief shows every number in use.
          </p>
        )}

        <details className="mt-6 border-y border-rule py-2" open={Boolean(initialSeed)}>
          <summary className="cursor-pointer py-1 font-semibold">Play the same world as a friend</summary>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
            <label htmlFor="seed" className="font-mono text-xs font-medium uppercase tracking-wider">
              Seed code
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
          <p id="seed-help" className="mt-2 pb-1 text-sm text-muted">
            A code fixes the hidden world and the dice. With the same code as a friend, you both face the same world, so you can
            compare what you decided afterwards. A link with a code fills this in for you. Your own code appears at the top of the
            screen once you start. Clear the box for a new world.
          </p>
        </details>
      </form>

      <Figure {...COVER} className="mt-10" />

      <section aria-labelledby="how-it-works" className="mt-10">
        <h2 id="how-it-works" className="text-xl">How it works</h2>
        <p className="mt-2">
          Each decision starts with a briefing and four advisers who do not all agree. You say how likely you think something is and
          choose what to do; until the last decision, you also pick one area to prepare for what comes later. Your unit coordinates;
          it does not command departments, regulators or foreign laboratories.
        </p>
        <p className="mt-3">
          The world you are governing has hidden facts that your evidence only partly reveals, and chance plays a part in what
          happens, so a sound decision can still end badly. At the end you see the hidden world, every probability the game used, and
          where chance helped or hurt.
        </p>
      </section>

      <section aria-labelledby="what-you-face" className="mt-8">
        <h2 id="what-you-face" className="text-xl">What you will face</h2>
        {/* One line per scripted scenario in src/content/game.json "sequence", in order, plus the unscheduled crisis. */}
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>A breach at a UK firm that an AI may have largely carried out. Experts disagree, and tougher rules could cost Britain new products.</li>
          <li>A powerful AI model released for anyone to download: useful to researchers and start-ups, and impossible to recall.</li>
          <li>A finding that AI helps scientists with difficult laboratory work, which may also lower the barrier to misuse.</li>
          <li>Graduate hiring falling as AI takes on junior work, while productivity rises and unemployment holds steady.</li>
          <li>Audio of a senior politician, three days before a general election, that may or may not be a deepfake.</li>
          <li>An AI system that does worse when it seems to know it is being tested: a quirk of its training, or a sign it is hiding what it can do?</li>
          <li>A final call in 2032 on a system that can do scientific research by itself, when no test can yet show that it is safe.</li>
          <li>And one unscheduled crisis, on a clock that moves only when you do.</li>
        </ul>
      </section>

      {facilitator && <Facilitator seedCode={seed} />}

      <p className="mt-10 border-t border-rule pt-4 text-xs text-muted">
        The Frontier Technology Risk Unit and its advisers are fictional. This game is not endorsed by any government body.
        Every probability in it is a design assumption, not a forecast, and is published at the end of the game.
      </p>
    </div>
  );
}
