#!/usr/bin/env node
/**
 * Heimdall CRS - Out-of-Process Host Policy Broker Daemon
 * Enforces zero-trust kernel containment, symlink-safe realpath checks,
 * Cedar formal lattice policies, and Ed25519 action notarization.
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { HostScopeGuard } from './scope-guard.js';
import { FormalPolicyProver, type ProposedAction } from './policy-prover.js';
import { runSandboxedBinary } from './safe-exec.js';

export interface BrokerServerConfig {
  port?: number;
  manifestPath?: string;
}

export class BrokerDaemon {
  private scopeGuard: HostScopeGuard;
  private policyProver: FormalPolicyProver | null = null;
  private server: ReturnType<typeof createServer> | null = null;

  constructor(private config: BrokerServerConfig = {}) {
    this.scopeGuard = new HostScopeGuard(config.manifestPath ?? './heimdall.scope.json');
  }

  public async start(): Promise<number> {
    const manifest = await this.scopeGuard.load();
    this.policyProver = new FormalPolicyProver(manifest);

    const port = this.config.port ?? (process.env.HEIMDALL_BROKER_PORT ? parseInt(process.env.HEIMDALL_BROKER_PORT, 10) : 4041);

    return new Promise((resolve) => {
      this.server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);

        const sendJson = (data: unknown, status = 200) => {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        };

        if (req.method === 'GET' && url.pathname === '/health') {
          return sendJson({ status: 'HEALTHY', pubKey: this.policyProver?.publicKeyPem });
        }

        if (req.method === 'POST' && url.pathname === '/evaluate-policy') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const action = JSON.parse(body) as ProposedAction;
              const result = this.policyProver!.evaluateAndSign(action);
              sendJson(result, result.permitted ? 200 : 403);
            } catch (err: unknown) {
              sendJson({ error: String(err) }, 400);
            }
          });
          return;
        }

        if (req.method === 'POST' && url.pathname === '/exec-sandboxed') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { binary, args, cwd, ticket } = JSON.parse(body) as {
                binary: string;
                args: string[];
                cwd: string;
                ticket?: { actionHash: string; signature: string };
              };

              // Verify Ed25519 ticket before execution if supplied
              if (ticket) {
                const valid = this.policyProver!.verifyTicket(ticket.actionHash, ticket.signature);
                if (!valid) {
                  return sendJson({ error: 'INVALID_TICKET_SIGNATURE' }, 403);
                }
              }

              const result = await runSandboxedBinary(binary, args, cwd, manifest);
              sendJson(result);
            } catch (err: unknown) {
              sendJson({ error: String(err) }, 500);
            }
          });
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      this.server.listen(port, '127.0.0.1', () => {
        resolve(port);
      });
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => this.server?.close(() => resolve()));
    }
  }

  public getPublicKey(): string {
    return this.policyProver?.publicKeyPem ?? '';
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const daemon = new BrokerDaemon();
  daemon.start().then((port) => {
    console.log(`[+] Heimdall Host Policy Broker Daemon listening on 127.0.0.1:${port}`);
  });
}
