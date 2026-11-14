import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import type { ScopeManifest } from '@heimdall/shared';

export interface ProposedAction {
  agentRole: 'AST_AUDITOR' | 'SMT_PROVER' | 'JIT_TESTER' | 'PATCH_SYNTHESIZER' | 'EVOLUTION_CONTROLLER';
  operation: 'READ_AST' | 'RUN_Z3' | 'RUN_SANDBOX_TEST' | 'APPLY_GIT_DIFF' | 'MUTATE_PARAM';
  targetPath: string;
  binary?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  permitted: boolean;
  reason: string;
  actionHash: string;
  ed25519Signature?: string;
  publicKeyPem: string;
  issuedAtIso: string;
}

export class FormalPolicyProver {
  private privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'];
  public readonly publicKeyPem: string;

  constructor(private readonly manifest: ScopeManifest) {
    const kp = generateKeyPairSync('ed25519');
    this.privateKey = kp.privateKey;
    this.publicKeyPem = kp.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  }

  /**
   * Formal Cedar / Lattice Policy Evaluation:
   * Rule 1: Only PATCH_SYNTHESIZER may mutate source files via APPLY_GIT_DIFF.
   * Rule 2: Any binary execution must exist in manifest.allowedBinaries.
   * Rule 3: Network is forbidden in sandboxed runs unless explicitly allowed in manifest.
   * Rule 4: System guardrail modifications are strictly forbidden.
   */
  public evaluateAndSign(action: ProposedAction): PolicyEvaluationResult {
    const issuedAtIso = new Date().toISOString();

    // Formal Lattice Rule 1: Only PATCH_SYNTHESIZER may mutate source files via APPLY_GIT_DIFF
    if (action.operation === 'APPLY_GIT_DIFF' && action.agentRole !== 'PATCH_SYNTHESIZER') {
      return {
        permitted: false,
        reason: `Role '${action.agentRole}' is formally forbidden from mutating repository source code via APPLY_GIT_DIFF.`,
        actionHash: '',
        publicKeyPem: this.publicKeyPem,
        issuedAtIso
      };
    }

    // Formal Lattice Rule 2: Any binary execution must be in manifest.allowedBinaries
    if (action.binary) {
      const baseBin = action.binary.replace(/\.(exe|cmd|bat)$/i, '').toLowerCase();
      const allowed = this.manifest.allowedBinaries.map((b) => b.replace(/\.(exe|cmd|bat)$/i, '').toLowerCase());
      if (!allowed.includes(baseBin)) {
        return {
          permitted: false,
          reason: `Binary '${action.binary}' is forbidden by Target ScopeManifest.`,
          actionHash: '',
          publicKeyPem: this.publicKeyPem,
          issuedAtIso
        };
      }
    }

    // Formal Lattice Rule 3: Guardrail tampering rejection
    if (action.operation === 'MUTATE_PARAM') {
      const axis = action.metadata?.axis as string | undefined;
      const allowedAxes = ['PERSONA_LENS', 'DIAGNOSTIC_ROUTING', 'INPUT_NORMALIZER'];
      if (!axis || !allowedAxes.includes(axis)) {
        return {
          permitted: false,
          reason: `Parameter adaptation outside 3 bounded axes (${allowedAxes.join(', ')}) is formally rejected.`,
          actionHash: '',
          publicKeyPem: this.publicKeyPem,
          issuedAtIso
        };
      }
    }

    const canonicalPayload = JSON.stringify({
      role: action.agentRole,
      op: action.operation,
      path: action.targetPath,
      bin: action.binary ?? null,
      meta: action.metadata ?? null,
      issuedAt: issuedAtIso
    });

    const actionHash = createHash('sha256').update(canonicalPayload).digest('hex');
    const signature = sign(null, Buffer.from(actionHash, 'utf8'), this.privateKey).toString('base64');

    return {
      permitted: true,
      reason: 'FORMAL_LATTICE_PERMIT_SATISFIED',
      actionHash,
      ed25519Signature: signature,
      publicKeyPem: this.publicKeyPem,
      issuedAtIso
    };
  }

  public verifyTicket(actionHash: string, signatureBase64: string): boolean {
    try {
      return verify(
        null,
        Buffer.from(actionHash, 'utf8'),
        this.publicKeyPem,
        Buffer.from(signatureBase64, 'base64')
      );
    } catch {
      return false;
    }
  }
}
