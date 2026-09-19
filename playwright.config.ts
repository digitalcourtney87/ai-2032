import { defineConfig, devices } from "@playwright/test";

// Node supplies `process` when Playwright loads this file; the project has no
// @types/node (runtime and dev dependencies are fixed), as in scripts/balance.ts.
declare const process: { env: Record<string, string | undefined> };

// Browser tests run against the production bundle, which is what players get and
// what the 3-second counterfactual budget must be measured on.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  // Several tests play one or two whole games, and the public-audience redesign
  // added clicks to every turn (disclosures, a preview, the pause card after
  // turn 1). The 30-second default left too little headroom.
  timeout: 60_000,
  use: { baseURL: "http://localhost:4173", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    // CI always builds and serves a fresh bundle. Locally, a preview server
    // already on port 4173 is reused, and it may be serving an old build: before
    // a gate run, `lsof -nP -iTCP:4173 -sTCP:LISTEN` must print nothing.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
