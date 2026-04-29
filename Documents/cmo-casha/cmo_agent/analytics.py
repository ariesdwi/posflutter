"""
cmo_agent/analytics.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Analytics Engine
Monitor performa konten, hitung KPI, dan generate laporan AI-powered
untuk semua platform sosial media Casha.
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import json
import os
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.columns import Columns
from rich.progress import Progress, BarColumn, TextColumn
from rich import box

from utils.logger import setup_logger

console = Console()
logger = setup_logger()


class AnalyticsEngine:
    """Analytics & Reporting Engine untuk Casha CMO."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.posted_dir = Path(
            config.get("scheduler", {}).get("posted_dir", "data/posted")
        )
        self.analytics_dir = Path("data/analytics")
        self.analytics_dir.mkdir(parents=True, exist_ok=True)
        self.platforms_config = config.get("platforms", {})
        self.kpis = config.get("analytics", {}).get("kpis", [])
        self.targets = config.get("analytics", {}).get("target_metrics", {})

    # ── Report Generation ────────────────────────────────────

    def generate_report(
        self,
        period: str = "weekly",
        platform: str = "all",
    ) -> Dict[str, Any]:
        """Generate laporan analytics komprehensif."""

        logger.info(f"Generating {period} analytics report for {platform}")

        # Load posted content
        posted = self._load_posted(platform)

        # Simulate/fetch platform metrics
        metrics = self._get_platform_metrics(platform, period)

        # Calculate KPIs
        kpis = self._calculate_kpis(metrics, posted)

        # Generate AI insights
        insights = self._generate_ai_insights(metrics, kpis)

        report = {
            "period": period,
            "platform": platform,
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_posts": len(posted),
                "active_platforms": [
                    p for p, v in self.platforms_config.items()
                    if v.get("enabled")
                ],
            },
            "metrics": metrics,
            "kpis": kpis,
            "insights": insights,
            "top_performing": self._get_top_performing(posted),
            "recommendations": self._get_quick_recommendations(kpis),
        }

        # Auto-save
        self._save_report(report, period)
        return report

    def get_raw_metrics(self) -> Dict[str, Any]:
        """Ambil data metrik mentah untuk semua platform."""
        return self._get_platform_metrics("all", "weekly")

    # ── Metrics Fetching ─────────────────────────────────────

    def _get_platform_metrics(self, platform: str, period: str) -> Dict[str, Any]:
        """Ambil metrik dari platform API (real jika credentials ada, fallback simulasi)."""
        platforms = (
            ["instagram", "tiktok"]
            if platform == "all"
            else [platform]
        )

        metrics = {}
        for plat in platforms:
            if not self.platforms_config.get(plat, {}).get("enabled"):
                continue

            if plat == "instagram" and os.getenv("META_ACCESS_TOKEN") and os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID"):
                try:
                    metrics[plat] = self._fetch_instagram_metrics(period)
                    logger.info("\u2705 Instagram metrics fetched from Meta Graph API")
                except Exception as e:
                    logger.warning(f"Instagram Graph API error, fallback kosong: {e}")
                    metrics[plat] = self._empty_instagram_metrics(source="graph_api_error")
            elif plat == "instagram":
                logger.info("Instagram credential belum lengkap, fallback kosong")
                metrics[plat] = self._empty_instagram_metrics(source="missing_credentials")
            else:
                metrics[plat] = self._simulate_platform_metrics(plat, period)

        return metrics

    def _fetch_instagram_metrics(self, period: str) -> Dict[str, Any]:
        """
        Fetch real metrics dari Meta Graph API v19.0.
        Requires: META_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID
        """
        import requests

        token      = os.getenv("META_ACCESS_TOKEN")
        ig_id      = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")
        base       = "https://graph.facebook.com/v19.0"
        api_period = {"daily": "day", "weekly": "week", "monthly": "days_28"}.get(period, "week")
        days_back  = {"day": 1, "week": 7, "days_28": 28}.get(api_period, 7)

        # 1. Followers & account info
        acc = requests.get(
            f"{base}/{ig_id}",
            params={"fields": "followers_count,media_count", "access_token": token},
            timeout=15,
        )
        acc.raise_for_status()
        followers = acc.json().get("followers_count", 0)

        # 2. Account-level insights
        insight_map: Dict[str, Any] = {}
        try:
            ins = requests.get(
                f"{base}/{ig_id}/insights",
                params={
                    "metric":       "reach,impressions,profile_views,website_clicks,follower_count",
                    "period":       api_period,
                    "access_token": token,
                },
                timeout=15,
            )
            ins.raise_for_status()
            for d in ins.json().get("data", []):
                insight_map[d["name"]] = sum(v.get("value", 0) for v in d.get("values", []))
        except Exception as e:
            logger.warning(f"Insights endpoint error: {e}")

        # 3. Recent media — aggregate likes, comments, saves, shares
        likes = comments = saves = shares = posts_count = 0
        try:
            since_ts = int((datetime.now() - timedelta(days=days_back)).timestamp())
            media_resp = requests.get(
                f"{base}/{ig_id}/media",
                params={
                    "fields":       "id,like_count,comments_count,timestamp",
                    "since":        since_ts,
                    "limit":        50,
                    "access_token": token,
                },
                timeout=15,
            )
            media_resp.raise_for_status()
            media_items = media_resp.json().get("data", [])
            posts_count = len(media_items)
            for media in media_items:
                likes    += media.get("like_count", 0)
                comments += media.get("comments_count", 0)
                try:
                    mi = requests.get(
                        f"{base}/{media['id']}/insights",
                        params={"metric": "saved,shares", "access_token": token},
                        timeout=10,
                    )
                    if mi.ok:
                        for entry in mi.json().get("data", []):
                            v = entry.get("value", 0)
                            if entry["name"] == "saved":    saves  += v
                            elif entry["name"] == "shares": shares += v
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"Media fetch error: {e}")

        return {
            "followers":        followers,
            "followers_gained": insight_map.get("follower_count", 0),
            "posts_count":      posts_count,
            "total_reach":      insight_map.get("reach", 0),
            "impressions":      insight_map.get("impressions", 0),
            "likes":            likes,
            "comments":         comments,
            "saves":            saves,
            "shares":           shares,
            "profile_visits":   insight_map.get("profile_views", 0),
            "link_clicks":      insight_map.get("website_clicks", 0),
            "_source":          "graph_api",
        }

    def _empty_instagram_metrics(self, source: str = "empty_fallback") -> Dict[str, Any]:
        """Fallback metrik Instagram kosong saat API error / credential belum siap."""
        return {
            "followers": 0,
            "followers_gained": 0,
            "posts_count": 0,
            "total_reach": 0,
            "impressions": 0,
            "likes": 0,
            "comments": 0,
            "saves": 0,
            "shares": 0,
            "profile_visits": 0,
            "link_clicks": 0,
            "_source": source,
        }

    def _simulate_platform_metrics(self, platform: str, period: str) -> Dict[str, Any]:
        """
        Simulasi data metrik yang realistis untuk demo.
        Ganti fungsi ini dengan API call nyata.
        """
        # Multiplier berdasarkan periode
        mult = {"daily": 1, "weekly": 7, "monthly": 30}.get(period, 7)

        base = {
            "instagram": {
                "followers": 12450,
                "followers_gained": int(random.gauss(45, 10) * (mult / 7)),
                "posts_count": int(7 * (mult / 7)),
                "total_reach": int(random.gauss(8500, 1200) * (mult / 7)),
                "impressions": int(random.gauss(22000, 3000) * (mult / 7)),
                "likes": int(random.gauss(980, 150) * (mult / 7)),
                "comments": int(random.gauss(85, 20) * (mult / 7)),
                "saves": int(random.gauss(220, 45) * (mult / 7)),
                "shares": int(random.gauss(65, 15) * (mult / 7)),
                "profile_visits": int(random.gauss(1200, 200) * (mult / 7)),
                "link_clicks": int(random.gauss(145, 30) * (mult / 7)),
            },
            "tiktok": {
                "followers": 8320,
                "followers_gained": int(random.gauss(120, 35) * (mult / 7)),
                "videos_count": int(5 * (mult / 7)),
                "total_views": int(random.gauss(45000, 12000) * (mult / 7)),
                "likes": int(random.gauss(3200, 800) * (mult / 7)),
                "comments": int(random.gauss(180, 50) * (mult / 7)),
                "shares": int(random.gauss(420, 100) * (mult / 7)),
                "average_watch_time_sec": round(random.gauss(18.5, 3.2), 1),
                "completion_rate_pct": round(random.gauss(34.5, 8), 1),
            },
            "linkedin": {
                "followers": 3180,
                "followers_gained": int(random.gauss(22, 8) * (mult / 7)),
                "posts_count": int(3 * (mult / 7)),
                "impressions": int(random.gauss(12000, 2500) * (mult / 7)),
                "unique_visitors": int(random.gauss(1850, 350) * (mult / 7)),
                "reactions": int(random.gauss(280, 60) * (mult / 7)),
                "comments": int(random.gauss(35, 12) * (mult / 7)),
                "reposts": int(random.gauss(18, 6) * (mult / 7)),
                "click_through_rate_pct": round(random.gauss(2.8, 0.5), 2),
            },
        }

        return base.get(platform, {})

    # ── KPI Calculation ──────────────────────────────────────

    def _calculate_kpis(
        self,
        metrics: Dict[str, Any],
        posted: List[Dict],
    ) -> Dict[str, Any]:
        """Hitung KPI utama dari data metrik."""
        kpis = {}

        ig = metrics.get("instagram", {})
        if ig:
            total_interactions = (
                ig.get("likes", 0) + ig.get("comments", 0)
                + ig.get("saves", 0) + ig.get("shares", 0)
            )
            followers = ig.get("followers", 1)
            kpis["instagram"] = {
                "engagement_rate": round(
                    total_interactions / max(followers, 1) * 100, 2
                ),
                "follower_growth": ig.get("followers_gained", 0),
                "avg_reach_per_post": round(
                    ig.get("total_reach", 0) / max(ig.get("posts_count", 1), 1)
                ),
                "save_rate": round(ig.get("saves", 0) / max(ig.get("total_reach", 1), 1) * 100, 2),
            }

        tt = metrics.get("tiktok", {})
        if tt:
            kpis["tiktok"] = {
                "avg_views_per_video": round(
                    tt.get("total_views", 0) / max(tt.get("videos_count", 1), 1)
                ),
                "engagement_rate": round(
                    (tt.get("likes", 0) + tt.get("comments", 0) + tt.get("shares", 0))
                    / max(tt.get("total_views", 1), 1) * 100, 2
                ),
                "follower_growth": tt.get("followers_gained", 0),
                "avg_watch_time": tt.get("average_watch_time_sec", 0),
                "completion_rate": tt.get("completion_rate_pct", 0),
            }

        li = metrics.get("linkedin", {})
        if li:
            kpis["linkedin"] = {
                "engagement_rate": round(
                    (li.get("reactions", 0) + li.get("comments", 0) + li.get("reposts", 0))
                    / max(li.get("impressions", 1), 1) * 100, 2
                ),
                "follower_growth": li.get("followers_gained", 0),
                "ctr": li.get("click_through_rate_pct", 0),
                "avg_impressions_per_post": round(
                    li.get("impressions", 0) / max(li.get("posts_count", 1), 1)
                ),
            }

        return kpis

    def _generate_ai_insights(self, metrics: Dict, kpis: Dict) -> List[str]:
        """Generate AI insights sederhana berdasarkan data."""
        insights = []

        ig_kpis = kpis.get("instagram", {})
        er = ig_kpis.get("engagement_rate", 0)
        target_er = self.targets.get("instagram_engagement_rate", 3.5)

        if er < target_er:
            insights.append(
                f"⚠️  Engagement rate Instagram ({er}%) di bawah target ({target_er}%). "
                "Coba tingkatkan konten carousel dan Instagram Stories."
            )
        else:
            insights.append(
                f"✅ Engagement rate Instagram ({er}%) melampaui target ({target_er}%). "
                "Pertahankan frekuensi dan kualitas konten!"
            )

        tt_kpis = kpis.get("tiktok", {})
        avg_views = tt_kpis.get("avg_views_per_video", 0)
        target_views = self.targets.get("tiktok_average_views", 10000)

        if avg_views < target_views:
            insights.append(
                f"📊 Rata-rata views TikTok ({avg_views:,}) belum mencapai target ({target_views:,}). "
                "Coba hook lebih kuat di 3 detik pertama."
            )
        else:
            insights.append(
                f"🚀 TikTok performa bagus! Rata-rata {avg_views:,} views per video."
            )

        total_growth = sum(
            kpis.get(p, {}).get("follower_growth", 0)
            for p in ["instagram", "tiktok", "linkedin"]
        )
        insights.append(
            f"📈 Total pertumbuhan followers semua platform: +{total_growth:,} followers minggu ini."
        )

        return insights

    def _get_top_performing(self, posted: List[Dict]) -> List[Dict]:
        """Dapatkan konten dengan performa terbaik."""
        # Simulasi: ambil 3 konten pertama sebagai top performers
        return posted[:3] if posted else []

    def _get_quick_recommendations(self, kpis: Dict) -> List[str]:
        """Rekomendasi cepat berdasarkan KPI."""
        recs = []

        ig = kpis.get("instagram", {})
        if ig.get("engagement_rate", 0) < 3:
            recs.append("🔁 Tingkatkan interaksi dengan audiens – balas komentar lebih aktif")
        if ig.get("save_rate", 0) < 2:
            recs.append("💾 Buat konten edukatif yang layak disave (tips, infografis)")

        tt = kpis.get("tiktok", {})
        if tt.get("completion_rate", 0) < 30:
            recs.append("✂️  Pangkas durasi video TikTok – target 15-25 detik untuk completion rate lebih tinggi")
        if tt.get("avg_watch_time", 0) < 15:
            recs.append("🎯 Perkuat hook di 3 detik pertama TikTok")

        if not recs:
            recs.append("🎉 Semua KPI dalam kondisi baik! Lanjutkan strategi saat ini.")

        return recs

    # ── Display ──────────────────────────────────────────────

    def display_report(self, report: Dict) -> None:
        """Tampilkan laporan analytics dengan Rich yang kaya visual."""
        console.print()
        console.print(Panel(
            f"[bold #2E7D32]📊 LAPORAN ANALYTICS CASHA[/bold #2E7D32]\n"
            f"[dim]Periode: {report['period'].upper()} • "
            f"Platform: {report['platform'].upper()} • "
            f"Dibuat: {datetime.now().strftime('%d %B %Y %H:%M')}[/dim]",
            border_style="#2E7D32",
            padding=(1, 2),
        ))

        metrics = report.get("metrics", {})
        kpis = report.get("kpis", {})

        # Per-platform metrics
        for platform, data in metrics.items():
            plat_colors = {
                "instagram": "#E1306C",
                "tiktok": "#69C9D0",
                "linkedin": "#0077B5",
            }
            color = plat_colors.get(platform, "#2E7D32")
            
            console.print()
            console.print(f"[bold {color}]{'▓' * 3} {platform.upper()} {'▓' * 3}[/bold {color}]")

            table = Table(box=box.SIMPLE_HEAVY, border_style=color, show_header=False)
            table.add_column("Metrik", style="bold", width=28)
            table.add_column("Nilai", style=color)
            table.add_column("KPI", width=35)

            plat_kpis = kpis.get(platform, {})

            for key, val in data.items():
                kpi_val = ""
                if key == "followers":
                    kpi_val = f"  Growth: +{plat_kpis.get('follower_growth', 0)}"
                elif key in ("total_reach", "impressions", "total_views"):
                    er = plat_kpis.get("engagement_rate", 0)
                    kpi_val = f"  Engagement Rate: {er}%"

                display_val = f"{val:,}" if isinstance(val, int) else str(val)
                table.add_row(
                    key.replace("_", " ").title(),
                    display_val,
                    f"[dim]{kpi_val}[/dim]",
                )

            console.print(table)

        # KPI Progress bars
        console.print()
        console.print("[bold]🎯 KPI vs Target[/bold]")
        console.print()

        ig_kpis = kpis.get("instagram", {})
        if ig_kpis:
            er = ig_kpis.get("engagement_rate", 0)
            target = self.targets.get("instagram_engagement_rate", 3.5)
            pct = min(int(er / target * 100), 100)
            bar = "█" * (pct // 5) + "░" * (20 - pct // 5)
            color = "green" if pct >= 100 else ("yellow" if pct >= 70 else "red")
            console.print(
                f"  Instagram ER  [{color}]{bar}[/{color}] {er}% / {target}% target"
            )

        tt_kpis = kpis.get("tiktok", {})
        if tt_kpis:
            views = tt_kpis.get("avg_views_per_video", 0)
            target = self.targets.get("tiktok_average_views", 10000)
            pct = min(int(views / target * 100), 100)
            bar = "█" * (pct // 5) + "░" * (20 - pct // 5)
            color = "green" if pct >= 100 else ("yellow" if pct >= 70 else "red")
            console.print(
                f"  TikTok Views  [{color}]{bar}[/{color}] {views:,} / {target:,} target"
            )

        # Insights
        insights = report.get("insights", [])
        if insights:
            console.print()
            console.print("[bold]💡 AI Insights:[/bold]")
            for insight in insights:
                console.print(f"  {insight}")

        # Recommendations
        recs = report.get("recommendations", [])
        if recs:
            console.print()
            console.print(Panel(
                "[bold yellow]📌 Rekomendasi Aksi[/bold yellow]\n\n" +
                "\n".join(f"  {r}" for r in recs),
                border_style="yellow",
                padding=(1, 2),
            ))

    # ── Export ───────────────────────────────────────────────

    def export_report(self, report: Dict, path: str) -> None:
        """Ekspor laporan ke CSV atau JSON."""
        if path.endswith(".json"):
            with open(path, "w", encoding="utf-8") as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
        elif path.endswith(".csv"):
            import csv
            rows = []
            for platform, data in report.get("metrics", {}).items():
                for key, val in data.items():
                    rows.append({"platform": platform, "metric": key, "value": val})
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=["platform", "metric", "value"])
                writer.writeheader()
                writer.writerows(rows)

    # ── Helpers ──────────────────────────────────────────────

    def _load_posted(self, platform: str) -> List[Dict]:
        """Load daftar konten yang sudah diposting."""
        items = []
        if platform == "all":
            search = self.posted_dir.rglob("*.json") if self.posted_dir.exists() else []
        else:
            target = self.posted_dir / platform
            search = target.glob("*.json") if target.exists() else []

        for f in search:
            try:
                with open(f, encoding="utf-8") as fh:
                    items.append(json.load(fh))
            except Exception:
                pass
        return items

    def _save_report(self, report: Dict, period: str) -> None:
        """Simpan laporan analytics ke disk."""
        filename = self.analytics_dir / f"report_{period}_{datetime.now().strftime('%Y%m%d')}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        logger.info(f"Analytics report saved to {filename}")
