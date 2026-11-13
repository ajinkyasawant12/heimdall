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
# Scan a codebase for vulnerabilities
aegis scan /path/to/project

# Deterministically verify a vulnerability with PoV execution
aegis verify finding-7f89d3a1

# Generate a surgical fix and verify PoV neutralization
aegis patch finding-7f89d3a1

# Execute a security workflow template
aegis workflow list
aegis workflow run template-vulnerability-research /path/to/project

# Inspect or refresh the learning memory ledger
aegis memory status
aegis memory refresh /path/to/project

# Export findings to SARIF or JSON
aegis export sarif ./results.sarif
aegis export json ./results.json
```

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

### Supported MCP Tools:
- `heimdall_scan_repository`: Scans codebase files under boundary scope limits.
- `heimdall_verify_pov`: Synthesizes and executes PoV reproducer against oracle.
- `heimdall_generate_patch`: Creates verified remediation diff neutralizing finding.
- `heimdall_query_findings`: Retrieves findings by status, severity, or CWE.
- `heimdall_recall_knowledge`: Recalls source-grounded memory patterns.
- `heimdall_run_workflow`: Executes end-to-end security DAG workflows.

---

## License

Licensed under the [Apache License, Version 2.0](LICENSE). Clean-room implementation free of proprietary dependencies.
