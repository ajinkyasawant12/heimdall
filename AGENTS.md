# HEIMDALL CRS: MASTER ARCHITECTURE, BIG 4 SECURITY AUDIT & ANTIGRAVITY BUILD SPECIFICATION

You are operating inside **Google Antigravity** (powered by `gemini-3.8-flash` and `gemini-4-argon`) as the Lead Principal Security Systems Engineer building **Heimdall CRS**. Follow this master specification strictly. Every architectural decision and code module below incorporates our complete **Big 4 Security Architecture Audit** and **Hackathon Technical Judge Review**.

## 1. Complete Point-by-Point Architecture Audit & Mandatory Upgrades

When migrating or implementing any file in the `heimdall-crs` monorepo, enforce every single upgrade below:

### 1.1 Executive Summary & Positioning Upgrades (Section 1 Fixes)
* **Upgrade 1.1 — Clear Purple-Team Verification Identity:** Frame Heimdall CRS as an **Autonomous AppSec, Formal Invariant & Self-Healing Patch Reasoning System** with a modular **Target Modality Router** (Track A: AppSec/API Source & Schema Verification; Track B: Native C/C++ Sanitizer & Crash Triage). Never mix web/API validation primitives with native ELF/PE memory-corruption primitives in the same execution path.
* **Upgrade 1.2 — Deterministic Solvers vs. LLM Reasoning Split:** Clearly separate what is **100% deterministic code** (`web-tree-sitter` AST slicing, `z3-solver` SMT verification, `@cedar-policy/cedar-wasm` policy enforcement, `node:sqlite` WAL Merkle ledger, `child_process.execFile` sandboxed test execution) from what is **LLM-assisted synthesis** (`gemini-3.8-flash` JiT test generation and `gemini-4-argon` surgical diff generation).

### 1.2 System Blueprint & Control Plane Upgrades (Section 2 Fixes)
* **Upgrade 2.1 — Out-of-Process Control Plane (`packages/broker`):** Never run `ScopeGuard`, `policy-prover.ts`, or cryptographic signing inside the same Node.js process as the LLM agent (`packages/core`). Run the Control Plane as an isolated **Host Policy Broker daemon** over a restricted Unix socket (`/tmp/aegis-broker.sock`), enforcing symlink-safe `realpath` checks, read-only bind mounts, and network-disabled execution (`bwrap --unshare-all` or isolated containers).
* **Upgrade 2.2 — Bounded 3-Axis Parameter Adaptation (Replacing Unbounded 8-Component Mutation):** Never allow an agent to dynamically rewrite its own transport plugins (`8. Plugins`), arbitrary host scripts (`7. Scripts`), or safety guardrails (`2. Guardrails`). Lock 5 components as immutable infrastructure and restrict adaptive parameterization to **3 bounded axes**: (1) Analysis Persona/Lens Framing, (2) Diagnostic Tool Routing, and (3) Sandboxed Input Normalizers running inside a zero-network QuickJS/WASM isolate.
* **Upgrade 2.3 — Target Modality Router:** Route targets deterministically at ingestion time: TypeScript/JavaScript/Python/Go repositories route to the **AST + Z3 + JiT Unit Test Pipeline**, while C/C++ targets route to the **ASan/UBSan + LLDB/Symbolizer Crash Triage Pipeline**.
* **Upgrade 2.4 — Tamper-Evident Ed25519 Merkle Audit Ledger:** Replace plain JSON files in `.aegis/data/` with a **SHA-256 hash-chained Merkle ledger** stored in Node's native `node:sqlite` (`WAL` mode) where every entry (`prev_hash`, `file_sha256`, `payload_json`) is cryptographically signed using an **Ed25519 private key** held exclusively by the out-of-process Host Policy Broker.

### 1.3 Monorepo & Storage Upgrades (Section 3 Fixes)
* **Upgrade 3.1 — Zero-Dependency `node:sqlite` WAL Engine (`packages/db`):** Replace custom flat-file JSON storage (`storage-engine.ts`) with Node 22.5+ built-in `node:sqlite` (`DatabaseSync` with `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`) to eliminate multi-agent file-lock race conditions and partial-write corruption.
* **Upgrade 3.2 — Expanded Finding Lifecycle State Machine (`findings-store.ts`):** Upgrade the naive `hypothesis -> confirmed -> patched` flow to a full 6-state deterministic lifecycle: `hypothesis -> reproduction_failed | confirmed_reproducible -> patch_synthesized -> regression_failed | verified_remediated`, recording container digests and test seeds at every transition.
* **Upgrade 3.3 — Constrained JSON Schema Decoding & Cost Circuit Breakers (`gemini-adapter.ts`):** Enforce `responseMimeType: "application/json"` with strict `responseSchema` definitions validated at runtime by `zod`, plus a per-campaign token and wall-clock budget cap so smaller or local models never break downstream DAG nodes.
* **Upgrade 3.4 — Cryptographically Scoped MCP Server (`packages/mcp`):** Require a mandatory `--scope ./heimdall.scope.json` manifest at MCP server startup so external MCP clients cannot point Heimdall tools at unauthorized host directories or external networks.

### 1.4 Verification Loop & Telemetry Calibration Upgrades (Section 4 Fixes)
* **Upgrade 4.1 — Concurrent `Promise.allSettled` Candidate Evaluation:** Never evaluate candidate verification harnesses sequentially. Dispatch up to 3 parallel diagnostic/test candidates concurrently via `Promise.allSettled` using `gemini-3.8-flash` with a hard 4-second timeout.
* **Upgrade 4.2 — Live Telemetry Feedback Sync (Eliminating Static Surrogate Drift):** Instead of scoring against a static local surrogate that drifts from reality, capture real runtime telemetry (exact exit codes, sanitizer stderr frames, exception types, and execution timing deltas) from the sandboxed target runner to calibrate subsequent verification passes.
* **Upgrade 4.3 — Four Deterministic Verification Oracles:** Support four concrete verification oracles depending on bug class:
  1. **Assertion / Exception Oracle:** Deterministic unit test failure on boundary or malformed input (`vitest` / `node:test`).
  2. **SMT Counterexample Oracle:** Mathematical `SAT` assignment from `z3-solver` proving an invariant or bounds violation.
  3. **Sanitizer Signal Oracle:** Immediate `SIGABRT` / `SIGSEGV` stack trace from `-fsanitize=address,undefined` parsed via `llvm-symbolizer`.
  4. **Differential Behavioral Oracle:** State or timing divergence between baseline and mutated inputs under identical sandbox seeds.

### 1.5 Research Lineage & Concrete Implementation Mapping (Section 5 Fixes)

| Research Lineage | Original Concept | Concrete Heimdall CRS Implementation Library | Module Path |
| :--- | :--- | :--- | :--- |
| **Unprompted Harness Engineering** (Graham Helton) | Deterministic AST slicing & execution barriers | `web-tree-sitter` AST parser + `child_process.execFile` (`shell: false`) | `packages/core/src/ast/tree-sitter-slicer.ts` & `packages/broker/src/safe-exec.ts` |
| **Formal Code Verification** (SMT Invariant Proving) | Machine-checked mathematical bounds & crypto invariants | `z3-solver` (Node Z3 WASM bindings) evaluating SMT-LIB2 predicates | `packages/core/src/formal/z3-invariant-prover.ts` |
| **Meta JiTTesting** ("Catching Tests") | Transient unit tests designed to expose buggy diffs | `vitest` / `node:test` Dodgy-Diff & Intent-Aware test synthesis | `packages/core/src/verification/jit-catching-tester.ts` |
| **NVIDIA OpenShell** (Sandboxed Agent Runtime) | Formal permission lattice & OS-level containment | `@cedar-policy/cedar-wasm` policy engine + `bwrap` / Linux namespaces | `packages/broker/src/policy-prover.ts` |
| **DARPA AIxCC CRS** ("Verify & Remediate") | Reproducible verification & zero-regression patching | AST structural anti-cheat guards + differential test suite runner | `packages/core/src/remediation/regression-gate.ts` |
| **Google Harness²** (Bounded Scaffold Optimization) | Task-level Propose-Probe-Compose parameter tuning | 3-axis parallel candidate evaluation with live runtime telemetry sync | `packages/core/src/verification/adaptive-harness.ts` |

### 1.6 Module-by-Module Engineering Upgrades (Section 6 Fixes: Modules A–G)
* **Module A (`tree-sitter-slicer.ts` & `safe-exec.ts`):** Replace regex line-guessing and shell-token blacklisting (`;`, `&&`, `|`) with `web-tree-sitter` byte-accurate AST slicing and `execFile(binary, args, { shell: false, env: minimalEnv })`.
* **Module B (`z3-invariant-prover.ts`):** Replace unsubstantiated "AlphaProof" branding with real **Z3 SMT-LIB2** verification via `z3-solver`, proving array bounds (`0 <= offset < alloc_size`), integer overflow constraints, and authorization bypass conditions in under 50ms.
* **Module C (`jit-catching-tester.ts`):** Feed failing **Dodgy Diff** and **Intent-Aware** catching tests directly into the `SurgicalPatchEngine` as automated counterexamples first; only surface Human-on-the-Loop review prompts if automated repair fails after 2 iterations.
* **Module D (`policy-prover.ts` & `orchestrator.ts`):** Replace the free-form 5-agent chat swarm with a **deterministic typed DAG state machine**, and evaluate every file/process action against formal **AWS Cedar** (`permit`/`forbid`) policies before issuing an Ed25519 execution ticket.
* **Module E (`compiler-harness.ts`):** Add `-fsanitize=address,undefined,fuzzer-no-link -fno-omit-frame-pointer -g -O1`, enforce `ulimit` memory/CPU quotas and a 3-second timeout, and parse stack traces with `llvm-symbolizer` into structured JSON frames.
* **Module F (`regression-gate.ts`):** Block "cheat patches" (patches that pass tests by deleting routes, removing exports, or adding empty `catch {}` blocks) using **AST Structural Diff Guards** alongside the baseline unit test suite.
* **Module G (`orchestrator.ts` & `dashboard/server.ts`):** Add a `--demo-fast` CLI flag (capping verification + repair at 2 iterations / 20 seconds total) and stream real-time Server-Sent Events (SSE) to the **Port 4040 3-Pane Live Verification Theater**.

## 2. Upgraded System Architecture Blueprint

```text
+-----------------------------------------------------------------------------------------+
|                 OUT-OF-PROCESS CONTROL PLANE DAEMON (packages/broker)                   |
|  - Unix Domain Socket (/tmp/aegis-broker.sock) — Isolated from Agent Process Memory     |
|  - ScopeGuard: realpath() Canonicalization, Symlink Rejection, heimdall.scope.json Lock    |
|  - Cedar / Z3 Policy Prover: Sub-millisecond Formal Lattice Check + Ed25519 Signing     |
|  - SafeExec Runner: child_process.execFile (shell: false) + bwrap / netns Isolation     |
+-----------------------------------------------------------------------------------------+
                                           |
                           (Signed Execution & Policy Tickets)
                                           v
+-----------------------------------------------------------------------------------------+
|                DETERMINISTIC DAG VERIFICATION & REPAIR ENGINE (packages/core)           |
|                                                                                         |
|  +---------------------------+   +---------------------------+   +-------------------+  |
|  | Tree-Sitter AST Slicer    |   | Z3 SMT Invariant Prover   |   | 3-Axis Adaptive   |  |
|  | Byte-Exact Taint & Sinks  |   | SAT Counterexample Check  |   | Test Synthesizer  |  |
|  +-------------+-------------+   +-------------+-------------+   +---------+---------+  |
|                |                               |                           |            |
|                +-------------------------------+---------------------------+            |
|                                                |                                        |
|                                                v                                        |
|                        +---------------------------------------+                        |
|                        |  4-Oracle Sandboxed Verification Gate |                        |
|                        |  (JiT Unit Test / Z3 / ASan / Diff)   |                        |
|                        +-------------------+-------------------+                        |
|                                            |                                            |
|                                            v                                            |
|                        +---------------------------------------+                        |
|                        |  Surgical Patch & AST Anti-Cheat Gate |                        |
|                        |  Neutralize Bug + 0% Test Regression  |                        |
|                        +-------------------+-------------------+                        |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
|               NATIVE SQLITE WAL MERKLE AUDIT LEDGER (packages/db)                       |
|  - Zero-Dependency node:sqlite in WAL Mode (Concurrent Read/Write Safe)                 |
|  - SHA-256 Hash Chain (prev_hash -> entry_hash) + Out-of-Band Ed25519 Signatures        |
|  - Source-Grounded Cache (Keyed by File SHA-256; Auto-Invalidated on Git Diff)          |
|  - Live SSE Telemetry Stream -> Port 4040 3-Pane Hackathon Verification Theater         |
+-----------------------------------------------------------------------------------------+
```

## 3. Monorepo Directory Layout

When scaffolding or modifying files in Antigravity, maintain this exact workspace layout:

```text
heimdall-crs/
├── AGENTS.md                                    # Master Antigravity instructions (this file, no YAML frontmatter)
├── .agents/
│   ├── mcp_config.json                          # Workspace MCP server configuration for Antigravity IDE & CLI
│   └── hooks.json                               # Pre-commit & post-patch verification hooks
├── heimdall.scope.json                             # Signed target manifest (allowed repo paths & sandbox limits)
├── package.json                                 # Node >= 22.5.0 pnpm/npm workspaces
├── tsconfig.json                                # Strict TypeScript 5.x project references
├── packages/
│   ├── shared/src/
│   │   ├── types.ts                             # Core schemas: Finding, ASTSlice, SMTProof, CatchingTest, PatchDiff
│   │   ├── ledger.ts                            # Merkle event ledger & Ed25519 receipt interfaces
│   │   └── constants.ts                         # CWE mappings, OWASP Top 10 / LLM Top 10 rules, timeouts
│   ├── db/src/
│   │   ├── sqlite-engine.ts                     # Native node:sqlite WAL store with append-only triggers
│   │   ├── findings-store.ts                    # 6-state machine: hypothesis -> reproduced -> verified_remediated
│   │   └── merkle-ledger.ts                     # SHA-256 hash chain + Ed25519 signature verifier
│   ├── broker/src/
│   │   ├── server.ts                            # Out-of-process Control Plane Unix socket daemon
│   │   ├── scope-guard.ts                       # Symlink-safe path containment & manifest validator
│   │   ├── policy-prover.ts                     # Cedar / Z3 lattice policy checker & Ed25519 notary
│   │   └── safe-exec.ts                         # Zero-shell execFile wrapper + ephemeral sandbox runner
│   ├── core/src/
│   │   ├── ast/tree-sitter-slicer.ts            # Deterministic AST sink & taint extractor
│   │   ├── formal/z3-invariant-prover.ts        # Z3 SMT-LIB2 counterexample & patch soundness prover
│   │   ├── verification/jit-catching-tester.ts  # Dodgy-Diff & Intent-Aware catching test generator
│   │   ├── verification/adaptive-harness.ts     # 3-Axis parallel candidate evaluator + telemetry sync
│   │   ├── verification/compiler-harness.ts     # ASan/UBSan native binary instrumentation + llvm-symbolizer
│   │   ├── remediation/surgical-patch-engine.ts # Minimal AST-checked git diff synthesizer
│   │   ├── remediation/regression-gate.ts       # Anti-cheat AST guard + full test suite runner
│   │   ├── providers/gemini-adapter.ts          # Native Gemini 3.8 Flash & Gemini 4 Argon structured JSON adapter
│   │   └── orchestrator.ts                      # Deterministic DAG workflow engine with --demo-fast mode
│   ├── mcp/src/
│   │   └── index.ts                             # Model Context Protocol stdio & streamable HTTP server
│   ├── cli/src/
│   │   └── index.ts                             # CLI (`aegis audit`, `aegis prove`, `aegis patch`, `aegis auto`)
│   └── dashboard/src/
│       └── server.ts                            # Port 4040 3-Pane SSE Live Verification & Patch Theater
└── benchmarks/
    └── demo-targets/                            # Pre-built vulnerable targets for 20-second live hackathon demos
```

## 4. Antigravity & Gemini 3.8 Flash Integration Configs

### 4.1 Workspace MCP Configuration (`.agents/mcp_config.json`)

Create `.agents/mcp_config.json` in the workspace root so Antigravity IDE (`Ctrl+Alt+B` -> `...` -> **MCP Servers**) and Antigravity CLI (`/mcp`) automatically mount the Heimdall verification tools:

```json
{
  "mcpServers": {
    "heimdall-crs-local": {
      "command": "node",
      "args": ["./packages/mcp/dist/index.js", "--scope", "./heimdall.scope.json"],
      "env": {
        "GEMINI_MODEL_FAST": "gemini-3.8-flash",
        "GEMINI_MODEL_REASONING": "gemini-4-argon",
        "HEIMDALL_BROKER_SOCKET": "/tmp/aegis-broker.sock"
      }
    }
  }
}
```

### 4.2 Target Scope Manifest (`heimdall.scope.json`)

Every MCP tool invocation and CLI run validates against `heimdall.scope.json` before touching disk:

```json
{
  "version": "2.0.0",
  "allowedRootPaths": ["./benchmarks/demo-targets", "./packages"],
  "maxSubprocessTimeoutMs": 5000,
  "maxMemoryMb": 512,
  "allowNetworkInSandbox": false,
  "allowedBinaries": ["node", "npm", "npx", "git", "z3", "bwrap", "clang", "llvm-symbolizer"]
}
```

## 5. Production Code Blueprints for Core Modules

### 5.1 Shared Contracts (`packages/shared/src/types.ts`)

```typescript
export type FindingState =
  | 'hypothesis'
  | 'reproduction_failed'
  | 'confirmed_reproducible'
  | 'patch_synthesized'
  | 'regression_failed'
  | 'verified_remediated';

export type TargetModality = 'APPSEC_SOURCE' | 'NATIVE_BINARY';

export interface ASTSlice {
  filePath: string;
  fileSha256: string;
  functionName: string;
  startLine: number;
  endLine: number;
  sinkExpression: string;
  cweId: string;
  sourceCode: string;
}

export interface SMTProofResult {
  status: 'SAT_COUNTEREXAMPLE' | 'UNSAT_PROVED' | 'TIMEOUT';
  smtLib2Query: string;
  counterexampleModel?: Record<string, string | number>;
  durationMs: number;
}

export interface CatchingTestResult {
  testFilePath: string;
  workflow: 'DODGY_DIFF' | 'INTENT_AWARE';
  failsOnUnpatched: boolean;
  passesOnPatched: boolean;
  stderrExcerpt: string;
  durationMs: number;
  exitCode: number;
}

export interface PolicyCertificate {
  actionHash: string;
  prevLedgerHash: string;
  merkleRoot: string;
  ed25519Signature: string;
  issuedAtIso: string;
}
```

### 5.2 Out-of-Band Safe Execution & Scope Guard (`packages/broker/src/safe-exec.ts`)

Enforces `shell: false`, canonical `realpath` resolution, symlink containment, and clean environments:

```typescript
import { execFile } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ScopeManifest {
  allowedRootPaths: string[];
  allowedBinaries: string[];
  maxSubprocessTimeoutMs: number;
}

export async function assertPathInScope(targetPath: string, manifest: ScopeManifest): Promise<string> {
  const resolvedTarget = await realpath(path.resolve(targetPath));
  const resolvedRoots = await Promise.all(
    manifest.allowedRootPaths.map((root) => realpath(path.resolve(root)))
  );
  const insideScope = resolvedRoots.some(
    (root) => resolvedTarget === root || resolvedTarget.startsWith(root + path.sep)
  );
  if (!insideScope) {
    throw new Error(`SCOPE_VIOLATION: Path ${resolvedTarget} is outside allowed roots.`);
  }
  return resolvedTarget;
}

export async function runSandboxedBinary(
  binary: string,
  args: readonly string[],
  cwd: string,
  manifest: ScopeManifest
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  if (!manifest.allowedBinaries.includes(binary)) {
    throw new Error(`POLICY_VIOLATION: Binary '${binary}' is not whitelisted.`);
  }
  const safeCwd = await assertPathInScope(cwd, manifest);

  try {
    const { stdout, stderr } = await execFileAsync(binary, [...args], {
      cwd: safeCwd,
      shell: false,
      timeout: manifest.maxSubprocessTimeoutMs,
      maxBuffer: 2 * 1024 * 1024,
      env: {
        PATH: '/usr/local/bin:/usr/bin:/bin',
        NODE_ENV: 'test',
        HOME: '/tmp',
        TMPDIR: '/tmp'
      }
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? String(err),
      exitCode: typeof e.code === 'number' ? e.code : 1
    };
  }
}
```

### 5.3 Formal Policy Prover & Ed25519 Ticket Notary (`packages/broker/src/policy-prover.ts`)

Verifies every proposed tool action against formal permission boundaries and signs an Ed25519 execution ticket:

```typescript
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import type { ScopeManifest } from './safe-exec.js';

export interface ProposedAction {
  agentRole: 'AST_AUDITOR' | 'SMT_PROVER' | 'JIT_TESTER' | 'PATCH_SYNTHESIZER';
  operation: 'READ_AST' | 'RUN_Z3' | 'RUN_SANDBOX_TEST' | 'APPLY_GIT_DIFF';
  targetPath: string;
  binary?: string;
}

export class FormalPolicyProver {
  private privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'];
  public readonly publicKeyPem: string;

  constructor(private readonly manifest: ScopeManifest) {
    const kp = generateKeyPairSync('ed25519');
    this.privateKey = kp.privateKey;
    this.publicKeyPem = kp.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  }

  public evaluateAndSign(action: ProposedAction): {
    permitted: boolean;
    reason: string;
    actionHash: string;
    ed25519Signature?: string;
  } {
    // Formal Lattice Rule 1: Only PATCH_SYNTHESIZER may mutate source files via APPLY_GIT_DIFF
    if (action.operation === 'APPLY_GIT_DIFF' && action.agentRole !== 'PATCH_SYNTHESIZER') {
      return {
        permitted: false,
        reason: `Role ${action.agentRole} is forbidden from mutating repository source files.`,
        actionHash: ''
      };
    }

    // Formal Lattice Rule 2: Any binary execution must be in manifest.allowedBinaries
    if (action.binary && !this.manifest.allowedBinaries.includes(action.binary)) {
      return {
        permitted: false,
        reason: `Binary ${action.binary} is forbidden by ScopeManifest.`,
        actionHash: ''
      };
    }

    const canonicalPayload = JSON.stringify({
      role: action.agentRole,
      op: action.operation,
      path: action.targetPath,
      bin: action.binary ?? null
    });
    const actionHash = createHash('sha256').update(canonicalPayload).digest('hex');
    const signature = sign(null, Buffer.from(actionHash, 'utf8'), this.privateKey).toString('base64');

    return {
      permitted: true,
      reason: 'PERMIT_SATISFIED',
      actionHash,
      ed25519Signature: signature
    };
  }
}
```

### 5.4 Z3 SMT Formal Invariant Prover (`packages/core/src/formal/z3-invariant-prover.ts`)

Executes Z3 SMT-LIB2 queries via `safe-exec` to mathematically prove whether a bounds or authorization violation is reachable (`SAT`) or unreachable after patching (`UNSAT`):

```typescript
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { runSandboxedBinary, type ScopeManifest } from '../../../broker/src/safe-exec.js';
import type { SMTProofResult } from '../../../shared/src/types.js';

export async function verifySmtInvariant(
  smtLib2Assertion: string,
  cwd: string,
  manifest: ScopeManifest
): Promise<SMTProofResult> {
  const startTime = Date.now();
  const tempFile = path.join(os.tmpdir(), `aegis-proof-${Date.now()}.smt2`);
  await writeFile(tempFile, smtLib2Assertion, 'utf8');

  try {
    const { stdout } = await runSandboxedBinary('z3', ['-smt2', tempFile], cwd, manifest);
    const durationMs = Date.now() - startTime;
    const lines = stdout.trim().split('\n');
    const firstLine = lines[0]?.trim();

    if (firstLine === 'sat') {
      return {
        status: 'SAT_COUNTEREXAMPLE',
        smtLib2Query: smtLib2Assertion,
        counterexampleModel: { rawModel: lines.slice(1).join('\n') },
        durationMs
      };
    }
    if (firstLine === 'unsat') {
      return {
        status: 'UNSAT_PROVED',
        smtLib2Query: smtLib2Assertion,
        durationMs
      };
    }
    return {
      status: 'TIMEOUT',
      smtLib2Query: smtLib2Assertion,
      durationMs
    };
  } finally {
    await unlink(tempFile).catch(() => undefined);
  }
}
```

### 5.5 Native SQLite WAL Merkle Audit Ledger (`packages/db/src/merkle-ledger.ts`)

Uses Node's built-in `node:sqlite` (`DatabaseSync`) with `PRAGMA journal_mode = WAL` and Ed25519 verification:

```typescript
import { DatabaseSync } from 'node:sqlite';
import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';

export class MerkleLedgerStore {
  private db: DatabaseSync;
  private privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'];
  public readonly publicKeyPem: string;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS audit_ledger (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        file_sha256 TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        prev_hash TEXT NOT NULL,
        entry_hash TEXT NOT NULL UNIQUE,
        ed25519_sig TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    const kp = generateKeyPairSync('ed25519');
    this.privateKey = kp.privateKey;
    this.publicKeyPem = kp.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  }

  public appendEvent(eventType: string, fileSha256: string, payload: unknown): {
    entryHash: string;
    signature: string;
  } {
    const lastRow = this.db
      .prepare('SELECT entry_hash FROM audit_ledger ORDER BY seq DESC LIMIT 1')
      .get() as { entry_hash?: string } | undefined;

    const prevHash = lastRow?.entry_hash ?? '0'.repeat(64);
    const payloadJson = JSON.stringify(payload);
    const createdAt = new Date().toISOString();

    const entryHash = createHash('sha256')
      .update(`${prevHash}|${eventType}|${fileSha256}|${payloadJson}|${createdAt}`)
      .digest('hex');

    const signature = sign(null, Buffer.from(entryHash, 'utf8'), this.privateKey).toString('base64');

    this.db
      .prepare(
        `INSERT INTO audit_ledger
         (event_type, file_sha256, payload_json, prev_hash, entry_hash, ed25519_sig, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(eventType, fileSha256, payloadJson, prevHash, entryHash, signature, createdAt);

    return { entryHash, signature };
  }

  public verifyChain(): boolean {
    const rows = this.db
      .prepare('SELECT * FROM audit_ledger ORDER BY seq ASC')
      .all() as Array<{
      event_type: string;
      file_sha256: string;
      payload_json: string;
      prev_hash: string;
      entry_hash: string;
      ed25519_sig: string;
      created_at: string;
    }>;

    let expectedPrev = '0'.repeat(64);
    for (const row of rows) {
      if (row.prev_hash !== expectedPrev) return false;
      const recomputed = createHash('sha256')
        .update(
          `${row.prev_hash}|${row.event_type}|${row.file_sha256}|${row.payload_json}|${row.created_at}`
        )
        .digest('hex');
      if (recomputed !== row.entry_hash) return false;
      const validSig = verify(
        null,
        Buffer.from(row.entry_hash, 'utf8'),
        this.publicKeyPem,
        Buffer.from(row.ed25519_sig, 'base64')
      );
      if (!validSig) return false;
      expectedPrev = row.entry_hash;
    }
    return true;
  }
}
```

### 5.6 Gemini 3.8 Flash & 4 Argon Structured Model Adapter (`packages/core/src/providers/gemini-adapter.ts`)

Routes high-speed parallel tasks (AST triage, 3-candidate JiT catching test synthesis) to `gemini-3.8-flash` and complex formal SMT/patch synthesis to `gemini-4-argon` with constrained JSON schema decoding:

```typescript
export interface GeminiAdapterConfig {
  apiKey: string;
  fastModel?: string;
  reasoningModel?: string;
}

export class GeminiStructuredAdapter {
  private apiKey: string;
  public readonly fastModel: string;
  public readonly reasoningModel: string;

  constructor(config: GeminiAdapterConfig) {
    this.apiKey = config.apiKey;
    this.fastModel = config.fastModel ?? process.env.GEMINI_MODEL_FAST ?? 'gemini-3.8-flash';
    this.reasoningModel =
      config.reasoningModel ?? process.env.GEMINI_MODEL_REASONING ?? 'gemini-4-argon';
  }

  public async generateStructured<T>(params: {
    tier: 'fast' | 'reasoning';
    systemInstruction: string;
    prompt: string;
    jsonSchema: Record<string, unknown>;
  }): Promise<T> {
    const model = params.tier === 'fast' ? this.fastModel : this.reasoningModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: params.prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: params.jsonSchema
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      throw new Error('Empty structured response from Gemini API.');
    }
    return JSON.parse(rawJson) as T;
  }
}
```

### 5.7 Differential Regression & Anti-Cheat Patch Gate (`packages/core/src/remediation/regression-gate.ts`)

Rejects "cheat patches" that pass tests by deleting exports, silencing exceptions, or bypassing business logic:

```typescript
export interface PatchGateReport {
  accepted: boolean;
  reason?: string;
  catchingTestNeutralized: boolean;
  baselineSuitePassed: boolean;
  smtProofUnsat: boolean;
  astGuardPassed: boolean;
}

export function verifyAstPatchIntegrity(originalSource: string, patchedSource: string): {
  passed: boolean;
  violation?: string;
} {
  // 1. Reject empty catch blocks introduced by the patch
  const emptyCatchRegex = /catch\s*\([^)]*\)\s*\{\s*\}/g;
  const origEmptyCatches = (originalSource.match(emptyCatchRegex) ?? []).length;
  const patchedEmptyCatches = (patchedSource.match(emptyCatchRegex) ?? []).length;
  if (patchedEmptyCatches > origEmptyCatches) {
    return { passed: false, violation: 'Patch introduces an empty catch block that swallows errors.' };
  }

  // 2. Reject deletion of exported functions, classes, or routes
  const exportRegex = /export\s+(?:async\s+)?(?:function|const|class)\s+([a-zA-Z0-9_]+)/g;
  const origExports = [...originalSource.matchAll(exportRegex)].map((m) => m[1]);
  const patchedExports = new Set([...patchedSource.matchAll(exportRegex)].map((m) => m[1]));
  for (const exp of origExports) {
    if (!patchedExports.has(exp)) {
      return { passed: false, violation: `Patch deletes exported symbol '${exp}'.` };
    }
  }

  return { passed: true };
}
```

## 6. Build Execution Order for Antigravity Agent

When instructed to build or complete this repository in Antigravity, execute these 5 tasks sequentially:

1. **Task 1 — Scaffold Workspace & Core Schemas:** Create `package.json`, `tsconfig.json`, `heimdall.scope.json`, `.agents/mcp_config.json`, and `packages/shared/src/types.ts`.
2. **Task 2 — Build SQLite WAL Ledger & Broker Daemon:** Implement `packages/db/src/merkle-ledger.ts`, `packages/db/src/findings-store.ts`, `packages/broker/src/safe-exec.ts`, and `packages/broker/src/policy-prover.ts`, followed by unit tests verifying Ed25519 hash-chain integrity and `ScopeGuard` symlink containment.
3. **Task 3 — Build AST Slicer, Z3 Prover, & JiT Catching Tester:** Implement `tree-sitter-slicer.ts`, `z3-invariant-prover.ts`, `jit-catching-tester.ts`, `adaptive-harness.ts` (with `Promise.allSettled` parallel candidate evaluation), and `regression-gate.ts` inside `packages/core`.
4. **Task 4 — Wire MCP Server & Unified CLI:** Expose `heimdall_audit_repo`, `heimdall_prove_invariant`, `heimdall_run_catching_test`, and `heimdall_synthesize_patch` in `packages/mcp/src/index.ts` and `packages/cli/src/index.ts` (including the `--demo-fast` flag).
5. **Task 5 — Build Port 4040 3-Pane Live Theater & Demo Benchmark:** Create `packages/dashboard/src/server.ts` (streaming SSE events across Pane 1: AST Taint & Failing Catching Test, Pane 2: 3-Axis Adaptive Harness & Z3 Counterexample/Unsat Proof, Pane 3: Surgical Diff, Anti-Cheat Gate, & Ed25519 Merkle Receipt) and a vulnerable Express/TypeScript target in `benchmarks/demo-targets/order-api` that runs end-to-end in under 20 seconds via `npx aegis auto ./benchmarks/demo-targets/order-api --demo-fast`.