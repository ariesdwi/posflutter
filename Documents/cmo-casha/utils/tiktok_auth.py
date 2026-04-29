"""
utils/tiktok_auth.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – TikTok OAuth 2.0 Helper

Flow:
  1. python utils/tiktok_auth.py url      → cetak authorization URL
  2. User buka URL, approve, copy ?code=XX dari callback
  3. python utils/tiktok_auth.py exchange <code>  → print access_token + open_id
  4. Simpan TIKTOK_ACCESS_TOKEN + TIKTOK_OPEN_ID ke .env

Env yang dibutuhkan:
  TIKTOK_CLIENT_KEY     – Client Key dari TikTok Developer Portal
  TIKTOK_CLIENT_SECRET  – Client Secret
  TIKTOK_REDIRECT_URI   – Redirect URI yang sudah didaftarkan di app
                          (untuk local test bisa pakai https://localhost/callback)
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import hashlib
import os
import secrets
import sys
import urllib.parse

import requests

_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize"
_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
_REVOKE_URL = "https://open.tiktokapis.com/v2/oauth/revoke/"

# Scopes yang dibutuhkan untuk Content Posting API
_REQUIRED_SCOPES = "user.info.basic,video.publish,video.upload"


def _env(key: str, required: bool = True) -> str:
    val = os.getenv(key, "").strip()
    if required and not val:
        sys.exit(f"[ERROR] {key} belum diset di .env")
    return val


def generate_auth_url(state: str | None = None) -> tuple[str, str]:
    """Return (authorization_url, code_verifier) untuk PKCE flow."""
    client_key = _env("TIKTOK_CLIENT_KEY")
    redirect_uri = _env("TIKTOK_REDIRECT_URI")

    code_verifier = secrets.token_urlsafe(64)
    code_challenge = (
        hashlib.sha256(code_verifier.encode()).digest().hex()
    )

    if state is None:
        state = secrets.token_urlsafe(16)

    params = {
        "client_key": client_key,
        "response_type": "code",
        "scope": _REQUIRED_SCOPES,
        "redirect_uri": redirect_uri,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    url = f"{_AUTH_BASE}?{urllib.parse.urlencode(params)}"
    return url, code_verifier


def exchange_code_for_token(code: str, code_verifier: str) -> dict:
    """Tukar authorization code dengan access_token + open_id."""
    client_key = _env("TIKTOK_CLIENT_KEY")
    client_secret = _env("TIKTOK_CLIENT_SECRET")
    redirect_uri = _env("TIKTOK_REDIRECT_URI")

    resp = requests.post(
        _TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "client_key": client_key,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
            "code_verifier": code_verifier,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def refresh_access_token(refresh_token: str) -> dict:
    """Refresh access token yang sudah expired (lifetime 24 jam)."""
    client_key = _env("TIKTOK_CLIENT_KEY")
    client_secret = _env("TIKTOK_CLIENT_SECRET")

    resp = requests.post(
        _TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "client_key": client_key,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def get_user_info(access_token: str) -> dict:
    """Ambil info akun TikTok (username, avatar, dll)."""
    resp = requests.get(
        "https://open.tiktokapis.com/v2/user/info/",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"fields": "open_id,union_id,avatar_url,display_name,username"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


# ── CLI helper ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json
    try:
        from dotenv import load_dotenv as _load_dotenv
        _load_dotenv()
    except ImportError:
        pass

    cmd = sys.argv[1] if len(sys.argv) > 1 else "url"

    if cmd == "url":
        url, verifier = generate_auth_url()
        print("\n=== Buka URL ini di browser (login dengan akun TikTok) ===")
        print(url)
        print(f"\nSimon code_verifier ini (dibutuhkan saat exchange):\n{verifier}")
        print("\nSetelah approve, copy nilai ?code=... dari URL redirect dan jalankan:")
        print("  python utils/tiktok_auth.py exchange <code> <code_verifier>")

    elif cmd == "exchange":
        if len(sys.argv) < 4:
            sys.exit("Usage: python utils/tiktok_auth.py exchange <code> <code_verifier>")
        code = sys.argv[2]
        verifier = sys.argv[3]
        result = exchange_code_for_token(code, verifier)
        print("\n=== Token Response ===")
        print(json.dumps(result, indent=2))
        data = result.get("data", result)
        at = data.get("access_token", "")
        rt = data.get("refresh_token", "")
        oid = data.get("open_id", "")
        if at:
            print("\n=== Tambahkan ke .env ===")
            print(f"TIKTOK_ACCESS_TOKEN={at}")
            print(f"TIKTOK_REFRESH_TOKEN={rt}")
            print(f"TIKTOK_OPEN_ID={oid}")

    elif cmd == "refresh":
        if len(sys.argv) < 3:
            rt = _env("TIKTOK_REFRESH_TOKEN")
        else:
            rt = sys.argv[2]
        result = refresh_access_token(rt)
        print(json.dumps(result, indent=2))

    elif cmd == "whoami":
        at = _env("TIKTOK_ACCESS_TOKEN")
        result = get_user_info(at)
        print(json.dumps(result, indent=2))

    else:
        print("Commands: url | exchange <code> <verifier> | refresh [token] | whoami")
