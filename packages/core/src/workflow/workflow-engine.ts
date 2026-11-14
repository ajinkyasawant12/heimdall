import { randomUUID } from "node:crypto";
import type { WorkflowStore } from "@heimdall/db";
import type { LearningService } from "../learning/learning-service.js";
import type {
  SecurityWorkflowDefinition,
  WorkflowRunRecord,
  StepExecutionResult
} from "@heimdall/shared";

export class WorkflowEngine {
  constructor(
    private readonly workflowStore: WorkflowStore,
    private readonly learningService: LearningService
  ) {}

  /**
   * Returns standard built-in security workflow templates.
   */
  getBuiltinTemplates(): SecurityWorkflowDefinition[] {
    return [
      {
        id: "template-code-audit",
        name: "Deep Code Security Audit",
        description: "Exhaustive multi-lens AST review, vulnerability hypothesis generation, and evidence recording.",
        revision: 1,
        nodes: [
          {
            id: "scope_discovery",
            label: "Scope Discovery & AST Ingestion",
            agentRole: "auditor",
            instructions: "Enforce target scope boundaries, index codebase files, and compute baseline digests.",
            inputs: [],
            timeoutSeconds: 60
          },
          {
            id: "multi_lens_scan",
            label: "Multi-Lens Pattern & Taint Analysis",
            agentRole: "auditor",
            instructions: "Scan code across memory corruption, injection, crypto misuse, and deserialization lenses.",
            inputs: ["scope_discovery"],
            timeoutSeconds: 180
          },
          {
            id: "learning_ingest",
            label: "Learning Ledger Derivation",
            agentRole: "evaluator",
            instructions: "Extract source-grounded patterns and append events to the durable learning store.",
            inputs: ["multi_lens_scan"],
            timeoutSeconds: 60
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "template-vulnerability-research",
        name: "Autonomous Vulnerability Research & PoV Verification",
        description: "Finds high-risk flaw hypotheses, synthesizes deterministic PoVs, and verifies exploitability.",
        revision: 1,
        nodes: [
          {
            id: "surface_mapping",
            label: "Attack Surface Mapping",
            agentRole: "auditor",
            instructions: "Map entry points, routes, IPC sockets, and unauthenticated endpoints.",
            inputs: [],
            timeoutSeconds: 60
          },
          {
            id: "hypothesis_generation",
            label: "Bug Hypothesis Generation",
            agentRole: "auditor",
            instructions: "Construct candidate exploit paths and identify candidate vulnerability sites.",
            inputs: ["surface_mapping"],
            timeoutSeconds: 120
          },
          {
            id: "pov_verification",
            label: "Deterministic PoV Oracle Verification",
            agentRole: "verifier",
            instructions: "Generate standalone reproducer scripts and execute in sandbox oracle to confirm findings.",
            inputs: ["hypothesis_generation"],
            timeoutSeconds: 180
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "template-patch-verification",
        name: "Remediation & Patch Verification",
        description: "Generates secure code patches and proves neutralization against reproducing PoVs without regressions.",
        revision: 1,
        nodes: [
          {
            id: "patch_synthesis",
            label: "Patch Synthesis",
            agentRole: "patcher",
            instructions: "Generate minimal surgical fix resolving the root cause of confirmed vulnerability.",
            inputs: [],
            timeoutSeconds: 60
          },
          {
            id: "neutralization_check",
            label: "PoV Neutralization Verification",
            agentRole: "verifier",
            instructions: "Execute PoV reproducer against patched code to ensure vulnerability cannot be triggered.",
            inputs: ["patch_synthesis"],
            timeoutSeconds: 60
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Executes a workflow DAG sequentially or by dependency ordering.
   */
  async executeWorkflow(
    workflowDef: SecurityWorkflowDefinition,
    projectId: string,
    stepHandler: (node: SecurityWorkflowDefinition["nodes"][number]) => Promise<{
      status: "completed" | "failed";
      summary: string;
      findings?: string[];
      error?: string;
    }>
  ): Promise<WorkflowRunRecord> {
    const run = this.workflowStore.createRun(workflowDef.id, workflowDef.revision, projectId);
    let allSucceeded = true;

    for (const node of workflowDef.nodes) {
      const stepStart = new Date().toISOString();
      const stepResult: StepExecutionResult = {
        stepId: node.id,
        status: "running",
        startedAt: stepStart
      };
      this.workflowStore.updateRunStep(run.id, stepResult);

      try {
        const outcome = await stepHandler(node);
        stepResult.status = outcome.status;
        stepResult.completedAt = new Date().toISOString();
        stepResult.outputSummary = outcome.summary;
        stepResult.emittedFindings = outcome.findings;
        stepResult.error = outcome.error;

        if (outcome.status === "failed") {
          allSucceeded = false;
        }

        this.workflowStore.updateRunStep(run.id, stepResult);

        // Record learning event for this workflow step
        this.learningService.recordEvent({
          idempotencyKey: `wf-step-${run.id}-${node.id}`,
          projectId,
          category: "workflow_step",
          outcome: outcome.status === "completed" ? "success" : "failure",
          summary: `Step "${node.label}" ${outcome.status}: ${outcome.summary || outcome.error || ""}`,
          strength: "operational",
          workflowId: workflowDef.id,
          stepId: node.id,
          executionId: run.id
        });
      } catch (err: any) {
        allSucceeded = false;
        stepResult.status = "failed";
        stepResult.completedAt = new Date().toISOString();
        stepResult.error = err.message || String(err);
        this.workflowStore.updateRunStep(run.id, stepResult);

        this.learningService.recordEvent({
          idempotencyKey: `wf-step-${run.id}-${node.id}`,
          projectId,
          category: "workflow_step",
          outcome: "failure",
          summary: `Step "${node.label}" failed: ${err.message}`,
          strength: "operational",
          workflowId: workflowDef.id,
          stepId: node.id,
          executionId: run.id
        });
        break;
      }
    }

    const finalStatus = allSucceeded ? "completed" : "failed";
    const completedRun = this.workflowStore.completeRun(run.id, finalStatus);

    this.learningService.recordEvent({
      idempotencyKey: `wf-run-${run.id}`,
      projectId,
      category: "workflow_run",
      outcome: allSucceeded ? "success" : "failure",
      summary: `Workflow "${workflowDef.name}" run finished with status: ${finalStatus}`,
      strength: "operational",
      workflowId: workflowDef.id,
      executionId: run.id
    });

    return completedRun;
  }
}
