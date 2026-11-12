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
