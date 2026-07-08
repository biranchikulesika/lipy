"""
Utilities for working with the Odia Unicode block.
"""

from __future__ import annotations

import unicodedata
from typing import Iterator

from .types import ODIA_BLOCK_END, ODIA_BLOCK_START


def iter_odia_characters() -> Iterator[str]:
    """
    Iterate over every assigned character in the Odia Unicode block.
    """
    for codepoint in range(
        ODIA_BLOCK_START,
        ODIA_BLOCK_END + 1,
    ):
        character = chr(codepoint)

        if is_assigned(character):
            yield character


def is_assigned(character: str) -> bool:
    """
    Return True if the character is assigned by Unicode.
    """
    try:
        unicodedata.name(character)
        return True
    except ValueError:
        return False


def unicode_name(character: str) -> str:
    """
    Return the official Unicode name.
    """
    return unicodedata.name(character)


def codepoint(character: str) -> int:
    """
    Return the Unicode code point as an integer.
    """
    return ord(character)


def unicode_string(character: str) -> str:
    """
    Return the Unicode code point in U+XXXX format.
    """
    return f"U+{ord(character):04X}"


def unicode_escape(character: str) -> str:
    """
    Return the Python Unicode escape sequence.
    """
    return f"\\u{ord(character):04x}"