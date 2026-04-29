"""
utils/video_uploader.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Video Uploader (Cloudinary)

Upload video lokal ke Cloudinary dan return public URL.
Digunakan oleh flow posting video/Reels yang membutuhkan URL publik stabil.

Env:
    CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import hashlib
import os
import time
from pathlib import Path
from typing import Tuple
from urllib.parse import urlparse

import requests

from utils.logger import setup_logger

logger = setup_logger()


def _parse_cloudinary_url() -> Tuple[str, str, str]:
    raw = os.getenv("CLOUDINARY_URL", "").strip()
    if not raw:
        raise EnvironmentError(
            "CLOUDINARY_URL belum diset di .env\n"
            "Format: cloudinary://<api_key>:<api_secret>@<cloud_name>"
        )

    parsed = urlparse(raw)
    api_key = parsed.username or ""
    api_secret = parsed.password or ""
    cloud_name = parsed.hostname or ""

    if not api_key or not api_secret or not cloud_name:
        raise EnvironmentError(
            "CLOUDINARY_URL invalid. Format yang benar:\n"
            "  cloudinary://<api_key>:<api_secret>@<cloud_name>"
        )

    return cloud_name, api_key, api_secret


def _sign_params(params: dict, api_secret: str) -> str:
    to_sign = "&".join(
        f"{k}={v}" for k, v in sorted(params.items()) if v not in (None, "")
    )
    return hashlib.sha1(f"{to_sign}{api_secret}".encode("utf-8")).hexdigest()


def upload_video(local_path: str | Path, folder: str = "cmo-casha/videos") -> str:
    """Upload satu video ke Cloudinary dan return secure public URL."""
    local_path = Path(local_path)
    if not local_path.exists():
        raise FileNotFoundError(f"File video tidak ditemukan: {local_path}")

    cloud_name, api_key, api_secret = _parse_cloudinary_url()
    timestamp = int(time.time())
    public_id = f"{local_path.stem}_{timestamp}"
    sign_params = {
        "folder": folder,
        "public_id": public_id,
        "timestamp": timestamp,
    }
    signature = _sign_params(sign_params, api_secret)

    upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/video/upload"
    with open(local_path, "rb") as fh:
        resp = requests.post(
            upload_url,
            data={
                "api_key": api_key,
                "timestamp": timestamp,
                "folder": folder,
                "public_id": public_id,
                "signature": signature,
            },
            files={"file": fh},
            timeout=120,
        )

    resp.raise_for_status()
    data = resp.json()
    secure_url = data.get("secure_url") or data.get("url")
    if not secure_url:
        raise RuntimeError(f"Cloudinary upload gagal: {data}")

    logger.info(f"Uploaded video {local_path.name} → {secure_url}")
    return secure_url


def upload_image(local_path: str | Path, folder: str = "cmo-casha/images") -> str:
    """Upload satu gambar ke Cloudinary dan return secure public URL."""
    local_path = Path(local_path)
    if not local_path.exists():
        raise FileNotFoundError(f"File gambar tidak ditemukan: {local_path}")

    cloud_name, api_key, api_secret = _parse_cloudinary_url()
    timestamp = int(time.time())
    public_id = f"{local_path.stem}_{timestamp}"
    sign_params = {
        "folder": folder,
        "public_id": public_id,
        "timestamp": timestamp,
    }
    signature = _sign_params(sign_params, api_secret)

    upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    with open(local_path, "rb") as fh:
        resp = requests.post(
            upload_url,
            data={
                "api_key": api_key,
                "timestamp": timestamp,
                "folder": folder,
                "public_id": public_id,
                "signature": signature,
            },
            files={"file": fh},
            timeout=60,
        )

    resp.raise_for_status()
    data = resp.json()
    secure_url = data.get("secure_url") or data.get("url")
    if not secure_url:
        raise RuntimeError(f"Cloudinary image upload gagal: {data}")

    logger.info(f"Uploaded image {local_path.name} → {secure_url}")
    return secure_url
