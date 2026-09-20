import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

// APIs that would break determinism. Banned across the engine (handoff invariant 2).
const bannedGlobals = ["Date", "crypto", "performance"].map((name) => ({
  name,
  message: "The engine is deterministic: no wall clock, no platform randomness.",
}));

export default tseslint.config(
  { ignores: ["dist", "node_modules", "playwright-report", "test-results"] },
  ...tseslint.configs.recommended,
  {
    // A leading underscore marks a parameter as deliberately unused.
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/ui/**/*.{ts,tsx}", "src/main.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Engine isolation: the engine and content must never reach into the UI.
    files: ["src/engine/**/*.ts", "src/content/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/ui/**", "react", "react-dom", "recharts"], message: "engine/ and content/ must not import UI code." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/engine/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", ...bannedGlobals],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "All randomness comes from the seeded generator in src/engine/rng.ts." },
      ],
    },
  },
  {
    // Truth stays in the engine: the UI may use only the public engine API.
    files: ["src/ui/**/*.{ts,tsx}", "src/main.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/engine/*", "!**/engine/index"], message: "Import the engine only through src/engine/index.ts." },
            { group: ["**/content/*", "!**/content/index"], message: "Import content only through src/content/index.ts, which hides hidden effects from components." },
            { group: ["**/session", "**/session.ts"], message: "Raw session state stays inside src/ui/session.ts and useGame.ts." },
          ],
        },
      ],
    },
  },
  {
    // Hidden information stays hidden until the debrief (DECISIONS.md B40): play
    // screens and components may not import the published assumptions, or read the
    // debrief-only fields of the displayed state. In flat config this block replaces
    // the no-restricted-imports options of the block above for these files, so it
    // repeats the engine and content patterns.
    files: ["src/ui/**/*.{ts,tsx}"],
    ignores: ["src/ui/debrief/**", "src/ui/screens/Debrief.tsx", "src/ui/screens/Facilitator.tsx", "src/ui/useGame.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/engine/*", "!**/engine/index"], message: "Import the engine only through src/engine/index.ts." },
            { group: ["**/content/*", "!**/content/index"], message: "Import content only through src/content/index.ts, which hides hidden effects from components." },
            { group: ["**/session", "**/session.ts"], message: "Raw session state stays inside src/ui/session.ts and useGame.ts." },
            { group: ["**/useGame"], importNames: ["published", "defaults"], message: "The published assumptions are for the debrief and the facilitator panel only (DECISIONS.md B40)." },
            { group: ["**/content", "**/content/index"], importNames: ["assumptionsOf"], message: "assumptionsOf() is for the debrief and the facilitator panel only (DECISIONS.md B40)." },
          ],
        },
      ],
      // The debrief-only fields of DisplayedState, and the band half-width, never reach a play screen.
      // On the final turn's consequences truth, debrief and history already exist. No earlier block
      // sets this rule, so nothing is replaced.
      "no-restricted-syntax": [
        "error",
        { selector: "MemberExpression[property.name=/^(truth|debrief|history)$/]:not([object.name='window'])", message: "truth, debrief and history are for the debrief only; on the final turn's consequences they already exist (DECISIONS.md B40, F5)." },
        { selector: "ObjectPattern > Property[key.name=/^(truth|debrief|history|halfWidth)$/]", message: "Do not destructure debrief-only fields or the band half-width outside the debrief (DECISIONS.md B40)." },
        { selector: "MemberExpression[property.name='halfWidth']", message: "The band half-width is 30 - 0.25 x true State Capacity: use low, mid and high only." },
      ],
    },
  },
);
