"""
Validate the LiPy character registry.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any

import yaml

from config import CHARACTERS_YAML
from .exceptions import RegistryError, RegistryValidationError
from .key_generator import generate_key
from .unicode_utils import is_assigned, unicode_name


def load_registry() -> dict[str, Any]:
    """
    Load the character registry.
    """

    if not CHARACTERS_YAML.exists():
        raise RegistryError(
            f"Registry not found: {CHARACTERS_YAML}"
        )

    with CHARACTERS_YAML.open(
        "r",
        encoding="utf-8",
    ) as file:
        data = yaml.safe_load(file)

    if not isinstance(data, dict):
        raise RegistryError(
            f"Registry must be a YAML mapping: {CHARACTERS_YAML}"
        )

    return data


def validate(data: Mapping[str, Any]) -> list[str]:
    """
    Validate the registry.

    Returns
    -------
    list[str]
        A list of validation errors.
    """

    errors: list[str] = []

    if "version" not in data:
        errors.append("Missing 'version' field.")
    elif not isinstance(data["version"], int):
        errors.append("'version' must be an integer.")

    if "characters" not in data:
        errors.append("Missing 'characters' field.")
        return errors

    characters = data["characters"]

    if not isinstance(characters, list):
        errors.append("'characters' must be a list.")
        return errors

    seen_keys: set[str] = set()
    seen_characters: set[str] = set()
    seen_unicode: set[str] = set()

    previous_codepoint = -1

    for index, entry in enumerate(characters, start=1):

        prefix = f"Entry #{index}"

        if not isinstance(entry, Mapping):
            errors.append(
                f"{prefix}: Entry must be a mapping."
            )
            continue

        required_fields = {
            "key",
            "character",
            "unicode",
            "unicode_name",
        }

        missing = required_fields - entry.keys()

        if missing:
            errors.append(
                f"{prefix}: Missing fields: {', '.join(sorted(missing))}"
            )
            continue

        key = entry["key"]
        character = entry["character"]
        unicode_value = entry["unicode"]
        stored_name = entry["unicode_name"]

        if not isinstance(key, str):
            errors.append(
                f"{prefix}: Key must be a string."
            )
            continue

        if not isinstance(character, str):
            errors.append(
                f"{prefix}: Character must be a string."
            )
            continue

        if not isinstance(unicode_value, str):
            errors.append(
                f"{prefix}: Unicode value must be a string."
            )
            continue

        if not isinstance(stored_name, str):
            errors.append(
                f"{prefix}: Unicode name must be a string."
            )
            continue

        # -------------------------------------------------------------
        # Duplicate checks
        # -------------------------------------------------------------

        if key in seen_keys:
            errors.append(
                f"{prefix}: Duplicate key '{key}'"
            )
        seen_keys.add(key)

        if character in seen_characters:
            errors.append(
                f"{prefix}: Duplicate character '{character}'"
            )
        seen_characters.add(character)

        if unicode_value in seen_unicode:
            errors.append(
                f"{prefix}: Duplicate unicode '{unicode_value}'"
            )
        seen_unicode.add(unicode_value)

        # -------------------------------------------------------------
        # Character validation
        # -------------------------------------------------------------

        if len(character) != 1:
            errors.append(
                f"{prefix}: Character must contain exactly one Unicode character."
            )
            continue

        if not is_assigned(character):
            errors.append(
                f"{prefix}: '{character}' is not an assigned Unicode character."
            )
            continue

        # -------------------------------------------------------------
        # Unicode value
        # -------------------------------------------------------------

        expected_unicode = f"U+{ord(character):04X}"

        if unicode_value != expected_unicode:
            errors.append(
                f"{prefix}: Unicode mismatch "
                f"(expected '{expected_unicode}', got '{unicode_value}')"
            )

        # -------------------------------------------------------------
        # Unicode name
        # -------------------------------------------------------------

        actual_name = unicode_name(character)

        if stored_name != actual_name:
            errors.append(
                f"{prefix}: Unicode name mismatch "
                f"(expected '{actual_name}', got '{stored_name}')"
            )

        # -------------------------------------------------------------
        # Registry key
        # -------------------------------------------------------------

        expected_key = generate_key(actual_name)

        if key != expected_key:
            errors.append(
                f"{prefix}: Invalid key "
                f"(expected '{expected_key}', got '{key}')"
            )

        # -------------------------------------------------------------
        # Key format
        # -------------------------------------------------------------

        if not re.fullmatch(r"[a-z0-9_]+", key):
            errors.append(
                f"{prefix}: Invalid key format '{key}'"
            )

        # -------------------------------------------------------------
        # Registry ordering
        # -------------------------------------------------------------

        codepoint = ord(character)

        if codepoint < previous_codepoint:
            errors.append(
                f"{prefix}: Registry is not ordered by Unicode code point."
            )

        previous_codepoint = codepoint

    return errors


def run() -> None:
    """
    Validate the character registry.

    Raises
    ------
    RegistryValidationError
        If validation fails.
    """

    registry = load_registry()

    errors = validate(registry)

    if errors:
        raise RegistryValidationError(
            "\n".join(errors)
        )

    print("✓ Registry is valid.")


if __name__ == "__main__":
    run()
