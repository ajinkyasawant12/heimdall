import sys
import json
import argparse
from .triage import triage_binary
from .oracle import CrashOracle

def main():
    parser = argparse.ArgumentParser(description="Heimdall Binary CRS Harness - Evidence-first binary reasoning")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Triage command
    triage_parser = subparsers.add_parser("triage", help="Triage binary format, arch, and mitigations")
    triage_parser.add_argument("target", help="Path to compiled binary")
    triage_parser.add_argument("--json", action="store_true", help="Output JSON format")

    # Prove command
    prove_parser = subparsers.add_parser("prove", help="Execute candidate PoV and record crash oracle verdict")
    prove_parser.add_argument("target", help="Path to compiled binary")
    prove_parser.add_argument("--payload", help="Path to proof payload file", required=True)

    args = parser.parse_args()

    if args.command == "triage":
        res = triage_binary(args.target)
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"=== Heimdall Binary Triage: {args.target} ===")
            print(f"Format:       {res['format']} ({res['bits']}-bit, {res['endian']})")
            print(f"Architecture: {res['architecture']}")
            print(f"Mitigations:")
            for k, v in res["mitigations"].items():
                status = "ENABLED" if v is True or (isinstance(v, str) and v != "none") else "DISABLED"
                print(f"  - {k.upper():8s}: {status} ({v})")

    elif args.command == "prove":
        oracle = CrashOracle()
        with open(args.payload, "rb") as f:
            payload = f.read()
        res = oracle.execute_pov(args.target, payload)
        if res["reproduced"]:
            print(f"[+] PoV REPRODUCED! Crash Class: {res['crash_class']} (Signal: {res['signal']})")
            print(f"[+] Finding status transitioned to: CONFIRMED")
        else:
            print(f"[-] PoV execution did not produce crash (Exit code: {res['exit_code']})")

if __name__ == "__main__":
    main()
