"""
utils/logger.py
Setup logging terpusat untuk Casha AI CMO.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path


def setup_logger(name: str = "casha_cmo", level: str = None) -> logging.Logger:
    """
    Setup dan return logger yang sudah dikonfigurasi.
    
    Args:
        name: Nama logger.
        level: Level logging (DEBUG/INFO/WARNING/ERROR). 
               Default dari env LOG_LEVEL atau INFO.
    """
    logger = logging.getLogger(name)
    
    if logger.handlers:  # Sudah dikonfigurasi
        return logger

    log_level = level or os.getenv("LOG_LEVEL", "INFO")
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    logger.setLevel(numeric_level)

    # Format
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler (hanya WARNING ke atas agar tidak mengganggu Rich output)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    file_handler = logging.FileHandler(log_dir / "cmo.log", encoding="utf-8")
    file_handler.setLevel(numeric_level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
