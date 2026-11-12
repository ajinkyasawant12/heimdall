import { createHash } from "node:crypto";
export class EvolutionController {
  constructor(learningStore) {
    this.learningStore = learningStore;
  }

  /**
   * Proposes a new prompt or instruction candidate.
   */
  proposeCandidate(input) {
    return this.learningStore.putCandidate({
      projectId: input.projectId,
      kind: input.kind,
      targetId: input.targetId,
      baseVersion: input.baseVersion,
      proposal: input.proposal,
      status: "proposed",
      evidenceEventIds: input.evidenceEventIds
    });
  }

  /**
   * Runs an evaluation suite comparing candidate against baseline on fixture test cases.
   */
  async evaluateCandidate(candidateId, fixtures, evaluatorFn) {
    const candidate = this.learningStore.getCandidate(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);
    let baselineCorrect = 0;
    let candidateCorrect = 0;
    for (const testCase of fixtures) {
      // Evaluate baseline
      const basePass = await evaluatorFn(candidate.baseVersion, testCase);
      if (basePass === testCase.shouldDetect) baselineCorrect++;

      // Evaluate candidate
      const candidatePass = await evaluatorFn(candidate.proposal, testCase);
      if (candidatePass === testCase.shouldDetect) candidateCorrect++;
    }
    const baselineAccuracy = fixtures.length > 0 ? baselineCorrect / fixtures.length : 0;
    const candidateAccuracy = fixtures.length > 0 ? candidateCorrect / fixtures.length : 0;
    const passed = candidateAccuracy >= baselineAccuracy && candidateAccuracy >= 0.75;
    const receipt = {
      baselineDigest: `sha256:${createHash("sha256").update(candidate.baseVersion).digest("hex")}`,
      candidateDigest: `sha256:${createHash("sha256").update(candidate.proposal).digest("hex")}`,
      evaluatorIdentity: "aegis-evolution-evaluator-v1",
      suiteDigest: `sha256:${createHash("sha256").update(JSON.stringify(fixtures)).digest("hex")}`,
      passed,
      metrics: {
        baselineAccuracy,
        candidateAccuracy,
        baselinePrecision: baselineAccuracy,
        candidatePrecision: candidateAccuracy
      }
    };
    return this.learningStore.recordEvaluation(candidateId, receipt);
  }
}
