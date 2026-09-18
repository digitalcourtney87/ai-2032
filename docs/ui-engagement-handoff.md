# AI 2032: public-facing engagement redesign

## Purpose of the next session

Help the user develop a more engaging, approachable UI for AI 2032. Continue from the review below, grounding design choices in the user's clarified audience. This is a handoff of exploration, not an approved implementation specification. No redesign has been implemented or deployed.

Repository: `/Users/courtneyallen/Documents/GitHub/ai-2032`

Live site: https://ai-2032.courtney-rj-allen.workers.dev/

## The user's intent — authoritative

The user initially asked to review the project and explore how to make the UI more engaging. After the review assumed the audience stated in the existing spec, the user clarified:

> Everyone - this isn't a professional project. It is a response to recent concerns shared about the dangers of AI in my network. It should be interesting to everyone

Treat this clarification as superseding the existing spec's emphasis on policy professionals and facilitated workshops. This is a personal project meant to engage a broad audience in questions about AI's potential dangers and trade-offs. Do not assume familiarity with government, forecasting or AI policy. The user has not specified age groups, a preferred visual direction or a final feature scope.

## Existing project context

Read the existing artifacts instead of reconstructing the game specification:

- `README.md`: architecture, commands and project status.
- `docs/spec.md`: mechanics, intended learning outcomes and original audience assumption. Its audience priority is now outdated relative to the conversation.
- `docs/handoff.md`: existing build handoff; distinct from this UI exploration handoff.
- `docs/plan.md`: implementation history and outstanding human playtests.
- `DECISIONS.md`: design decisions, including the current visual system.

The project is a React/TypeScript browser decision game about UK AI governance through 2032. It has a distinctive illustrated dossier aesthetic, an eight-turn game, uncertainty, adviser disagreement, forecasts, optional information purchases, policy decisions, investments and a substantial debrief. It is a static application with no backend or accounts. Preserve the separation between public information and hidden simulation state.

## What was actually reviewed

- Played one full turn on the live site: briefing → forecast → policy choice → investment → consequences.
- Observed the cover, forecast and consequences visually at a roughly 726px-wide browser viewport in dark mode.
- Read the UI screens, shell, theme, status panel, crisis clock, navigation rail and relevant design documentation.
- Reviewed debrief structure in source; did not complete a live eight-turn playthrough.
- The working tree was clean when checked. No project files were changed during the review; recheck current status before working.
- These are expert design observations, not validated user-research findings. No new tests were run because no code changed.

## Observations from the review

1. The cover illustration and introductory text put the Begin button below the first viewport at the observed width. Optional seed-code setup takes space before starting.
2. The briefing presents a situation, assessment, four options and four adviser statements before the first action. The content is meaningful but asks for substantial reading upfront.
3. Policy and investment screens use similar stacked radio-card forms. Their distinct purposes could feel more tangible.
4. Policy effects are embedded in text. Selecting an option could provide a clearer preview of known trade-offs and remaining Political Capital, without exposing hidden effects.
5. The first consequences screen offered one headline, with national metric changes in a separate panel below the main content at the observed width. Feedback exists, but is easy to miss.
6. The navigation rail displays steps but does not let players revisit briefing/adviser context while deciding.
7. Labels such as `720PT` and `48MM` appear in the public interface. They add print-production styling without helping players understand the game.
8. Adviser forecast estimates are listed separately from the slider. Showing them on a common scale could make disagreement clearer, although consider anchoring effects when designing it.
9. The debrief has six substantial sections, with the interactive What if section last. Its strongest invitation to experiment could appear earlier.
10. Local save/resume was suggested for a 25-minute experience; the reviewed app keeps play state in memory and the URL carries a seed, not saved progress. Verify before implementing persistence.

Useful implementation entry points: `src/ui/screens/{Title,Briefing,Forecast,Decision,Invest,News,Debrief}.tsx`, `src/ui/components/StatusPanel.tsx`, `src/ui/shell/{AppShell,StepsRail}.tsx`, `src/ui/App.tsx`, `src/ui/theme.css`, and `src/ui/debrief/`.

## Direction discussed after the audience correction

The initial review recommended a “living dossier” approach for the old workshop audience. After the user's clarification, the recommendation shifted toward an accessible “cabinet room” experience: retain the government role as the story, but lead with human concerns, lively disagreement and visible consequences.

The user has not explicitly selected this direction. Treat the following as proposals to develop, not approved requirements:

- **Start with a dilemma:** connect AI's possible benefits and harms, then invite the player to try a first decision. Suggested draft: “AI could make us healthier, wealthier and safer. It could also make serious harm easier. What would you do?” CTA: “Try your first decision”.
- **Use everyday stakes:** jobs, hospitals, scams, elections and public services before institutional terminology. These are framing ideas, not claims that every subject already has a scenario.
- **Teach through play:** explain resources and forecasting when needed rather than in a long opening. Make shared-seed play an optional “Play the same scenario as a friend” feature.
- **Make advisers approachable:** short, recognisable perspectives and disagreements, with deeper reasoning available on demand. Avoid flattening them into a correct expert and incorrect foils.
- **Make consequences memorable:** a headline, a visible change and an unresolved question. Separate what was chosen, what became public, what changed measurably and what remains unknown.
- **Make preparation visible:** show investment progression and the next unlock; make the payoff evident when a later option becomes available.
- **End with discussion and agency:** reflect on priorities, surprising outcomes and changed expectations, then offer an easy way to replay one decision.
- **Explore a five-minute introductory route:** let visitors sample the experience before committing to the existing full game. This is a potential scope expansion, not simply a copy change. Evaluate what it would require and whether it preserves meaningful uncertainty and learning.

Suggested central promise: “Explore what you think about AI—and discover what might change your mind.”

The objective is curiosity and thoughtful conversation, with both benefits and dangers represented. Do not turn the game into a predetermined warning, a knowledge exam or a score-maximising exercise.

## Suggested next steps

1. Read repository instructions and the relevant existing documentation; inspect the current working tree.
2. Briefly acknowledge the broad, non-professional audience. Do not reopen the already answered question of whether workshops are the main audience.
3. Develop a concrete, reviewable design for the opening and one representative turn. A small interactive prototype would make pacing and feedback easier to assess than another long list of recommendations.
4. Keep the existing simulation mechanics for the first UI experiment where possible. Identify separately any changes needed for a shorter introductory route.
5. Validate whether a newcomer can understand the dilemma, choose without specialist knowledge, explain the visible consequences and want to continue. Retain uncertainty rather than explaining every outcome as caused by the player.
6. If the user requests implementation, agree the scope from the concrete design and proceed with appropriate responsive, keyboard and accessibility checks. Read README for available build/test commands; do not claim its historical pass status as fresh verification.

No approval to publish or deploy a redesign was given in this conversation. The latest request was only to prepare this handoff for Claude Code.

## Constraints and cautions

- Preserve meaningful trade-offs and the distinction between decision quality and luck.
- Do not reveal hidden simulation facts through choice previews or consequence explanations.
- Metric movement can include investments, background drift and other effects; do not attribute the entire net change to the selected policy without support from the engine.
- The crisis clock is deliberately simulated and advances with steps rather than elapsed time. Preserve accessible, unhurried play.
- Maintain reduced-motion support, keyboard operation and readable layouts at smaller widths.
- Preserve the local, no-account nature of the experience unless the user requests otherwise.
- A seed link reproduces a world; it is not a saved-progress link.

## Suggested skills

- **Brainstorming**: continue refining the public-facing experience before broad implementation. This was used in the originating session.
- **Prototype**: useful if building the proposed opening/one-turn interaction experiment. Read its instructions before applying it.
- **Accessibility/browser testing**: use an available browser workflow to inspect the real interaction, responsive layout and keyboard navigation.
- **Implementation planning and verification**: apply when a direction and scope are accepted; choose meaningful checks for the changed behavior.

The user's repository instructions also requested bootstrapping the Superpowers system. The originating session ran `~/.codex/superpowers/.codex/superpowers-codex bootstrap`. Follow the current repository and Claude Code environment instructions rather than assuming Codex-specific tool names exist in the new session.
