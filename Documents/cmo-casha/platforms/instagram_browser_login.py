"""
platforms/instagram_browser_login.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Instagram Browser Login

Buka browser Chromium, user login Instagram secara manual (seperti biasa),
lalu cookies diextract dan diconvert ke session instagrapi.

Keuntungan:
  - Login via browser asli → tidak kena IP blacklist
  - User bisa handle 2FA / challenge secara visual
  - Session disimpan untuk dipakai instagrapi posting
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Optional

from rich.console import Console
from rich.panel import Panel

from utils.logger import setup_logger

console = Console()
logger = setup_logger()

SESSION_PATH = Path("data/auth/instagrapi_session.json")
BROWSER_STATE_PATH = Path("data/auth/browser_state.json")


def browser_login(username: Optional[str] = None, headless: bool = False) -> dict:
    """
    Buka browser Chromium untuk login Instagram secara manual.
    Setelah user berhasil login, extract cookies dan simpan session.
    
    Returns:
        dict dengan session info
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise ImportError(
            "Playwright belum terinstall.\n"
            "Jalankan: pip install playwright && python -m playwright install chromium"
        )

    SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
    BROWSER_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

    console.print(Panel(
        "[bold #2E7D32]🌐 Browser Login Instagram[/bold #2E7D32]\n\n"
        "[dim]1. Browser Chromium akan terbuka\n"
        "2. Login ke Instagram dengan username & password\n"
        "3. Selesaikan verifikasi jika diminta (2FA, challenge, dll)\n"
        "4. Pastikan kamu sudah masuk ke halaman home/feed\n"
        "5. Sistem akan otomatis mendeteksi login berhasil[/dim]\n\n"
        "[yellow]⚠ Jangan tutup browser sampai muncul pesan 'Login berhasil'![/yellow]",
        border_style="#2E7D32",
        padding=(1, 2),
    ))

    with sync_playwright() as p:
        # Launch browser VISIBLE (bukan headless) agar user bisa login
        browser = p.chromium.launch(
            headless=headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
            ],
        )

        # Buat context — JANGAN load state lama (supaya fresh login)
        context = browser.new_context(
            viewport={"width": 430, "height": 932},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            locale="id-ID",
        )

        page = context.new_page()

        # Navigate ke halaman login Instagram
        console.print("\n[dim]🔄 Membuka Instagram...[/dim]")
        page.goto("https://www.instagram.com/accounts/login/", 
                   wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # Handle cookie consent popup jika ada
        try:
            accept_btn = page.query_selector('button:has-text("Allow")')
            if not accept_btn:
                accept_btn = page.query_selector('button:has-text("Izinkan")')
            if not accept_btn:
                accept_btn = page.query_selector('button:has-text("Accept")')
            if accept_btn:
                accept_btn.click()
                time.sleep(1)
        except Exception:
            pass

        # Pre-fill username jika tersedia
        if username:
            try:
                time.sleep(1)
                username_input = page.query_selector('input[name="username"]')
                if username_input:
                    username_input.fill(username)
                    console.print(f"[dim]📝 Username @{username} sudah diisi otomatis[/dim]")
            except Exception:
                pass

        # Cek apakah sudah ada sessionid (mungkin dari cookies sebelumnya)
        session_id = _get_sessionid(context)
        if session_id:
            console.print("[green]✓ Kamu sudah login![/green]")
        else:
            console.print(
                "\n[bold yellow]👆 Silakan login di browser yang terbuka![/bold yellow]\n"
                "[dim]Masukkan username & password, selesaikan verifikasi jika diminta.[/dim]"
            )

            # Tunggu sampai sessionid cookie muncul (bukti login berhasil)
            console.print("[dim]⏳ Menunggu login berhasil (max 5 menit)...[/dim]")
            timeout = 300  # 5 menit
            start = time.time()
            while time.time() - start < timeout:
                session_id = _get_sessionid(context)
                if session_id:
                    console.print("\n[green]✓ Login berhasil terdeteksi![/green]")
                    break
                time.sleep(2)
            else:
                console.print("[red]✗ Timeout: login tidak selesai dalam 5 menit[/red]")
                browser.close()
                raise TimeoutError("Login timeout setelah 5 menit")

        # Tunggu sebentar untuk semua cookies ter-set
        time.sleep(3)

        # Ambil sessionid dan semua cookies
        session_id = _get_sessionid(context)
        all_cookies = context.cookies()
        ig_cookies = [c for c in all_cookies if "instagram" in c.get("domain", "")]

        console.print(f"[dim]📦 Ditemukan {len(ig_cookies)} cookies Instagram[/dim]")

        # Simpan browser state
        context.storage_state(path=str(BROWSER_STATE_PATH))
        console.print("[dim]💾 Browser state disimpan[/dim]")

        # Sekarang login ke instagrapi pakai sessionid (TANPA username/password!)
        result = _login_instagrapi_by_sessionid(session_id, ig_cookies)

        input("\n📱 Tekan ENTER untuk menutup browser...")
        browser.close()

    return result


def _get_sessionid(context) -> Optional[str]:
    """Extract sessionid dari browser cookies."""
    try:
        cookies = context.cookies("https://www.instagram.com")
        for c in cookies:
            if c["name"] == "sessionid" and c["value"]:
                return c["value"]
    except Exception:
        pass
    return None


def _login_instagrapi_by_sessionid(session_id: str, ig_cookies: list) -> dict:
    """Login ke instagrapi menggunakan sessionid dari browser (tanpa password!)."""
    try:
        from instagrapi import Client
    except ImportError:
        raise ImportError("Install instagrapi: pip install instagrapi")

    console.print("[dim]🔄 Menghubungkan session ke instagrapi...[/dim]")
    
    cl = Client()
    cl.delay_range = [2, 5]

    try:
        # Login pakai sessionid — TIDAK perlu username/password
        cl.login_by_sessionid(session_id)
        
        # Test: ambil info akun
        user_info = cl.account_info()
        ig_username = user_info.username
        
        # Simpan session
        cl.dump_settings(SESSION_PATH)
        
        console.print(Panel(
            f"[bold green]✓ Login Instagram berhasil![/bold green]\n\n"
            f"[dim]Username  :[/dim] [bold]@{ig_username}[/bold]\n"
            f"[dim]User ID   :[/dim] {user_info.pk}\n"
            f"[dim]Session   :[/dim] {SESSION_PATH}\n\n"
            "[dim]Session tersimpan. Posting bisa dilakukan tanpa login ulang.[/dim]",
            border_style="green",
            padding=(1, 2),
        ))
        
        logger.info(f"Instagram browser login berhasil: @{ig_username}")
        
        return {
            "session_path": str(SESSION_PATH),
            "username": ig_username,
            "user_id": str(user_info.pk),
            "method": "browser_sessionid",
        }
    except Exception as e:
        console.print(f"[red]✗ Gagal menghubungkan session ke instagrapi:[/red] {e}")
        
        # Fallback: simpan session manual dari cookies
        console.print("[dim]💾 Menyimpan cookies sebagai fallback...[/dim]")
        _save_cookies_as_session(session_id, ig_cookies)
        
        return {
            "session_path": str(SESSION_PATH),
            "method": "browser_cookies_fallback",
            "error": str(e),
        }


def _save_cookies_as_session(session_id: str, ig_cookies: list) -> None:
    """Simpan cookies browser sebagai session instagrapi format."""
    import uuid
    import secrets

    session = {
        "uuids": {
            "phone_id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "client_session_id": str(uuid.uuid4()),
            "advertising_id": str(uuid.uuid4()),
            "android_device_id": f"android-{secrets.token_hex(8)}",
        },
        "cookies": {},
        "last_login": time.time(),
        "device_settings": {
            "app_version": "269.0.0.18.75",
            "android_version": 31,
            "android_release": "12.0",
            "dpi": "440dpi",
            "resolution": "1080x2340",
            "manufacturer": "Samsung",
            "device": "SM-G991B",
            "model": "samsung",
            "cpu": "exynos2100",
            "version_code": "314665256",
        },
        "user_agent": (
            "Instagram 269.0.0.18.75 Android (31/12.0; 440dpi; 1080x2340; "
            "Samsung; SM-G991B; samsung; exynos2100; id_ID; 314665256)"
        ),
    }

    # Tambahkan semua IG cookies
    for c in ig_cookies:
        session["cookies"][c["name"]] = c["value"]

    # Pastikan sessionid ada
    session["cookies"]["sessionid"] = session_id

    with open(SESSION_PATH, "w", encoding="utf-8") as f:
        json.dump(session, f, indent=2)
    
    console.print(f"[green]✓ Session disimpan ke {SESSION_PATH}[/green]")


if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    load_dotenv()
    username = os.getenv("INSTAGRAM_USERNAME")
    result = browser_login(username=username)
    print(f"\nResult: {result}")
