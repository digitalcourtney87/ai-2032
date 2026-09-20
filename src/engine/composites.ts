// The three ending composites (spec Section 10). Isolated so condition
// evaluation can use them without a resolve ↔ conditions import cycle.

import type { CompositeKey, MetricKey } from "./types";

export function composites(metrics: Record<MetricKey, number>): Record<CompositeKey, number> {
  return {
    control: (metrics.nationalSecurity + metrics.stateCapacity + (100 - metrics.systemicRisk)) / 3,
    prosperity: (metrics.economy + metrics.innovation + metrics.socialStability) / 3,
    legitimacy: metrics.publicTrust,
  };
}
