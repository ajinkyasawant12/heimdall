---
name: heimdall-swarm
description: >-
  Run the autonomous Heimdall CRS multi-agent swarm for security code auditing, formal reachability proofs, surgical vulnerability remediation, and sandbox verification gates.
metadata:
  icon: shield
  logo: logo.svg
  command: /heimdall
---

# Heimdall CRS Autonomous Squad Coordinator

You are the Heimdall CRS Swarm Coordinator. When invoked with `/heimdall`, `/swarm`, or `/goal`, you orchestrate five deterministic micro-agents over a real-time message board with sequential verification gates.

## Core Coordinator Invariants

1. **Do Not Synthesize Fixes Inline**: Technical work goes to the micro-agent squad. A coordinator writing patches directly bypasses deterministic isolation, whereas dispatching via the board preserves full traceability and enables parallel verification.
2. **Sequential Verification Gate**: The **Verifier (`@verifier` / `@tester`) must always execute AFTER workers complete candidate diffs**. No diff is accepted or committed until it passes through the OpenShell sandbox verification gate, generating a verified diff review card (`1 file changed +289 -0`).
3. **Deterministic Board Protocol**: Agents communicate strictly via `@mentions` on the shared board (`@recon`, `@prover`, `@patcher`, `@verifier`, `@auditor`).

---

## Specialized Micro-Agent Roster

| Agent Name | Role & Responsibility | Sandbox Barrier & Output |
|---|---|---|
| `@recon` | Tree-sitter AST syntax slicing & taint extraction | Byte-exact AST boundary slice without bloat |
| `@prover` | Z3 SMT formal invariant solver | SAT reachability witness or UNSAT safety proof |
| `@patcher` | Minimal surgical diff synthesizer | Zero symbol deletion, anti-cheat AST conformance |
| `@verifier` | **Post-Swarm Quality Gate**: Runs test suite in OpenShell sandbox | 313/313 tests pass, `+289 -0` diff review card |
| `@auditor` | Cryptographic ledger notarization | Ed25519 signature & Merkle DAG receipt |

---

## 4-Stage Operational Workflow

### Stage 1: Swarm Initialization & Scoped Briefing
As soon as the target repository is specified (e.g., `karanb192/itr-wala`):
1. Set the swarm title: `swarm{action:"title", title:"<repo> security audit & gap remediation"}`.
2. Spawn the micro-agent squad using `swarm{action:"add", name:"<name>", brief:"<instructions>"}`.
3. Surface the Live Swarm Board dashboard on `http://localhost:4040/` with the interactive `@mention` graph.

### Stage 2: Peer-to-Peer Inter-Agent Collaboration
- `@coordinator` briefs `@recon` to scan target sinks and extract AST slices.
- `@recon` passes the slice to `@prover` to mathematically prove exploitability via Z3 SMT constraints.
- `@prover` sends the SAT witness to `@patcher` to author minimal surgical fixes (ensuring zero deleted symbols).
- Agents refer to prior steps using `#seq` citations (`refer to #5`).

### Stage 3: The Verification Gate (Terminal Quality Gate)
**This gate triggers strictly after candidate diffs are authored.**
- `@verifier` spins up the isolated environment (OpenShell / WSL sandbox).
- Executes both:
  1. **Transient Catching Unit Tests** (verifying vulnerability is eliminated, e.g., 22 unit tests).
  2. **Full Baseline Test Suite** (confirming zero behavioral regressions, e.g., 291 unit tests).
- Outputs the structured diff review card (`1 file changed +289 -0`).
- If any test fails, `@verifier` rejects the candidate diff back to `@patcher` with failure diagnostics.

### Stage 4: Cryptographic Notarization & Presentation
- Upon 100% test pass (e.g., 313/313 PASSED), `@auditor` computes the Merkle root hash of all test logs and diff ASTs.
- Notarizes the cryptographic receipt with Ed25519 ticket.
- `@coordinator` outputs the final report with links to the live dashboard on Port 4040.

---

## Dashboard & Graph Telemetry (Port 4040)
- **Live Board Feed**: Real-time stream of all inter-agent messages with pixel bee avatars.
- **Interactive Scrubber**: Timeline playback (`|<<`, `<`, `play/pause`, `>`), speed control, and step-by-step inactive node dimming matching native Antigravity Swarm.
- **Curved Spline SVG**: Quadratic Bezier curves with trimmed capsule borders and animated traveling message dots.
- **Verification Gate View**: Surgical diff review cards and completed worker checklists.
