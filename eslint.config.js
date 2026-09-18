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
          ],
        },
      ],
    },
  },
);
