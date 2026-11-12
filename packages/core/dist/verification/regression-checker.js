import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
/**
 * Differential Regression Verifier.
 * Inspired by DARPA AIxCC scoring rigor: ensures that an automated patch
 * neutralizes the PoV exploit without breaking existing functional unit tests.
 */
export class DifferentialRegressionVerifier {
  /**
   * Evaluates patch differential integrity.
   */
  verifyPatchIntegrity(testCommand, targetFile, originalContent, patchedContent, povCheckerFn) {
    return new Promise(async resolve => {
      // 1. Run baseline test command if specified
      let baselinePassed = true;
      if (testCommand) {
        try {
          execSync(testCommand, {
            timeout: 30_000,
            stdio: "ignore"
          });
          baselinePassed = true;
        } catch {
          baselinePassed = false;
        }
      }

      // 2. Temporarily write patched content to verify regression
      try {
        writeFileSync(targetFile, patchedContent, "utf-8");
      } catch (err) {
        return resolve({
          baselineTestsPassed: baselinePassed,
          postPatchTestsPassed: false,
          regressionDetected: true,
          povNeutralized: false,
          verdict: "REJECTED_FUNCTIONAL_REGRESSION",
          details: `Failed to write patch to file: ${err.message}`
        });
      }

      // 3. Test post-patch functionality
      let postPatchPassed = true;
      if (testCommand) {
        try {
          execSync(testCommand, {
            timeout: 30_000,
            stdio: "ignore"
          });
          postPatchPassed = true;
        } catch {
          postPatchPassed = false;
        }
      }

      // 4. Test PoV Neutralization (PoV checker should return false when vulnerability is neutralized)
      const povStillTriggers = await povCheckerFn();
      const povNeutralized = !povStillTriggers;

      // Restore original content
      try {
        writeFileSync(targetFile, originalContent, "utf-8");
      } catch {}
      if (!povNeutralized) {
        return resolve({
          baselineTestsPassed: baselinePassed,
          postPatchTestsPassed: postPatchPassed,
          regressionDetected: false,
          povNeutralized: false,
          verdict: "REJECTED_POV_NOT_NEUTRALIZED",
          details: "Patch applied cleanly but Proof-of-Vulnerability reproducer still successfully triggered."
        });
      }
      if (baselinePassed && !postPatchPassed) {
        return resolve({
          baselineTestsPassed: baselinePassed,
          postPatchTestsPassed: false,
          regressionDetected: true,
          povNeutralized: true,
          verdict: "REJECTED_FUNCTIONAL_REGRESSION",
          details: "Patch neutralized the PoV but caused existing functional test suite to fail (destructive patch)."
        });
      }
      return resolve({
        baselineTestsPassed: baselinePassed,
        postPatchTestsPassed: postPatchPassed,
        regressionDetected: false,
        povNeutralized: true,
        verdict: "APPROVED",
        details: "Patch successfully neutralized PoV with zero regressions detected on existing test suites."
      });
    });
  }
}
