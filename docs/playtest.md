# Playtest and timing protocol

How to run the newcomer playtest (the playtest row in `DECISIONS.md` section F) and check the game against its time budget. Both need people: the automated gates cannot measure reading speed, understanding, or whether someone wants to keep playing. Until a round has been run and reported in [docs/plan.md](plan.md), these items stay open.

## Who

- Ten solo testers from the general public with no professional background in AI policy, government or forecasting. An informal group sharing one seed code is optional.
- Adults, until the designer decides the age range: the game includes an election deepfake and a biosecurity scenario.
- A mix of phones and laptops, with at least four on a phone.
- Nobody who has seen the redesign, read these documents or been told how the game works.

## Setting up a session

1. Before the round, ask the designer to approve a preview address for testers: an unlisted preview deployment of the branch under review, not a public release. Phone testers and the replay-within-a-week follow-up need it. Without one, run `npm run build && npm run preview -- --host` on a laptop, open the `Network` address it prints on phones on the same Wi-Fi, stop the server with Ctrl+C after the session, and report replay within a week as not measured. Never post either address publicly: no deploy of the redesign has been approved.
2. For each tester, open a new private (incognito) window at `/` with no seed code, and close every private window at the end of the session, so no earlier tester's seed code or kept game is offered. Once the game starts, note the seed code shown in the header.
3. Before starting, tell the tester that the game is fiction with invented numbers; that it touches on cyber attacks, an election deepfake and a biological threat, at policy level; and that they can stop at any time without saying why. Ask whether you may note what they say, keep their run summary and message them in a week. Keep record sheets under initials, and delete contact details after the follow-up.
4. Then say only: "This is a game about decisions on AI. Play it as you would at home. There is no time limit and no right answer. If a word puzzles you, say so; I will note it but will not explain it until the end." Keep the stopwatch out of the tester's sight. Do not explain terms; write down every word the tester raises.
5. Nothing is collected automatically: the game has no analytics and sends nothing anywhere. Your data are the timing sheet, what you observe, the turn-1 option and forecast shown on the pause card, the tester's own **Copy run summary** (ask them to paste it to you at the end) and the interview.

## Timing the game against its budget

The spec gives about three minutes a turn and 25 minutes overall, and a new player should finish without help in under 30 minutes (spec Sections 1, 4 and 13). Budgets per step:

| Step | Ends when the tester presses | Budget |
| --- | --- | --- |
| Title | Try your first decision | 1 minute |
| Briefing | Continue to your forecast | 60 to 75 seconds |
| Forecast | Lock in | 20 seconds |
| Decision, with any analysis | Confirm option | 45 seconds |
| Investment | Invest in | 15 seconds |
| Consequences | Next briefing (Read your debrief after the last decision) | 30 seconds |
| Pause card after turn 1 | Keep going | 30 seconds |
| One whole turn | | about 3 minutes |
| Title to the pause card (the taster) | | about 5 minutes |
| Title to the debrief | Read your debrief | about 25 minutes |
| The whole session, debrief included | the tester says they have finished | under 30 minutes |

How to time:

- Use a stopwatch with laps; a phone's clock app will do. Start it when the title screen appears and press lap each time the tester presses one of the buttons in the table. The last decision has no investment step.
- Do not ask the tester to think aloud: it slows reading. Ask questions only at the pause card, once the tester has chosen, and after the debrief, and pause the stopwatch while you do.
- Stop when the tester says they have finished with the debrief, and note how far into it they read.
- Note any interruption and subtract it.

A step is over budget when it takes more than one and a half times its budget for three or more of ten testers. The spec's remedy when completion is low is to shorten the briefings (spec Section 13). Log any change in `DECISIONS.md`.

## What to measure

### The spec's six playtest metrics (spec Section 13)

| Metric | Target | Where it comes from |
| --- | --- | --- |
| Most-chosen option share, per scenario | below 60% | the run summaries: each decision's line gives the option; for a tester who stopped at the pause, the turn-1 option you noted from the pause card |
| Completion rate | 80% or above | observation: the tester reached the debrief. A tester who chose Stop here counts as not completed |
| Replay within a week | 30% or above | a message seven days later to each tester who agreed to one: "Have you played again?" It needs the approved preview address (setup step 1); without one, report it as not measured |
| Testers who name a decision they would defend despite a bad outcome | 50% or above; two of five is the floor for a five-person round | interview question 1 |
| Forecast slider used meaningfully (not left at 50%) | 70% of forecasts | the run summaries: count the forecasts moved away from 50% (each decision's line gives "forecast N%"); for a tester who stopped, the turn-1 forecast you noted from the pause card |
| Testers who say the game pushed a policy line | below 20%, split evenly by direction | interview question 5: record the direction they name |

### The engagement handoff's four approachability checks

While the tester reads the pause card after turn 1, note the turn-1 option and forecast it shows under What you chose and Still open. Say nothing until the tester has pressed **Keep going** or **Stop here**, and record which (check 4). Then pause the stopwatch and ask checks 1 to 3, then: "If you had found this on your own at home, would you have kept going now?"

1. **Understands the dilemma.** "In your own words, what was that first decision trading off?" It passes if the answer names something gained and something risked.
2. **Can explain the visible consequences.** "What changed after your decision, and what is still unknown?" It passes if the answer names at least one measured change and one open question.
3. **Chooses without specialist knowledge.** It passes if the tester raised no unknown term before the first decision, and answers no to: "Was there a word you needed for that choice that you did not know?"
4. **Wants to continue.** It passes if the tester chose **Keep going** at the pause card. If they chose **Stop here**, ask "What made you stop?", then interview questions 4 to 8, and end the session. Their taster time still counts, and they count as not completed.

### Neutrality

Ask in exactly these words: "Did the game try to convince you AI is dangerous, or that it is safe?" Record dangerous, safe, neither or both, with the tester's own words. Report it on its own, as counts of dangerous, safe, neither and both. It is not the spec's policy-line metric, which has its own question (interview question 5): a game can be even-handed about AI's dangers and still favour one kind of policy.

## Interview after the debrief (about five minutes)

1. "Is there a decision you would defend even though it turned out badly?"
2. "Which decision would you argue about with a friend?"
3. "Did anything that looked dangerous turn out not to be, or the other way round?"
4. The neutrality question, above.
5. "Did the game seem to favour one kind of policy, for example acting early and restrictively, or waiting and staying open? If so, which?"
6. "Did it feel like a test with right answers, or a score to beat?" Record their words.
7. "Was there a word or a screen you did not understand?"
8. "Would you play again, or send it to someone?"

## Record sheet (one per tester)

| Field | Entry |
| --- | --- |
| Tester (initials), date, phone or laptop | |
| Agreed to: notes of what they say, keeping the run summary, a message in a week | |
| Seed code | |
| Laps: the title; then briefing, forecast, decision, investment and consequences for each turn; the pause card | |
| Title to the pause card; title to the debrief; the whole session | |
| Words the tester raised | |
| At the pause card: Keep going or Stop here; the turn-1 option and forecast it showed; the "at home" answer | |
| Checks 1 to 4: passed or not, with notes | |
| Neutrality answer, in their words | |
| Interview answers 1 to 8 (4 to 8 for a tester who stopped) | |
| Run summary, pasted (testers who reached the debrief) | |
| Replay within a week (the follow-up), or "not measured" | |

## Reporting

Report each metric as a count, for example "7 of 10", and count testers who stopped at the pause in every measure they answered, marked as stopped. Do not call a target met from fewer than ten testers, except the two-of-five floor. Record the results against the items in the "Owned by the designer, not the build" section of `docs/plan.md`, and log any change they lead to in `DECISIONS.md`. The items stay open until the designer reports them.
