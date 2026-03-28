// ============================================================================
// ZenNode — Cloud Sync Service
//
// Completely optional. Only activates when the developer explicitly connects
// to a team. JWT stored in VS Code SecretStorage — never in plaintext.
//
// Privacy contract:
//   ONLY anonymized session summaries are sent — never raw behavioral data.
//   Developer is identified by anonymous_id only, not email.
// ============================================================================

import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { SessionSummary } from './sessionStore';

const SECRET_KEY_TOKEN    = 'zn_token';
const SECRET_KEY_ANON_ID  = 'zn_anon_id';
const SETTING_CLOUD_URL   = 'zn_cloud_url';

export interface ConnectResult {
    ok: boolean;
    error?: string;
    anonymousId?: string;
    teamId?: string | null;
    role?: string;
}

export class CloudSyncService {
    private _secrets: vscode.SecretStorage;
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._secrets = context.secrets;
        this._context = context;
    }

    // ── Connection state ────────────────────────────────────────────────────

    async isConnected(): Promise<boolean> {
        const token = await this._secrets.get(SECRET_KEY_TOKEN);
        return !!token;
    }

    async getAnonymousId(): Promise<string | undefined> {
        return this._secrets.get(SECRET_KEY_ANON_ID);
    }

    getCloudUrl(): string {
        return this._context.globalState.get<string>(SETTING_CLOUD_URL)
            ?? 'http://127.0.0.1:8421';
    }

    // ── Auth ────────────────────────────────────────────────────────────────

    async signup(cloudUrl: string, email: string, password: string, displayName: string): Promise<ConnectResult> {
        // First ensure we have an anonymous_id
        let anonId = await this._secrets.get(SECRET_KEY_ANON_ID);
        if (!anonId) {
            anonId = this._generateUUID();
            await this._secrets.store(SECRET_KEY_ANON_ID, anonId);
        }

        const res = await this._post(cloudUrl, '/auth/signup', {
            email,
            password,
            display_name: displayName,
            anonymous_id: anonId,
        });

        if (!res.ok) {
            return { ok: false, error: res.body?.detail ?? 'Signup failed' };
        }

        await this._storeSession(cloudUrl, res.body.access_token, anonId);
        return { ok: true, anonymousId: anonId, teamId: res.body.team_id, role: res.body.role };
    }

    async login(cloudUrl: string, email: string, password: string): Promise<ConnectResult> {
        const res = await this._post(cloudUrl, '/auth/login', { email, password });

        if (!res.ok) {
            return { ok: false, error: res.body?.detail ?? 'Login failed' };
        }

        // Use the anonymous_id from the server (links to their existing data)
        const anonId = res.body.anonymous_id;
        await this._storeSession(cloudUrl, res.body.access_token, anonId);
        return { ok: true, anonymousId: anonId, teamId: res.body.team_id, role: res.body.role };
    }

    async joinTeam(inviteCode: string): Promise<{ ok: boolean; teamName?: string; error?: string }> {
        const token = await this._secrets.get(SECRET_KEY_TOKEN);
        if (!token) { return { ok: false, error: 'Not connected' }; }

        const res = await this._post(
            this.getCloudUrl(),
            '/teams/join',
            { invite_code: inviteCode },
            token,
        );

        if (!res.ok) {
            return { ok: false, error: res.body?.detail ?? 'Invalid invite code' };
        }
        return { ok: true, teamName: res.body.name };
    }

    async disconnect(): Promise<void> {
        await this._secrets.delete(SECRET_KEY_TOKEN);
        // Keep anonymous_id — if they reconnect later, their history links up
    }

    // ── Sync ────────────────────────────────────────────────────────────────

    async pushSessions(sessions: SessionSummary[]): Promise<{ accepted: number; failed: number }> {
        const token  = await this._secrets.get(SECRET_KEY_TOKEN);
        const anonId = await this._secrets.get(SECRET_KEY_ANON_ID);

        if (!token || !anonId || sessions.length === 0) {
            return { accepted: 0, failed: 0 };
        }

        const cloudUrl = this.getCloudUrl();
        let accepted = 0;
        let failed   = 0;

        for (const s of sessions) {
            const payload = {
                anonymous_user_id: anonId,
                session_id:        s.sessionId,
                session_date:      s.startedAt.slice(0, 10),
                avg_score:         s.avgScore,
                max_score:         s.maxScore,
                overload_count:    s.overloadCount,
                flow_seconds:      s.flowSeconds,
                friction_seconds:  s.frictionSeconds,
                fatigue_seconds:   s.fatigueSeconds,
                overload_seconds:  s.overloadSeconds,
                snapshot_count:    s.snapshotCount,
            };

            const res = await this._post(cloudUrl, '/sync/session', payload, token);
            if (res.ok) { accepted++; } else { failed++; }
        }

        console.log(`[ZenNode] Cloud sync — accepted: ${accepted}, failed: ${failed}`);
        return { accepted, failed };
    }

    // ── HTTP helpers ────────────────────────────────────────────────────────

    private async _post(
        baseUrl: string,
        path: string,
        body: object,
        token?: string,
    ): Promise<{ ok: boolean; body: any }> {
        return new Promise((resolve) => {
            try {
                const url    = new URL(path, baseUrl);
                const data   = JSON.stringify(body);
                const isHttps = url.protocol === 'https:';
                const lib    = isHttps ? https : http;

                const options: http.RequestOptions = {
                    hostname: url.hostname,
                    port:     url.port || (isHttps ? 443 : 80),
                    path:     url.pathname + url.search,
                    method:   'POST',
                    headers: {
                        'Content-Type':   'application/json',
                        'Content-Length': Buffer.byteLength(data),
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                };

                const req = lib.request(options, (res) => {
                    let raw = '';
                    res.on('data', chunk => { raw += chunk; });
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(raw);
                            resolve({ ok: (res.statusCode ?? 0) < 300, body: parsed });
                        } catch {
                            resolve({ ok: false, body: { detail: raw } });
                        }
                    });
                });

                req.on('error', (e) => {
                    resolve({ ok: false, body: { detail: e.message } });
                });

                req.setTimeout(10_000, () => {
                    req.destroy();
                    resolve({ ok: false, body: { detail: 'Request timed out' } });
                });

                req.write(data);
                req.end();
            } catch (e: any) {
                resolve({ ok: false, body: { detail: e?.message ?? 'Unknown error' } });
            }
        });
    }

    private async _storeSession(cloudUrl: string, token: string, anonId: string): Promise<void> {
        await this._secrets.store(SECRET_KEY_TOKEN, token);
        await this._secrets.store(SECRET_KEY_ANON_ID, anonId);
        await this._context.globalState.update(SETTING_CLOUD_URL, cloudUrl);
    }

    private _generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
