# Heimdall Binary CRS Harness

Evidence-first binary analysis and autonomous Proof-of-Vulnerability (PoV) confirmation.

## Principles

1. **PoV is the unit of truth:** A security hypothesis is confirmed *only* when a deterministic oracle reproduces a crash or vulnerability trigger.
2. **Graceful degradation:** Triage and analysis operate without external decompilers; Ghidra headless and angr are used when present.
3. **Automated verification loop:** Synthesizes exploit payloads, verifies crash signals (SIGSEGV, SIGABRT, memory corruption), and records cryptographic proof receipts.

## Quickstart

```bash
# Binary triage: inspect architecture, binary format, and mitigations
python3 -m heimdall_binary.cli triage ./target_binary

# Execute candidate Proof-of-Vulnerability
python3 -m heimdall_binary.cli prove ./target_binary --payload crash_payload.bin
```
