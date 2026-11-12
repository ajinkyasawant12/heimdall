/**
 * Heimdall CRS - Global Constants & Configuration Defaults
 */

export const HEIMDALL_VERSION = "2.0.0";
export const HEIMDALL_BANNER = "Heimdall CRS - Autonomous AI Security Harness";

// Compatibility aliases
export const AEGIS_VERSION = HEIMDALL_VERSION;
export const AEGIS_BANNER = HEIMDALL_BANNER;

export const DEFAULT_MAX_REVIEW_FILES = 2000;
export const DEFAULT_MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB
export const DEFAULT_EXECUTION_TIMEOUT_MS = 300_000; // 5 minutes
export const DEFAULT_VERIFICATION_CONCURRENCY = 6;
export const DEFAULT_MAX_TURNS = 20;

export const KNOWN_CWE_MAPPINGS: Record<string, string> = {
  memory_corruption: "CWE-119",
  buffer_overflow: "CWE-120",
  use_after_free: "CWE-416",
  integer_overflow: "CWE-190",
  format_string: "CWE-134",
  command_injection: "CWE-78",
  sql_injection: "CWE-89",
  path_traversal: "CWE-22",
  ssrf: "CWE-918",
  crypto_misuse: "CWE-327",
  broken_auth: "CWE-287",
  deserialization: "CWE-502",
  race_condition: "CWE-362",
  logic_flaw: "CWE-840"
};
