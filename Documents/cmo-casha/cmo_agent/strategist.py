"""
cmo_agent/strategist.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Marketing Strategist
Menggunakan AI untuk merancang strategi marketing Casha secara menyeluruh.
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from openai import OpenAI
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.columns import Columns
from rich import box

from utils.config_loader import load_config
from utils.logger import setup_logger

console = Console()
logger = setup_logger()


# ── System Prompt ────────────────────────────────────────────
STRATEGIST_SYSTEM_PROMPT = """
Kamu adalah Chief Marketing Officer (CMO) AI untuk Casha, 
aplikasi manajemen keuangan personal berbasis AI untuk pasar Indonesia.

Keahlianmu meliputi:
- Strategi konten media sosial (Instagram, TikTok, LinkedIn)
- Growth hacking untuk fintech mobile app
- Consumer psychology untuk segmen milenial/Gen-Z Indonesia
- Data-driven marketing optimization

Framework Wajib Strategi Konten:
1. DISTRIBUSI PILAR (Format Ideal):
   - Industry Insights / Edukasi: 30% (Data, tren, tips investasi/nabung)
   - Behind-the-scenes / Story: 25% (Cerita jatuh bangun finansial, use-case nyata Casha)
   - Personal / Relatable: 25% (Meme keuangan, curhat Gen-Z soal uang)
   - Promotional: 20% (Promo, fitur baru, CTA download aplikasi)

2. REPURPOSING SYSTEM:
   - Pecah satu tema besar menjadi banyak "Content Atoms".
   - Misalnya jika temanya "Cara Beli Rumah Pertama", buat: 
     a) Carousel LinkedIn/IG (Rangkuman langkah)
     b) Video TikTok (Hook emosional / cerita)
     c) Text Thread (Data statistik KPR)

Gaya komunikasi: Profesional namun ramah, menggunakan Bahasa Indonesia yang baik.
Selalu berikan output dalam format JSON yang terstruktur dan actionable.
"""


class MarketingStrategist:
    """AI-powered Marketing Strategist untuk Casha."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.brand = config.get("brand", {})
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.ai_config = config.get("ai", {})
        self.output_dir = Path("data/strategies")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    # ── Strategy Generation ──────────────────────────────────

    def generate_strategy(
        self,
        period: str = "weekly",
        focus: Optional[str] = None,
        analytics_snapshot: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Generate strategi marketing komprehensif menggunakan AI."""

        logger.info(f"Generating {period} marketing strategy for Casha...")

        period_map = {
            "weekly": "1 minggu ke depan (7 hari)",
            "monthly": "1 bulan ke depan (30 hari)",
            "quarterly": "1 kuartal ke depan (90 hari)",
        }
        period_label = period_map.get(period, period)

        content_pillars = self.config.get("content", {}).get("content_pillars", [])
        pillars_text = "\n".join(
            [f"- {p['name']}: {p['description']} (bobot {p['weight']}%)"
             for p in content_pillars]
        )

        platforms = self.config.get("platforms", {})
        active_platforms = [k for k, v in platforms.items() if v.get("enabled")]

        today = datetime.now().strftime("%A, %d %B %Y")
        focus_note = f"\nFokus kampanye khusus: {focus}" if focus else ""

        # ── Analytics context ────────────────────────────────
        analytics_section = ""
        if analytics_snapshot:
            targets = self.config.get("analytics", {}).get("target_metrics", {})
            ig = analytics_snapshot.get("metrics", {}).get("instagram", {})
            tt = analytics_snapshot.get("metrics", {}).get("tiktok", {})
            ig_kpis = analytics_snapshot.get("kpis", {}).get("instagram", {})
            tt_kpis = analytics_snapshot.get("kpis", {}).get("tiktok", {})

            # Gap analysis
            ig_er = ig_kpis.get("engagement_rate", 0)
            ig_er_target = targets.get("instagram_engagement_rate", 3.5)
            ig_er_gap = round(ig_er_target - ig_er, 2)

            ig_growth = ig_kpis.get("follower_growth", 0)
            monthly_growth_target = targets.get("follower_growth_monthly", 500)
            # Normalise to period
            period_factor = {"weekly": 7/30, "monthly": 1, "quarterly": 3}.get(period, 7/30)
            period_growth_target = round(monthly_growth_target * period_factor)
            growth_gap = period_growth_target - ig_growth

            tt_views = tt_kpis.get("avg_views_per_video", 0)
            tt_views_target = targets.get("tiktok_average_views", 10000)

            analytics_section = f"""

DATA ANALYTICS AKTUAL (periode terakhir):
Instagram:
  - Followers saat ini: {ig.get('followers', 'N/A'):,}
  - Follower baru: +{ig_growth} (target periode ini: +{period_growth_target}, gap: {growth_gap:+})
  - Engagement Rate: {ig_er}% (target: {ig_er_target}%, gap: {ig_er_gap:+}%)
  - Reach: {ig.get('total_reach', 0):,} | Impressions: {ig.get('impressions', 0):,}
  - Likes: {ig.get('likes', 0):,} | Comments: {ig.get('comments', 0):,} | Saves: {ig.get('saves', 0):,}
  - Profile visits: {ig.get('profile_visits', 0):,} | Link clicks: {ig.get('link_clicks', 0):,}
  - Posts bulan ini: {ig.get('posts_count', 0)}
TikTok:
  - Followers saat ini: {tt.get('followers', 'N/A'):,}
  - Avg views/video: {tt_views:,} (target: {tt_views_target:,})
  - Total views: {tt.get('total_views', 0):,} | Engagement rate: {tt_kpis.get('engagement_rate', 0)}%

AI Insights dari laporan:
{chr(10).join('  - ' + i for i in analytics_snapshot.get('insights', []))}

TUJUAN PERTUMBUHAN yang HARUS dicapai strategi ini:
1. Tambah +{period_growth_target} followers Instagram (dari {ig.get('followers', 0):,} → {ig.get('followers', 0) + period_growth_target:,})
2. Naikkan Engagement Rate dari {ig_er}% ke {ig_er_target}%{"+" if ig_er_gap > 0 else ""}
3. Rata-rata views TikTok {tt_views_target:,}+/video
4. Dorong profile visits → link clicks conversion untuk app install

Strategi HARUS secara eksplisit menyebutkan bagaimana setiap action item berkontribusi ke target pertumbuhan di atas.
"""

        # ── Historical Feedback Loop ─────────────────────────────
        historical_feedback = ""
        try:
            posted_files = list(Path("data/posted").rglob("*.json"))
            if posted_files:
                platforms_count = {}
                pillars_count = {}
                for pf in posted_files:
                    try:
                        with open(pf, "r", encoding="utf-8") as fh:
                            d = json.load(fh)
                            plat = d.get("platform", "unknown")
                            pil = d.get("pillar", "unknown")
                            platforms_count[plat] = platforms_count.get(plat, 0) + 1
                            pillars_count[pil] = pillars_count.get(pil, 0) + 1
                    except Exception:
                        pass
                
                historical_feedback = f"""
FEEDBACK LOOP (Riwayat Postingan):
- Total konten terposting: {len(posted_files)}
- Distribusi platform: {json.dumps(platforms_count)}
- Distribusi pillar: {json.dumps(pillars_count)}
Insight: Evaluasi apakah distribusi pillar ini sudah ideal. Jika satu pillar terlalu dominan, sarankan pillar lain di strategi ini.
"""
        except Exception:
            pass

        # ── Trend Jacking (Real-Time Context) ────────────────────
        trend_context = ""
        try:
            from cmo_agent.trend_watcher import TrendWatcher
            watcher = TrendWatcher(self.config)
            trends = watcher.fetch_current_trends()
            if trends:
                trend_lines = "\n".join([f"- {t['title']}: {t['description']}" for t in trends[:3]])
                trend_context = f"""
TREN BERITA TERKINI (TREND-JACKING):
Gunakan berita berikut sebagai inspirasi untuk minimal 1 ide konten (news-jacking):
{trend_lines}
"""
        except Exception as e:
            logger.warning(f"TrendWatcher error: {e}")

        prompt = f"""
Buat strategi marketing Casha untuk {period_label}.
Hari ini: {today}{focus_note}

BRAND INFO:
- Nama: {self.brand.get('name', 'Casha')}
- Tagline: {self.brand.get('tagline', '')}
- Target: {self.brand.get('target_audience', {}).get('primary', '')}
- Brand Voice: {self.brand.get('voice', {}).get('style', '')}

PLATFORM AKTIF: {', '.join(active_platforms)}

CONTENT PILLARS:
{pillars_text}{analytics_section}{historical_feedback}{trend_context}


Hasilkan strategi dalam format JSON berikut:
{{
  "period": "{period}",
  "generated_at": "{datetime.now().isoformat()}",
  "executive_summary": "Ringkasan strategi 2-3 kalimat",
  "main_objective": "Tujuan utama periode ini",
  "key_themes": ["tema 1", "tema 2", "tema 3"],
  "weekly_content_plan": [
    {{
      "week_label": "Minggu 1",
      "focus": "Fokus minggu ini",
      "instagram_posts": 7,
      "tiktok_videos": 5,
      "linkedin_posts": 3,
      "campaign_idea": "Ide kampanye spesifik",
      "key_message": "Pesan utama minggu ini"
    }}
  ],
  "content_ideas": [
    {{
      "title": "Judul konten",
      "pillar": "nama pillar",
      "platform": "instagram/tiktok/linkedin",
      "format": "carousel/video/single/text",
      "hook": "Kalimat pembuka yang menarik",
      "description": "Deskripsi singkat konten"
    }}
  ],
  "hashtag_strategy": {{
    "primary": ["hashtag utama brand"],
    "secondary": ["hashtag topik"],
    "trending_suggestions": ["hashtag trending yang relevan"]
  }},
  "kpi_targets": {{
    "follower_growth": "jumlah follower baru yang ditargetkan (sesuaikan dengan data aktual)",
    "engagement_rate": "target % (harus lebih tinggi dari kondisi saat ini)",
    "reach_per_post": "target reach per postingan",
    "profile_visits": "target kunjungan profil per minggu",
    "link_clicks": "target klik link bio (konversi ke app install)",
    "app_install_attribution": "estimasi install dari social media"
  }},
  "growth_roadmap": {{
    "current_state": "Kondisi akun saat ini berdasarkan data analytics",
    "bottleneck": "Hambatan utama pertumbuhan yang teridentifikasi dari data",
    "primary_lever": "Taktik pertumbuhan utama yang paling efektif untuk kondisi ini",
    "milestone_week_1": "Target terukur di akhir minggu 1",
    "milestone_week_2": "Target terukur di akhir minggu 2",
    "milestone_week_4": "Target terukur di akhir bulan"
  }},
  "action_items": [
    {{
      "priority": "HIGH/MEDIUM/LOW",
      "task": "Task yang perlu dikerjakan",
      "deadline": "timeline",
      "owner": "Tim/departemen"
    }}
  ],
  "competitor_insights": "Insight singkat tentang lanskap kompetitor fintech",
  "cmo_notes": "Catatan strategis dari CMO"
}}
"""

        response = self.client.chat.completions.create(
            model=self.ai_config.get("model", "gpt-4o"),
            messages=[
                {"role": "system", "content": STRATEGIST_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=3000,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        strategy = json.loads(raw)
        strategy["_meta"] = {
            "period": period,
            "focus": focus,
            "generated_by": "Casha AI CMO",
            "tokens_used": response.usage.total_tokens,
            "analytics_driven": analytics_snapshot is not None,
        }

        # Auto-save
        self._autosave(strategy, period)
        return strategy

    # ── Optimization ─────────────────────────────────────────

    def generate_optimizations(self, analytics_data: Dict) -> List[Dict]:
        """Analisis data dan generate rekomendasi optimasi."""

        prompt = f"""
Analisis data performa marketing Casha berikut dan berikan rekomendasi optimasi:

DATA ANALYTICS:
{json.dumps(analytics_data, indent=2, ensure_ascii=False)}

Berikan rekomendasi dalam format JSON:
{{
  "optimizations": [
    {{
      "category": "content/posting_time/hashtag/platform/budget",
      "priority": "HIGH/MEDIUM/LOW",
      "issue": "Masalah yang teridentifikasi",
      "recommendation": "Rekomendasi spesifik",
      "expected_impact": "Dampak yang diharapkan",
      "implementation": "Cara implementasi"
    }}
  ],
  "quick_wins": ["Tindakan cepat yang bisa dilakukan hari ini"],
  "cmo_verdict": "Penilaian CMO tentang performa saat ini"
}}
"""

        response = self.client.chat.completions.create(
            model=self.ai_config.get("model", "gpt-4o"),
            messages=[
                {"role": "system", "content": STRATEGIST_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)
        return result.get("optimizations", [])

    def apply_optimizations(self, optimizations: List[Dict]) -> None:
        """Terapkan optimasi ke konfigurasi (simulasi)."""
        logger.info(f"Applying {len(optimizations)} optimizations...")
        # Implementasi nyata: update config.yaml, reschedule posts, dll.
        console.print(f"[green]✓ {len(optimizations)} optimasi diterapkan[/green]")

    # ── Display ──────────────────────────────────────────────

    def display_strategy(self, strategy: Dict) -> None:
        """Tampilkan strategi dengan format Rich yang elegan."""
        console.print()
        console.print(Panel(
            f"[bold #2E7D32]📋 STRATEGI MARKETING CASHA[/bold #2E7D32]\n"
            f"[dim]Periode: {strategy.get('period', '').upper()} • "
            f"Generated: {datetime.now().strftime('%d %B %Y %H:%M')}[/dim]",
            border_style="#2E7D32",
            padding=(1, 2),
        ))

        # Executive Summary
        console.print()
        console.print(Panel(
            f"[bold]🎯 Executive Summary[/bold]\n\n{strategy.get('executive_summary', '')}",
            border_style="dim",
            padding=(1, 2),
        ))

        # Key Themes
        themes = strategy.get("key_themes", [])
        if themes:
            console.print()
            console.print("[bold]💡 Key Themes:[/bold]")
            for i, t in enumerate(themes, 1):
                console.print(f"  [#2E7D32]{i}.[/#2E7D32] {t}")

        # Content Ideas Table
        ideas = strategy.get("content_ideas", [])
        if ideas:
            console.print()
            table = Table(
                title="✍️  Content Ideas",
                box=box.ROUNDED,
                border_style="#2E7D32",
                header_style="bold #2E7D32",
                show_lines=True,
            )
            table.add_column("Platform", style="bold", width=10)
            table.add_column("Format", width=10)
            table.add_column("Pillar", width=12)
            table.add_column("Hook", width=50)

            for idea in ideas[:8]:  # tampilkan max 8
                table.add_row(
                    idea.get("platform", "").capitalize(),
                    idea.get("format", ""),
                    idea.get("pillar", ""),
                    idea.get("hook", ""),
                )
            console.print(table)

        # KPI Targets
        kpis = strategy.get("kpi_targets", {})
        if kpis:
            console.print()
            table2 = Table(
                title="🎯 KPI Targets",
                box=box.SIMPLE_HEAVY,
                border_style="green",
                header_style="bold green",
            )
            table2.add_column("Metrik")
            table2.add_column("Target", style="green")
            for k, v in kpis.items():
                table2.add_row(k.replace("_", " ").title(), str(v))
            console.print(table2)

        # Growth Roadmap
        roadmap = strategy.get("growth_roadmap", {})
        if roadmap:
            console.print()
            console.print(Panel(
                f"[bold cyan]🚀 Growth Roadmap[/bold cyan]\n\n"
                f"[bold]Kondisi saat ini:[/bold] {roadmap.get('current_state', '')}\n"
                f"[bold]Bottleneck:[/bold] [red]{roadmap.get('bottleneck', '')}[/red]\n"
                f"[bold]Primary Lever:[/bold] [green]{roadmap.get('primary_lever', '')}[/green]\n\n"
                f"[bold]Milestone:[/bold]\n"
                f"  • Minggu 1: {roadmap.get('milestone_week_1', '')}\n"
                f"  • Minggu 2: {roadmap.get('milestone_week_2', '')}\n"
                f"  • Akhir Bulan: {roadmap.get('milestone_week_4', '')}",
                border_style="cyan",
                padding=(1, 2),
            ))

        # Action Items
        actions = strategy.get("action_items", [])
        if actions:
            console.print()
            console.print("[bold]📌 Action Items:[/bold]")
            for a in actions:
                priority_color = {"HIGH": "red", "MEDIUM": "yellow", "LOW": "green"}.get(
                    a.get("priority", "MEDIUM"), "white"
                )
                console.print(
                    f"  [{priority_color}]●[/{priority_color}] "
                    f"[bold]{a.get('task', '')}[/bold] "
                    f"[dim]– {a.get('deadline', '')}[/dim]"
                )

        # CMO Notes
        notes = strategy.get("cmo_notes", "")
        if notes:
            console.print()
            console.print(Panel(
                f"[bold yellow]💬 CMO Notes[/bold yellow]\n\n{notes}",
                border_style="yellow",
                padding=(1, 2),
            ))

    def display_optimizations(self, optimizations: List[Dict]) -> None:
        """Tampilkan rekomendasi optimasi."""
        if not optimizations:
            console.print("[yellow]Tidak ada rekomendasi optimasi saat ini.[/yellow]")
            return

        console.print()
        table = Table(
            title="🔮 Rekomendasi Optimasi AI CMO",
            box=box.ROUNDED,
            border_style="#2E7D32",
            header_style="bold #2E7D32",
            show_lines=True,
        )
        table.add_column("Prioritas", width=8)
        table.add_column("Kategori", width=12)
        table.add_column("Rekomendasi", width=45)
        table.add_column("Dampak", width=25)

        for opt in optimizations:
            p = opt.get("priority", "MEDIUM")
            color = {"HIGH": "red", "MEDIUM": "yellow", "LOW": "green"}.get(p, "white")
            table.add_row(
                f"[{color}]{p}[/{color}]",
                opt.get("category", "").capitalize(),
                opt.get("recommendation", ""),
                opt.get("expected_impact", ""),
            )

        console.print(table)

    # ── Persistence ──────────────────────────────────────────

    def _autosave(self, strategy: Dict, period: str) -> None:
        """Simpan strategi otomatis ke disk."""
        filename = self.output_dir / f"strategy_{period}_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(strategy, f, ensure_ascii=False, indent=2)
        logger.info(f"Strategy saved to {filename}")

    def save_strategy(self, strategy: Dict, path: str) -> None:
        """Simpan strategi ke path tertentu."""
        with open(path, "w", encoding="utf-8") as f:
            json.dump(strategy, f, ensure_ascii=False, indent=2)
