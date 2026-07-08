"""
Generate LiPy registry keys from Unicode names.
"""

from __future__ import annotations

import re


def snake_case(text: str) -> str:
    """
    Convert text to lowercase snake_case.
    """
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def generate_key(unicode_name: str) -> str:
    """
    Convert an official Unicode name into a LiPy registry key.
    """
    return snake_case(unicode_name)