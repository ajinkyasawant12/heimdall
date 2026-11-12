#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { resolve as resolveEntryPath } from "node:path";
/**
 * Heimdall CRS - Out-of-Process Host Policy Broker Daemon
 * Enforces zero-trust kernel containment, symlink-safe realpath checks,
 * Cedar formal lattice policies, and Ed25519 action notarization.
 */

import { createServer } from 'node:http';
import { HostScopeGuard } from './scope-guard.js';
import { FormalPolicyProver } from './policy-prover.js';
import { runSandboxedBinary } from './safe-exec.js';
export class BrokerDaemon {
  scopeGuard;
  policyProver = null;
  server = null;
  constructor(config = {}) {
    this.config = config;
    this.scopeGuard = new HostScopeGuard(config.manifestPath ?? './heimdall.scope.json');
  }
  async start() {
    const manifest = await this.scopeGuard.load();
    this.policyProver = new FormalPolicyProver(manifest);
    const port = this.config.port ?? (process.env.HEIMDALL_BROKER_PORT ? parseInt(process.env.HEIMDALL_BROKER_PORT, 10) : 4041);
    return new Promise(resolve => {
      this.server = createServer(async (req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        const sendJson = (data, status = 200) => {
          res.writeHead(status, {
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify(data));
        };
        if (req.method === 'GET' && url.pathname === '/health') {
          return sendJson({
            status: 'HEALTHY',
            pubKey: this.policyProver?.publicKeyPem
          });
        }
        if (req.method === 'POST' && url.pathname === '/evaluate-policy') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const action = JSON.parse(body);
              const result = this.policyProver.evaluateAndSign(action);
              sendJson(result, result.permitted ? 200 : 403);
            } catch (err) {
              sendJson({
                error: String(err)
              }, 400);
            }
          });
          return;
        }
        if (req.method === 'POST' && url.pathname === '/exec-sandboxed') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const {
                binary,
                args,
                cwd,
                ticket
              } = JSON.parse(body);

              // Verify Ed25519 ticket before execution if supplied
              if (ticket) {
                const valid = this.policyProver.verifyTicket(ticket.actionHash, ticket.signature);
                if (!valid) {
                  return sendJson({
                    error: 'INVALID_TICKET_SIGNATURE'
                  }, 403);
                }
              }
              const result = await runSandboxedBinary(binary, args, cwd, manifest);
              sendJson(result);
            } catch (err) {
              sendJson({
                error: String(err)
              }, 500);
            }
          });
          return;
        }
        res.writeHead(404, {
          'Content-Type': 'text/plain'
        });
        res.end('Not Found');
      });
      this.server.listen(port, '127.0.0.1', () => {
        resolve(port);
      });
    });
  }
  async stop() {
    if (this.server) {
      await new Promise(resolve => this.server?.close(() => resolve()));
    }
  }
  getPublicKey() {
    return this.policyProver?.publicKeyPem ?? '';
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolveEntryPath(process.argv[1])).href) {
  const daemon = new BrokerDaemon();
  daemon.start().then(port => {
    console.log(`[+] Heimdall Host Policy Broker Daemon listening on 127.0.0.1:${port}`);
  });
}
