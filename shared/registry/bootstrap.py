"""
Generate the LiPy character registry from the Unicode Odia block.
"""

from __future__ import annotations

from dataclasses import asdict

import yaml

from config import CHARACTERS_YAML
from .key_generator import generate_key
from .types import Character
from .unicode_utils import (
    iter_odia_characters,
    unicode_name,
    unicode_string,
)


def build_registry() -> list[Character]:
    """
    Build the complete character registry from the Odia Unicode block.
    """
    registry: list[Character] = []

    for char in iter_odia_characters():
        registry.append(
            Character(
                key=generate_key(unicode_name(char)),
                character=char,
                unicode=unicode_string(char),
                unicode_name=unicode_name(char),
            )
        )

    # Ensure deterministic ordering by Unicode code point.
    registry.sort(key=lambda character: ord(character.character))

    return registry


def write_yaml(characters: list[Character]) -> None:
    """
    Write the registry to characters.yaml.
    """

    data = {
        "version": 1,
        "characters": [
            asdict(character)
            for character in characters
        ],
    }

    CHARACTERS_YAML.parent.mkdir(parents=True, exist_ok=True)

    with CHARACTERS_YAML.open(
        "w",
        encoding="utf-8",
    ) as file:
        yaml.safe_dump(
            data,
            file,
            allow_unicode=True,
            indent=2,
            sort_keys=False,
            default_flow_style=False,
        )


def run() -> None:
    """
    Generate the LiPy character registry.
    """

    characters = build_registry()

    write_yaml(characters)

    print(f"✓ Generated {len(characters)} characters")
    print(f"✓ Saved to {CHARACTERS_YAML}")


if __name__ == "__main__":
    run()
