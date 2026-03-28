# =============================================================================
# ZenNode Backend — Cloud Sync Service
#
# Syncs completed local sessions (anonymized summaries only) to the
# ZenNode Cloud API. Called manually via POST /api/v1/cloud/sync or
# automatically after each session reset.
#
# Privacy contract enforced here:
#   - Only session-level aggregates are sent (avg/max score, state durations)
#   - NO raw timeline entries, NO keystroke counts, NO behavioral data
#   - User is identified by anonymous_id only (not email or name)
# =============================================================================

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import json as _json

from database import get_connection


# ── Setting keys ──────────────────────────────────────────────────────────────
_KEY_ANON_ID    = "anonymous_user_id"
_KEY_CLOUD_URL  = "cloud_api_url"
_KEY_SYNC_ON    = "sync_enabled"
_KEY_AUTH_TOKEN = "auth_token"


class CloudSyncService:
    """
    Manages local cloud sync settings and pushes unsynced sessions to the
    ZenNode Cloud API.

    Usage:
        sync = CloudSyncService()
        if sync.is_configured:
            result = sync.push_unsynced()
    """

    # ── Settings ──────────────────────────────────────────────────────────────

    def get_setting(self, key: str, default: Optional[str] = None) -> Optional[str]:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT value FROM app_settings WHERE key = ?", (key,)
            ).fetchone()
        return row["value"] if row else default

    def set_setting(self, key: str, value: str) -> None:
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO app_settings(key, value) VALUES(?, ?)"
                " ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, value),
            )

    def ensure_anonymous_id(self) -> str:
        """Return the anonymous_id, generating one on first call."""
        anon_id = self.get_setting(_KEY_ANON_ID)
        if not anon_id:
            anon_id = str(uuid.uuid4())
            self.set_setting(_KEY_ANON_ID, anon_id)
            print(f"   🔑 Generated anonymous_id: {anon_id}")
        return anon_id

    def configure(self, cloud_url: str, auth_token: str) -> None:
        """Save cloud API credentials to local settings."""
        self.set_setting(_KEY_CLOUD_URL, cloud_url.rstrip("/"))
        self.set_setting(_KEY_AUTH_TOKEN, auth_token)
        self.set_setting(_KEY_SYNC_ON, "true")
        print(f"   ☁️  Cloud sync configured → {cloud_url}")

    def disable(self) -> None:
        """Disable cloud sync (keeps credentials, just stops syncing)."""
        self.set_setting(_KEY_SYNC_ON, "false")

    @property
    def is_configured(self) -> bool:
        """True if cloud URL + auth token are set and sync is enabled."""
        return (
            self.get_setting(_KEY_SYNC_ON) == "true"
            and bool(self.get_setting(_KEY_CLOUD_URL))
            and bool(self.get_setting(_KEY_AUTH_TOKEN))
        )

    @property
    def anonymous_id(self) -> str:
        return self.ensure_anonymous_id()

    # ── Sync ──────────────────────────────────────────────────────────────────

    def push_unsynced(self) -> dict:
        """
        Find all completed sessions not yet synced and push them to the cloud.
        Returns a summary dict with accepted/skipped/failed counts.
        """
        if not self.is_configured:
            return {"status": "skipped", "reason": "sync not configured"}

        cloud_url = self.get_setting(_KEY_CLOUD_URL)
        auth_token = self.get_setting(_KEY_AUTH_TOKEN)
        anon_id = self.ensure_anonymous_id()

        # Fetch all unsynced, completed sessions
        with get_connection() as conn:
            rows = conn.execute(
                """
                SELECT session_id, started_at,
                       avg_score, max_score, overload_count,
                       flow_seconds, friction_seconds,
                       fatigue_seconds, overload_seconds, snapshot_count
                FROM sessions
                WHERE ended_at IS NOT NULL
                  AND synced_to_cloud = 0
                  AND snapshot_count > 0
                ORDER BY started_at
                """,
            ).fetchall()

        if not rows:
            return {"status": "ok", "accepted": 0, "message": "Nothing to sync"}

        accepted = 0
        failed = 0

        for row in rows:
            session_date = _parse_date(row["started_at"])
            payload = {
                "anonymous_user_id": anon_id,
                "session_id": row["session_id"],
                "session_date": session_date,
                "avg_score": row["avg_score"] or 0.0,
                "max_score": row["max_score"] or 0.0,
                "overload_count": row["overload_count"] or 0,
                "flow_seconds": row["flow_seconds"] or 0.0,
                "friction_seconds": row["friction_seconds"] or 0.0,
                "fatigue_seconds": row["fatigue_seconds"] or 0.0,
                "overload_seconds": row["overload_seconds"] or 0.0,
                "snapshot_count": row["snapshot_count"] or 0,
            }

            ok = self._post(
                f"{cloud_url}/sync/session",
                payload,
                auth_token,
            )

            if ok:
                accepted += 1
                with get_connection() as conn:
                    conn.execute(
                        "UPDATE sessions SET synced_to_cloud = 1 WHERE session_id = ?",
                        (row["session_id"],),
                    )
            else:
                failed += 1

        print(
            f"   ☁️  Sync complete — accepted: {accepted}, failed: {failed}"
        )
        return {"status": "ok", "accepted": accepted, "failed": failed}

    # ── HTTP helper (using stdlib only) ───────────────────────────────────────

    def _post(self, url: str, body: dict, token: str) -> bool:
        """POST JSON to the cloud API. Returns True on success."""
        data = _json.dumps(body).encode("utf-8")
        req = Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
            method="POST",
        )
        try:
            with urlopen(req, timeout=10) as resp:
                return resp.status in (200, 201)
        except HTTPError as e:
            print(f"[ZenNode Sync] ⚠️  HTTP {e.code} from {url}: {e.reason}")
            return False
        except URLError as e:
            print(f"[ZenNode Sync] ⚠️  Cannot reach cloud API: {e.reason}")
            return False


def _parse_date(iso_str: str) -> str:
    """Extract YYYY-MM-DD from an ISO 8601 datetime string."""
    try:
        return datetime.fromisoformat(iso_str).date().isoformat()
    except (ValueError, TypeError):
        return datetime.now(timezone.utc).date().isoformat()
