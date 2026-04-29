#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║          CASHA AI CMO – Chief Marketing Officer              ║
║          Sistem Marketing Otomatis dari Terminal             ║
╚══════════════════════════════════════════════════════════════╝

Entry point utama untuk Casha AI CMO Agent.
Jalankan: python main.py --help
"""

import sys
import os
import warnings

# Pastikan root project ada di path dan CWD (supaya relative paths seperti
# "data/queue" selalu resolve dari folder project, bukan dari folder mana
# user memanggil script).
_PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _PROJECT_ROOT)
os.chdir(_PROJECT_ROOT)

# Sembunyikan warning urllib3/LibreSSL yang tidak actionable di macOS.
# Filter dipasang SEBELUM import lain agar aktif saat urllib3 di-load pertama kali.
warnings.filterwarnings("ignore", message=".*LibreSSL.*")
warnings.filterwarnings("ignore", message=".*NotOpenSSLWarning.*")

import typer
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich import print as rprint
from typing import Optional
from datetime import datetime

from cmo_agent.strategist import MarketingStrategist
from cmo_agent.content_gen import ContentGenerator
from cmo_agent.scheduler import PostScheduler
from cmo_agent.analytics import AnalyticsEngine
from utils.config_loader import load_config
from utils.logger import setup_logger

# ── CLI App ─────────────────────────────────────────────────
app = typer.Typer(
    name="casha-cmo",
    help="🚀 Casha AI CMO – Sistem Marketing Otomatis",
    add_completion=False,
    rich_markup_mode="rich",
)

console = Console()
logger = setup_logger()

# ── Banner ───────────────────────────────────────────────────
BANNER = """
[bold #2E7D32]
  ██████╗ █████╗ ███████╗██╗  ██╗ █████╗ 
 ██╔════╝██╔══██╗██╔════╝██║  ██║██╔══██╗
 ██║     ███████║███████╗███████║███████║
 ██║     ██╔══██║╚════██║██╔══██║██╔══██║
 ╚██████╗██║  ██║███████║██║  ██║██║  ██║
  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
[/bold #2E7D32]
[bold white]         🤖 AI Chief Marketing Officer[/bold white]
[dim]    Sistem Marketing Otomatis dari Terminal[/dim]
"""


def show_banner():
    """Tampilkan banner Casha CMO."""
    console.print(BANNER)
    console.print(
        Panel(
            f"[green]✓[/green] Sistem aktif • [dim]{datetime.now().strftime('%A, %d %B %Y – %H:%M WIB')}[/dim]",
            border_style="dim #2E7D32",
            padding=(0, 2),
        )
    )
    console.print()


# ── Commands ─────────────────────────────────────────────────

@app.command(name="strategy", help="🎯 Generate strategi marketing mingguan/bulanan")
def cmd_strategy(
    period: str = typer.Option("weekly", "--period", "-p", help="weekly | monthly | quarterly"),
    focus: Optional[str] = typer.Option(None, "--focus", "-f", help="Fokus kampanye khusus (opsional)"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Simpan ke file (opsional)"),
):
    """Generate strategi marketing Casha menggunakan AI CMO Agent."""
    show_banner()
    config = load_config()

    # ── Load analytics snapshot ──────────────────────────────
    analytics_snapshot = None
    with console.status("[bold #2E7D32]📊 Memuat data analytics terkini...[/bold #2E7D32]"):
        try:
            engine = AnalyticsEngine(config)
            analytics_snapshot = engine.generate_report(period=period, platform="all")
            console.print("[green]✓ Data analytics berhasil dimuat – strategi akan disesuaikan dengan performa aktual[/green]")
        except Exception as exc:
            logger.warning(f"Analytics tidak tersedia, strategi tanpa data aktual: {exc}")
            console.print("[yellow]⚠  Analytics tidak tersedia – strategi dibuat tanpa data aktual[/yellow]")

    with console.status("[bold #2E7D32]🧠 AI CMO sedang menganalisis pasar & brand Casha...[/bold #2E7D32]"):
        strategist = MarketingStrategist(config)
        strategy = strategist.generate_strategy(
            period=period,
            focus=focus,
            analytics_snapshot=analytics_snapshot,
        )

    strategist.display_strategy(strategy)

    if output:
        strategist.save_strategy(strategy, output)
        console.print(f"\n[green]✓ Strategi disimpan ke:[/green] {output}")


@app.command(name="content", help="✍️  Generate konten siap posting (caption, hook, hashtag)")
def cmd_content(
    pillar: Optional[str] = typer.Option(None, "--pillar", "-p", 
        help="tips | fitur | motivasi | edukasi | auto"),
    platform: str = typer.Option("instagram", "--platform", "-pl",
        help="instagram | tiktok | linkedin | all"),
    count: int = typer.Option(1, "--count", "-c", help="Jumlah konten yang dibuat"),
    topic: Optional[str] = typer.Option(None, "--topic", "-t", help="Topik spesifik konten"),
    format_type: str = typer.Option("auto", "--format", "-f", help="auto | image | video"),
    no_shooting: bool = typer.Option(True, "--no-shooting/--allow-shooting", help="Mode video tanpa shooting real"),
    save: bool = typer.Option(True, "--save/--no-save", help="Simpan ke antrian posting"),
):
    """Generate konten marketing Casha siap posting."""
    show_banner()
    config = load_config()
    
    generator = ContentGenerator(config)
    
    with console.status("[bold #2E7D32]✍️  AI sedang menulis konten Casha...[/bold #2E7D32]"):
        contents = generator.generate_batch(
            pillar=pillar or "auto",
            platform=platform,
            count=count,
            topic=topic,
            format_type=format_type,
            no_shooting=no_shooting,
        )
    
    generator.display_contents(contents)
    
    if save:
        saved = generator.save_to_queue(contents)
        console.print(f"\n[green]✓ {saved} konten disimpan ke antrian posting[/green]")


@app.command(name="schedule", help="📅 Kelola jadwal posting konten")
def cmd_schedule(
    action: str = typer.Argument("show", help="show | optimize | clear"),
    platform: Optional[str] = typer.Option(None, "--platform", "-p"),
):
    """Kelola dan optimalkan jadwal posting konten."""
    show_banner()
    config = load_config()
    
    scheduler = PostScheduler(config)
    
    if action == "show":
        scheduler.display_schedule()
    elif action == "optimize":
        with console.status("[bold #2E7D32]🔄 Mengoptimalkan jadwal posting...[/bold #2E7D32]"):
            scheduler.optimize_schedule(platform=platform)
        console.print("[green]✓ Jadwal berhasil dioptimalkan![/green]")
    elif action == "clear":
        if typer.confirm("⚠️  Yakin ingin menghapus semua jadwal?"):
            scheduler.clear_schedule(platform=platform)
            console.print("[yellow]✓ Jadwal dihapus[/yellow]")


@app.command(name="requeue", help="↩️  Kembalikan konten dari posted/failed ke antrian (tanpa posting)")
def cmd_requeue(
    content_id: str = typer.Option(..., "--id", help="ID konten yang akan dikembalikan ke antrian"),
):
    """Pindahkan konten dari data/posted atau data/failed ke data/queue tanpa langsung posting."""
    show_banner()
    config = load_config()
    scheduler = PostScheduler(config)

    console.print(f"[bold]↩️  Requeue [{content_id}]...[/bold]\n")
    ok = scheduler.requeue_item(content_id)
    if ok:
        console.print(f"[green]✓ [{content_id}] berhasil dikembalikan ke antrian[/green]")
    else:
        console.print(f"[red]✗ [{content_id}] tidak ditemukan di folder posted/failed[/red]")


@app.command(name="blast", help="💥 Post konten ke beberapa platform sekaligus (blast by ID)")
def cmd_blast(
    content_id: str = typer.Option(..., "--id", help="ID konten yang akan di-blast"),
    platforms: str = typer.Option("instagram,tiktok", "--platforms", "-p",
        help="Comma-separated: instagram,tiktok,linkedin"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview tanpa benar-benar posting"),
):
    """Post konten yang sama ke beberapa platform sekaligus menggunakan content ID."""
    show_banner()
    config = load_config()
    scheduler = PostScheduler(config)

    plat_list = [p.strip() for p in platforms.split(",") if p.strip()]
    console.print(f"[bold]💥 Blast [{content_id}] → {', '.join(p.upper() for p in plat_list)}[/bold]\n")

    if dry_run:
        console.print("[yellow]⚡ Mode DRY RUN – tidak akan benar-benar posting[/yellow]\n")

    scheduler.blast_post(content_id=content_id, platforms=plat_list, dry_run=dry_run)


@app.command(name="retry", help="🔁 Pindah konten dari failed ke antrian & posting ulang")
def cmd_retry(
    content_id: Optional[str] = typer.Option(None, "--id", help="ID konten spesifik (kosong = semua yang failed)"),
    platform: str = typer.Option("all", "--platform", "-p", help="instagram | tiktok | linkedin | all"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview tanpa benar-benar posting"),
):
    """Pindah konten dari data/failed ke data/queue lalu posting ulang."""
    import json
    import shutil
    from pathlib import Path
    config = load_config()

    scheduler = PostScheduler(config)
    failed_base = scheduler.failed_dir
    queue_base = scheduler.queue_dir

    platforms = (
        ["instagram", "tiktok", "linkedin"] if platform == "all" else [platform]
    )

    moved = 0
    for plat in platforms:
        failed_dir = failed_base / plat
        queue_dir = queue_base / plat
        if not failed_dir.exists():
            continue
        queue_dir.mkdir(parents=True, exist_ok=True)
        for f in sorted(failed_dir.glob("*.json")):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                if content_id and data.get("id") != content_id:
                    continue
                data["status"] = "pending"
                data.pop("failed_at", None)
                data.pop("error", None)

                # Ensure asset folder exists again when item is returned to queue.
                cid = data.get("id")
                if cid:
                    asset_dir = Path("data/assets") / plat / cid
                    asset_dir.mkdir(parents=True, exist_ok=True)

                dest = queue_dir / f.name
                dest.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
                f.unlink()
                moved += 1
                console.print(f"[green]↩[/green]  {plat}/{f.name} → antrian")
            except Exception as e:
                console.print(f"[red]✗[/red]  Gagal memindahkan {f.name}: {e}")

    if moved == 0:
        console.print("[yellow]Tidak ada konten failed yang ditemukan.[/yellow]")
        return

    console.print(f"\n[green]✓ {moved} konten dipindahkan ke antrian[/green]\n")

    if dry_run:
        console.print("[yellow]⚡ Mode DRY RUN – tidak akan benar-benar posting[/yellow]\n")

    scheduler.execute_posts(platform=platform, dry_run=dry_run, content_id=content_id)


@app.command(name="post", help="🚀 Eksekusi posting konten ke platform")
def cmd_post(
    platform: str = typer.Option("all", "--platform", "-p", help="instagram | tiktok | linkedin | all"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview tanpa benar-benar posting"),
    content_id: Optional[str] = typer.Option(None, "--id", help="Post konten spesifik berdasarkan ID"),
):
    """Posting konten dari antrian ke platform sosial media."""
    show_banner()
    config = load_config()
    
    scheduler = PostScheduler(config)
    
    if dry_run:
        console.print("[yellow]⚡ Mode DRY RUN – tidak akan benar-benar posting[/yellow]\n")
    
    scheduler.execute_posts(
        platform=platform,
        dry_run=dry_run,
        content_id=content_id,
    )


@app.command(name="auth", help="🔐 Hubungkan akun sosial media via OAuth / browser login")
def cmd_auth(
    platform: str = typer.Argument("instagram", help="instagram"),
    action: str = typer.Option("login", "--action", "-a", help="login | browser | logout | status"),
    force: bool = typer.Option(False, "--force", help="Login ulang walau token masih valid"),
):
    """
    Autentikasi platform. Mendukung dua metode login Instagram:

    1. browser  – Buka browser, login manual (DIREKOMENDASIKAN, anti IP blacklist)
    2. login    – OAuth via Facebook Developer App (butuh FACEBOOK_APP_ID)

    Contoh:
        python main.py auth instagram -a browser   # login via browser (recommended!)
        python main.py auth instagram               # login via OAuth
        python main.py auth instagram --force       # login ulang
        python main.py auth instagram -a logout     # hapus token lokal
        python main.py auth instagram -a status     # cek status token
    """
    show_banner()

    if platform.lower() != "instagram":
        console.print(f"[red]✗ Platform '{platform}' belum didukung untuk auth.[/red]")
        raise typer.Exit(code=1)

    # ── Browser Login (recommended) ──
    if action == "browser":
        try:
            from platforms.instagram_browser_login import browser_login
            ig_username = os.getenv("INSTAGRAM_USERNAME")
            browser_login(username=ig_username)
        except ImportError as e:
            console.print(f"[red]✗ {e}[/red]")
            console.print("[dim]Jalankan: pip install playwright && python -m playwright install chromium[/dim]")
            raise typer.Exit(code=1)
        except Exception as e:
            console.print(f"[red]✗ Browser login gagal:[/red] {e}")
            raise typer.Exit(code=1)
        return

    from platforms.instagram_oauth import InstagramOAuth
    oauth = InstagramOAuth()

    if action == "logout":
        oauth.logout()
        # Hapus juga session instagrapi
        from pathlib import Path
        for p in [Path("data/auth/instagrapi_session.json"), Path("data/auth/browser_state.json")]:
            if p.exists():
                p.unlink()
                console.print(f"[yellow]✓ {p.name} dihapus[/yellow]")
        return

    if action == "status":
        from pathlib import Path
        # Cek session instagrapi (dari browser login)
        instagrapi_session = Path("data/auth/instagrapi_session.json")
        if instagrapi_session.exists():
            console.print(Panel(
                "[green]✓ Session instagrapi tersedia[/green]\n\n"
                f"[dim]File    :[/dim] {instagrapi_session}\n"
                f"[dim]Method  :[/dim] Browser Login",
                title="🔐 Instagram Session (instagrapi)",
                border_style="#2E7D32",
                padding=(1, 2),
            ))

        # Cek OAuth token
        cached = oauth.load_cached()
        if cached:
            valid = oauth._is_valid(cached)
            badge = "[green]✓ VALID[/green]" if valid else "[red]✗ EXPIRED[/red]"
            console.print(Panel(
                f"{badge}\n\n"
                f"[dim]Username     :[/dim] [bold]@{cached.get('ig_username') or '—'}[/bold]\n"
                f"[dim]IG User ID   :[/dim] {cached.get('ig_user_id')}\n"
                f"[dim]Page ID      :[/dim] {cached.get('page_id')}\n"
                f"[dim]Obtained at  :[/dim] {cached.get('obtained_at')}\n"
                f"[dim]Expires at   :[/dim] {cached.get('expires_at')}",
                title="🔐 Instagram Auth Status (OAuth)",
                border_style="#2E7D32",
                padding=(1, 2),
            ))
        elif not instagrapi_session.exists():
            console.print("[yellow]• Belum ada session Instagram tersimpan.[/yellow]")
            console.print("[dim]  Jalankan: python main.py auth instagram -a browser[/dim]")
            raise typer.Exit(code=1)
        return

    # action == "login" (OAuth)
    try:
        oauth.ensure_token(force=force, interactive=True)
    except Exception as e:
        console.print(f"[red]✗ Login Instagram gagal:[/red] {e}")
        console.print("\n[dim]💡 Tip: Coba login via browser:[/dim]")
        console.print("[bold]   python main.py auth instagram -a browser[/bold]")
        raise typer.Exit(code=1)



@app.command(name="analytics", help="📊 Lihat performa & laporan marketing")
def cmd_analytics(
    period: str = typer.Option("weekly", "--period", "-p", help="daily | weekly | monthly"),
    platform: str = typer.Option("all", "--platform", "-pl", help="instagram | tiktok | linkedin | all"),
    export: Optional[str] = typer.Option(None, "--export", "-e", help="Ekspor ke CSV/JSON"),
):
    """Monitor dan analisis performa konten Casha di semua platform."""
    show_banner()
    config = load_config()
    
    with console.status("[bold #2E7D32]📊 Mengambil data analitik...[/bold #2E7D32]"):
        engine = AnalyticsEngine(config)
        report = engine.generate_report(period=period, platform=platform)
    
    engine.display_report(report)
    
    if export:
        engine.export_report(report, export)
        console.print(f"\n[green]✓ Laporan diekspor ke:[/green] {export}")


@app.command(name="optimize", help="🔮 AI otomatis optimalkan strategi berdasarkan data")
def cmd_optimize(
    auto_apply: bool = typer.Option(False, "--auto-apply", help="Terapkan optimasi otomatis"),
):
    """Gunakan AI untuk menganalisis data dan optimalkan strategi marketing."""
    show_banner()
    config = load_config()
    
    console.print("[bold]🔮 AI CMO Optimizer[/bold]\n")
    
    engine = AnalyticsEngine(config)
    strategist = MarketingStrategist(config)
    
    with console.status("[bold #2E7D32]🤖 AI menganalisis performa & merumuskan optimasi...[/bold #2E7D32]"):
        analytics_data = engine.get_raw_metrics()
        optimizations = strategist.generate_optimizations(analytics_data)
    
    strategist.display_optimizations(optimizations)
    
    if auto_apply or typer.confirm("\n🚀 Terapkan semua optimasi sekarang?"):
        strategist.apply_optimizations(optimizations)
        console.print("\n[green]✓ Optimasi berhasil diterapkan![/green]")


@app.command(name="run", help="🤖 Jalankan AI CMO Agent secara otomatis (daemon mode)")
def cmd_run(
    interval: int = typer.Option(60, "--interval", "-i", help="Interval pengecekan dalam menit"),
    once: bool = typer.Option(False, "--once", help="Jalankan sekali lalu berhenti"),
):
    """Mode otomatis – AI CMO Agent berjalan terus, membuat & posting konten secara terjadwal."""
    show_banner()
    config = load_config()
    
    console.print(Panel(
        "[bold]🤖 Casha AI CMO Agent – MODE OTOMATIS[/bold]\n\n"
        f"[dim]• Interval pengecekan: setiap [white]{interval} menit[/white][/dim]\n"
        f"[dim]• Auto-posting: [white]{'ON' if config.get('scheduler', {}).get('auto_post') else 'OFF'}[/white][/dim]\n"
        "[dim]• Tekan [white]Ctrl+C[/white] untuk menghentikan[/dim]",
        border_style="#2E7D32",
        padding=(1, 2),
    ))
    console.print()
    
    scheduler = PostScheduler(config)
    generator = ContentGenerator(config)
    engine = AnalyticsEngine(config)
    
    try:
        scheduler.run_daemon(
            generator=generator,
            analytics=engine,
            interval_minutes=interval,
            once=once,
        )
    except KeyboardInterrupt:
        console.print("\n\n[yellow]⏹  AI CMO Agent dihentikan.[/yellow]")


@app.command(name="queue", help="📋 Lihat daftar konten dalam antrian posting")
def cmd_queue(
    platform: Optional[str] = typer.Option(None, "--platform", "-p"),
    status: str = typer.Option("pending", "--status", "-s", help="pending | posted | failed | all"),
):
    """Tampilkan antrian konten yang menunggu untuk diposting."""
    show_banner()
    config = load_config()
    
    scheduler = PostScheduler(config)
    scheduler.display_queue(platform=platform, status=status)


@app.command(name="setup", help="⚙️  Setup awal & validasi konfigurasi")
def cmd_setup():
    """Panduan setup awal Casha AI CMO – validasi API keys dan konfigurasi."""
    show_banner()
    
    from utils.setup_wizard import SetupWizard
    wizard = SetupWizard()
    wizard.run()


# ── Main Entry ───────────────────────────────────────────────
if __name__ == "__main__":
    app()
