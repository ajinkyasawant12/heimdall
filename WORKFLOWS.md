# Heimdall Security Workflows

Heimdall CRS models security operations as Directed Acyclic Graphs (DAGs) composed of specialized agent roles:
- **Auditor:** High-recall discovery, pattern recognition, and surface mapping.
- **Verifier:** Deterministic reproducer synthesis and PoV execution.
- **Patcher:** Surgical remediation synthesis and regression verification.
- **Evaluator:** Ledger derivation and knowledge freshness assessment.

---

## Built-in Templates

### 1. `template-code-audit` (Deep Code Security Audit)
Exhaustive multi-lens AST review, vulnerability hypothesis generation, and evidence recording.
- **Step 1 (`scope_discovery`):** Enforce target scope boundaries, index codebase files, and compute baseline digests.
- **Step 2 (`multi_lens_scan`):** Scan code across memory corruption, injection, crypto misuse, and deserialization lenses.
- **Step 3 (`learning_ingest`):** Extract source-grounded patterns and append events to the durable learning store.

### 2. `template-vulnerability-research` (Autonomous Vulnerability Research & PoV Verification)
Finds high-risk flaw hypotheses, synthesizes deterministic PoVs, and verifies exploitability.
- **Step 1 (`surface_mapping`):** Map entry points, routes, IPC sockets, and unauthenticated endpoints.
- **Step 2 (`hypothesis_generation`):** Construct candidate exploit paths and identify candidate vulnerability sites.
- **Step 3 (`pov_verification`):** Generate standalone reproducer scripts and execute in sandbox oracle to confirm findings.

### 3. `template-patch-verification` (Remediation & Patch Verification)
Generates secure code patches and proves neutralization against reproducing PoVs without regressions.
- **Step 1 (`patch_synthesis`):** Generate minimal surgical fix resolving the root cause of confirmed vulnerability.
- **Step 2 (`neutralization_check`):** Execute PoV reproducer against patched code to ensure vulnerability cannot be triggered.

---

## Executing Workflows

From the terminal:
```bash
aegis workflow run template-vulnerability-research /path/to/repo
```

From MCP:
```json
{
  "name": "heimdall_run_workflow",
  "arguments": {
    "templateId": "template-vulnerability-research",
    "targetPath": "/path/to/repo"
  }
}
```


---

## 4. `template-cloudflare-harness-audit` (Cloudflare 6-Phase & Google Harness² Autonomous CRS)

Integrates Cloudflare's 6-Phase Security Audit methodology with Google Research Harness² adaptive mutation and terminal verification gates:

- **Phase 1: Architecture Mapping & Recon (`@recon`):** Discovers entry points, trust boundaries, and slices byte-exact AST sinks.
- **Phase 2: Coverage-Led Hunting (`@recon`):** Partitions the target repository into isolated audit zones.
- **Phase 3: The Fight / SMT Adversarial Validation (`@prover`):** Evaluates Z3 SMT-LIB2 invariants to mathematically challenge finding candidates. If SAT witness is found, finding is confirmed; if UNSAT, it is eliminated as an unsound false positive.
- **Phase 4: Surgical Remediation (`@patcher`):** Synthesizes minimal AST transformations enforcing DARPA AIxCC anti-cheat rules (0 deleted symbols, no dummy bypasses).
- **Phase 5: Post-Swarm OpenShell Sandbox Verification (`@verifier`):** Mandatory quality gate running inside an isolated sandbox. Executes transient catching tests and full baseline test suites (313/313 pass).
- **Phase 6: Cryptographic Merkle Notarization (`@auditor`):** Issues Ed25519-signed verification tickets and commits state blocks to the SQLite WAL Merkle ledger.

---

## 5. `template-rogue-agent-containment` (NVIDIA OpenShell 3-Layer Runtime Governance)

Interception pipeline for evaluating agent tool and execution proposals against deterministic boundaries:

- **Layer 1: OpenShell Kernel & Network Fence:** Evaluates proposed filesystem operations against Landlock LSM rules (blocking `/etc/shadow`, `~/.ssh`) and network calls against egress namespace policies (blocking SSRF to `169.254.169.254`).
- **Layer 2: Z3 SMT & Cedar Role Lattice Prover:** Formally verifies that the agent's proposed action matches its assigned role (e.g. read-only auditor cannot mutate code via `APPLY_GIT_DIFF`) and prevents self-stripping of ROE rules.
- **Layer 3: AST Anti-Cheat & Backdoor Gate:** Scans proposed code modifications for malicious constructs (`eval()`, `new Function()`, empty `catch {}` blocks) before disk commit.
- **Quarantine & Notarization:** Hijacked agent processes are immediately terminated, state is rolled back via git, and an Ed25519 quarantine warrant is sealed to the Merkle ledger.

Execution:
```bash
aegis catch-rogue benchmarks/demo-targets/order-api
```
