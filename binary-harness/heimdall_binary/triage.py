import struct
import os
from typing import Dict, Any

def triage_binary(path: str) -> Dict[str, Any]:
    """Inspects binary format, architecture, and security mitigations."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Binary file not found: {path}")

    with open(path, "rb") as f:
        header = f.read(64)

    info: Dict[str, Any] = {
        "path": os.path.abspath(path),
        "size_bytes": os.path.getsize(path),
        "format": "unknown",
        "architecture": "unknown",
        "bits": 0,
        "endian": "unknown",
        "mitigations": {
            "canary": False,
            "nx": False,
            "pie": False,
            "relro": "none"
        }
    }

    # ELF Detection
    if header.startswith(b"\x7fELF"):
        info["format"] = "ELF"
        ei_class = header[4]
        ei_data = header[5]
        info["bits"] = 64 if ei_class == 2 else 32
        info["endian"] = "little" if ei_data == 1 else "big"

        endian_char = "<" if ei_data == 1 else ">"
        e_type, e_machine = struct.unpack_from(f"{endian_char}HH", header, 16)

        arch_map = {0x03: "x86", 0x3E: "x86_64", 0x28: "ARM", 0xB7: "AArch64", 0xF3: "RISC-V"}
        info["architecture"] = arch_map.get(e_machine, f"custom (0x{e_machine:x})")
        info["mitigations"]["pie"] = (e_type == 3) # ET_DYN is PIE/shared library

        with open(path, "rb") as f:
            all_bytes = f.read()
            # Canary heuristic: __stack_chk_fail presence
            if b"__stack_chk_fail" in all_bytes:
                info["mitigations"]["canary"] = True
            # NX heuristic: GNU_STACK header presence without execute bit
            if b"GNU_STACK" in all_bytes:
                info["mitigations"]["nx"] = True
            if b"GNU_RELRO" in all_bytes:
                info["mitigations"]["relro"] = "partial"
                if b"BIND_NOW" in all_bytes:
                    info["mitigations"]["relro"] = "full"

    # PE (Windows Executable)
    elif header.startswith(b"MZ"):
        info["format"] = "PE"
        with open(path, "rb") as f:
            f.seek(0x3C)
            pe_offset_raw = f.read(4)
            if len(pe_offset_raw) == 4:
                pe_offset = struct.unpack("<I", pe_offset_raw)[0]
                f.seek(pe_offset)
                pe_sig = f.read(4)
                if pe_sig == b"PE\x00\x00":
                    machine_raw = f.read(2)
                    machine = struct.unpack("<H", machine_raw)[0]
                    info["architecture"] = "x86_64" if machine == 0x8664 else "x86" if machine == 0x14c else "ARM64"
                    info["bits"] = 64 if machine == 0x8664 else 32

    # Mach-O (macOS)
    elif header[:4] in (b"\xfe\xed\xfa\xce", b"\xce\xfa\xed\xfe", b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe"):
        info["format"] = "Mach-O"
        info["bits"] = 64 if header[:4] in (b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe") else 32

    return info
