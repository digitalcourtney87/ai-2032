import { DISCUSSION_PROMPTS, TALK_INTRO } from "./copy";

/** Open questions to end on, for thinking alone or talking over with someone who has played. Never numbered, never scored. */
export function TalkItOver() {
  return (
    <div className="space-y-3">
      <p>{TALK_INTRO}</p>
      <ul className="list-disc space-y-2 pl-5">
        {DISCUSSION_PROMPTS.map((prompt) => (
          <li key={prompt}>{prompt}</li>
        ))}
      </ul>
    </div>
  );
}
