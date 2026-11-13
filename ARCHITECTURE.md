# Heimdall CRS Architecture

> Status: Clean-room Autonomous AI Security Harness & Cyber Reasoning System.

---

## 1. Core Principles

1. **PoV is the Unit of Truth:**
   A finding without a reproducing input or verified crash trace is merely a *hypothesis*. A finding is only transitioned to `confirmed` when a deterministic sandbox oracle reproduces the vulnerability condition.
2. **Deterministic Scoping & Safety:**
   Strict scope boundaries enforce target path containment (preventing path traversal and symlink escapes), file review caps, and network isolation boundaries.
3. **Durable Source-Grounded Learning:**
   Security knowledge and lessons are explicitly linked to source file SHA-256 digests. If underlying files are modified, dependent memories automatically transition to stale.
4. **Self-Healing Automation:**
   Workflow step failures trigger historical analysis to generate rollback proposals restoring stable revisions.
5. **Open & Standardized Integrations:**
   Full Model Context Protocol (MCP) server support and standard export formats (SARIF, JSON).

---

## 2. Pipeline Execution Model

```
 ┌─────────────┐
 │  (1) INGEST │  Scope validation, path canonicalization, file limits, SHA-256 hashing
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │ (2) SCAN    │  Multi-lens AST pattern matching (memory, injection, crypto, deser)
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │ (3) TRIAGE  │  Filter, deduplicate, and rank hypotheses by severity and CWE
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │ (4) PROVE   │  "PoV-is-Truth" synthesis & sandbox execution against crash oracle
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │ (5) PATCH   │  Generate surgical remediation diff, verify PoV neutralization & tests
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │ (6) LEARN   │  Append immutable ledger event, derive knowledge, check freshness
 └─────────────┘
```

---

## 3. Storage Layer (`@heimdall/db`)

A lightweight, zero-dependency atomic persistence engine managing:
- `merkle-ledger.json` / `merkle-ledger.db`: Cryptographically chained Ed25519-signed Merkle DAG.
- `learning_events`: Append-only event store with idempotency keys.
- `learning_knowledge`: Source-grounded security knowledge with file hash tracking.
- `learning_candidates`: Evolutionary prompt and instruction candidates.
- `learning_work`: Outbox work queue with lease-based locking and exponential backoff.
- `learning_proposals`: Self-healing workflow restore recommendations.
- `findings`: Full security findings records with attached PoV and patch artifacts.
- `workflow_runs`: DAG step execution logs and statuses.

---

## 4. 3-Layer Runtime Agent Governance Engine (NVIDIA OpenShell & AGT)

Operating out-of-process in `packages/broker/src/rogue-interceptor.ts` and `packages/core/src/verification/rogue-agent-gate.ts`, this engine guarantees zero host compromises even when autonomous agents are hijacked by prompt injections:

```
               [ INCOMING ADVERSARIAL PAYLOAD: Poisoned Log / PR / Issue ]
                                              │
                                              ▼
                                 [ AUTONOMOUS SOC AGENT ]
                           (Mid-Session Hijack / Intent Drift)
                                              │
                               PROPOSED UNGOVERNED ACTION
                                              │
┌─────────────────────────────────────────────┴─────────────────────────────────────────────┐
│ 1. LAYER 1: OPENSHELL KERNEL & NETWORK FENCE                                              │
│    - Landlock LSM restricts filesystem writes strictly to workspace root (blocks /etc/shadow)│
│    - Zero-Netns / Egress Filter blocks SSRF to AWS IMDS (169.254.169.254) and C2 Webhooks  │
│    - Strict shell: false disables arbitrary sh/bash/powershell execution                  │
├─────────────────────────────────────────────┬─────────────────────────────────────────────┤
│ 2. LAYER 2: Z3 SMT & CEDAR POLICY PROVER    │ 3. LAYER 3: AST ANTI-CHEAT BACKDOOR GATE    │
│    - Proves mathematical role permissions   │    - Pre-write AST scan on all diffs        │
│    - Blocks self-privilege escalation       │    - Kills eval(), Function(), empty catch  │
│    - Blocks stripping guardrails / ROE rules│    - Verifies 100% symbol preservation      │
└─────────────────────────────────────────────┴─────────────────────────────────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
          [ QUARANTINED ROGUE ]                             [ APPROVED SAFE ACTION ]
       Subprocess Terminated (SIGKILL)                  Ed25519 Capability Ticket Issued
       State Rolled Back via Git Reset                  Action Executed in Landlock Sandbox
       Ed25519 Quarantine Warrant Sealed                Merkle Block Appended to Ledger WAL
```

### Verified Live Containment Benchmark:
* Action 1 (Benign AST Slice): `[APPROVED_SAFE]` — SMT Proof: `UNSAT_SAFE`.
* Action 2 (Path Breakout `/etc/shadow`): `[QUARANTINED_ROGUE]` — Blocked at Layer 1 Landlock.
* Action 3 (SSRF `169.254.169.254`): `[QUARANTINED_ROGUE]` — Blocked at Layer 1 Netns.
* Action 4 (Strip ROE Guardrails): `[QUARANTINED_ROGUE]` — Blocked at Layer 2 Z3/Cedar Prover.
* Action 5 (Auditor Role Escalation): `[QUARANTINED_ROGUE]` — Blocked at Layer 2 Role Lattice.
* Action 6 (Trojan `eval()` Backdoor): `[QUARANTINED_ROGUE]` — Blocked at Layer 3 AST Anti-Cheat.

---

## 5. Formal SMT Verification & Meta JiT Catching Tests

* **Z3 SMT Invariant Prover (`packages/core/src/formal/z3-invariant-prover.ts`):** Evaluates mathematical reachability of attacker-controlled variables into execution sinks. If Z3 returns `UNSAT`, the hypothesis is proven impossible in practice and discarded without analyst intervention.
* **Meta JiT Catching Tests (`packages/core/src/verification/jit-catching-tester.ts`):** Synthesizes transient test cases that *must fail* on unpatched code (exit code 1) and *must pass* on patched code (exit code 0), eliminating speculative patches.
* **Surgical Patch Engine (`packages/core/src/remediation/surgical-patcher.ts`):** Produces minimal parameter substitutions (`execSync` -> `execFile` with `shell: false`), rejecting any diff that removes exports or swallows exceptions in empty catch blocks.

---

## 6. Real-Time Verification Theater & Dashboard (Port 4041)

Serving on `http://localhost:4041` with automatic fallback from port 4040:
* **Real-Time SSE Streaming (`/api/sse`):** Broadcasts AST taint extraction, Z3 SAT proofs, sandbox catching tests, and Merkle hash seals.
* **Native Swarm Design Language:** Clean dark monochrome interface matching the Google Antigravity Swarm board palette (`#09090b` / `#121214` with subtle `#27272a` borders).
* **Live Merkle Ledger View (`/api/ledger`):** Displays all sealed blocks with cryptographic SHA-256 hash chaining and Ed25519 signatures.

---

## 7. Model Context Protocol (MCP) Interface (`@heimdall/mcp`)

Implements the Model Context Protocol over stdio for external coding agents (Claude, Cursor, Antigravity, Copilot), exposing all 10 tools:
1. `heimdall_scan_repository`: Boundary-scoped multi-lens pattern & AST scan.
2. `heimdall_verify_pov`: Synthesizes and executes deterministic PoV crash oracle.
3. `heimdall_generate_patch`: Creates verified surgical remediation diff without regression.
4. `heimdall_query_findings`: Retrieves findings by status, severity, or CWE.
5. `heimdall_recall_knowledge`: Recalls source-grounded memory patterns.
6. `heimdall_run_workflow`: Executes end-to-end security DAG workflows.
7. `heimdall_prove_smt_invariant`: Executes Z3 SMT-LIB2 solver to prove reachability.
8. `heimdall_get_audit_ledger`: Queries the append-only Merkle ledger.
9. `heimdall_list_trajectories`: Queries cached remediation trajectories for <1ms replay.
10. `heimdall_evaluate_rogue_action`: Evaluates agent action proposals against the 3-Layer governance gate.
