"""
platforms/instagram_oauth.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Instagram OAuth (Facebook Login)

Flow OAuth untuk Instagram Graph API:
  1. Terminal membuka browser ke halaman Facebook Login.
  2. User login + approve scope di web.
  3. Facebook redirect ke http://localhost:8765/callback?code=...
  4. Local HTTP server menerima code, tukar jadi long-lived token.
  5. Token & IG Business Account ID disimpan ke
     data/auth/instagram.json (dan diexport ke env runtime).

Scope yang diminta:
  - instagram_basic
  - instagram_content_publish
  - pages_show_list
  - pages_read_engagement
  - business_management

Prasyarat (.env):
  FACEBOOK_APP_ID=...
  FACEBOOK_APP_SECRET=...
  OAUTH_REDIRECT_URI=http://localhost:8765/callback   # opsional
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import json
import os
import secrets
import threading
import time
import webbrowser
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlencode, urlparse

from rich.console import Console
from rich.panel import Panel

from utils.logger import setup_logger

console = Console()
logger = setup_logger()

GRAPH_VERSION = "v19.0"
DEFAULT_REDIRECT = "http://localhost:8765/callback"
SCOPES = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
]
TOKEN_PATH = Path("data/auth/instagram.json")


# ── Local callback HTTP server ─────────────────────────────────

class _OAuthCallbackHandler(BaseHTTPRequestHandler):
    """Handler satu-kali untuk menerima redirect dari Facebook."""

    server_version = "CashaOAuth/1.0"

    def do_GET(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path != "/callback":
            self.send_response(404)
            self.end_headers()
            return

        params = parse_qs(parsed.query)
        self.server.oauth_result = {  # type: ignore[attr-defined]
            "code": (params.get("code") or [None])[0],
            "state": (params.get("state") or [None])[0],
            "error": (params.get("error_description") or params.get("error") or [None])[0],
        }

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        html = _render_success_page(
            error=self.server.oauth_result["error"],  # type: ignore[attr-defined]
        )
        self.wfile.write(html.encode("utf-8"))

    def log_message(self, format, *args):  # noqa: A002
        # Diam saja supaya tidak mengotori output terminal.
        return


def _render_success_page(error: Optional[str]) -> str:
    if error:
        title = "Gagal menghubungkan Instagram"
        body = f"<p style='color:#F44336'>{error}</p>"
        badge_color = "#F44336"
    else:
        title = "Berhasil terhubung!"
        body = (
            "<p>Instagram kamu sudah terhubung ke Casha CMO.</p>"
            "<p style='color:#757575'>Tab ini boleh ditutup. "
            "Kembali ke terminal untuk melanjutkan.</p>"
        )
        badge_color = "#2E7D32"

    return f"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>Casha · Instagram Auth</title>
<style>
  body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
       background:#EFF0F1;color:#212121;display:flex;align-items:center;
       justify-content:center;min-height:100vh;margin:0}}
  .card{{background:#fff;padding:40px 48px;border-radius:16px;
        box-shadow:0 8px 32px rgba(0,0,0,.08);max-width:480px;text-align:center}}
  .badge{{width:64px;height:64px;border-radius:50%;background:{badge_color};
         color:#fff;display:inline-flex;align-items:center;justify-content:center;
         font-size:32px;margin-bottom:16px}}
  h1{{margin:0 0 12px;font-size:22px}} p{{line-height:1.6}}
</style></head>
<body><div class="card">
  <div class="badge">{'✕' if error else '✓'}</div>
  <h1>{title}</h1>{body}
</div></body></html>"""


# ── Main OAuth class ───────────────────────────────────────────

class InstagramOAuth:
    """
    Manage Facebook Login OAuth untuk Instagram Graph API.

    Pemakaian:
        oauth = InstagramOAuth()
        token_info = oauth.ensure_token()   # login jika perlu, else load cache
        access_token = token_info["access_token"]
        ig_user_id   = token_info["ig_user_id"]
    """

    def __init__(
        self,
        app_id: Optional[str] = None,
        app_secret: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        token_path: Path = TOKEN_PATH,
    ):
        self.app_id = app_id or os.getenv("FACEBOOK_APP_ID")
        self.app_secret = app_secret or os.getenv("FACEBOOK_APP_SECRET")
        self.redirect_uri = redirect_uri or os.getenv(
            "OAUTH_REDIRECT_URI", DEFAULT_REDIRECT
        )
        self.token_path = token_path
        self.token_path.parent.mkdir(parents=True, exist_ok=True)

    # ── Public API ──────────────────────────────────────────

    def ensure_token(self, force: bool = False, interactive: bool = True) -> Dict[str, Any]:
        """
        Pastikan ada token yang valid. Jika tidak/expired → trigger OAuth.
        """
        cached = self.load_cached()
        if cached and not force and self._is_valid(cached):
            return cached

        if not interactive:
            raise RuntimeError(
                "Instagram belum terhubung. Jalankan: python main.py auth instagram"
            )

        if not self.app_id or not self.app_secret:
            raise RuntimeError(
                "FACEBOOK_APP_ID / FACEBOOK_APP_SECRET belum diset di .env. "
                "Buat Facebook App di https://developers.facebook.com/apps/, "
                "aktifkan produk 'Facebook Login' & 'Instagram Graph API', "
                "lalu isi .env dengan App ID & Secret."
            )

        return self._run_oauth_flow()

    def load_cached(self) -> Optional[Dict[str, Any]]:
        if not self.token_path.exists():
            return None
        try:
            with open(self.token_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            logger.warning(f"Token cache tidak bisa dibaca: {e}")
            return None

    def logout(self) -> None:
        """Hapus token cache lokal."""
        if self.token_path.exists():
            self.token_path.unlink()
            console.print("[yellow]✓ Token Instagram dihapus dari cache lokal[/yellow]")

    # ── Internal flow ───────────────────────────────────────

    def _run_oauth_flow(self) -> Dict[str, Any]:
        import requests

        state = secrets.token_urlsafe(24)
        auth_url = self._build_authorize_url(state)

        # Parse host/port dari redirect_uri untuk binding local server.
        parsed = urlparse(self.redirect_uri)
        host = parsed.hostname or "localhost"
        port = parsed.port or 8765

        server = HTTPServer((host, port), _OAuthCallbackHandler)
        server.oauth_result = None  # type: ignore[attr-defined]
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        console.print(Panel(
            "[bold #2E7D32]🔐 Menghubungkan Instagram lewat Facebook Login[/bold #2E7D32]\n\n"
            "[dim]1. Browser akan terbuka otomatis.\n"
            "2. Login dengan akun Facebook yang mengelola IG Business/Creator.\n"
            "3. Approve semua permission yang diminta.\n"
            "4. Tab akan otomatis tertutup, kembali ke terminal ini.[/dim]\n\n"
            f"[dim]Jika browser tidak terbuka, paste link ini manual:[/dim]\n"
            f"[underline]{auth_url}[/underline]",
            border_style="#2E7D32",
            padding=(1, 2),
        ))

        try:
            webbrowser.open(auth_url, new=2)
        except Exception as e:
            logger.warning(f"Tidak bisa buka browser otomatis: {e}")

        # Tunggu callback (timeout 5 menit).
        console.print("\n[dim]⏳ Menunggu user menyelesaikan login di browser...[/dim]")
        deadline = time.time() + 300
        result = None
        while time.time() < deadline:
            if server.oauth_result is not None:  # type: ignore[attr-defined]
                result = server.oauth_result  # type: ignore[attr-defined]
                break
            time.sleep(0.5)

        server.shutdown()
        server.server_close()

        if result is None:
            raise TimeoutError("OAuth timeout: tidak ada callback dalam 5 menit.")
        if result.get("error"):
            raise RuntimeError(f"OAuth error dari Facebook: {result['error']}")
        if result.get("state") != state:
            raise RuntimeError("State mismatch – kemungkinan CSRF. Ulangi login.")

        code = result.get("code")
        if not code:
            raise RuntimeError("OAuth callback tidak berisi 'code'.")

        console.print("[green]✓ Code diterima, menukar dengan access token...[/green]")

        # Step 1: code → short-lived token
        short_token = self._exchange_code_for_token(code)

        # Step 2: short → long-lived token (~60 hari)
        long_token, expires_in = self._exchange_for_long_lived(short_token)

        # Step 3: ambil IG Business Account ID
        ig_user_id, page_id, ig_username = self._resolve_ig_business_account(long_token)

        token_info = {
            "access_token": long_token,
            "ig_user_id": ig_user_id,
            "page_id": page_id,
            "ig_username": ig_username,
            "obtained_at": datetime.utcnow().isoformat() + "Z",
            "expires_at": (
                datetime.utcnow() + timedelta(seconds=expires_in)
            ).isoformat() + "Z",
            "scopes": SCOPES,
        }

        self._save(token_info)
        self._apply_to_env(token_info)

        console.print(Panel(
            f"[bold green]✓ Instagram terhubung![/bold green]\n\n"
            f"[dim]Username     :[/dim] [bold]@{ig_username or '—'}[/bold]\n"
            f"[dim]IG User ID   :[/dim] {ig_user_id}\n"
            f"[dim]Page ID      :[/dim] {page_id}\n"
            f"[dim]Token expires:[/dim] {token_info['expires_at']}\n"
            f"[dim]Disimpan ke  :[/dim] {self.token_path}",
            border_style="green",
            padding=(1, 2),
        ))

        return token_info

    def _build_authorize_url(self, state: str) -> str:
        params = {
            "client_id": self.app_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": ",".join(SCOPES),
            "response_type": "code",
        }
        return f"https://www.facebook.com/{GRAPH_VERSION}/dialog/oauth?{urlencode(params)}"

    def _exchange_code_for_token(self, code: str) -> str:
        import requests
        r = requests.get(
            f"https://graph.facebook.com/{GRAPH_VERSION}/oauth/access_token",
            params={
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "redirect_uri": self.redirect_uri,
                "code": code,
            },
            timeout=30,
        )
        r.raise_for_status()
        return r.json()["access_token"]

    def _exchange_for_long_lived(self, short_token: str) -> tuple[str, int]:
        import requests
        r = requests.get(
            f"https://graph.facebook.com/{GRAPH_VERSION}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "fb_exchange_token": short_token,
            },
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        # expires_in kadang tidak dikirim untuk long-lived → default 60 hari.
        return data["access_token"], int(data.get("expires_in", 60 * 24 * 3600))

    def _resolve_ig_business_account(
        self, access_token: str
    ) -> tuple[str, str, Optional[str]]:
        """
        Ambil Page pertama yang punya linked IG Business Account.
        Jika ada beberapa, user diminta memilih via terminal.
        """
        import requests
        pages = requests.get(
            f"https://graph.facebook.com/{GRAPH_VERSION}/me/accounts",
            params={"access_token": access_token, "fields": "id,name,instagram_business_account"},
            timeout=30,
        ).json().get("data", [])

        candidates = [p for p in pages if p.get("instagram_business_account")]
        if not candidates:
            raise RuntimeError(
                "Tidak ditemukan Facebook Page yang terhubung ke IG Business/Creator account. "
                "Pastikan akun IG sudah dikonversi ke Business/Creator dan terhubung ke Page."
            )

        if len(candidates) == 1:
            chosen = candidates[0]
        else:
            console.print("\n[bold]Pilih Page yang akan digunakan:[/bold]")
            for i, p in enumerate(candidates, 1):
                console.print(f"  [cyan]{i}[/cyan]. {p['name']} (Page ID: {p['id']})")
            while True:
                raw = console.input("Nomor > ").strip()
                if raw.isdigit() and 1 <= int(raw) <= len(candidates):
                    chosen = candidates[int(raw) - 1]
                    break
                console.print("[red]Input tidak valid, coba lagi.[/red]")

        ig_id = chosen["instagram_business_account"]["id"]

        # Ambil username IG
        ig_meta = requests.get(
            f"https://graph.facebook.com/{GRAPH_VERSION}/{ig_id}",
            params={"fields": "username", "access_token": access_token},
            timeout=30,
        ).json()

        return ig_id, chosen["id"], ig_meta.get("username")

    # ── Persistence ─────────────────────────────────────────

    def _save(self, token_info: Dict[str, Any]) -> None:
        with open(self.token_path, "w", encoding="utf-8") as f:
            json.dump(token_info, f, indent=2)
        try:
            os.chmod(self.token_path, 0o600)
        except OSError:
            pass

    @staticmethod
    def _apply_to_env(token_info: Dict[str, Any]) -> None:
        """Export ke environment proses saat ini agar langsung dipakai InstagramPoster."""
        os.environ["META_ACCESS_TOKEN"] = token_info["access_token"]
        os.environ["INSTAGRAM_BUSINESS_ACCOUNT_ID"] = token_info["ig_user_id"]
        if token_info.get("page_id"):
            os.environ["META_PAGE_ID"] = token_info["page_id"]

    @staticmethod
    def _is_valid(token_info: Dict[str, Any]) -> bool:
        exp = token_info.get("expires_at")
        if not exp:
            return False
        try:
            expires = datetime.fromisoformat(exp.rstrip("Z"))
        except ValueError:
            return False
        # Buffer 1 hari: refresh sebelum benar-benar expired.
        return expires > datetime.utcnow() + timedelta(days=1)
