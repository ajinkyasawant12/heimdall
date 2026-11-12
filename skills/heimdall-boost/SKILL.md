---
name: heimdall-boost
description: >-
  Autonomous capability discovery, feature enhancement, architectural optimization, and resource acceleration for existing systems and new code.
metadata:
  icon: zap
  logo: assets/logo.svg
  command: /boost
  aliases:
    - /enhance
    - /scale
---

# Heimdall Boost - Autonomous Capability & Feature Accelerator

When invoked with `/boost` (or aliases `/enhance`, `/scale`), Heimdall analyzes all provided resources, identifies high-leverage architectural opportunities, synthesizes enhancements for existing code, discovers and prototypes new features, and mathematically validates improvements with regression-free verification gates.

## Autonomous Boost Principles

1. **Zero Architectural Regressions**: Every enhancement or new feature must preserve 100% backward-compatibility with existing APIs, types, and baseline test suites.
2. **Resource-Informed Ideation**: Synthesize features directly tailored to the target codebase's actual domain, assets, harness, and interfaces.
3. **Formal Invariant Preservation**: When upgrading or enhancing logic, verify that state transitions, security boundaries, and concurrency constraints are mathematically maintained.
4. **Verified Diff Gate**: All proposed enhancements pass through `@verifier` in an isolated OpenShell sandbox before being finalized.

---

## 4-Phase Boost Lifecycle

### Phase 1: Resource Discovery & Opportunity Mapping
- Deeply inspect all available resources, files, schemas, APIs, benchmarks, and data models.
- Map the codebase's feature surface area and identify:
  * Missing capabilities or incomplete workflows
  * Latency, memory, or throughput bottlenecks
  * UX or telemetry gaps (e.g., interactive dashboard controls, real-time feedback)
  * Plugin or integration opportunities

### Phase 2: Feature Synthesis & Enhancement Design
- Draft concrete, surgical enhancement specifications.
- Propose feature additions with clear architectural rationale and interface contracts:
  * High-value APIs and CLI extensions
  * Real-time monitoring & interactive UI controls
  * High-performance fastpaths (e.g., trajectory cache replay, sub-millisecond AST lookup)
  * Resilient edge-case handling

### Phase 3: Sandbox Verification Gate
- Author transient JiT test suites that exercise the newly enhanced capabilities.
- Execute the full regression test suite in the OpenShell / WSL sandbox barrier.
- Ensure:
  * 100% of preexisting baseline tests PASS
  * 100% of newly authored feature tests PASS
  * Zero deleted symbols, zero empty error suppressions

### Phase 4: Ledger Notarization & Trajectory Replay
- Package the enhancement into a reusable trajectory.
- Record the cryptographic receipt into the Merkle WAL ledger.
- Enable immediate <1ms fast-path replay for identical AST patterns in future runs.

---

## Example Invocations

```bash
# Boost and enhance an existing target or module
/boost ./benchmarks/targets/itr-wala

# Discover new features and accelerate dashboard telemetry
/boost packages/dashboard

# Enhance all resources and discover upgrade opportunities
/boost
```
