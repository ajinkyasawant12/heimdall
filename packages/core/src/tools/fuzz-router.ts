export type FuzzStrategy = "mutation_fast" | "concolic_symbolic" | "structure_aware" | "dictionary_guided";

export interface FuzzRoutingDecision {
  strategy: FuzzStrategy;
  allocatedSeconds: number;
  rationale: string;
}

/**
 * DARPA AIxCC & Mayhem inspired Hybrid Fuzzing Router.
 * Balances cheap AFL-style mutation fuzzing with expensive symbolic path solving.
 */
export class HybridFuzzRouter {
  routeExploration(inputCharacteristics: {
    hasMagicBytesCheck: boolean;
    coveragePlateaued: boolean;
    cyclomaticComplexity: number;
    remainingBudgetSeconds: number;
  }): FuzzRoutingDecision {
    // If coverage has plateaued and code contains magic value comparison, route to symbolic execution
    if (inputCharacteristics.hasMagicBytesCheck && inputCharacteristics.coveragePlateaued) {
      return {
        strategy: "concolic_symbolic",
        allocatedSeconds: Math.min(60, inputCharacteristics.remainingBudgetSeconds * 0.4),
        rationale: "Coverage plateaued at complex constraint branch. Engaging SMT solver (Z3/angr concolic) to solve branch guard."
      };
    }

    if (inputCharacteristics.cyclomaticComplexity > 25) {
      return {
        strategy: "structure_aware",
        allocatedSeconds: Math.min(120, inputCharacteristics.remainingBudgetSeconds * 0.5),
        rationale: "High complexity grammar detected. Deploying AST/structure-aware payload mutator."
      };
    }

    // Default fast path
    return {
      strategy: "mutation_fast",
      allocatedSeconds: Math.min(30, inputCharacteristics.remainingBudgetSeconds * 0.2),
      rationale: "Standard high-throughput coverage-guided evolutionary mutation."
    };
  }
}
