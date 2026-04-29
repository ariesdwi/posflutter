"""
utils/setup_wizard.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Setup Wizard
Panduan interaktif untuk konfigurasi awal sistem.
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import os
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

console = Console()


class SetupWizard:
    """Setup wizard interaktif untuk Casha AI CMO."""

    def __init__(self):
        self.env_path = Path(".env")

    def run(self) -> None:
        """Jalankan setup wizard."""
        console.print(Panel(
            "[bold #2E7D32]⚙️  Casha AI CMO – Setup Wizard[/bold #2E7D32]\n\n"
            "[dim]Wizard ini akan membantu Anda mengonfigurasi sistem.\n"
            "Semua credentials disimpan di file [bold].env[/bold] (tidak di-commit ke Git).[/dim]",
            border_style="#2E7D32",
            padding=(1, 2),
        ))
        console.print()

        self._check_openai()
        self._check_platforms()
        self._check_config_yaml()
        self._show_summary()

    def _check_openai(self) -> None:
        """Validasi OpenAI API key."""
        console.print("[bold]1️⃣  OpenAI API Key[/bold]")
        key = os.getenv("OPENAI_API_KEY", "")
        
        if key and key.startswith("sk-"):
            console.print("  [green]✓[/green] OPENAI_API_KEY sudah dikonfigurasi")
            try:
                from openai import OpenAI
                client = OpenAI(api_key=key)
                models = client.models.list()
                console.print("  [green]✓[/green] Koneksi ke OpenAI berhasil!")
            except Exception as e:
                console.print(f"  [red]✗[/red] Gagal koneksi OpenAI: {str(e)[:80]}")
        else:
            console.print("  [yellow]⚠[/yellow]  OPENAI_API_KEY belum dikonfigurasi")
            console.print("  → Tambahkan ke file [bold].env[/bold]: OPENAI_API_KEY=sk-...")
        console.print()

    def _check_platforms(self) -> None:
        """Cek status konfigurasi platform."""
        console.print("[bold]2️⃣  Platform API Status[/bold]")
        
        table = Table(box=box.SIMPLE_HEAVY, show_header=True, header_style="bold")
        table.add_column("Platform", width=12)
        table.add_column("Status", width=12)
        table.add_column("Konfigurasi Yang Dibutuhkan")

        platforms = {
            "Instagram": {
                "check": ["META_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"],
                "alt": "atau INSTAGRAM_USERNAME + INSTAGRAM_PASSWORD (instagrapi)",
            },
            "TikTok": {
                "check": ["TIKTOK_SESSION_ID"],
                "alt": "TIKTOK_MS_TOKEN (opsional)",
            },
            "LinkedIn": {
                "check": ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_ORGANIZATION_ID"],
                "alt": "",
            },
        }

        for plat, info in platforms.items():
            configured = all(os.getenv(k) for k in info["check"])
            status = "[green]✓ Aktif[/green]" if configured else "[yellow]⏳ Belum[/yellow]"
            req = " + ".join(info["check"])
            if info["alt"]:
                req += f"\n  [dim]{info['alt']}[/dim]"
            table.add_row(plat, status, req)

        console.print(table)
        console.print()

    def _check_config_yaml(self) -> None:
        """Validasi config.yaml."""
        console.print("[bold]3️⃣  Konfigurasi Sistem[/bold]")
        
        config_path = Path("config.yaml")
        if config_path.exists():
            console.print(f"  [green]✓[/green] config.yaml ditemukan")
            try:
                from utils.config_loader import load_config, validate_config
                config = load_config()
                valid, errors = validate_config(config)
                if valid:
                    console.print("  [green]✓[/green] Config valid")
                else:
                    for e in errors:
                        console.print(f"  [red]✗[/red] {e}")
            except Exception as e:
                console.print(f"  [red]✗[/red] Error membaca config: {e}")
        else:
            console.print("  [red]✗[/red] config.yaml tidak ditemukan!")
            console.print("  → Pastikan Anda berada di direktori casha-ai-cmo/")
        console.print()

    def _show_summary(self) -> None:
        """Tampilkan ringkasan setup dan langkah selanjutnya."""
        console.print(Panel(
            "[bold]🚀 Langkah Selanjutnya:[/bold]\n\n"
            "1. Salin [bold].env.example[/bold] menjadi [bold].env[/bold]\n"
            "   [dim]cp .env.example .env[/dim]\n\n"
            "2. Isi API keys di file [bold].env[/bold]\n\n"
            "3. Generate strategi pertama:\n"
            "   [cyan]python main.py strategy --period weekly[/cyan]\n\n"
            "4. Generate konten:\n"
            "   [cyan]python main.py content --platform instagram --count 5[/cyan]\n\n"
            "5. Lihat jadwal:\n"
            "   [cyan]python main.py schedule show[/cyan]\n\n"
            "6. Jalankan daemon otomatis:\n"
            "   [cyan]python main.py run --interval 60[/cyan]",
            border_style="green",
            padding=(1, 2),
        ))
