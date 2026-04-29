"""
platforms/tiktok.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – TikTok Platform Integration

Flow:
  1. Upload video ke Cloudinary → dapat public URL
  2. POST ke Content Posting API dengan source PULL_FROM_URL
  3. Poll status sampai PUBLISH_COMPLETE / FAILED

Env yang dibutuhkan:
  TIKTOK_CLIENT_KEY      – dari TikTok Developer Portal
  TIKTOK_CLIENT_SECRET   – dari TikTok Developer Portal
  TIKTOK_ACCESS_TOKEN    – dari OAuth flow (utils/tiktok_auth.py)
  TIKTOK_OPEN_ID         – open_id user (dikembalikan saat OAuth)
  TIKTOK_REFRESH_TOKEN   – untuk auto-refresh saat token expired

Untuk mendapatkan token pertama kali:
  python utils/tiktok_auth.py url
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import os
import time
from datetime import datetime
from typing import Any, Dict

import requests

from utils.logger import setup_logger

logger = setup_logger()

_PUBLISH_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"
_PUBLISH_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"
_INBOX_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"
_PHOTO_PUBLISH_URL = "https://open.tiktokapis.com/v2/post/publish/content/init/"


class TikTokPoster:
    """TikTok posting handler untuk Casha via Content Posting API."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.tt_config = config.get("platforms", {}).get("tiktok", {})

        self.client_key = os.getenv("TIKTOK_CLIENT_KEY", "").strip()
        self.client_secret = os.getenv("TIKTOK_CLIENT_SECRET", "").strip()
        self.access_token = os.getenv("TIKTOK_ACCESS_TOKEN", "").strip()
        self.open_id = os.getenv("TIKTOK_OPEN_ID", "").strip()
        self.refresh_token = os.getenv("TIKTOK_REFRESH_TOKEN", "").strip()
        self.draft_only = bool(self.tt_config.get("draft_only", True))

        self.has_credentials = bool(self.access_token)

    # ── Public entry point ──────────────────────────────────

    def post(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Post video ke TikTok."""
        if not self.has_credentials:
            logger.warning("TikTok access_token tidak ditemukan – demo mode")
            return self._simulate_post(content)

        video_path = str(content.get("video_path", "") or "")
        image_paths = content.get("image_paths") or []
        has_video = bool(video_path and os.path.exists(video_path))
        has_images = bool(image_paths)

        # Konten foto/carousel (tidak ada video) → gunakan Photo Post API
        if not has_video and has_images:
            logger.info("Konten photo/carousel terdeteksi, menggunakan TikTok Photo Post API")
            return self._post_photo_carousel(content)

        if self.draft_only:
            if has_video:
                logger.info("TikTok draft_only aktif: upload ke inbox/draft")
                return self._post_via_file_upload(content)
            logger.warning(
                "TikTok draft_only aktif tapi video_path tidak valid, fallback ke auto publish"
            )

        return self._post_via_url(content)

    # ── Posting via public URL (Cloudinary) ─────────────────

    def _post_via_url(self, content: Dict) -> Dict:
        """
        Post video via Content Posting API dengan PULL_FROM_URL.
        Cloudinary URL harus sudah ada di content['video_url'].
        Jika tidak ada, upload lokal dulu ke Cloudinary.
        """
        caption = self._build_caption(content)
        video_url = content.get("video_url", "")

        # Jika belum ada URL publik, upload ke Cloudinary terlebih dahulu
        if not video_url or not video_url.startswith("http"):
            video_path = content.get("video_path", "")
            if video_path and not video_path.startswith("http"):
                from utils.video_uploader import upload_video
                logger.info("Mengupload video ke Cloudinary untuk TikTok...")
                video_url = upload_video(video_path)
                content["video_url"] = video_url
                logger.info(f"Video URL Cloudinary: {video_url}")
            else:
                return self._simulate_post(content)

        # Privacy level: default PUBLIC, bisa override dari config
        privacy = self.tt_config.get("default_privacy", "PUBLIC_TO_EVERYONE")

        headers = self._auth_headers()

        payload = {
            "post_info": {
                "title": caption[:2200],
                "privacy_level": privacy,
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
                "video_cover_timestamp_ms": 1000,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "video_url": video_url,
            },
        }

        try:
            resp = self._api_post_with_refresh(_PUBLISH_INIT_URL, headers, payload)

            resp.raise_for_status()
            result = resp.json()

            error_info = result.get("error", {})
            if error_info.get("code", "ok") != "ok":
                raise RuntimeError(
                    f"TikTok API error [{error_info.get('code')}]: "
                    f"{error_info.get('message', '')} – {error_info.get('log_id', '')}"
                )

            publish_id = result.get("data", {}).get("publish_id", "")
            logger.info(f"TikTok publish initiated, publish_id: {publish_id}")

            # Poll status
            final_status = self._poll_publish_status(publish_id, headers)

            return {
                "post_id": publish_id,
                "platform": "tiktok",
                "method": "content_posting_api_url",
                "status": final_status,
                "posted_at": datetime.now().isoformat(),
                "video_url": video_url,
            }

        except requests.HTTPError as e:
            # TikTok mewajibkan verifikasi ownership domain untuk PULL_FROM_URL.
            # Fallback ke FILE_UPLOAD agar sandbox bisa tetap dipakai tanpa verifikasi domain.
            body = (e.response.text or "") if e.response is not None else ""
            if "url_ownership_unverified" in body:
                logger.warning("PULL_FROM_URL ditolak (url_ownership_unverified), fallback ke FILE_UPLOAD")
                return self._post_via_file_upload(content)
            raise RuntimeError(
                f"TikTok API HTTP error: {e.response.text}"
            ) from e

    def _post_via_file_upload(self, content: Dict) -> Dict:
        """Upload video ke TikTok via FILE_UPLOAD.

        - draft_only=True  → inbox endpoint (publish manual dari app TikTok)
        - draft_only=False → publish endpoint langsung (direct publish ke feed)
        """
        caption = self._build_caption(content)
        video_path = str(content.get("video_path", "") or "")

        if not video_path:
            raise RuntimeError("TikTok FILE_UPLOAD membutuhkan video_path lokal")
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"TikTok video_path tidak ditemukan: {video_path}")

        file_size = os.path.getsize(video_path)
        headers = self._auth_headers()

        direct_publish = not self.draft_only

        if direct_publish:
            # Production: langsung publish ke feed
            privacy = self.tt_config.get("default_privacy", "PUBLIC_TO_EVERYONE")
            init_url = _PUBLISH_INIT_URL
            init_payload = {
                "post_info": {
                    "title": caption[:2200],
                    "privacy_level": privacy,
                    "disable_duet": False,
                    "disable_comment": False,
                    "disable_stitch": False,
                    "video_cover_timestamp_ms": 1000,
                },
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": file_size,
                    "chunk_size": file_size,
                    "total_chunk_count": 1,
                },
            }
        else:
            # Sandbox / draft: upload ke inbox, publish manual dari app
            init_url = _INBOX_INIT_URL
            init_payload = {
                "post_info": {"title": caption[:2200]},
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": file_size,
                    "chunk_size": file_size,
                    "total_chunk_count": 1,
                },
            }

        init_resp = self._api_post_with_refresh(init_url, headers, init_payload)
        init_data = init_resp.json().get("data", {})
        publish_id = init_data.get("publish_id", "")
        upload_url = init_data.get("upload_url", "")

        if not publish_id or not upload_url:
            raise RuntimeError(f"TikTok FILE_UPLOAD init gagal: {init_resp.text}")

        with open(video_path, "rb") as vf:
            upload_resp = requests.put(
                upload_url,
                headers={
                    "Content-Type": "video/mp4",
                    "Content-Range": f"bytes 0-{file_size - 1}/{file_size}",
                    "Content-Length": str(file_size),
                },
                data=vf,
                timeout=120,
            )
            upload_resp.raise_for_status()

        if direct_publish:
            logger.info(f"TikTok FILE_UPLOAD selesai, polling status publish_id: {publish_id}")
            final_status = self._poll_publish_status(publish_id, headers)
            return {
                "post_id": publish_id,
                "platform": "tiktok",
                "method": "content_posting_api_file_upload_direct",
                "status": final_status,
                "posted_at": datetime.now().isoformat(),
                "video_path": video_path,
                "note": "Video published directly to TikTok feed via FILE_UPLOAD.",
            }
        else:
            logger.info("TikTok Inbox upload selesai. Lanjut publish manual dari aplikasi TikTok (inbox).")
            return {
                "post_id": publish_id,
                "platform": "tiktok",
                "method": "content_posting_api_inbox_file_upload",
                "status": "inbox_uploaded",
                "posted_at": datetime.now().isoformat(),
                "video_path": video_path,
                "note": "Video uploaded to TikTok inbox. Final publish dilakukan manual dari akun TikTok.",
            }

    def _poll_publish_status(
        self, publish_id: str, headers: dict, max_attempts: int = 20
    ) -> str:
        """Poll publish status sampai selesai atau error."""
        for attempt in range(max_attempts):
            time.sleep(5)
            try:
                resp = requests.post(
                    _PUBLISH_STATUS_URL,
                    headers=headers,
                    json={"publish_id": publish_id},
                    timeout=15,
                )
                if not resp.ok:
                    logger.warning(f"Status poll gagal ({resp.status_code}), retry...")
                    continue

                data = resp.json().get("data", {})
                status = data.get("status", "PROCESSING_UPLOAD")
                logger.info(f"TikTok publish status [{attempt+1}/{max_attempts}]: {status}")

                if status in ("PUBLISH_COMPLETE", "SUCCESS"):
                    return "published"
                if status in ("FAILED", "CANCELLED"):
                    fail_reason = data.get("fail_reason", "unknown")
                    raise RuntimeError(f"TikTok publish failed: {fail_reason}")
            except RuntimeError:
                raise
            except Exception as e:
                logger.warning(f"Status poll error: {e}")

        logger.warning("Timeout polling TikTok publish status, assumed OK")
        return "pending"

    # ── Token refresh ────────────────────────────────────────

    def _refresh_token(self) -> str | None:
        """Auto-refresh access token, return new token or None."""
        try:
            from utils.tiktok_auth import refresh_access_token
            result = refresh_access_token(self.refresh_token)
            data = result.get("data", result)
            new_token = data.get("access_token", "")
            if new_token:
                self.access_token = new_token
                new_refresh = data.get("refresh_token", "")
                if new_refresh:
                    self.refresh_token = new_refresh
                logger.info("TikTok access token berhasil di-refresh")
                return new_token
        except Exception as e:
            logger.error(f"Gagal refresh TikTok token: {e}")
        return None

    def _auth_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        }

    def _api_post_with_refresh(self, url: str, headers: dict, payload: dict) -> requests.Response:
        """POST helper dengan auto-refresh token sekali saat mendapat 401."""
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code == 401 and self.refresh_token:
            logger.info("TikTok token expired, mencoba refresh...")
            new_token = self._refresh_token()
            if new_token:
                headers["Authorization"] = f"Bearer {new_token}"
                resp = requests.post(url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        return resp

    # ── Caption builder ──────────────────────────────────────

    def _build_caption(self, content: Dict) -> str:
        """Bangun caption TikTok (maks 2200 chars)."""
        caption = content.get("caption", "")
        hashtags_raw = content.get("hashtags", [])

        flat_tags: list[str] = []
        if isinstance(hashtags_raw, list):
            flat_tags = hashtags_raw
        elif isinstance(hashtags_raw, dict):
            for vals in hashtags_raw.values():
                if isinstance(vals, list):
                    flat_tags.extend(vals)
        elif isinstance(hashtags_raw, str):
            flat_tags = hashtags_raw.split()

        tag_str = " ".join(flat_tags[:15])
        full = f"{caption}\n\n{tag_str}".strip()
        return full[:2200]

    # ── Demo / simulate ──────────────────────────────────────

    def _post_photo_carousel(self, content: Dict) -> Dict:
        """Konversi slides PNG → MP4 slideshow, lalu upload via inbox (draft) TikTok.

        Digunakan karena TikTok Photo Post API membutuhkan izin direct publish
        yang masih under review. Inbox/FILE_UPLOAD hanya menerima video.
        """
        image_paths = content.get("image_paths") or []
        if isinstance(image_paths, str):
            image_paths = [image_paths]

        if not image_paths:
            raise RuntimeError("TikTok photo carousel membutuhkan image_paths")

        # Buat MP4 slideshow dari PNG slides
        video_path = self._slides_to_video(image_paths, content.get("id", "carousel"))
        content["video_path"] = video_path
        logger.info(f"Slideshow MP4 dibuat: {video_path}")

        # Upload via inbox (draft) — flow yang sudah approved
        return self._post_via_file_upload(content)

    def _slides_to_video(self, image_paths: list, name: str, seconds_per_slide: int = 4) -> str:
        """Konversi list PNG ke MP4 slideshow menggunakan imageio-ffmpeg."""
        import imageio
        from PIL import Image
        import tempfile
        import os as _os

        # Tentukan resolusi dari slide pertama
        first = Image.open(image_paths[0]).convert("RGB")
        w, h = first.size
        # TikTok vertical: paksa 9:16 jika belum
        if w > h:
            w, h = h, w

        fps = 30
        out_path = _os.path.join(
            _os.path.dirname(image_paths[0]),
            f"{name}_slideshow.mp4",
        )

        writer = imageio.get_writer(out_path, fps=fps, codec="libx264",
                                    pixelformat="yuv420p",
                                    output_params=["-crf", "23", "-preset", "fast"])
        try:
            for path in image_paths:
                img = Image.open(path).convert("RGB").resize((w, h))
                frame = __import__("numpy").array(img)
                for _ in range(fps * seconds_per_slide):
                    writer.append_data(frame)
        finally:
            writer.close()

        return out_path

    def _simulate_post(self, content: Dict) -> Dict:
        return {
            "post_id": f"TT_DEMO_{content.get('id', 'XX')}",
            "platform": "tiktok",
            "method": "simulated",
            "posted_at": datetime.now().isoformat(),
            "note": "Demo mode – TikTok access_token belum dikonfigurasi. "
                    "Jalankan: python utils/tiktok_auth.py url",
        }

    def generate_script_prompt(self, content: Dict) -> str:
        """Generate TikTok video script dari konten."""
        return (
            f"🎬 SCRIPT TIKTOK – {content.get('topic', '')}\n"
            f"Durasi target: {self.tt_config.get('video_duration_target', 30)} detik\n\n"
            f"HOOK (0-3 detik):\n{content.get('hook', '')}\n\n"
            f"KONTEN UTAMA (3-25 detik):\n{content.get('script', content.get('caption', ''))}\n\n"
            f"CTA (25-30 detik):\n{content.get('cta', 'Follow untuk tips keuangan tiap hari!')}"
        )
