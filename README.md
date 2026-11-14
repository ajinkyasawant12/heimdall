# Heimdall CRS - Autonomous AI Security Harness & Cyber Reasoning System

**Heimdall CRS** is a fully customized, clean-room Autonomous AI Security Harness and Cyber Reasoning System (CRS). It coordinates parallel security reasoning, multi-lens vulnerability detection, deterministic Proof-of-Vulnerability (PoV) verification, automated surgical remediation, and a source-grounded evolutionary learning harness.

---

## Key Highlights

- **3-Layer Runtime Agent Governance (Catching Rogue Agents):**
  - **Layer 1 (OpenShell Kernel & Network Fence):** Enforces Landlock LSM path containment (`/etc/shadow`, `~/.ssh`), blocks cloud metadata SSRF (`169.254.169.254`), and enforces zero-shell execution (`shell: false`).
  - **Layer 2 (Z3 / Cedar Policy Prover):** Enforces mathematical role boundaries (preventing read-only SOC agents from escalating to code mutation) and blocks guardrail self-modification.
  - **Layer 3 (AST Anti-Cheat & Backdoor Gate):** Scans agent-proposed code for trojans (`eval()`, `new Function()`, empty `catch {}` blocks), kills hijacked processes, rolls back state, and notarizes Ed25519 quarantine warrants into the Merkle Ledger.
  - *Run live benchmark:* `aegis catch-rogue [target]`
- **PoV-is-Truth Verification:** A vulnerability hypothesis is never accepted as a confirmed finding based on LLM output alone. Confirmation requires executing a standalone reproducer (PoV) against a deterministic sandbox oracle.
- **Durable Learning & Memory Harness:**
  - Immutable, append-only security event ledger with cryptographic digests.
  - Source-grounded codebase memory: links lessons and patterns to exact file hashes (`sha256`), automatically invalidating stale memories when code changes.
  - Evolutionary candidate controller: tests prompt and instruction variants against fixture suites and notarizes cryptographic receipts.
  - Self-healing workflows: detects repeated step failures (3+ consecutive runs) following instruction updates and proposes automatic rollback to previous stable revisions.
- **Multi-Lens AST & Pattern Analysis:**
  - Memory corruption (buffer overflow, use-after-free, integer wrapping)
  - Injections (command injection, SQLi, SSRF, path traversal)
  - Cryptographic misuse (weak hashes, static IVs, broken PRNG)
  - Insecure deserialization & prototype pollution
- **Model Context Protocol (MCP) Server:** Native MCP tools for external AI agents (Claude, Cursor, Antigravity, Copilot).
- **Embedded Web Dashboard & Kanban Board:** Real-time visualization of findings, evidence snippets, PoV execution outputs, and the learning ledger.
- **Binary Reasoning Harness:** Pure Python triage of ELF, PE, and Mach-O binaries with crash oracle verification.

---

## Architecture Overview

```
                                +---------------------------+
                                |  AI Coding Agents / MCP   |
                                +-------------+-------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                                    Heimdall Engine Core                                    |
|                                                                                         |
|  +--------------------+   +-----------------------+   +------------------------------+  |
|  |    Scope Guard     |-->|  Multi-Lens Scanner   |-->|   Hypothesis Triage Pool     |  |
|  |  Boundary Policies |   |   Pattern & Taint     |   |    High Recall Findings      |  |
|  +--------------------+   +-----------------------+   +--------------+---------------+  |
|                                                                      |                  |
|                                                                      v                  |
|  +--------------------+   +-----------------------+   +------------------------------+  |
|  | Remediation Engine |<--| Deterministic Oracle  |<--|   PoV Synthesis Engine       |  |
|  |  Surgical Patches  |   | "PoV is Truth" Replay |   | Standalone Reproducers       |  |
|  +--------------------+   +-----------------------+   +------------------------------+  |
|                                       |                                                 |
|                                       v                                                 |
|  +-----------------------------------------------------------------------------------+  |
|  |                       Learning & Memory Harness (Ledger)                          |  |
|  |  - Append-Only Event Store        - Source-Grounded Note Indexing (sha256)        |  |
|  |  - Real-Time Staleness Audit      - Self-Healing Workflow Restore Proposals       |  |
|  |  - Evolutionary Candidate Testing - Notarized Evaluation Receipts                 |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
    +-------------------------+                   +-------------------------+
    |   Heimdall Terminal CLI    |                   |   Heimdall Web Dashboard   |
    +-------------------------+                   +-------------------------+
```

---

## Directory Structure

```
heimdall-crs/
├── package.json                   # Monorepo configuration
├── tsconfig.json                  # TypeScript project references
├── packages/
│   ├── shared/                    # Core contracts, findings, learning & workflow types
│   ├── db/                        # Persistent document & event ledger storage
│   ├── core/                      # Scanner, PoV engine, patch engine, learning service
│   ├── mcp/                       # Model Context Protocol stdio server
│   ├── cli/                       # Terminal CLI (aegis scan, verify, patch, workflow)
│   └── dashboard/                 # Embedded Web Dashboard & REST API
├── binary-harness/                # Evidence-first Python binary CRS harness
├── ARCHITECTURE.md                # Comprehensive architectural design document
├── LEARNING_HARNESS.md            # Deep dive into the learning & memory ledger
└── WORKFLOWS.md                   # Guide to built-in security DAG workflows
```

---

## CLI Usage

```bash
# Catch rogue agents & evaluate runtime governance fence (5 injection attacks)
aegis catch-rogue benchmarks/demo-targets/order-api

# Scan an arbitrary codebase or external repository
aegis scan benchmarks/live-targets/openshell

# Run complete autonomous CRS cycle (Scan -> PoV -> Patch -> Verify -> Merkle Notarize)
aegis auto benchmarks/demo-targets/order-api --demo-fast

# Deterministically verify a vulnerability with PoV execution
aegis verify finding-7f89d3a1

# Generate a surgical fix and verify PoV neutralization
aegis patch finding-7f89d3a1

# Execute a security workflow template
aegis workflow list
aegis workflow run template-vulnerability-research /path/to/project

# Deploy micro-agent swarm with policy prover barrier
aegis swarm http://127.0.0.1:8000

# Inspect or refresh the learning memory ledger
aegis memory status
aegis memory refresh /path/to/project
```

---

## Live Control Room UI & Web Dashboard (Port 4041)

Heimdall CRS includes a real-time web control room and live verification theater aligned with the native Antigravity Swarm design language:

```bash
# Start the Control Room server (defaults to port 4041, auto-detects occupied ports)
node packages/dashboard/dist/server.js
```

* **Interactive Dashboard:** `http://localhost:4041/`
* **Live SSE Telemetry:** `http://localhost:4041/api/sse`
* **Real-Time Findings API:** `http://localhost:4041/api/findings`
* **Merkle Ledger API (19 Blocks Sealed):** `http://localhost:4041/api/ledger`

### Dashboard Highlights:
1. **Board Feed:** Live message stream between coordinator, recon, prover, patcher, verifier, tester, and auditor.
2. **Rogue Agent Gate:** Real-time visualization of the 3-layer execution fence intercepting Landlock breakouts, SSRF egress, role escalation, and AST backdoor trojans.
3. **Verification Gate:** Verified surgical diffs, regression test passes (100%), and zero-symbol-deletion guarantees.
4. **Ledger DB:** Cryptographic Merkle DAG with SHA-256 hash chaining and Ed25519 signature verification.

---

## Model Context Protocol (MCP) Setup

To connect Heimdall CRS to external AI tools (e.g., Claude Desktop, Cursor, Antigravity), add the following to your MCP settings configuration:

```json
{
  "mcpServers": {
    "heimdall-crs": {
      "command": "node",
      "args": ["<path-to-heimdall-crs>/packages/mcp/dist/index.js"]
    }
  }
}
```

### Complete List of 10 MCP Tools:
1. `heimdall_scan_repository`: Scans codebase files under boundary scope limits across pattern and AST lenses.
2. `heimdall_verify_pov`: Synthesizes and executes PoV reproducer against deterministic crash oracle.
3. `heimdall_generate_patch`: Creates verified surgical remediation diff neutralizing finding without regression.
4. `heimdall_query_findings`: Retrieves findings by status, severity, or CWE with pagination.
5. `heimdall_recall_knowledge`: Recalls source-grounded memory patterns linked to exact SHA-256 digests.
6. `heimdall_run_workflow`: Executes end-to-end security DAG workflows across multi-agent roles.
7. `heimdall_prove_smt_invariant`: Executes Z3 SMT-LIB2 solver to prove invariant reachability (`SAT` vs `UNSAT`).
8. `heimdall_get_audit_ledger`: Queries the append-only Merkle ledger and validates Ed25519 chain integrity.
9. `heimdall_list_trajectories`: Queries cached remediation trajectories for sub-millisecond (<1ms) replay.
10. `heimdall_evaluate_rogue_action`: Evaluates agent action proposals against the 3-Layer OpenShell/AGT governance gate.

---

## Real-World Target Benchmark: NVIDIA OpenShell

Heimdall CRS was evaluated live on upstream open-source repositories:
* **Target:** `https://github.com/NVIDIA/OpenShell` (2,047 files)
* **Scan Results:** Discovered 6 real vulnerability hypotheses:
  * **CWE-502 (Insecure Deserialization):** `python/openshell/sandbox.py:1967` (untrusted `pickle.loads` / unsafe YAML loading in manifest parser).
  * **CWE-502 (Insecure Deserialization):** `python/openshell/sandbox_test.py:3034` and `3047`.
  * **CWE-89 (Raw SQL String Concatenation):** `python/openshell/sandbox.py:2129` and `examples/spiffe-token-exchange-demo/k8s/token-issuer.js:165`.
* **Rogue Agent Containment:** 5 adversarial injection attacks quarantined at Layer 1 Landlock LSM, Layer 1 Netns, Layer 2 Z3/Cedar lattice, and Layer 3 AST anti-cheat gate with **0 host compromises**.

---

## License

Licensed under the [Apache License, Version 2.0](LICENSE). Clean-room implementation free of proprietary dependencies.
