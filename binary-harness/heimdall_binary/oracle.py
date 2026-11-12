import subprocess
import os
import signal
from typing import Dict, Any, Optional

class CrashOracle:
    """Executes target binaries with proof payloads to deterministically verify crashes."""

    CRASH_SIGNALS = {
        signal.SIGSEGV: "SIGSEGV (Segmentation Fault / Invalid Memory Access)",
        signal.SIGABRT: "SIGABRT (Abort / Stack Smashing / Assert Failure)",
        signal.SIGBUS: "SIGBUS (Bus Error / Unaligned Access)",
        signal.SIGILL: "SIGILL (Illegal Instruction / Corrupted Control Flow)",
        signal.SIGFPE: "SIGFPE (Floating Point / Integer Zero Division)"
    }

    def execute_pov(self, binary_path: str, payload_bytes: bytes, timeout_sec = 5) -> Dict[str, Any]:
        if not os.path.exists(binary_path):
            raise FileNotFoundError(f"Binary not found: {binary_path}")

        result: Dict[str, Any] = {
            "reproduced": False,
            "exit_code": 0,
            "signal": None,
            "crash_class": None,
            "stdout": "",
            "stderr": ""
        }

        try:
            proc = subprocess.run(
                [binary_path],
                input=payload_bytes,
                capture_output=True,
                timeout=timeout_sec
            )
            result["exit_code"] = proc.returncode
            result["stdout"] = proc.stdout.decode("latin1", errors="replace")
            result["stderr"] = proc.stderr.decode("latin1", errors="replace")

            # On Unix, negative return codes indicate termination by signal
            if proc.returncode < 0:
                sig_num = -proc.returncode
                result["reproduced"] = True
                result["signal"] = sig_num
                result["crash_class"] = self.CRASH_SIGNALS.get(sig_num, f"SIGNAL_{sig_num}")

        except subprocess.TimeoutExpired:
            result["reproduced"] = False
            result["crash_class"] = "TIMEOUT_EXPIRED"
        except Exception as e:
            result["reproduced"] = False
            result["stderr"] = str(e)

        return result
