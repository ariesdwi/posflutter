"""
utils/config_loader.py
Memuat dan memvalidasi konfigurasi dari config.yaml dan .env
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict

import yaml
from dotenv import load_dotenv

# Load .env file
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
else:
    load_dotenv()  # fallback ke .env di cwd


def load_config(config_path: str = None) -> Dict[str, Any]:
    """
    Muat konfigurasi dari config.yaml.
    
    Args:
        config_path: Path ke file config. Default: config.yaml di root project.
    
    Returns:
        Dict konfigurasi yang sudah divalidasi.
    """
    if config_path is None:
        # Cari config.yaml di root project
        root = Path(__file__).parent.parent
        config_path = root / "config.yaml"

    config_path = Path(config_path)
    
    if not config_path.exists():
        raise FileNotFoundError(
            f"Config file tidak ditemukan: {config_path}\n"
            f"Pastikan Anda berada di direktori casha-ai-cmo/"
        )

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    # Inject env vars ke config jika diperlukan
    config = _inject_env_vars(config)
    
    return config


def _inject_env_vars(config: Dict) -> Dict:
    """Tambahkan env vars yang relevan ke config."""
    # Pastikan platform usernames dari env
    ig = config.get("platforms", {}).get("instagram", {})
    if not ig.get("username") and os.getenv("INSTAGRAM_USERNAME"):
        ig["username"] = os.getenv("INSTAGRAM_USERNAME")

    tt = config.get("platforms", {}).get("tiktok", {})
    if not tt.get("username") and os.getenv("TIKTOK_USERNAME"):
        tt["username"] = os.getenv("TIKTOK_USERNAME")

    li = config.get("platforms", {}).get("linkedin", {})
    if not li.get("page_id") and os.getenv("LINKEDIN_ORGANIZATION_ID"):
        li["page_id"] = os.getenv("LINKEDIN_ORGANIZATION_ID")

    return config


def validate_config(config: Dict) -> bool:
    """Validasi field wajib di konfigurasi."""
    required_fields = [
        "brand.name",
        "brand.tagline",
        "ai.provider",
        "ai.model",
    ]
    
    errors = []
    for field in required_fields:
        keys = field.split(".")
        val = config
        for k in keys:
            if not isinstance(val, dict) or k not in val:
                errors.append(f"Missing config field: {field}")
                break
            val = val[k]
    
    return len(errors) == 0, errors
