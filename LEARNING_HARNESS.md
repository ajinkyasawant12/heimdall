# Heimdall Learning & Memory Harness

The **Heimdall Learning Harness** provides a durable, source-grounded memory and evolutionary improvement engine for security agents. Unlike volatile context windows or untrusted conversational notes, Heimdall grounds all learning in cryptographic file hashes and deterministic verification receipts.

---

## 1. Durable Ledger Architecture

All activities, findings, verification outputs, and workflow steps are written to an append-only event ledger:

```
[ Security Run ] ──> [ Event Ledger ] ──> [ Background Outbox ] ──> [ Knowledge Derivation ]
                            │
                            └──> [ Immutable Audit Trail ]
```

### Event Structure
Each event is stored with:
- `idempotencyKey`: Prevents duplicate records across retried agent sessions.
- `projectId`: Stable SHA-256 identifier for the target codebase.
- `category`: `finding`, `verification`, `workflow_step`, `workflow_run`, `source_context`.
- `strength`: `operational`, `hypothesis`, `verified`, or `human_feedback`.
- `sourceLinks`: Array of `{ path, hash }` linking the event to exact source bytes.

---

## 2. Source-Grounded Knowledge Freshness

Memories and lessons learned during vulnerability hunting are only valuable while the analyzed source code remains unchanged.

### Verification Algorithm:
1. When a note or pattern is recorded, Heimdall hashes every referenced source file (`sha256:HEX`).
2. When an agent requests memory recall, Heimdall re-checks the referenced file hashes on disk.
3. If any file has been modified or deleted, the knowledge entry is flagged as `stale` or `invalidated`.
4. Only `current` knowledge entries are fed into agent reasoning prompts, preventing hallucinations grounded in obsolete code.

---

## 3. Evolutionary Candidate Controller

Heimdall continuously refines security prompts, heuristic rules, and workflow instructions using an evolutionary challenger loop:

1. **Candidate Proposal:** A new prompt or instruction variation is generated and assigned `status: proposed`.
2. **Shadow Evaluation:** The candidate is evaluated in parallel with the current `baseline` against a held-out test suite of vulnerability fixtures.
3. **Metric Comparison:** Candidate accuracy and precision must match or exceed the baseline (default threshold: >= 75% accuracy and >= baseline).
4. **Notarized Receipt:** A cryptographically signed evaluation receipt is generated containing:
   - `baselineDigest`
   - `candidateDigest`
   - `suiteDigest`
   - Outcome metrics
5. **Promotion:** Candidates meeting acceptance criteria are transitioned to `active`.

---

## 4. Self-Healing Workflow Restore

When security workflows are modified, experimental instruction changes can inadvertently break execution steps. Heimdall incorporates automated self-healing:

```
[ Step Fails in Run #1 ] ──> Logged to Ledger
[ Step Fails in Run #2 ] ──> Logged to Ledger
[ Step Fails in Run #3 ] ──> Trigger Self-Healing Detector
                                     │
                                     v
                        Identify Last Working Revision
                                     │
                                     v
                        Generate Self-Healing Proposal
```

- When a workflow step fails across 3 consecutive runs on the current revision, Heimdall queries the execution history for the last revision where that step succeeded.
- Heimdall emits a `WorkflowSelfHealingProposal` detailing the failure count and offering a verified rollback to the stable revision instructions.
