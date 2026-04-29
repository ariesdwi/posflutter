"""
platforms/linkedin.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – LinkedIn Platform Integration
Posting ke LinkedIn Company Page via LinkedIn API v2.
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict

import requests

from utils.logger import setup_logger

logger = setup_logger()

LINKEDIN_API_BASE = "https://api.linkedin.com/v2"


class LinkedInPoster:
    """LinkedIn posting handler untuk Casha."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.li_config = config.get("platforms", {}).get("linkedin", {})
        
        self.access_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
        self.org_id = os.getenv("LINKEDIN_ORGANIZATION_ID")
        self.has_credentials = bool(self.access_token and self.org_id)

    def post(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Post ke LinkedIn Company Page."""
        if self.has_credentials:
            return self._post_via_api(content)
        return self._simulate_post(content)

    def _post_via_api(self, content: Dict) -> Dict:
        """Post via LinkedIn Marketing API."""
        caption = self._build_post(content)
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

        body = {
            "author": f"urn:li:organization:{self.org_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": caption},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            },
        }

        resp = requests.post(
            f"{LINKEDIN_API_BASE}/ugcPosts",
            headers=headers,
            json=body,
        )
        resp.raise_for_status()
        post_id = resp.headers.get("x-restli-id", resp.json().get("id", ""))

        logger.info(f"LinkedIn post published: {post_id}")
        return {
            "post_id": post_id,
            "platform": "linkedin",
            "method": "ugc_api",
            "posted_at": datetime.now().isoformat(),
        }

    def _build_post(self, content: Dict) -> str:
        """Format teks lengkap untuk LinkedIn."""
        caption = content.get("caption", "")
        hashtags = " ".join(content.get("hashtags", [])[:10])
        cta = content.get("cta", "")
        
        parts = [caption]
        if cta and cta not in caption:
            parts.append(f"\n\n{cta}")
        if hashtags:
            parts.append(f"\n\n{hashtags}")
        
        return "\n".join(parts)[:3000]  # LinkedIn limit 3000 chars

    def _simulate_post(self, content: Dict) -> Dict:
        """Demo mode."""
        return {
            "post_id": f"LI_DEMO_{content.get('id', 'XX')}",
            "platform": "linkedin",
            "method": "simulated",
            "posted_at": datetime.now().isoformat(),
            "note": "Demo mode – LinkedIn credentials belum dikonfigurasi",
        }

    def get_page_analytics(self, start_date: str, end_date: str) -> Dict:
        """Ambil analytics Company Page dari LinkedIn."""
        if not self.has_credentials:
            return {"status": "demo", "followers": 3180}
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {
            "q": "organizationalPage",
            "organizationalPage": f"urn:li:organization:{self.org_id}",
            "timeIntervals.timeGranularityType": "DAY",
            "timeIntervals.timeRange.start": start_date,
            "timeIntervals.timeRange.end": end_date,
        }
        resp = requests.get(
            f"{LINKEDIN_API_BASE}/organizationalEntityShareStatistics",
            headers=headers,
            params=params,
        )
        return resp.json()
