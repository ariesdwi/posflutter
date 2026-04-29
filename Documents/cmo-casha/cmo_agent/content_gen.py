"""
cmo_agent/content_gen.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Content Generator
Menggunakan AI untuk menghasilkan konten marketing berkualitas tinggi:
caption, hook, hashtag, script video, dan brief visual.
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from openai import OpenAI
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.rule import Rule
from rich import box

from utils.config_loader import load_config
from utils.logger import setup_logger

console = Console()
logger = setup_logger()


# ── System Prompt ────────────────────────────────────────────
CONTENT_SYSTEM_PROMPT = """
Kamu adalah Content Creator & Copywriter expert untuk Casha – 
aplikasi keuangan personal berbasis AI untuk pasar Indonesia.

Spesialisasimu:
- Menulis caption Instagram yang engaging dengan hook yang kuat
- Membuat script TikTok yang viral dan relatable
- Konten LinkedIn profesional namun tetap personal
- Copywriting yang menggunakan psikologi persuasi

Prinsip Konten Casha & Framework Wajib:
1. HOOK FORMULAS (Wajib gunakan salah satu dari ini):
   - Curiosity Hook: "Saya dulu salah besar soal [mitos keuangan]..." atau "Alasan sebenarnya kamu gagal nabung bukanlah [hal umum]."
   - Story Hook: "3 tahun lalu gaji saya numpang lewat. Hari ini..." atau "Kemarin, saya hampir [kesalahan finansial besar]."
   - Value Hook: "Cara [hasil yang diinginkan] tanpa [pain point umum]:" atau "Stop [kesalahan]. Lakukan ini:"
   - Contrarian Hook: "Unpopular opinion: [pernyataan berani soal uang]" atau "[Nasihat umum] itu salah. Ini alasannya:"

2. ATURAN FORMATTING & VISUAL:
   - DILARANG KERAS menggunakan formatting markdown seperti **bold** atau *italic* di dalam teks/caption. Gunakan ALL CAPS atau emoji untuk penekanan.
   - Gunakan bullet points dan spasi antar paragraf untuk readability.
   - Untuk video/Reels: default NO SHOOTING (tanpa tampil muka talent). Prioritaskan motion graphics, stock footage, ilustrasi digital, dan screencast app.
   - Ekstrak ide menjadi "Content Atoms": Quotable moments, Story arcs, atau Tactical tips.

3. CTA (Call To Action):
   - CTA harus super jelas di akhir (contoh: "Klik link di bio untuk download Casha gratis!").
   - Sentuh emosi pembaca: rasa takut rugi (FOMO), ingin bebas finansial, dll.
   - Tone: Friendly, helpful, relatable, tidak menggurui.
"""

# ── Platform Specs ───────────────────────────────────────────
PLATFORM_SPECS = {
    "instagram": {
        "caption_length": "150-300 kata",
        "hashtags": "20-30 hashtag",
        "formats": ["single image", "carousel", "reel"],
        "ideal_cta": "Klik link di bio untuk download Casha gratis!",
        "image_sizes": {
            "feed_square": "1080 x 1080 px (1:1)",
            "feed_portrait": "1080 x 1350 px (4:5) – REKOMENDASI",
            "carousel": "1080 x 1350 px (4:5)",
            "story_reel": "1080 x 1920 px (9:16)",
            "landscape": "1080 x 566 px (1.91:1)",
        },
    },
    "tiktok": {
        "caption_length": "50-100 kata",
        "hashtags": "5-10 hashtag",
        "formats": ["video 15-60 detik"],
        "ideal_cta": "Follow untuk tips keuangan tiap hari!",
        "script_duration": "30-45 detik",
    },
    "linkedin": {
        "caption_length": "200-400 kata",
        "hashtags": "5-10 hashtag",
        "formats": ["text", "article", "carousel"],
        "ideal_cta": "Download Casha dan mulai perjalanan keuanganmu!",
    },
}

# ── Content Templates ─────────────────────────────────────────
CONTENT_PILLARS_MAP = {
    "tips": "Tips Keuangan",
    "fitur": "Fitur Casha",
    "motivasi": "Motivasi Finansial",
    "edukasi": "Edukasi Investasi",
    "auto": None,  # AI pilih sendiri
}


class ContentGenerator:
    """AI-powered Content Generator untuk Casha."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.brand = config.get("brand", {})
        self.ai_config = config.get("ai", {})
        
        # Support both Gemini and OpenAI via OpenAI SDK
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if gemini_api_key:
            self.client = OpenAI(
                api_key=gemini_api_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
            )
            # Default model for Gemini if a GPT model was set in config
            if "model" not in self.ai_config or "gpt" in self.ai_config.get("model", ""):
                self.ai_config["model"] = "gemini-2.5-flash"
            logger.info("Using Gemini API for content generation")
        else:
            self.client = OpenAI(api_key=openai_api_key)
            logger.info("Using OpenAI API for content generation")
            
        self.queue_dir = Path(config.get("scheduler", {}).get("queue_dir", "data/queue"))
        self.queue_dir.mkdir(parents=True, exist_ok=True)

    # ── Public API ───────────────────────────────────────────

    def generate_batch(
        self,
        pillar: str = "auto",
        platform: str = "instagram",
        count: int = 3,
        topic: Optional[str] = None,
        format_type: str = "auto",
      no_shooting: bool = True,
    ) -> List[Dict[str, Any]]:
        """Generate batch konten siap posting."""
        contents = []

        platforms = (
            ["instagram", "tiktok", "linkedin"]
            if platform == "all"
            else [platform]
        )

        generated = 0
        p_idx = 0
        while generated < count:
            plat = platforms[p_idx % len(platforms)]
            content = self.generate_single(
                platform=plat,
                pillar=pillar,
                topic=topic,
                format_type=format_type,
              no_shooting=no_shooting,
            )
            contents.append(content)
            generated += 1
            p_idx += 1

        logger.info(f"Generated {len(contents)} content pieces")
        return contents

    def generate_single(
        self,
        platform: str = "instagram",
        pillar: str = "auto",
        topic: Optional[str] = None,
        format_type: str = "auto",
      no_shooting: bool = True,
    ) -> Dict[str, Any]:
        """Generate satu konten lengkap untuk platform tertentu."""

        pillar_name = CONTENT_PILLARS_MAP.get(pillar)
        content_pillars = self.config.get("content", {}).get("content_pillars", [])
        
        pillars_info = "\n".join([
            f"- {p['name']}: {p['description']}"
            for p in content_pillars
        ])

        specs = PLATFORM_SPECS.get(platform, PLATFORM_SPECS["instagram"])
        topic_note = f"Topik spesifik: {topic}" if topic else ""
        pillar_note = f"Gunakan pillar: {pillar_name}" if pillar_name else "Pilih pillar yang paling relevan"

        # Brand colors for visual brief
        brand_colors = self.brand.get('colors', {})
        colors_info = ""
        if brand_colors:
            colors_info = (
                f"\nBRAND COLORS CASHA (selaras App/UI/Theme/Colors.swift – tema hijau finance-growth):\n"
                f"- Primary / cashaPrimary (Hijau Brand): {brand_colors.get('primary', '#2E7D32')}\n"
                f"- Accent / cashaAccent (Hijau Aksen): {brand_colors.get('accent', '#4CAF50')}\n"
                f"- Background / cashaBackground (Putih): {brand_colors.get('background', '#FFFFFF')}\n"
                f"- Card / cashaCard (Abu Muda): {brand_colors.get('card', '#EFF0F1')}\n"
                f"- Text Primary / cashaTextPrimary (Hitam Lembut): {brand_colors.get('text_primary', '#212121')}\n"
                f"- Text Secondary / cashaTextSecondary (Abu): {brand_colors.get('text_secondary', '#757575')}\n"
                f"- Success / cashaSuccess (Pemasukan): {brand_colors.get('success', '#2E7D32')}\n"
                f"- Danger / cashaDanger (Pengeluaran/Error): {brand_colors.get('danger', '#F44336')}\n"
                f"- Gradient Marketing: {brand_colors.get('gradient_start', '#2E7D32')} → {brand_colors.get('gradient_end', '#4CAF50')}\n"
                f"Aturan: gunakan Primary/Accent hanya untuk CTA & aksen (hindari flood layar); "
                f"Success/Danger hanya untuk state feedback; jaga kontras WCAG AA.\n"
            )

        # Typography for visual brief
        typography = self.brand.get('typography', {})
        usage = typography.get('usage', {})
        fonts_info = ""
        if typography:
            fonts_info = (
                f"\nBRAND TYPOGRAPHY CASHA:\n"
                f"- Font Utama: {typography.get('primary_font', 'Plus Jakarta Sans')} (Google Fonts)\n"
                f"- Font Pendukung: {typography.get('secondary_font', 'Inter')}\n"
                f"- Font Aksen: {typography.get('accent_font', 'Poppins')} (untuk quote/highlight)\n"
                f"Panduan penggunaan:\n"
                f"  • Headline: {usage.get('headline', 'Plus Jakarta Sans – Bold 700 – 48-64px')}\n"
                f"  • Subheadline: {usage.get('subheadline', 'Plus Jakarta Sans – SemiBold 600 – 28-36px')}\n"
                f"  • Body text: {usage.get('body', 'Inter – Regular 400 – 14-16px')}\n"
                f"  • Caption: {usage.get('caption', 'Inter – Regular 400 – 12px')}\n"
                f"  • CTA Button: {usage.get('cta_button', 'Plus Jakarta Sans – Bold 700 – 16px')}\n"
                f"  • Quote: {usage.get('quote', 'Poppins – SemiBold Italic 600i – 20-24px')}\n"
                f"  • Label/Tag: {usage.get('label_tag', 'Inter – Medium 500 – 12px – UPPERCASE')}\n"
            )

        # Build platform-specific prompt
        # Deteksi apakah format Reels/video
        topic_lower = (topic or "").lower()
        is_reels = (
            format_type.lower() in ["video", "reels", "reel"]
            or (format_type == "auto" and ("reels" in topic_lower or "reel" in topic_lower or "video" in topic_lower))
        )
        is_video = is_reels or (format_type == "auto" and platform == "tiktok") or (format_type.lower() == "video")

        json_schema = None  # None = gunakan flat template + extra

        if is_video:
            # ── TikTok video ─────────────────────────────────────────────────
            extra = """,
  "caption_short": "Versi pendek caption khusus TikTok (maks 5 baris)",
  "hook_visual": "Deskripsi scene visual saat hook diucapkan (0–3 detik pertama)",
  "carousel_slides": null,
  "hashtags": {
    "branded": ["#CashaIndonesia"],
    "niche": ["#KeuanganCerdas", "#TipsKeuangan"],
    "volume_tinggi": ["#FinancialFreedom", "#fyp"],
    "trending": ["#CaraMenabung", "#UangPintar"]
  },
  "cta_primary": "Follow untuk tips keuangan tiap hari!",
  "cta_secondary": "Simpan video ini! 🔖",
  "best_post_time": {
    "primary": "19:00 WIB",
    "secondary": "22:00 WIB"
  },
  "content_score": {
    "engagement_potential": 85,
    "brand_alignment": 90,
    "relatability": 88,
    "shareability": 82,
    "educational_value": 90,
    "cmo_recommendation": "Komentar singkat CMO"
  },
  "video_production": {
    "production_constraint": "NO SHOOTING (tanpa footage real/talent kamera)",
    "asset_strategy": "Motion Graphics + Stock Video + Screencast App",
    "duration_seconds": 30,
    "fps": 30,
    "scene_breakdown": [
      {
        "scene": 1,
        "duration_sec": 3,
        "visual": "Stock video dompet kosong + teks hook bold",
        "color_palette": ["#2E7D32", "#FFFFFF"],
        "vo": "Kalimat hook"
      },
      {
        "scene": 2,
        "duration_sec": 4,
        "visual": "Stock video orang sibuk + subtitle kontras",
        "color_palette": ["#FFFFFF", "#212121"],
        "vo": "Validasi masalah"
      },
      {
        "scene": 3,
        "duration_sec": 4,
        "visual": "Motion graphic teks besar untuk pattern interrupt",
        "color_palette": ["#2E7D32", "#FFFFFF"],
        "vo": "Transisi ke solusi"
      }
    ],
    "bgm_mood": "upbeat / motivational",
    "transition_style": "quick cut + zoom punch",
    "subtitle_style": {"font": "Inter Bold", "color": "#FFFFFF", "position": "center-bottom"},
    "source_recommendation": {
      "stock_video": "Pexels/Pixabay",
      "motion_tool": "CapCut/Canva",
      "illustration_source": "Canva/Freepik/Flaticon",
      "app_demo": "Screencast penggunaan fitur Casha"
    }
  },
  "target_persona": {
    "segment": "Segmen spesifik target",
    "age_range": "18–25",
    "pain_point": "Pain point spesifik"
  },
  "reference_content": ["URL atau judul konten viral sejenis"],
  "brand_safety_notes": "Hindari klaim return investasi spesifik (regulasi OJK)."
"""
        elif platform == "instagram":
            # ── Instagram carousel / single image ───────────────────────────
            sizes = specs.get('image_sizes', {})
            sizes_info = '\\n'.join([f"  • {k.replace('_', ' ').title()}: {v}" for k, v in sizes.items()])
            extra = f""",
  "carousel_slides": ["slide 1", "slide 2"],
  "hashtags": {{
    "branded": ["#CashaIndonesia"],
    "niche": ["#KeuanganCerdas"],
    "volume_tinggi": ["#FinancialFreedom"],
    "trending": ["#TipsKeuangan"]
  }},
  "cta_primary": "Klik link di bio untuk download Casha gratis!",
  "cta_secondary": "Simpan post ini! 🔖",
  "best_post_time": {{
    "primary": "19:00 WIB",
    "secondary": "12:00 WIB"
  }},
  "content_score": {{
    "engagement_potential": 85,
    "brand_alignment": 90,
    "relatability": 85,
    "shareability": 80,
    "educational_value": 85,
    "cmo_recommendation": "Komentar singkat CMO"
  }},
  "visual_brief": {{
    "brand_colors": {{
      "primary": "#2E7D32",
      "accent": "#4CAF50",
      "background": "#FFFFFF",
      "text_primary": "#212121"
    }},
    "image_dimensions": "Feed Portrait: 1080 x 1350 px (4:5) — REKOMENDASI\\nOpsi lain:\\n{sizes_info}",
    "layout_guidelines": "Deskripsi layout, grid, hierarki elemen per slide",
    "typography": {{
      "headline": "Plus Jakarta Sans – Bold (700) – 48px",
      "body_text": "Inter – Regular (400) – 16px",
      "cta_button": "Plus Jakarta Sans – Bold (700) – 16px"
    }},
    "visual_elements": "Deskripsi elemen visual utama"
  }}
"""
        else:
            extra = """,
  "article_outline": ["poin 1", "poin 2"]
"""

        video_mode_instructions = ""
        if no_shooting:
            video_mode_instructions = """
- Jika format video/Reels: WAJIB no-shooting (jangan minta filming real atau tampil muka talent).
- Untuk video/Reels, utamakan kombinasi Motion Graphics + Stock Video + Screencast app Casha.
- Baseline scene video yang harus diikuti:
  1) Segmen problem dompet kosong -> stock video
  2) Segmen orang sibuk/overwhelmed -> stock video
  3) Segmen pattern interrupt -> motion graphic teks bold
- Alternatif visual tambahan: ilustrasi/sketsa digital atau slideshow/presentasi bergerak.
"""
        else:
            video_mode_instructions = """
- Untuk video/Reels, kamu BOLEH gunakan footage shooting real atau on-camera talent jika relevan,
  namun tetap boleh kombinasi dengan stock footage, motion graphics, ilustrasi, dan screencast app.
"""

        prompt = f"""
Buat konten marketing untuk Casha di platform {platform.upper()}.

BRAND:
- Nama: {self.brand.get('name', 'Casha')}
- Tagline: {self.brand.get('tagline', '')}
- Target: {self.brand.get('target_audience', {}).get('primary', '')}
- Pain points audiens: {', '.join(self.brand.get('target_audience', {}).get('pain_points', []))}
- Brand voice: {self.brand.get('voice', {}).get('style', '')}
{colors_info}{fonts_info}

CONTENT PILLARS TERSEDIA:
{pillars_info}

INSTRUKSI:
- {pillar_note}
- {topic_note}
- Panjang caption: {specs['caption_length']}
- Format hashtag: {specs['hashtags']}
- CTA: {specs['ideal_cta']}
{video_mode_instructions}

Hasilkan dalam format JSON:
{json_schema if json_schema else f'''{{
  "id": "auto-generated",
  "platform": "{platform}",
  "pillar": "nama pillar yang dipilih",
  "topic": "topik konten",
  "format": "jenis format konten (Reels / carousel / single image / video)",
  "hook": "kalimat pembuka yang sangat menarik (1-2 kalimat)",
  "caption": "caption lengkap siap posting",
  "best_post_time": "waktu terbaik posting (misal: 19:00 WIB)"{extra}
}}'''}
"""

        response = self.client.chat.completions.create(
            model=self.ai_config.get("model", "gpt-4o"),
            messages=[
                {"role": "system", "content": CONTENT_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=self.ai_config.get("temperature", 0.85),
            max_tokens=4000 if json_schema else self.ai_config.get("max_tokens", 2000),
            response_format={"type": "json_object"},
        )

        content = json.loads(response.choices[0].message.content)
        
        # Enrich dengan metadata
        content["id"] = str(uuid.uuid4())[:8].upper()
        content["created_at"] = datetime.now().isoformat()
        content["status"] = "pending"
        content["platform"] = platform

        # Tambahkan signature otomatis ke setiap caption
        signature = """

Casha 💸  
Smart way to track your money  

📊 Track expenses & control your finance  
🤖 AI-powered money insights  

Download now:  
🍎 App Store: https://apps.apple.com/id/app/cashaapp/id6754607757  
🤖 Play Store: https://play.google.com/store/apps/details?id=com.casha.app  

Follow us:  
IG: @cashaapps  
TikTok: @cashaapp  
Threads: @cashaapps  
YouTube: @cashaapps"""

        if "caption" in content and isinstance(content["caption"], str):
            content["caption"] += signature
        elif "caption_short" in content and isinstance(content["caption_short"], str):
            content["caption_short"] += signature

        if "content" in content and isinstance(content["content"], dict):
            if "caption_reels" in content["content"] and isinstance(content["content"]["caption_reels"], str):
                content["content"]["caption_reels"] += signature
            elif "caption" in content["content"] and isinstance(content["content"]["caption"], str):
                content["content"]["caption"] += signature

        return content

    # ── Queue Management ─────────────────────────────────────

    def save_to_queue(self, contents: List[Dict]) -> int:
      """Simpan konten ke antrian posting."""
      saved = 0
      for content in contents:
        platform = content.get("platform", "unknown")
        content_id = content.get("id")
        platform_dir = self.queue_dir / platform
        platform_dir.mkdir(parents=True, exist_ok=True)

        # Auto-create asset folder for each queued content.
        if content_id:
          asset_dir = Path("data/assets") / platform / content_id
          asset_dir.mkdir(parents=True, exist_ok=True)

        filename = platform_dir / f"{content['id']}_{datetime.now().strftime('%Y%m%d')}.json"
        with open(filename, "w", encoding="utf-8") as f:
          json.dump(content, f, ensure_ascii=False, indent=2)
        saved += 1
        logger.info(f"Content {content['id']} saved to queue")

      return saved

    # ── Display ──────────────────────────────────────────────

    def display_contents(self, contents: List[Dict]) -> None:
        """Tampilkan konten yang digenerate dengan format Rich."""
        console.print()
        
        for i, content in enumerate(contents, 1):
            platform = content.get("platform", "unknown").upper()
            platform_colors = {
                "INSTAGRAM": "#E1306C",
                "TIKTOK": "#69C9D0",
                "LINKEDIN": "#0077B5",
            }
            color = platform_colors.get(platform, "#2E7D32")

            console.print(Rule(
                f"[bold {color}]📱 {platform} – Konten #{i} (ID: {content.get('id')})[/bold {color}]",
                style=color,
            ))
            console.print()

            # Pillar & Topic
            console.print(
                f"  [bold]📌 Pillar:[/bold] {content.get('pillar', '')}  "
                f"[bold]🏷  Topik:[/bold] {content.get('topic', '')}  "
                f"[bold]📐 Format:[/bold] {content.get('format', '')}"
            )
            console.print()

            # Deteksi nested schema (Reels baru)
            c = content.get("content") or content  # nested or flat
            vp = content.get("video_production", {})
            dist = content.get("distribution", {})

            # Hook
            hook_text = c.get("hook") or content.get("hook", "")
            console.print(Panel(
                f"[bold yellow]🎣 HOOK[/bold yellow]\n\n{hook_text}",
                border_style="yellow",
                padding=(1, 2),
            ))

            # Caption
            caption = c.get("caption_reels") or content.get("caption", "")
            if len(caption) > 600:
                caption = caption[:600] + "...\n[dim](caption dipotong untuk preview)[/dim]"
            console.print(Panel(
                f"[bold]✍️  CAPTION[/bold]\n\n{caption}",
                border_style=color,
                padding=(1, 2),
            ))

            # Script / Video Production
            script = content.get("script", "")
            if not script and vp:
                scenes = vp.get("scene_breakdown", [])
                if scenes:
                    lines = [f"⏱ {s.get('timestamp','scene '+str(s.get('scene','')))} — [{s.get('label','')}]" for s in scenes]
                    script = "\n".join(lines)
                
            if script:
                console.print(Panel(
                    f"[bold cyan]🎬 SCRIPT / VIDEO PROD[/bold cyan]\n\n{script}",
                    border_style="cyan",
                    padding=(1, 2),
                ))

            # Hashtags — support flat list or grouped dict, nested or flat
            hashtags = c.get("hashtags") or content.get("hashtags", [])
            if isinstance(hashtags, dict):
                all_tags = [t for tags in hashtags.values() for t in tags]
                console.print(f"  [bold]🏷  Hashtags:[/bold] [dim]{' '.join(all_tags[:15])}[/dim]")
            elif hashtags:
                console.print(f"  [bold]🏷  Hashtags:[/bold] [dim]{' '.join(hashtags[:15])}[/dim]")

            # Best post time — nested in distribution or flat
            bpt = dist.get("best_post_time") or content.get("best_post_time", "")
            bpt_display = bpt.get("primary", "") if isinstance(bpt, dict) else bpt

            # Score
            score = content.get("content_score", {})
            if score:
                console.print(
                    f"\n  [bold]📊 Score:[/bold]  "
                    f"Engagement: [green]{score.get('engagement_potential', 0)}%[/green]  "
                    f"Brand Fit: [green]{score.get('brand_alignment', 0)}%[/green]  "
                    f"Relatability: [green]{score.get('relatability', '–')}%[/green]  "
                    f"⏰ Best time: [cyan]{bpt_display}[/cyan]"
                )
                cmo_note = score.get("cmo_recommendation", "")
                if cmo_note:
                    console.print(f"  [dim]💬 CMO: {cmo_note}[/dim]")

            console.print()
