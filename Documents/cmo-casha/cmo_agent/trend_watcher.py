"""
cmo_agent/trend_watcher.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Trend Watcher
Membaca tren terbaru dari portal berita (RSS) dan web untuk 
men-generate marketing angle yang up-to-date (Trend-Jacking).
═══════════════════════════════════════════════════════════════
"""

import json
import os
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any, Dict, List

import requests
from openai import OpenAI
from rich.console import Console

from utils.logger import setup_logger

console = Console()
logger = setup_logger()

class TrendWatcher:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.ai_config = config.get("ai", {})
        self.brand = config.get("brand", {})
        
        # Support both Gemini and OpenAI
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if gemini_api_key:
            self.client = OpenAI(
                api_key=gemini_api_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
            )
        else:
            self.client = OpenAI(api_key=openai_api_key)

    def fetch_current_trends(self) -> List[Dict[str, str]]:
        """Fetch berita terbaru dari RSS feeds (CNBC Indonesia / Bisnis)."""
        trends = []
        rss_urls = [
            "https://www.cnbcindonesia.com/investment/rss",
            "https://www.cnbcindonesia.com/mymoney/rss"
        ]
        
        for url in rss_urls:
            try:
                resp = requests.get(url, timeout=10)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.content)
                    for item in root.findall('.//item')[:5]:  # Ambil 5 berita per feed
                        title = item.find('title').text if item.find('title') is not None else ""
                        desc = item.find('description').text if item.find('description') is not None else ""
                        link = item.find('link').text if item.find('link') is not None else ""
                        
                        if title:
                            trends.append({
                                "title": title,
                                "description": desc,
                                "link": link
                            })
            except Exception as e:
                logger.warning(f"Gagal mengambil RSS {url}: {e}")
                
        # Fallback jika tidak ada internet/gagal
        if not trends:
            trends = [
                {"title": "Pajak Naik, Milenial Sulit Nabung untuk Beli Rumah", "description": "Kenaikan PPN membuat pengeluaran membengkak."},
                {"title": "Tren Frugal Living Kembali Ramai di TikTok", "description": "Banyak pekerja muda membagikan tips hidup hemat ekstrim."},
                {"title": "Isu Pemotongan Gaji untuk Tapera Kembali Mengemuka", "description": "Reaksi netizen terkait potongan wajib bagi pekerja."}
            ]
            
        return trends

    def generate_trend_jacking_ideas(self) -> List[Dict[str, str]]:
        """Menganalisis berita terbaru dan membuat ide konten (news-jacking)."""
        console.print("[dim]🔄 Fetching real-time market trends...[/dim]")
        trends = self.fetch_current_trends()
        
        if not trends:
            return []

        news_text = "\n".join([f"- {t['title']}: {t['description']}" for t in trends[:8]])

        prompt = f"""
Kamu adalah CMO AI untuk Casha (Aplikasi Keuangan Personal).
Tugasmu adalah menganalisis berita/tren terkini di bawah ini dan merumuskan 3 ide konten "Trend-Jacking" (menunggangi isu viral) yang sangat relevan untuk diposting di TikTok atau Instagram.

BERITA TERKINI:
{news_text}

BRAND VOICE CASHA: {self.brand.get('voice', {}).get('style', 'Edukasi santai, relatable')}

Buatlah output dalam format JSON:
{{
  "trend_jacking_ideas": [
    {{
      "trend_topic": "Topik berita yang diangkat",
      "platform": "tiktok / instagram",
      "hook": "Kalimat pertama (hook) yang langsung nyambung dengan berita tersebut",
      "marketing_angle": "Penjelasan singkat bagaimana mengaitkan berita ini dengan fitur aplikasi Casha",
      "urgency_level": "High/Medium"
    }}
  ]
}}
"""
        console.print("[dim]🧠 AI sedang merumuskan angle marketing berdasarkan tren...[/dim]")
        
        response = self.client.chat.completions.create(
            model=self.ai_config.get("model", "gpt-4o"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("trend_jacking_ideas", [])
