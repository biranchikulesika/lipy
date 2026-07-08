"""
Generate runtime artifacts from the LiPy character registry.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import yaml

from config import (
    CHARACTERS_JSON,
    CHARACTERS_TS,
    CHARACTERS_YAML,
    CLASS_TO_INDEX_JSON,
    INDEX_TO_CLASS_JSON,
    LABELS_TXT,
)
from .exceptions import RegistryError, RegistryValidationError
from .validate import validate as validate_registry


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


def build_forward(characters: list[dict]) -> dict[str, str]:
    """
    Build key -> character mapping.
    """

    return {
        entry["key"]: entry["character"]
        for entry in characters
    }


def build_reverse(characters: list[dict]) -> dict[str, str]:
    """
    Build character -> key mapping.
    """

    return {
        entry["character"]: entry["key"]
        for entry in characters
    }


def build_labels(characters: list[dict]) -> list[str]:
    """
    Return registry keys in registry order.
    """

    return [
        entry["key"]
        for entry in characters
    ]


def build_class_to_index(
    labels: list[str],
) -> dict[str, int]:
    """
    Build class -> index mapping.
    """

    return {
        label: index
        for index, label in enumerate(labels)
    }


def build_index_to_class(
    labels: list[str],
) -> dict[str, str]:
    """
    Build index -> class mapping.
    """

    return {
        str(index): label
        for index, label in enumerate(labels)
    }


def write_characters_json(
    version: int,
    forward: dict[str, str],
    reverse: dict[str, str],
) -> None:
    """
    Write characters.json.
    """

    data = {
        "version": version,
        "generated_at": (
            datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
        ),
        "forward": forward,
        "reverse": reverse,
    }

    CHARACTERS_JSON.parent.mkdir(parents=True, exist_ok=True)

    with CHARACTERS_JSON.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2,
        )


def write_typescript(
    forward: dict[str, str],
) -> None:
    """
    Write characters.ts.
    """

    lines = [
        "// AUTO-GENERATED. DO NOT EDIT.",
        "",
        "export const CHARACTERS = {",
    ]

    for key, value in forward.items():
        lines.append(
            f"  {json.dumps(key, ensure_ascii=False)}: "
            f"{json.dumps(value, ensure_ascii=False)},"
        )

    lines.extend(
        [
            "} as const;",
            "",
            "export type CharacterKey = keyof typeof CHARACTERS;",
            "",
            "export default CHARACTERS;",
        ]
    )

    CHARACTERS_TS.parent.mkdir(parents=True, exist_ok=True)
    CHARACTERS_TS.write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
    )


def write_labels(
    labels: list[str],
) -> None:
    """
    Write labels.txt.
    """

    LABELS_TXT.parent.mkdir(parents=True, exist_ok=True)
    LABELS_TXT.write_text(
        "\n".join(labels) + "\n",
        encoding="utf-8",
    )


def write_class_to_index(
    mapping: dict[str, int],
) -> None:
    """
    Write class_to_index.json.
    """

    CLASS_TO_INDEX_JSON.parent.mkdir(parents=True, exist_ok=True)

    with CLASS_TO_INDEX_JSON.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            mapping,
            file,
            ensure_ascii=False,
            indent=2,
        )


def write_index_to_class(
    mapping: dict[str, str],
) -> None:
    """
    Write index_to_class.json.
    """

    INDEX_TO_CLASS_JSON.parent.mkdir(parents=True, exist_ok=True)

    with INDEX_TO_CLASS_JSON.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            mapping,
            file,
            ensure_ascii=False,
            indent=2,
        )


def run() -> None:
    """
    Generate all runtime artifacts.
    """

    registry = load_registry()

    errors = validate_registry(registry)
    if errors:
        raise RegistryValidationError(
            "\n".join(errors)
        )

    version = registry["version"]
    characters = registry["characters"]

    forward = build_forward(characters)
    reverse = build_reverse(characters)

    labels = build_labels(characters)

    class_to_index = build_class_to_index(labels)
    index_to_class = build_index_to_class(labels)

    write_characters_json(
        version,
        forward,
        reverse,
    )

    write_typescript(forward)

    write_labels(labels)

    write_class_to_index(class_to_index)

    write_index_to_class(index_to_class)

    print(f"✓ Generated {CHARACTERS_JSON.name}")
    print(f"✓ Generated {CHARACTERS_TS.name}")
    print(f"✓ Generated {LABELS_TXT.name}")
    print(f"✓ Generated {CLASS_TO_INDEX_JSON.name}")
    print(f"✓ Generated {INDEX_TO_CLASS_JSON.name}")


if __name__ == "__main__":
    run()
