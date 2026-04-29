"""
utils/image_uploader.py
═══════════════════════════════════════════════════════════════
Casha AI CMO – Image Uploader (imgbb)

Upload gambar lokal ke imgbb dan return public URL.
Digunakan oleh Instagram Graph API yang membutuhkan URL publik.

Env:
    IMGBB_API_KEY=...   (dari https://api.imgbb.com)
═══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import List

import requests

from utils.logger import setup_logger

logger = setup_logger()

IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload"


def upload_image(local_path: str | Path, expiration: int = 600) -> str:
    """
    Upload satu gambar ke imgbb dan return public URL.

    Args:
        local_path: Path file gambar lokal (.jpg / .png / .webp)
        expiration: Berapa detik gambar tersimpan di imgbb (default 600 = 10 menit).
                    Cukup untuk proses posting ke Graph API.

    Returns:
        Public URL gambar (https://i.ibb.co/...)

    Raises:
        EnvironmentError: Jika IMGBB_API_KEY tidak diset.
        RuntimeError: Jika upload gagal.
    """
    api_key = os.getenv("IMGBB_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "IMGBB_API_KEY belum diset di .env\n"
            "Daftar gratis di https://api.imgbb.com lalu tambahkan:\n"
            "  IMGBB_API_KEY=your_key_here"
        )

    local_path = Path(local_path)
    if not local_path.exists():
        raise FileNotFoundError(f"File tidak ditemukan: {local_path}")

    with open(local_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    resp = requests.post(
        IMGBB_UPLOAD_URL,
        data={
            "key": api_key,
            "image": image_data,
            "expiration": expiration,
        },
        timeout=30,
    )
    resp.raise_for_status()

    result = resp.json()
    if not result.get("success"):
        raise RuntimeError(f"imgbb upload gagal: {result}")

    url = result["data"]["url"]
    logger.info(f"Uploaded {local_path.name} → {url}")
    return url


def upload_images(local_paths: List[str | Path], expiration: int = 600) -> List[str]:
    """
    Upload beberapa gambar ke imgbb secara berurutan.

    Returns:
        List public URLs sesuai urutan input.
    """
    urls = []
    for i, path in enumerate(local_paths, 1):
        logger.info(f"Uploading image {i}/{len(local_paths)}: {Path(path).name}")
        url = upload_image(path, expiration=expiration)
        urls.append(url)
    return urls
