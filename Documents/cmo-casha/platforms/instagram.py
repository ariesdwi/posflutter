"""
platforms/instagram.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Instagram Platform Integration
Mendukung posting via Meta Graph API (bisnis) dan instagrapi (personal).
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from rich.console import Console

from utils.logger import setup_logger

console = Console()
logger = setup_logger()


class InstagramPoster:
    """
    Instagram posting handler untuk Casha.
    
    Mendukung dua mode:
    1. Meta Graph API – untuk akun bisnis/kreator (direkomendasikan)
    2. instagrapi  – alternatif unofficial untuk akun personal
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.ig_config = config.get("platforms", {}).get("instagram", {})

        # Credentials
        self.access_token = os.getenv("META_ACCESS_TOKEN") or ""
        self.ig_user_id = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID") or ""
        self.username = os.getenv("INSTAGRAM_USERNAME") or ""
        self.password = os.getenv("INSTAGRAM_PASSWORD") or ""

        # Coba muat token hasil OAuth dari data/auth/instagram.json
        self._load_oauth_cache()

        # Auto-resolve IG Business Account ID dari token jika belum diset
        if self.access_token and not self.ig_user_id:
            self._resolve_ig_user_id()

        # Mode deteksi: Graph API jika ada token + ig_user_id
        self.use_graph_api = bool(self.access_token and self.ig_user_id)

        self._client = None

    def _resolve_ig_user_id(self) -> None:
        """Auto-fetch IG Business Account ID dari META_ACCESS_TOKEN."""
        try:
            import requests
            resp = requests.get(
                "https://graph.facebook.com/v19.0/me/accounts",
                params={
                    "fields": "id,name,instagram_business_account",
                    "access_token": self.access_token,
                },
                timeout=15,
            )
            resp.raise_for_status()
            pages = resp.json().get("data", [])
            for page in pages:
                ig = page.get("instagram_business_account")
                if ig:
                    self.ig_user_id = ig["id"]
                    self.meta_page_id = page["id"]
                    # Simpan ke env runtime supaya tidak fetch ulang
                    os.environ["INSTAGRAM_BUSINESS_ACCOUNT_ID"] = self.ig_user_id
                    os.environ["META_PAGE_ID"] = self.meta_page_id
                    logger.info(f"IG Business Account ID resolved: {self.ig_user_id}")
                    # Simpan ke cache file supaya tidak fetch ulang di run berikutnya
                    cache_path = Path("data/auth/ig_resolved.json")
                    cache_path.parent.mkdir(parents=True, exist_ok=True)
                    import json
                    with open(cache_path, "w") as f:
                        json.dump({"ig_user_id": self.ig_user_id, "page_id": self.meta_page_id}, f)
                    break
            if not self.ig_user_id:
                logger.warning(
                    "Tidak ditemukan IG Business Account. Pastikan akun IG sudah "
                    "dikonversi ke Business/Creator dan terhubung ke Facebook Page."
                )
        except Exception as e:
            logger.warning(f"Gagal resolve IG Business Account ID: {e}")

    def _load_oauth_cache(self) -> None:
        """Muat token dari cache OAuth / resolved cache jika env belum diset."""
        # Cek cache hasil _resolve_ig_user_id
        if self.access_token and not self.ig_user_id:
            cache_path = Path("data/auth/ig_resolved.json")
            if cache_path.exists():
                try:
                    import json
                    data = json.loads(cache_path.read_text())
                    self.ig_user_id = data.get("ig_user_id", "")
                    self.meta_page_id = data.get("page_id", "")
                    if self.ig_user_id:
                        os.environ.setdefault("INSTAGRAM_BUSINESS_ACCOUNT_ID", self.ig_user_id)
                        logger.debug(f"IG user ID loaded from cache: {self.ig_user_id}")
                        return
                except Exception:
                    pass

        if self.access_token and self.ig_user_id:
            return
        try:
            from platforms.instagram_oauth import InstagramOAuth
            cached = InstagramOAuth().load_cached()
        except Exception as e:  # pragma: no cover
            logger.debug(f"OAuth cache tidak tersedia: {e}")
            return
        if not cached:
            return
        self.access_token = self.access_token or cached.get("access_token")
        self.ig_user_id = self.ig_user_id or cached.get("ig_user_id")
        # Pastikan proses anak (requests) juga lihat token ini.
        if self.access_token:
            os.environ.setdefault("META_ACCESS_TOKEN", self.access_token)
        if self.ig_user_id:
            os.environ.setdefault("INSTAGRAM_BUSINESS_ACCOUNT_ID", self.ig_user_id)

    # ── Public API ───────────────────────────────────────────

    def ensure_authenticated(self, interactive: bool = True) -> bool:
        """
        Pastikan Graph API siap dipakai. Kalau belum, trigger OAuth di browser.
        Return True jika berhasil (Graph API mode), False jika fallback instagrapi.
        """
        if self.use_graph_api:
            return True

        # Fallback credential instagrapi (username/password) → skip OAuth.
        if self.username and self.password:
            logger.info("Pakai instagrapi (username/password) – skip OAuth.")
            return False

        try:
            from platforms.instagram_oauth import InstagramOAuth
            token_info = InstagramOAuth().ensure_token(interactive=interactive)
        except Exception as e:
            logger.error(f"OAuth Instagram gagal: {e}")
            console.print(f"[red]✗ OAuth Instagram gagal:[/red] {e}")
            return False

        self.access_token = token_info["access_token"]
        self.ig_user_id = token_info["ig_user_id"]
        self.use_graph_api = True
        return True

    def post(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Post konten ke Instagram.
        Returns dict dengan post_id dan URL.
        """
        fmt = content.get("format", "single").lower()

        # Auto-trigger OAuth kalau belum login & tidak ada fallback creds.
        if not self.use_graph_api and not (self.username and self.password):
            self.ensure_authenticated(interactive=True)

        # Deteksi apakah ada file lokal (bukan URL)
        has_local_files = False
        image_paths = content.get("image_paths", [])
        image_path = content.get("image_path", "")
        video_path = content.get("video_path", "")
        
        if image_paths and any(not p.startswith("http") for p in image_paths):
            has_local_files = True
        elif image_path and not image_path.startswith("http"):
            has_local_files = True
        elif video_path and not video_path.startswith("http"):
            has_local_files = True

        # Graph API membutuhkan URL publik untuk media lokal.
        if self.use_graph_api:
            if has_local_files:
                logger.info("Local media detected → menggunakan Graph API")
            if fmt in ["video", "reels"] or video_path or content.get("video_url"):
                return self._post_reel_via_graph_api(content, fmt)
            return self._post_via_graph_api(content, fmt)

        # Fallback: instagrapi
        return self._post_via_instagrapi(content, fmt)

    def get_insights(self, post_id: str) -> Dict[str, Any]:
        """Ambil data insights untuk post tertentu via Graph API."""
        if not self.use_graph_api:
            return self._simulate_insights(post_id)
        
        import requests
        url = f"https://graph.facebook.com/v19.0/{post_id}/insights"
        params = {
            "metric": "impressions,reach,likes,comments,saves,shares",
            "access_token": self.access_token,
        }
        response = requests.get(url, params=params)
        return response.json()

    # ── Meta Graph API ───────────────────────────────────────

    def _post_via_graph_api(self, content: Dict, fmt: str) -> Dict:
        """Post via Meta Graph API (akun bisnis). Support single image & carousel.
        
        Gambar lokal di-serve sementara via ngrok agar Graph API bisa
        mengaksesnya sebagai URL publik.
        """
        import requests

        caption = self._build_caption(content)
        image_paths: list = content.get("image_paths", [])
        image_path: str = content.get("image_path", "")

        # Kumpulkan semua path gambar lokal
        local_paths = []
        if image_paths:
            local_paths = [p for p in image_paths if p and not p.startswith("http")]
        elif image_path and not image_path.startswith("http"):
            local_paths = [image_path]

        # Resolve URL publik (ngrok) atau URL langsung
        public_urls: list[str] = []

        if local_paths:
            # Upload ke imgbb untuk mendapatkan public URL
            try:
                from utils.image_uploader import upload_images
                console.print(f"[dim]☁️  Mengupload {len(local_paths)} gambar ke imgbb...[/dim]")
                public_urls = upload_images(local_paths)
                logger.info(f"Local paths → imgbb URLs: {public_urls}")
            except Exception as e:
                logger.warning(f"imgbb upload gagal ({e}) – fallback ke placeholder")
                public_urls = []
        elif image_paths:
            public_urls = [p for p in image_paths if p.startswith("http")]
        elif content.get("image_url"):
            public_urls = [content["image_url"]]

        if not public_urls:
            public_urls = [self._get_placeholder_image_url(content)]

        media_url = f"https://graph.facebook.com/v19.0/{self.ig_user_id}/media"
        publish_url = f"https://graph.facebook.com/v19.0/{self.ig_user_id}/media_publish"

        try:
            is_carousel = len(public_urls) > 1

            if is_carousel:
                # ── Carousel: buat item container per gambar ────────────────
                console.print(f"[dim]📸 Membuat {len(public_urls)} carousel item containers...[/dim]")
                item_ids = []
                for idx, url in enumerate(public_urls, 1):
                    resp = requests.post(media_url, data={
                        "image_url": url,
                        "is_carousel_item": "true",
                        "access_token": self.access_token,
                    }, timeout=30)
                    resp.raise_for_status()
                    item_id = resp.json().get("id")
                    item_ids.append(item_id)
                    logger.info(f"Carousel item {idx}/{len(public_urls)} created: {item_id}")
                    time.sleep(1)

                # Buat carousel container
                console.print("[dim]🗂  Membuat carousel container...[/dim]")
                carousel_resp = requests.post(media_url, data={
                    "media_type": "CAROUSEL",
                    "children": ",".join(item_ids),
                    "caption": caption,
                    "access_token": self.access_token,
                }, timeout=30)
                carousel_resp.raise_for_status()
                creation_id = carousel_resp.json().get("id")

            else:
                # ── Single image ────────────────────────────────────────────
                console.print("[dim]🖼  Membuat media container...[/dim]")
                single_resp = requests.post(media_url, data={
                    "image_url": public_urls[0],
                    "caption": caption,
                    "access_token": self.access_token,
                }, timeout=30)
                single_resp.raise_for_status()
                creation_id = single_resp.json().get("id")

            # ── Publish ─────────────────────────────────────────────────────
            console.print("[dim]🚀 Publishing ke Instagram...[/dim]")
            time.sleep(3)  # tunggu container diproses Meta
            pub_resp = requests.post(publish_url, data={
                "creation_id": creation_id,
                "access_token": self.access_token,
            }, timeout=30)
            pub_resp.raise_for_status()
            post_id = pub_resp.json().get("id")

        except requests.HTTPError as e:
            raise RuntimeError(f"Graph API error: {e.response.text}") from e

        logger.info(f"Instagram post published via Graph API: {post_id}")
        return {
            "post_id": post_id,
            "platform": "instagram",
            "method": "graph_api",
            "posted_at": datetime.now().isoformat(),
            "url": f"https://instagram.com/p/{post_id}/",
        }

    def _post_reel_via_graph_api(self, content: Dict, fmt: str) -> Dict:
        """Post Reels/Video via Meta Graph API (akun bisnis)."""
        import requests
        import time

        caption = self._build_caption(content)
        video_url = content.get("video_url")
        video_path = content.get("video_path")

        if not video_url and video_path:
            if video_path.startswith("http"):
                video_url = video_path
            else:
                from utils.video_uploader import upload_video
                console.print("[dim]☁️  Mengupload video ke Cloudinary...[/dim]")
                video_url = upload_video(video_path)
                logger.info(f"Local video path → Cloudinary URL: {video_url}")

        if not video_url:
            video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
        else:
            content["video_url"] = video_url

        media_url = f"https://graph.facebook.com/v19.0/{self.ig_user_id}/media"
        publish_url = f"https://graph.facebook.com/v19.0/{self.ig_user_id}/media_publish"

        try:
            console.print("[dim]🎥 Membuat media container untuk Reels...[/dim]")
            container_resp = requests.post(media_url, data={
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption,
                "access_token": self.access_token,
            }, timeout=30)
            container_resp.raise_for_status()
            creation_id = container_resp.json().get("id")
            
            console.print("[dim]⏳ Menunggu Instagram memproses video...[/dim]")
            status_url = f"https://graph.facebook.com/v19.0/{creation_id}"
            max_attempts = 15
            for attempt in range(max_attempts):
                time.sleep(5)
                status_resp = requests.get(status_url, params={
                    "fields": "status_code",
                    "access_token": self.access_token,
                })
                if status_resp.ok:
                    status = status_resp.json().get("status_code")
                    logger.info(f"Reels processing status: {status}")
                    if status == "FINISHED":
                        break
                    elif status == "ERROR":
                        raise RuntimeError("Instagram gagal memproses video (status ERROR).")
                
                if attempt == max_attempts - 1:
                    logger.warning("Timeout menunggu pemrosesan video, lanjut publish.")

            console.print("[dim]🚀 Publishing Reels ke Instagram...[/dim]")
            pub_resp = requests.post(publish_url, data={
                "creation_id": creation_id,
                "access_token": self.access_token,
            }, timeout=30)
            pub_resp.raise_for_status()
            post_id = pub_resp.json().get("id")

        except requests.HTTPError as e:
            raise RuntimeError(f"Graph API Reels error: {e.response.text}") from e

        logger.info(f"Instagram Reels published via Graph API: {post_id}")
        return {
            "post_id": post_id,
            "platform": "instagram",
            "method": "graph_api",
            "posted_at": datetime.now().isoformat(),
            "url": f"https://instagram.com/reel/{post_id}/",
        }

    # ── instagrapi ───────────────────────────────────────────

    def _post_via_instagrapi(self, content: Dict, fmt: str) -> Dict:
        """Post via instagrapi (akun personal/unofficial)."""
        try:
            from instagrapi import Client
        except ImportError:
            raise ImportError("Install instagrapi: pip install instagrapi")

        if not self._client:
            SESSION_PATH = Path("data/auth/instagrapi_session.json")
            SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)

            if SESSION_PATH.exists():
                try:
                    settings = json.loads(SESSION_PATH.read_text())

                    # Ambil sessionid (cek cookies dan authorization_data)
                    session_id = (
                        settings.get("cookies", {}).get("sessionid", "")
                        or settings.get("authorization_data", {}).get("sessionid", "")
                    )

                    if not session_id:
                        raise RuntimeError(
                            "Tidak ada sessionid di file session. Jalankan:\n"
                            "  python main.py auth instagram -a browser"
                        )

                    # URL-decode sessionid jika perlu (%3A → :)
                    from urllib.parse import unquote
                    session_id_decoded = unquote(session_id)

                    # Buat client BARU dan login HANYA dengan sessionid.
                    # Jangan load_settings sebelum login_by_sessionid — keduanya
                    # bertentangan dan menyebabkan login_required saat upload.
                    self._client = Client()
                    self._client.delay_range = [2, 5]
                    self._client.login_by_sessionid(session_id_decoded)

                    # Setelah login berhasil, load device settings supaya device info
                    # konsisten dengan sesi yang disimpan (opsional tapi direkomendasikan).
                    # Gunakan set_settings agar tidak menimpa cookie yang baru di-set.
                    device_keys = ("uuids", "device_settings", "user_agent")
                    device_settings = {k: settings[k] for k in device_keys if k in settings}
                    if device_settings:
                        self._client.set_settings(device_settings)

                    logger.info("Logged in to Instagram via sessionid (browser session)")
                    console.print("[green]✓ Login via saved session (browser)[/green]")

                except RuntimeError:
                    raise
                except Exception as e:
                    logger.warning(f"Session login gagal: {e}")
                    # Coba re-login dengan username/password jika tersedia
                    if self.username and self.password:
                        console.print("[yellow]⚠ Session expired – mencoba re-login dengan username/password...[/yellow]")
                        try:
                            self._client = Client()
                            self._client.delay_range = [2, 5]
                            self._login_fresh(SESSION_PATH)
                        except Exception as re_e:
                            raise RuntimeError(
                                f"Re-login gagal: {re_e}\n"
                                "Jalankan: python main.py auth instagram -a browser"
                            ) from re_e
                    else:
                        raise RuntimeError(
                            "Session Instagram expired. Jalankan ulang:\n"
                            "  python main.py auth instagram -a browser"
                        ) from e
            else:
                # Belum ada session sama sekali
                raise RuntimeError(
                    "Tidak ada session Instagram. Jalankan dulu:\n"
                    "  python main.py auth instagram -a browser"
                )

        caption = self._build_caption(content)
        image_paths = content.get("image_paths", [])
        image_path = content.get("image_path")
        video_path = content.get("video_path")

        try:
            if video_path and Path(video_path).exists():
                logger.info(f"Uploading video/reels via instagrapi: {video_path}")
                if fmt in ["reels", "video"]:
                    media = self._client.clip_upload(Path(video_path), caption)
                else:
                    # Fallback jika disebut single tapi isinya video
                    media = self._client.video_upload(Path(video_path), caption)
            elif image_paths and len(image_paths) > 1:
                # Pastikan semua file ada
                valid_paths = [Path(p) for p in image_paths if Path(p).exists()]
                # Instagram wajib JPEG — konversi PNG/format lain dulu
                valid_paths = [self._ensure_jpeg(p) for p in valid_paths]
                if len(valid_paths) > 1:
                    logger.info(f"Uploading carousel with {len(valid_paths)} images")
                    media = self._client.album_upload(valid_paths, caption)
                elif valid_paths:
                    media = self._client.photo_upload(valid_paths[0], caption)
                else:
                    logger.warning("No valid image paths provided for carousel, skipping upload")
                    return self._simulate_post_result(content)
            elif image_path and Path(image_path).exists():
                jpeg_path = self._ensure_jpeg(Path(image_path))
                media = self._client.photo_upload(jpeg_path, caption)
            else:
                logger.warning("No media path provided, skipping actual upload")
                return self._simulate_post_result(content)
        except Exception as upload_err:
            err_str = str(upload_err)
            # "Unknown ({})" → Instagram menolak request — bisa session expired
            # ATAU format gambar tidak didukung (PNG, RGBA, dsb.)
            if "Unknown" in err_str and "{}" in err_str:
                logger.error("Instagram upload gagal (Unknown {}). Cek format gambar & session.")
                console.print(
                    "\n[red bold]✗ Upload ke Instagram gagal.[/red bold]\n"
                    "[yellow]Kemungkinan penyebab:[/yellow]\n"
                    "  1. Session expired → jalankan: [bold cyan]python main.py auth instagram -a browser[/bold cyan]\n"
                    "  2. Format gambar tidak valid (harus JPEG 1080x1080)\n"
                )
                raise RuntimeError(
                    "Upload Instagram gagal (Unknown {}). "
                    "Coba: python main.py auth instagram -a browser"
                ) from upload_err
            raise

        return {
            "post_id": str(media.pk),
            "platform": "instagram",
            "method": "instagrapi",
            "posted_at": datetime.now().isoformat(),
            "url": f"https://instagram.com/p/{media.code}/",
        }

    def _login_fresh(self, session_path: Path) -> None:
        """Login baru ke Instagram dengan interactive challenge handling."""
        from instagrapi import Client

        def challenge_code_handler(username, choice):
            """Handler interaktif: minta user input kode verifikasi dari terminal."""
            methods = {0: "SMS", 1: "Email"}
            method_name = methods.get(choice, f"method {choice}")
            console.print(f"\n[yellow]🔐 Instagram mengirim kode verifikasi via {method_name}[/yellow]")
            console.print("[dim]Cek inbox email/SMS kamu, lalu masukkan kode di bawah ini:[/dim]")
            code = input(f"\n📱 Masukkan kode verifikasi ({method_name}): ").strip()
            return code

        # Pasang challenge handler
        self._client.challenge_code_handler = challenge_code_handler

        try:
            console.print(f"[dim]🔄 Mencoba login sebagai @{self.username}...[/dim]")
            self._client.login(self.username, self.password)
            self._client.dump_settings(session_path)
            logger.info("Logged in to Instagram via instagrapi (new session saved)")
            console.print(f"[green]✓ Login berhasil sebagai @{self.username}![/green]")
        except Exception as e:
            error_msg = str(e).lower()
            console.print(f"\n[red]✗ Login Instagram gagal:[/red] {e}\n")

            if "challenge" in error_msg:
                console.print(
                    "[yellow]⚠ Instagram meminta verifikasi tambahan.[/yellow]\n"
                    "[dim]Langkah:\n"
                    "  1. Buka Instagram di HP atau browser\n"
                    "  2. Login dan selesaikan verifikasi (confirm 'This was me')\n"
                    "  3. Jalankan ulang perintah ini[/dim]"
                )
            elif "blacklist" in error_msg or "ip" in error_msg or "bad request" in error_msg:
                console.print(
                    "[yellow]⚠ IP kamu di-blacklist Instagram.[/yellow]\n"
                    "[dim]Solusi:\n"
                    "  1. Ganti koneksi internet (hotspot HP / VPN)\n"
                    "  2. Tunggu 15-30 menit sebelum coba lagi\n"
                    "  3. Login ke Instagram di browser dulu untuk verifikasi[/dim]"
                )
            elif "password" in error_msg or "credentials" in error_msg:
                console.print(
                    "[yellow]⚠ Username atau password salah.[/yellow]\n"
                    "[dim]Cek file .env:\n"
                    "  INSTAGRAM_USERNAME=username_kamu\n"
                    "  INSTAGRAM_PASSWORD=password_kamu[/dim]"
                )
            elif "two_factor" in error_msg or "2fa" in error_msg:
                console.print(
                    "[yellow]⚠ Akun menggunakan Two-Factor Authentication (2FA).[/yellow]\n"
                    "[dim]Masukkan kode 2FA dari Authenticator app kamu.[/dim]"
                )
                try:
                    code_2fa = input("\n🔑 Masukkan kode 2FA: ").strip()
                    self._client.login(self.username, self.password, verification_code=code_2fa)
                    self._client.dump_settings(session_path)
                    logger.info("Logged in to Instagram via 2FA (new session saved)")
                    console.print(f"[green]✓ Login berhasil via 2FA sebagai @{self.username}![/green]")
                    return
                except Exception as e2:
                    console.print(f"[red]✗ Login 2FA gagal:[/red] {e2}")
            raise

    # ── Helpers ──────────────────────────────────────────────

    def _ensure_jpeg(self, path: Path) -> Path:
        """
        Konversi gambar ke JPEG jika belum JPEG.
        Instagram hanya menerima JPEG — PNG/RGBA/dll akan menyebabkan error Unknown {}.
        File JPEG hasil konversi disimpan di folder yang sama dengan suffix _ig.jpg.
        """
        if path.suffix.lower() in (".jpg", ".jpeg"):
            return path
        try:
            from PIL import Image
        except ImportError:
            raise ImportError(
                "Pillow belum terinstall. Jalankan: pip install Pillow"
            )
        out_path = path.with_name(path.stem + "_ig.jpg")
        if not out_path.exists():
            img = Image.open(path)
            # Konversi RGBA/P ke RGB agar bisa disimpan sebagai JPEG
            if img.mode in ("RGBA", "P", "LA"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                bg.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = bg
            elif img.mode != "RGB":
                img = img.convert("RGB")
            img.save(out_path, "JPEG", quality=95)
            logger.debug(f"Converted {path.name} → {out_path.name}")
        return out_path

    def _build_caption(self, content: Dict) -> str:
        """Bangun caption lengkap dengan hashtag."""
        caption = content.get("caption", "")
        
        # Instagram tidak mendukung markdown, jadi kita hapus formatting bold/italic
        caption = caption.replace("**", "")
        
        hashtags = content.get("hashtags", [])
        cta = (
            content.get("cta", "")
            or content.get("cta_primary", "")
            or content.get("cta_secondary", "")
        )

        # hashtags bisa berupa list atau dict berkelompok
        hashtag_list = []
        if isinstance(hashtags, list):
            hashtag_list = hashtags
        elif isinstance(hashtags, dict):
            for _, values in hashtags.items():
                if isinstance(values, list):
                    hashtag_list.extend(values)
        elif isinstance(hashtags, str):
            hashtag_list = hashtags.split()
        
        parts = [caption]
        if cta and cta not in caption:
            parts.append(f"\n\n{cta}")
        if hashtag_list:
            parts.append(f"\n\n{' '.join(hashtag_list[:30])}")
        
        return "\n".join(parts)

    def _get_placeholder_image_url(self, content: Dict) -> str:
        """URL gambar placeholder untuk testing."""
        # Gunakan Unsplash dengan keyword finansial
        return "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1080"

    def _simulate_post_result(self, content: Dict) -> Dict:
        """Simulasi hasil posting untuk mode demo."""
        return {
            "post_id": f"DEMO_{content.get('id', 'XX')}",
            "platform": "instagram",
            "method": "simulated",
            "posted_at": datetime.now().isoformat(),
            "url": "https://instagram.com/casha_app",
            "note": "Demo mode – API keys belum dikonfigurasi",
        }

    def _simulate_insights(self, post_id: str) -> Dict:
        """Simulasi data insights untuk demo."""
        import random
        return {
            "post_id": post_id,
            "impressions": random.randint(1000, 5000),
            "reach": random.randint(800, 4000),
            "likes": random.randint(50, 500),
            "comments": random.randint(5, 50),
            "saves": random.randint(10, 100),
        }

    # ── Profile & Account ────────────────────────────────────

    def get_account_info(self) -> Dict:
        """Ambil informasi akun Instagram."""
        if not self.use_graph_api:
            return {"status": "Demo mode", "username": self.username or "casha_app"}
        
        import requests
        url = f"https://graph.facebook.com/v19.0/{self.ig_user_id}"
        params = {
            "fields": "username,followers_count,media_count,profile_picture_url",
            "access_token": self.access_token,
        }
        response = requests.get(url, params=params)
        return response.json()
