"""
cmo_agent/scheduler.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Post Scheduler
Mengelola antrian konten, menjadwalkan posting, dan menjalankan
daemon otomatis yang memposting konten di waktu terbaik.
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import schedule
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.live import Live
from rich.layout import Layout
from rich import box

from utils.logger import setup_logger

console = Console()
logger = setup_logger()


class PostScheduler:
    """Scheduler untuk posting konten Casha ke semua platform."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.queue_dir = Path(config.get("scheduler", {}).get("queue_dir", "data/queue"))
        self.posted_dir = Path(config.get("scheduler", {}).get("posted_dir", "data/posted"))
        self.failed_dir = Path(config.get("scheduler", {}).get("failed_dir", "data/failed"))
        self.auto_post = config.get("scheduler", {}).get("auto_post", False)
        self.platforms_config = config.get("platforms", {})

        # Pastikan direktori ada
        for d in [self.queue_dir, self.posted_dir, self.failed_dir]:
            d.mkdir(parents=True, exist_ok=True)

    # ── Queue Loading ────────────────────────────────────────

    def load_queue(
        self,
        platform: Optional[str] = None,
        status: str = "pending",
    ) -> List[Dict]:
        """Muat konten dari antrian berdasarkan platform dan status."""
        items = []
        base = {
            "pending": self.queue_dir,
            "posted": self.posted_dir,
            "failed": self.failed_dir,
        }.get(status, self.queue_dir)

        if platform and platform != "all":
            search_dirs = [base / platform]
        else:
            search_dirs = [d for d in base.iterdir() if d.is_dir()] if base.exists() else []
            if not search_dirs and base.exists():
                search_dirs = [base]

        for d in search_dirs:
            if not d.exists():
                continue
            for f in sorted(d.glob("*.json")):
                try:
                    with open(f, "r", encoding="utf-8") as fh:
                        item = json.load(fh)
                        item["_file"] = str(f)
                        
                        # Auto-detect media in assets folder
                        plat_name = item.get("platform", "unknown")
                        content_id = item.get("id", "")
                        assets_dir = Path("data/assets") / plat_name
                        if assets_dir.exists() and content_id:
                            # 1. Cek folder untuk carousel (misal: C5E804EB/)
                            media_folder = assets_dir / content_id
                            if media_folder.is_dir():
                                images = []
                                for ext in [".jpg", ".jpeg", ".png"]:
                                    images.extend(list(media_folder.glob(f"*{ext}")))
                                    images.extend(list(media_folder.glob(f"*{ext.upper()}")))
                                videos = []
                                for ext in [".mp4", ".mov"]:
                                    videos.extend(list(media_folder.glob(f"*{ext}")))
                                    videos.extend(list(media_folder.glob(f"*{ext.upper()}")))
                                
                                if images:
                                    images.sort(key=lambda x: x.name)
                                    item["image_paths"] = [str(p) for p in images]
                                    item["image_path"] = str(images[0]) # Fallback
                                if videos:
                                    videos.sort(key=lambda x: x.name)
                                    item["video_path"] = str(videos[0])
                                    if not item.get("image_paths"):
                                        item["image_paths"] = [str(videos[0])]
                                        item["image_path"] = str(videos[0])
                            else:
                                # 2. Cek file tunggal (misal: C5E804EB.jpg)
                                for ext in [".jpg", ".jpeg", ".png", ".mp4", ".mov"]:
                                    media_file = assets_dir / f"{content_id}{ext}"
                                    if not media_file.exists():
                                        media_file = assets_dir / f"{content_id}{ext.upper()}"
                                        
                                    if media_file.exists():
                                        item["image_path"] = str(media_file)
                                        item["image_paths"] = [str(media_file)]
                                        item["video_path"] = str(media_file) # untuk TikTok/Reels
                                        break

                        items.append(item)
                except Exception as e:
                    logger.warning(f"Failed to load {f}: {e}")

        return items

    # ── Scheduling ───────────────────────────────────────────

    def get_optimal_times(self, platform: str) -> List[str]:
        """Dapatkan waktu optimal posting untuk platform tertentu."""
        plat_config = self.platforms_config.get(platform, {})
        times = plat_config.get("optimal_post_times", {})
        today = datetime.now().weekday()
        is_weekend = today >= 5
        
        if is_weekend:
            return times.get("weekend", ["08:00", "12:00", "19:00"])
        return times.get("weekday", ["07:00", "12:00", "19:00", "21:00"])

    def optimize_schedule(self, platform: Optional[str] = None) -> None:
        """Jadwalkan ulang konten di waktu optimal."""
        platforms = [platform] if platform else ["instagram", "tiktok", "linkedin"]
        
        for plat in platforms:
            items = self.load_queue(platform=plat)
            if not items:
                continue
            
            optimal_times = self.get_optimal_times(plat)
            
            for i, item in enumerate(items):
                time_slot = optimal_times[i % len(optimal_times)]
                item["scheduled_time"] = time_slot
                item["scheduled_date"] = (
                    datetime.now() + timedelta(hours=i // len(optimal_times))
                ).strftime("%Y-%m-%d")
                
                # Update file
                filepath = Path(item["_file"])
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump({k: v for k, v in item.items() if k != "_file"}, f, 
                             ensure_ascii=False, indent=2)
            
            logger.info(f"Optimized {len(items)} items for {plat}")

    def clear_schedule(self, platform: Optional[str] = None) -> None:
        """Hapus semua konten dari antrian."""
        if platform and platform != "all":
            target = self.queue_dir / platform
            if target.exists():
                for f in target.glob("*.json"):
                    f.unlink()
        else:
            for f in self.queue_dir.rglob("*.json"):
                f.unlink()

    # ── Posting Execution ────────────────────────────────────

    def execute_posts(
        self,
        platform: str = "all",
        dry_run: bool = False,
        content_id: Optional[str] = None,
    ) -> None:
        """Eksekusi posting konten dari antrian."""
        from platforms.instagram import InstagramPoster
        from platforms.tiktok import TikTokPoster
        from platforms.linkedin import LinkedInPoster

        poster_map = {
            "instagram": InstagramPoster,
            "tiktok": TikTokPoster,
            "linkedin": LinkedInPoster,
        }

        platforms = (
            ["instagram", "tiktok", "linkedin"] if platform == "all"
            else [platform]
        )

        total_posted = 0
        total_failed = 0
        total_previewed = 0

        for plat in platforms:
            if not self.platforms_config.get(plat, {}).get("enabled", False):
                console.print(f"[dim]⏭  {plat.capitalize()} tidak aktif, dilewati[/dim]")
                continue

            items = self.load_queue(platform=plat)
            if content_id:
                items = [i for i in items if i.get("id") == content_id]

            if not items:
                console.print(f"[dim]📭 Tidak ada konten dalam antrian {plat.capitalize()}[/dim]")
                continue

            PosterClass = poster_map.get(plat)
            if not PosterClass:
                continue

            poster = PosterClass(self.config)

            # Pastikan Instagram sudah ter-autentikasi sebelum batch posting.
            # Jika belum, buka OAuth di browser (skip saat dry-run).
            if plat == "instagram" and not dry_run:
                ensure = getattr(poster, "ensure_authenticated", None)
                if callable(ensure):
                    try:
                        ensure(interactive=True)
                    except Exception as e:
                        logger.error(f"Instagram auth gagal: {e}")
                        console.print(f"[red]✗ Instagram auth gagal, skip platform:[/red] {e}")
                        continue

            console.print(f"\n[bold]📤 Posting ke {plat.upper()} ({len(items)} konten)...[/bold]")

            for item in items:
                content_id_val = item.get("id", "?")
                try:
                    if dry_run:
                        from rich.panel import Panel
                        
                        media_info = ""
                        if item.get("image_paths"):
                            media_info = f"\n[blue]Media:[/blue] {len(item.get('image_paths'))} gambar (Carousel)"
                            for p in item.get('image_paths'):
                                media_info += f"\n  - {p}"
                        elif item.get("image_path"):
                            media_info = f"\n[blue]Media:[/blue] Single Image\n  - {item.get('image_path')}"
                        else:
                            media_info = f"\n[red]Media:[/red] Tidak ada file media ditemukan di folder assets!"

                        caption_preview = str(item.get('caption', ''))[:100] + "..." if len(item.get('caption', '')) > 100 else item.get('caption', '')
                        
                        hashtags_raw = item.get("hashtags", [])
                        hashtags_flat = []
                        if isinstance(hashtags_raw, list):
                            hashtags_flat = hashtags_raw
                        elif isinstance(hashtags_raw, dict):
                            for _, vals in hashtags_raw.items():
                                if isinstance(vals, list):
                                    hashtags_flat.extend(vals)
                        elif isinstance(hashtags_raw, str):
                            hashtags_flat = hashtags_raw.split()

                        preview_text = (
                            f"[bold]Topik:[/bold] {item.get('topic', '')}\n"
                            f"[bold]Format:[/bold] {item.get('format', 'single')}"
                            f"{media_info}\n\n"
                            f"[bold]Caption Preview:[/bold]\n[dim]{caption_preview}[/dim]\n\n"
                            f"[bold]Hashtags:[/bold] [cyan]{' '.join(hashtags_flat[:5])} ...[/cyan]"
                        )
                        
                        console.print(Panel(
                            preview_text,
                            title=f"🔍 DRY RUN – {plat.upper()} – [bold]{content_id_val}[/bold]",
                            border_style="yellow"
                        ))
                        
                        total_previewed += 1
                    else:
                        result = poster.post(item)
                        self._mark_posted(item, result)
                        console.print(
                            f"  [green]✓[/green] [{content_id_val}] "
                            f"{item.get('topic', '')[:50]} → Posted!"
                        )
                        total_posted += 1

                except Exception as e:
                    logger.error(f"Failed to post {content_id_val}: {e}")
                    self._mark_failed(item, str(e))
                    console.print(
                        f"  [red]✗[/red] [{content_id_val}] Error: {str(e)[:60]}"
                    )
                    total_failed += 1

        if dry_run and total_previewed > 0:
            console.print(
                f"\n[bold]Hasil: [yellow]{total_previewed} previewed (dry-run)[/yellow] / "
                f"[red]{total_failed} gagal[/red][/bold]"
            )
        else:
            console.print(
                f"\n[bold]Hasil: [green]{total_posted} berhasil[/green] / "
                f"[red]{total_failed} gagal[/red][/bold]"
            )

    # ── Daemon Mode ──────────────────────────────────────────

    def run_daemon(
        self,
        generator,
        analytics,
        interval_minutes: int = 60,
        once: bool = False,
    ) -> None:
        """Jalankan AI CMO sebagai daemon yang berjalan terus."""

        def tick():
            now = datetime.now()
            console.print(
                f"\n[dim]🔄 [{now.strftime('%H:%M:%S')}] Memeriksa jadwal posting...[/dim]"
            )

            # Cek apakah ada konten yang perlu dipost sekarang
            for plat in ["instagram", "tiktok", "linkedin"]:
                if not self.platforms_config.get(plat, {}).get("enabled"):
                    continue

                items = self.load_queue(platform=plat)
                optimal = self.get_optimal_times(plat)
                current_time = now.strftime("%H:%M")

                for item in items:
                    scheduled = item.get("scheduled_time")
                    if scheduled and self._is_time_to_post(scheduled, current_time):
                        console.print(f"  [green]→[/green] Posting ke {plat}: {item.get('topic', '')[:40]}")
                        if self.auto_post:
                            self.execute_posts(platform=plat, content_id=item.get("id"))

            # Generate konten baru jika antrian hampir kosong
            all_pending = self.load_queue()
            if len(all_pending) < 3:
                console.print("  [yellow]⚡ Antrian menipis, generate konten baru...[/yellow]")
                new_contents = generator.generate_batch(count=3, platform="all")
                generator.save_to_queue(new_contents)
                console.print(f"  [green]✓ {len(new_contents)} konten baru ditambahkan ke antrian[/green]")

        if once:
            tick()
            return

        schedule.every(interval_minutes).minutes.do(tick)
        tick()  # Jalankan sekali langsung

        console.print(f"\n[green]✓ Daemon berjalan. Pengecekan setiap {interval_minutes} menit.[/green]")

        while True:
            schedule.run_pending()
            time.sleep(30)

    # ── Display ──────────────────────────────────────────────

    def display_schedule(self) -> None:
        """Tampilkan jadwal posting semua platform."""
        console.print()
        
        all_items = self.load_queue()
        
        if not all_items:
            console.print(Panel(
                "[dim]📭 Antrian posting kosong.\n\n"
                "Jalankan [bold]python main.py content[/bold] untuk generate konten baru.[/dim]",
                border_style="dim",
                padding=(1, 2),
            ))
            return

        table = Table(
            title=f"📅 Jadwal Posting Casha ({len(all_items)} konten)",
            box=box.ROUNDED,
            border_style="#2E7D32",
            header_style="bold #2E7D32",
            show_lines=True,
        )
        table.add_column("ID", width=10)
        table.add_column("Platform", width=12)
        table.add_column("Pillar", width=15)
        table.add_column("Topik", width=35)
        table.add_column("Waktu", width=10)
        table.add_column("Status", width=10)

        platform_colors = {
            "instagram": "#E1306C",
            "tiktok": "#69C9D0",
            "linkedin": "#0077B5",
        }

        for item in all_items:
            plat = item.get("platform", "")
            color = platform_colors.get(plat, "white")
            table.add_row(
                item.get("id", "?"),
                f"[{color}]{plat.capitalize()}[/{color}]",
                item.get("pillar", ""),
                item.get("topic", "")[:35],
                item.get("scheduled_time", "–"),
                f"[yellow]{item.get('status', 'pending')}[/yellow]",
            )

        console.print(table)

    def display_queue(self, platform: Optional[str], status: str) -> None:
        """Tampilkan antrian dengan status tertentu."""
        items = self.load_queue(platform=platform, status=status)
        
        status_colors = {"pending": "yellow", "posted": "green", "failed": "red"}
        color = status_colors.get(status, "white")

        console.print()
        console.print(f"[bold]📋 Antrian {status.upper()} – {len(items)} item[/bold]")
        
        if not items:
            console.print("[dim]Tidak ada item dengan status ini.[/dim]")
            return

        for item in items:
            console.print(
                f"  [{color}]●[/{color}] [{item.get('id')}] "
                f"[bold]{item.get('platform', '').capitalize()}[/bold] – "
                f"{item.get('topic', '')} "
                f"[dim]({item.get('created_at', '')[:10]})[/dim]"
            )

    # ── Helpers ──────────────────────────────────────────────

    def _is_time_to_post(self, scheduled: str, current: str, tolerance_min: int = 5) -> bool:
        """Cek apakah waktu sekarang cocok dengan jadwal (toleransi ±5 menit)."""
        try:
            sch = datetime.strptime(scheduled, "%H:%M")
            cur = datetime.strptime(current, "%H:%M")
            diff = abs((cur - sch).total_seconds() / 60)
            return diff <= tolerance_min
        except Exception:
            return False

    # ── Requeue ──────────────────────────────────────────────

    def requeue_item(self, content_id: str) -> bool:
        """Pindahkan konten dari posted/failed ke queue (tanpa posting ulang).

        Returns True jika berhasil, False jika tidak ditemukan.
        """
        strip_keys = ("status", "posted_at", "failed_at", "post_result",
                      "error", "video_url", "_file")

        for base in [self.posted_dir, self.failed_dir]:
            if not base.exists():
                continue
            for f in base.rglob("*.json"):
                try:
                    d = json.loads(f.read_text(encoding="utf-8"))
                except Exception:
                    continue
                if d.get("id") != content_id:
                    continue

                # Bersihkan field hasil posting/gagal
                for k in strip_keys:
                    d.pop(k, None)
                d["status"] = "pending"

                platform = d.get("platform", "unknown")
                dest_dir = self.queue_dir / platform
                dest_dir.mkdir(parents=True, exist_ok=True)

                # Pertahankan nama file asli agar ID tetap konsisten
                dest = dest_dir / f.name
                dest.write_text(
                    json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8"
                )
                f.unlink(missing_ok=True)
                logger.info(f"Requeue: {f} → {dest}")
                return True

        return False

    def _mark_posted(self, item: Dict, result: Dict) -> None:
        """Pindahkan konten dari queue ke posted dan hapus aset medianya."""
        src = Path(item["_file"])
        item["status"] = "posted"
        item["posted_at"] = datetime.now().isoformat()
        item["post_result"] = result

        platform = item.get("platform", "unknown")
        dest_dir = self.posted_dir / platform
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / src.name

        with open(dest, "w", encoding="utf-8") as f:
            json.dump({k: v for k, v in item.items() if k != "_file"}, f,
                     ensure_ascii=False, indent=2)
        src.unlink(missing_ok=True)

    # ── Blast Post ───────────────────────────────────────────

    def blast_post(
        self,
        content_id: str,
        platforms: List[str],
        dry_run: bool = False,
    ) -> None:
        """Post konten yang sama ke beberapa platform sekaligus.

        Mencari konten `content_id` di semua folder (queue/posted/failed),
        lalu menduplikasinya ke antrian masing-masing target platform dan
        langsung mengeksekusi posting-nya.
        """
        from platforms.instagram import InstagramPoster
        from platforms.tiktok import TikTokPoster
        from platforms.linkedin import LinkedInPoster

        poster_map = {
            "instagram": InstagramPoster,
            "tiktok":    TikTokPoster,
            "linkedin":  LinkedInPoster,
        }

        # --- Temukan source content (cari di semua folder & platform)
        source_item: Dict | None = None
        for base in [self.queue_dir, self.posted_dir, self.failed_dir]:
            if not base.exists():
                continue
            for f in base.rglob("*.json"):
                try:
                    d = json.loads(f.read_text(encoding="utf-8"))
                    if d.get("id") == content_id:
                        source_item = d
                        break
                except Exception:
                    pass
            if source_item:
                break

        if not source_item:
            console.print(f"[red]✗ Konten ID '{content_id}' tidak ditemukan[/red]")
            return

        total_ok = 0
        total_fail = 0

        for plat in platforms:
            if not self.platforms_config.get(plat, {}).get("enabled", False):
                console.print(f"[dim]⏭  {plat.capitalize()} tidak aktif, dilewati[/dim]")
                continue

            # Buat salinan konten untuk platform ini
            adapted = {k: v for k, v in source_item.items()
                       if k not in ("_file", "status", "posted_at", "post_result",
                                    "failed_at", "error")}
            adapted["platform"] = plat
            adapted["status"]   = "pending"

            # Salin aset dari platform sumber jika berbeda
            source_plat = source_item.get("platform")
            cid = adapted.get("id", content_id)
            
            if source_plat and source_plat != plat:
                import shutil
                src_dir = Path("data/assets") / source_plat / cid
                tgt_dir = Path("data/assets") / plat / cid
                
                if src_dir.is_dir() and not tgt_dir.exists():
                    shutil.copytree(src_dir, tgt_dir)
                else:
                    for ext in [".jpg", ".jpeg", ".png", ".mp4", ".mov"]:
                        src_file = Path("data/assets") / source_plat / f"{cid}{ext}"
                        if not src_file.exists():
                            src_file = Path("data/assets") / source_plat / f"{cid}{ext.upper()}"
                        if src_file.exists():
                            tgt_file = Path("data/assets") / plat / src_file.name
                            if not tgt_file.exists():
                                Path("data/assets").joinpath(plat).mkdir(parents=True, exist_ok=True)
                                shutil.copy2(src_file, tgt_file)
                            break

            # Sesuaikan asset path untuk dieksekusi sekarang
            assets_dir = Path("data/assets") / plat
            if assets_dir.exists():
                media_folder = assets_dir / cid
                if media_folder.is_dir():
                    images, videos = [], []
                    for ext in [".jpg", ".jpeg", ".png"]:
                        images.extend(list(media_folder.glob(f"*{ext}")))
                        images.extend(list(media_folder.glob(f"*{ext.upper()}")))
                    for ext in [".mp4", ".mov"]:
                        videos.extend(list(media_folder.glob(f"*{ext}")))
                        videos.extend(list(media_folder.glob(f"*{ext.upper()}")))
                    if images:
                        images.sort(key=lambda x: x.name)
                        adapted["image_paths"] = [str(p) for p in images]
                        adapted["image_path"]  = str(images[0])
                    if videos:
                        videos.sort(key=lambda x: x.name)
                        adapted["video_path"] = str(videos[0])
                        if not adapted.get("image_paths"):
                            adapted["image_paths"] = [str(videos[0])]
                            adapted["image_path"]  = str(videos[0])
                else:
                    for ext in [".jpg", ".jpeg", ".png", ".mp4", ".mov"]:
                        media_file = assets_dir / f"{cid}{ext}"
                        if not media_file.exists():
                            media_file = assets_dir / f"{cid}{ext.upper()}"
                        if media_file.exists():
                            adapted["image_path"] = str(media_file)
                            adapted["image_paths"] = [str(media_file)]
                            adapted["video_path"] = str(media_file)
                            break

            # Simpan ke queue platform target
            date_str = datetime.now().strftime("%Y%m%d")
            dest_dir = self.queue_dir / plat
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest_file = dest_dir / f"{cid}_{date_str}_blast.json"
            dest_file.write_text(
                json.dumps(adapted, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            adapted["_file"] = str(dest_file)

            if dry_run:
                console.print(f"  [yellow]🔍 DRY RUN[/yellow] [{cid}] → {plat.upper()} (file: {dest_file.name})")
                total_ok += 1
                continue

            # Autentikasi Instagram jika perlu
            PosterClass = poster_map.get(plat)
            if not PosterClass:
                dest_file.unlink(missing_ok=True)
                continue

            poster = PosterClass(self.config)
            if plat == "instagram":
                ensure = getattr(poster, "ensure_authenticated", None)
                if callable(ensure):
                    try:
                        ensure(interactive=True)
                    except Exception as e:
                        logger.error(f"Instagram auth gagal: {e}")
                        console.print(f"[red]✗ Instagram auth gagal, skip:[/red] {e}")
                        dest_file.unlink(missing_ok=True)
                        total_fail += 1
                        continue

            try:
                result = poster.post(adapted)
                self._mark_posted(adapted, result)
                console.print(
                    f"  [green]✓[/green] [{cid}] → {plat.upper()} Posted!"
                )
                total_ok += 1
            except Exception as e:
                logger.error(f"Blast failed {cid} → {plat}: {e}")
                self._mark_failed(adapted, str(e))
                console.print(
                    f"  [red]✗[/red] [{cid}] → {plat.upper()} Error: {str(e)[:60]}"
                )
                total_fail += 1

        console.print(
            f"\n[bold]Blast hasil: [green]{total_ok} berhasil[/green] / "
            f"[red]{total_fail} gagal[/red][/bold]"
        )

    def _mark_failed(self, item: Dict, error: str) -> None:
        """Pindahkan konten gagal ke folder failed."""
        src = Path(item["_file"])
        item["status"] = "failed"
        item["failed_at"] = datetime.now().isoformat()
        item["error"] = error

        platform = item.get("platform", "unknown")
        dest_dir = self.failed_dir / platform
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / src.name

        with open(dest, "w", encoding="utf-8") as f:
            json.dump({k: v for k, v in item.items() if k != "_file"}, f,
                     ensure_ascii=False, indent=2)
        src.unlink(missing_ok=True)
