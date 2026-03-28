// ============================================================================
// ZenNode — Backend HTTP Client
//
// Sends behavioral snapshots to the optional FastAPI backend when LLM is
// enabled. Uses Node's built-in `http` module — zero external dependencies.
//
// The backend is always optional. If it's unreachable, the extension falls
// back to local scoring seamlessly.
// ============================================================================

import * as http from 'http';
import { BehavioralSnapshot, CognitiveReport } from './types';

export class BackendClient {
    private baseUrl: string;
    private timeoutMs = 5000;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    /**
     * POST /api/v1/snapshot — sends behavioral data, returns a CognitiveReport
     * that may include an LLM-generated intervention message.
     *
     * Returns null if the backend is unreachable or returns an error.
     */
    async sendSnapshot(snapshot: BehavioralSnapshot): Promise<CognitiveReport | null> {
        try {
            const body = JSON.stringify(snapshot);
            const url  = new URL(`${this.baseUrl}/api/v1/snapshot`);

            return await this.post<CognitiveReport>(url, body);
        } catch {
            return null;
        }
    }

    /**
     * GET /health — quick reachability check.
     */
    async isHealthy(): Promise<boolean> {
        try {
            const url = new URL(`${this.baseUrl}/health`);
            const res = await this.get<{ status: string }>(url);
            return res?.status === 'ok';
        } catch {
            return false;
        }
    }

    // ── Internal HTTP helpers ─────────────────────────────────────────────────

    private post<T>(url: URL, body: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const options: http.RequestOptions = {
                hostname: url.hostname,
                port:     url.port || 80,
                path:     url.pathname + url.search,
                method:   'POST',
                headers:  {
                    'Content-Type':   'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
                timeout: this.timeoutMs,
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try { resolve(JSON.parse(data)); }
                        catch { reject(new Error('Invalid JSON response')); }
                    } else {
                        reject(new Error(`Backend returned ${res.statusCode}`));
                    }
                });
            });

            req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    private get<T>(url: URL): Promise<T> {
        return new Promise((resolve, reject) => {
            const options: http.RequestOptions = {
                hostname: url.hostname,
                port:     url.port || 80,
                path:     url.pathname + url.search,
                method:   'GET',
                timeout:  this.timeoutMs,
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch { reject(new Error('Invalid JSON response')); }
                });
            });

            req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
            req.on('error', reject);
            req.end();
        });
    }
}
