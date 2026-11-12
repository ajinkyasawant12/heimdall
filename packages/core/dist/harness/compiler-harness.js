import { execSync } from "node:child_process";
import { writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
/**
 * Compiler & Sanitizer Harness.
 * Automatically instruments target C/C++ code with AddressSanitizer and UndefinedBehaviorSanitizer
 * (-fsanitize=address,undefined) to turn silent memory corruptions into deterministic crash signals.
 */
export class CompilerSanitizerHarness {
  /**
   * Compiles source code with ASan instrumentation.
   */
  compileWithSanitizers(sourceCode, language = "c") {
    const ext = language === "cpp" ? "cpp" : "c";
    const srcFile = join(tmpdir(), `aegis-target-${randomUUID()}.${ext}`);
    const binFile = join(tmpdir(), `aegis-bin-${randomUUID()}${process.platform === "win32" ? ".exe" : ""}`);
    writeFileSync(srcFile, sourceCode, "utf-8");
    const compiler = language === "cpp" ? process.platform === "win32" ? "clang++" : "g++" : process.platform === "win32" ? "clang" : "gcc";
    const flags = "-fsanitize=address,undefined -fno-omit-frame-pointer -g -O1";
    const cmd = `${compiler} ${flags} "${srcFile}" -o "${binFile}"`;
    try {
      const output = execSync(cmd, {
        encoding: "utf-8",
        timeout: 15_000
      });
      return {
        success: existsSync(binFile),
        binaryPath: binFile,
        compilerStdout: output,
        compilerStderr: "",
        asanEnabled: true
      };
    } catch (err) {
      // Fallback compilation without ASan if clang/gcc sanitizer libraries aren't installed on host
      try {
        const fallbackCmd = `${compiler} -g -O0 "${srcFile}" -o "${binFile}"`;
        const fallbackOut = execSync(fallbackCmd, {
          encoding: "utf-8",
          timeout: 15_000
        });
        return {
          success: existsSync(binFile),
          binaryPath: binFile,
          compilerStdout: fallbackOut,
          compilerStderr: "Compiled without ASan (sanitizer runtime unavailable)",
          asanEnabled: false
        };
      } catch (fallbackErr) {
        return {
          success: false,
          binaryPath: "",
          compilerStdout: "",
          compilerStderr: fallbackErr.stderr?.toString() || fallbackErr.message,
          asanEnabled: false
        };
      }
    } finally {
      try {
        unlinkSync(srcFile);
      } catch {}
    }
  }
}
