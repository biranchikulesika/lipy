"""
Shared types and constants for the LiPy character registry.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final


# ---------------------------------------------------------------------------
# Unicode block
# ---------------------------------------------------------------------------

ODIA_BLOCK_START: Final[int] = 0x0B00
ODIA_BLOCK_END: Final[int] = 0x0B7F


# ---------------------------------------------------------------------------
# Registry entry
# ---------------------------------------------------------------------------

@dataclass(slots=True)
class Character:
    """
    Represents a single character in the LiPy registry.
    """

    key: str
    character: str
    unicode: str
    unicode_name: str