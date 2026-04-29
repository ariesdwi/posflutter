"""
utils/ngrok_server.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Ngrok Local File Server

Menjalankan HTTP server lokal untuk serving file dari data/assets/,
lalu expose via ngrok agar dapat URL publik sementara.
Digunakan untuk posting carousel ke Instagram Graph API
(yang hanya menerima URL publik, bukan file lokal).

Penggunaan:
    from utils.ngrok_server import NgrokFileServer

    with NgrokFileServer() as srv:
        public_url = srv.public_url
        file_url = srv.url_for("instagram/0C9F634D/1.png")
        # → https://xxxx.ngrok-free.app/instagram/0C9F634D/1.png
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import subprocess
import threading
import time
import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Optional

import requests

from utils.logger import setup_logger

logger = setup_logger()

ASSETS_DIR = Path("data/assets")
DEFAULT_PORT = 18765


class _SilentHandler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler tanpa output log ke stderr."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ASSETS_DIR.resolve()), **kwargs)

    def log_message(self, format, *args):  # noqa: A002
        pass  # silent


class NgrokFileServer:
    """
    Context manager yang menjalankan local HTTP server + ngrok tunnel.

    Contoh:
        with NgrokFileServer(port=18765) as srv:
            url = srv.url_for("instagram/0C9F634D/1.png")
    """

    def __init__(self, port: int = DEFAULT_PORT):
        self.port = port
        self.public_url: Optional[str] = None
        self._httpd: Optional[HTTPServer] = None
        self._thread: Optional[threading.Thread] = None
        self._ngrok_proc: Optional[subprocess.Popen] = None

    # ── Context manager ────────────────────────────────────

    def __enter__(self) -> "NgrokFileServer":
        self.start()
        return self

    def __exit__(self, *_):
        self.stop()

    # ── Lifecycle ──────────────────────────────────────────

    def start(self) -> str:
        """Start HTTP server dan ngrok tunnel. Return public base URL."""
        ASSETS_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Start local HTTP server in background thread
        self._httpd = HTTPServer(("0.0.0.0", self.port), _SilentHandler)
        self._thread = threading.Thread(target=self._httpd.serve_forever, daemon=True)
        self._thread.start()
        logger.info(f"Local file server started on port {self.port}")

        # 2. Start ngrok
        self._ngrok_proc = subprocess.Popen(
            ["ngrok", "http", str(self.port), "--log=stderr", "--log-format=json"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )

        # 3. Poll ngrok API until tunnel is ready (max 15s)
        self.public_url = self._wait_for_tunnel(timeout=15)
        if not self.public_url:
            self.stop()
            raise RuntimeError(
                "ngrok tunnel tidak bisa dimulai dalam 15 detik.\n"
                "Pastikan ngrok sudah di-autentikasi: ngrok config add-authtoken <token>\n"
                "Daftar gratis di https://ngrok.com"
            )

        logger.info(f"ngrok tunnel ready: {self.public_url}")
        return self.public_url

    def stop(self):
        """Hentikan ngrok dan HTTP server."""
        if self._httpd:
            self._httpd.shutdown()
            self._httpd = None
        if self._ngrok_proc:
            self._ngrok_proc.terminate()
            try:
                self._ngrok_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._ngrok_proc.kill()
            self._ngrok_proc = None
        logger.info("ngrok tunnel dan file server dihentikan")

    # ── URL helpers ────────────────────────────────────────

    def url_for(self, relative_path: str) -> str:
        """
        Konversi relative path (dari data/assets/) ke public URL.

        Contoh:
            srv.url_for("instagram/0C9F634D/1.png")
            → "https://xxxx.ngrok-free.app/instagram/0C9F634D/1.png"
        """
        if not self.public_url:
            raise RuntimeError("Server belum dimulai. Gunakan sebagai context manager.")
        relative_path = relative_path.lstrip("/")
        return f"{self.public_url}/{relative_path}"

    def local_path_to_url(self, local_path: str) -> str:
        """
        Konversi absolute/relative local path ke public URL.

        Contoh:
            srv.local_path_to_url("data/assets/instagram/0C9F634D/1.png")
            → "https://xxxx.ngrok-free.app/instagram/0C9F634D/1.png"
        """
        p = Path(local_path).resolve()
        assets_abs = ASSETS_DIR.resolve()
        try:
            rel = p.relative_to(assets_abs)
        except ValueError:
            raise ValueError(
                f"Path '{local_path}' bukan di dalam {ASSETS_DIR}. "
                "Pastikan gambar ada di data/assets/."
            )
        return self.url_for(str(rel))

    # ── Internal ───────────────────────────────────────────

    def _wait_for_tunnel(self, timeout: int = 15) -> Optional[str]:
        """Poll ngrok local API sampai tunnel tersedia."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                resp = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
                tunnels = resp.json().get("tunnels", [])
                for t in tunnels:
                    url = t.get("public_url", "")
                    if url.startswith("https://"):
                        return url.rstrip("/")
            except Exception:
                pass
            time.sleep(0.5)
        return None
