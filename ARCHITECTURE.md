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
- `learning_events`: Append-only event store with idempotency keys.
- `learning_knowledge`: Source-grounded security knowledge with file hash tracking.
- `learning_candidates`: Evolutionary prompt and instruction candidates.
- `learning_work`: Outbox work queue with lease-based locking and exponential backoff.
- `learning_proposals`: Self-healing workflow restore recommendations.
- `findings`: Full security findings records with attached PoV and patch artifacts.
- `workflow_runs`: DAG step execution logs and statuses.

---

## 4. MCP Interface (`@heimdall/mcp`)

Implements the Model Context Protocol over stdio:
- Exposes tools for external coding agents (Claude, Cursor, Antigravity, Copilot).
- Bridges agent reasoning directly into Heimdall's deterministic scan, verification, and patch engines.
