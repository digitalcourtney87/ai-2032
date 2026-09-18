import { useState, type FormEvent } from "react";
import { Button } from "../components/Button";
import { newSeedCode } from "../format";

interface Props {
  /** A seed code carried in the URL, for workshop play. */
  initialSeed: string | null;
  onStart: (seedCode: string) => void;
}

export function Title({ initialSeed, onStart }: Props) {
  const [seed, setSeed] = useState(initialSeed ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    onStart(seed.trim() || newSeedCode());
  }

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm uppercase tracking-widest text-muted">A decision game</p>
      <h1 className="mt-2 text-5xl">AI 2032</h1>
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

      <form onSubmit={submit} className="mt-8 border-t border-rule pt-6">
        <label htmlFor="seed" className="block font-semibold">
          Seed code <span className="font-normal text-muted">(optional)</span>
        </label>
        <p id="seed-help" className="mt-1 text-sm text-muted">
          Everyone who enters the same code plays the same world and faces the same dice, so a group can compare decisions
          afterwards. Leave it blank for a new world.
        </p>
        <input
          id="seed"
          aria-describedby="seed-help"
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="For example K7Q2-M9XD"
          className="mt-2 block w-full max-w-xs rounded-sm border border-rule bg-paper px-3 py-2 uppercase tracking-wider"
        />
        <Button type="submit" className="mt-5">
          Begin
        </Button>
      </form>

      <p className="mt-10 border-t border-rule pt-4 text-xs text-muted">
        The Frontier Technology Risk Unit and its advisers are fictional. This game is not endorsed by any government body.
        Every probability in it is a design assumption, not a forecast, and is published at the end of the game.
      </p>
    </main>
  );
}
