"""
Validate and build the LiPy grapheme registry.
"""

from __future__ import annotations

import json
from itertools import product
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

import yaml

from config import (
    CHARACTERS_YAML,
    GRAPHEME_CLASS_TO_INDEX_JSON,
    GRAPHEME_INDEX_TO_CLASS_JSON,
    GRAPHEME_LABELS_TXT,
    GRAPHEMES_JSON,
    GRAPHEMES_TS,
    GRAPHEMES_YAML,
    MAX_CONSONANTS_PER_GRAPHEME,
)
from .exceptions import RegistryError, RegistryValidationError
from .validate import validate as validate_unicode_registry


REQUIRED_FIELDS = {
    "id",
    "label",
    "display",
    "unicode_sequence",
}

INDEPENDENT_VOWEL_NAMES = {
    "ORIYA LETTER A",
    "ORIYA LETTER AA",
    "ORIYA LETTER I",
    "ORIYA LETTER II",
    "ORIYA LETTER U",
    "ORIYA LETTER UU",
    "ORIYA LETTER VOCALIC R",
    "ORIYA LETTER VOCALIC L",
    "ORIYA LETTER E",
    "ORIYA LETTER AI",
    "ORIYA LETTER O",
    "ORIYA LETTER AU",
    "ORIYA LETTER VOCALIC RR",
    "ORIYA LETTER VOCALIC LL",
}

VIRAMA_NAME = "ORIYA SIGN VIRAMA"


def load_yaml(path: Any) -> dict[str, Any]:
    """
    Load a YAML mapping.
    """

    if not path.exists():
        raise RegistryError(f"Registry not found: {path}")

    with path.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    if not isinstance(data, dict):
        raise RegistryError(f"Registry must be a YAML mapping: {path}")

    return data


def load_unicode_registry() -> dict[str, Any]:
    """
    Load the atomic Unicode registry.
    """

    return load_yaml(CHARACTERS_YAML)


def load_grapheme_registry() -> dict[str, Any]:
    """
    Load the grapheme registry.
    """

    return load_yaml(GRAPHEMES_YAML)


def unicode_entries_by_name(
    unicode_registry: Mapping[str, Any],
) -> dict[str, Mapping[str, Any]]:
    """
    Build Unicode name -> registry entry mapping.
    """

    return {
        entry["unicode_name"]: entry
        for entry in unicode_registry["characters"]
    }


def unicode_entries_by_key(
    unicode_registry: Mapping[str, Any],
) -> dict[str, Mapping[str, Any]]:
    """
    Build Unicode key -> registry entry mapping.
    """

    return {
        entry["key"]: entry
        for entry in unicode_registry["characters"]
    }


def sorted_unicode_entries(
    unicode_registry: Mapping[str, Any],
) -> list[Mapping[str, Any]]:
    """
    Return Unicode entries ordered by code point.
    """

    return sorted(
        unicode_registry["characters"],
        key=lambda entry: int(entry["unicode"][2:], 16),
    )


def is_independent_vowel(entry: Mapping[str, Any]) -> bool:
    """
    Return True for Odia independent vowel letters.
    """

    return entry["unicode_name"] in INDEPENDENT_VOWEL_NAMES


def is_consonant(entry: Mapping[str, Any]) -> bool:
    """
    Return True for Odia consonant letters.
    """

    return (
        entry["unicode_name"].startswith("ORIYA LETTER ")
        and not is_independent_vowel(entry)
    )


def is_vowel_sign(entry: Mapping[str, Any]) -> bool:
    """
    Return True for Odia dependent vowel signs.
    """

    return entry["unicode_name"].startswith("ORIYA VOWEL SIGN ")


def is_standalone_symbol(entry: Mapping[str, Any]) -> bool:
    """
    Return True for non-combining Odia symbols useful as grapheme classes.
    """

    unicode_name = entry["unicode_name"]
    return (
        unicode_name.startswith("ORIYA DIGIT ")
        or unicode_name.startswith("ORIYA FRACTION ")
        or unicode_name == "ORIYA ISSHAR"
    )


def label_from_unicode_sequence(
    unicode_sequence: list[str],
    entries_by_name: Mapping[str, Mapping[str, Any]],
) -> str:
    """
    Generate a deterministic grapheme label from Unicode registry keys.
    """

    return "__".join(
        entries_by_name[unicode_name]["key"]
        for unicode_name in unicode_sequence
    )


def display_from_unicode_sequence(
    unicode_sequence: list[str],
    entries_by_name: Mapping[str, Mapping[str, Any]],
) -> str:
    """
    Render a grapheme from its Unicode registry sequence.
    """

    return "".join(
        entries_by_name[unicode_name]["character"]
        for unicode_name in unicode_sequence
    )


def codepoints_from_unicode_sequence(
    unicode_sequence: list[str],
    entries_by_name: Mapping[str, Mapping[str, Any]],
) -> list[str]:
    """
    Return code point strings for a grapheme sequence.
    """

    return [
        entries_by_name[unicode_name]["unicode"]
        for unicode_name in unicode_sequence
    ]


def keys_from_unicode_sequence(
    unicode_sequence: list[str],
    entries_by_name: Mapping[str, Mapping[str, Any]],
) -> list[str]:
    """
    Return Unicode registry keys for a grapheme sequence.
    """

    return [
        entries_by_name[unicode_name]["key"]
        for unicode_name in unicode_sequence
    ]


def conjunct_sequence(consonant_names: tuple[str, ...]) -> list[str]:
    """
    Join consonants with virama signs.
    """

    sequence: list[str] = []
    for index, consonant_name in enumerate(consonant_names):
        if index:
            sequence.append(VIRAMA_NAME)
        sequence.append(consonant_name)
    return sequence


def source_entry(
    grapheme_id: int,
    unicode_sequence: list[str],
    entries_by_name: Mapping[str, Mapping[str, Any]],
) -> dict[str, Any]:
    """
    Build one source grapheme entry from a Unicode sequence.
    """

    return {
        "id": grapheme_id,
        "label": label_from_unicode_sequence(
            unicode_sequence,
            entries_by_name,
        ),
        "display": display_from_unicode_sequence(
            unicode_sequence,
            entries_by_name,
        ),
        "unicode_sequence": unicode_sequence,
    }


def generate_grapheme_registry(
    unicode_registry: Mapping[str, Any],
    max_consonants: int = MAX_CONSONANTS_PER_GRAPHEME,
) -> dict[str, Any]:
    """
    Generate a deterministic Odia grapheme source registry.

    The generator creates structurally valid Odia grapheme candidates from the
    Unicode registry: standalone letters and symbols, consonant-vowel forms,
    and consonant clusters up to ``max_consonants`` joined by virama.
    """

    if max_consonants < 1:
        raise RegistryError("max_consonants must be at least 1.")

    entries = sorted_unicode_entries(unicode_registry)
    entries_by_name = unicode_entries_by_name(unicode_registry)

    if VIRAMA_NAME not in entries_by_name:
        raise RegistryError(f"Missing required Unicode entry: {VIRAMA_NAME}")

    consonants = [
        entry
        for entry in entries
        if is_consonant(entry)
    ]
    vowel_signs = [
        entry
        for entry in entries
        if is_vowel_sign(entry)
    ]

    sequences: list[list[str]] = []

    sequences.extend(
        [[entry["unicode_name"]]]
        for entry in entries
        if is_independent_vowel(entry)
        or is_consonant(entry)
        or is_standalone_symbol(entry)
    )

    for consonant in consonants:
        for vowel_sign in vowel_signs:
            sequences.append(
                [
                    consonant["unicode_name"],
                    vowel_sign["unicode_name"],
                ]
            )

    consonant_names = [
        entry["unicode_name"]
        for entry in consonants
    ]

    for cluster_size in range(2, max_consonants + 1):
        for cluster in product(consonant_names, repeat=cluster_size):
            base_sequence = conjunct_sequence(cluster)
            sequences.append(base_sequence)

            for vowel_sign in vowel_signs:
                sequences.append(
                    [
                        *base_sequence,
                        vowel_sign["unicode_name"],
                    ]
                )

    graphemes = [
        source_entry(index, sequence, entries_by_name)
        for index, sequence in enumerate(sequences)
    ]

    return {
        "version": 1,
        "unicode_registry_version": unicode_registry["version"],
        "generation": {
            "max_consonants_per_grapheme": max_consonants,
            "strategy": "standalone letters/symbols, consonant-vowel forms, virama conjunct clusters",
        },
        "graphemes": graphemes,
    }


def write_source_registry(grapheme_registry: Mapping[str, Any]) -> None:
    """
    Write the generated grapheme source registry.
    """

    GRAPHEMES_YAML.parent.mkdir(parents=True, exist_ok=True)
    with GRAPHEMES_YAML.open("w", encoding="utf-8") as file:
        yaml.safe_dump(
            dict(grapheme_registry),
            file,
            allow_unicode=True,
            indent=2,
            sort_keys=False,
            default_flow_style=False,
        )


def validate(
    grapheme_registry: Mapping[str, Any],
    unicode_registry: Mapping[str, Any],
) -> list[str]:
    """
    Validate graphemes against the atomic Unicode registry.
    """

    errors: list[str] = []

    if "version" not in grapheme_registry:
        errors.append("Missing 'version' field.")
    elif not isinstance(grapheme_registry["version"], int):
        errors.append("'version' must be an integer.")

    if "unicode_registry_version" not in grapheme_registry:
        errors.append("Missing 'unicode_registry_version' field.")
    elif grapheme_registry["unicode_registry_version"] != unicode_registry.get("version"):
        errors.append(
            "'unicode_registry_version' must match characters.yaml version."
        )

    if "graphemes" not in grapheme_registry:
        errors.append("Missing 'graphemes' field.")
        return errors

    graphemes = grapheme_registry["graphemes"]
    if not isinstance(graphemes, list):
        errors.append("'graphemes' must be a list.")
        return errors

    entries_by_name = unicode_entries_by_name(unicode_registry)

    seen_ids: set[int] = set()
    seen_labels: set[str] = set()
    seen_sequences: set[tuple[str, ...]] = set()

    previous_id = -1

    for index, entry in enumerate(graphemes, start=1):
        prefix = f"Grapheme #{index}"

        if not isinstance(entry, Mapping):
            errors.append(f"{prefix}: Entry must be a mapping.")
            continue

        missing = REQUIRED_FIELDS - entry.keys()
        if missing:
            errors.append(
                f"{prefix}: Missing fields: {', '.join(sorted(missing))}"
            )
            continue

        grapheme_id = entry["id"]
        label = entry["label"]
        display = entry["display"]
        unicode_sequence = entry["unicode_sequence"]

        if not isinstance(grapheme_id, int):
            errors.append(f"{prefix}: id must be an integer.")
            continue

        expected_id = index - 1
        if grapheme_id != expected_id:
            errors.append(
                f"{prefix}: id must match registry order "
                f"(expected {expected_id}, got {grapheme_id})."
            )

        if grapheme_id <= previous_id:
            errors.append(f"{prefix}: ids must be strictly increasing.")
        previous_id = grapheme_id

        if grapheme_id in seen_ids:
            errors.append(f"{prefix}: Duplicate id '{grapheme_id}'.")
        seen_ids.add(grapheme_id)

        if not isinstance(label, str):
            errors.append(f"{prefix}: label must be a string.")
            continue

        if label in seen_labels:
            errors.append(f"{prefix}: Duplicate label '{label}'.")
        seen_labels.add(label)

        if not isinstance(display, str):
            errors.append(f"{prefix}: display must be a string.")
            continue

        if not isinstance(unicode_sequence, list) or not unicode_sequence:
            errors.append(f"{prefix}: unicode_sequence must be a non-empty list.")
            continue

        if not all(isinstance(unicode_name, str) for unicode_name in unicode_sequence):
            errors.append(f"{prefix}: unicode_sequence values must be strings.")
            continue

        missing_names = [
            unicode_name
            for unicode_name in unicode_sequence
            if unicode_name not in entries_by_name
        ]
        if missing_names:
            errors.append(
                f"{prefix}: Unknown Unicode names: {', '.join(missing_names)}"
            )
            continue

        sequence_key = tuple(unicode_sequence)
        if sequence_key in seen_sequences:
            sequence = " + ".join(unicode_sequence)
            errors.append(
                f"{prefix}: Duplicate unicode_sequence '{sequence}'."
            )
        seen_sequences.add(sequence_key)

        expected_label = label_from_unicode_sequence(
            unicode_sequence,
            entries_by_name,
        )
        if label != expected_label:
            errors.append(
                f"{prefix}: Invalid label "
                f"(expected '{expected_label}', got '{label}')."
            )

        expected_display = display_from_unicode_sequence(
            unicode_sequence,
            entries_by_name,
        )
        if display != expected_display:
            errors.append(
                f"{prefix}: Invalid display "
                f"(expected '{expected_display}', got '{display}')."
            )

    return errors


def generate_source_run() -> None:
    """
    Generate graphemes.yaml from characters.yaml.
    """

    unicode_registry = load_unicode_registry()

    unicode_errors = validate_unicode_registry(unicode_registry)
    if unicode_errors:
        raise RegistryValidationError("\n".join(unicode_errors))

    grapheme_registry = generate_grapheme_registry(unicode_registry)
    write_source_registry(grapheme_registry)

    print(
        f"✓ Generated {len(grapheme_registry['graphemes'])} graphemes"
    )
    print(f"✓ Saved to {GRAPHEMES_YAML}")


def build_graphemes(
    grapheme_registry: Mapping[str, Any],
    unicode_registry: Mapping[str, Any],
) -> list[dict[str, Any]]:
    """
    Build normalized grapheme entries with derived fields.
    """

    entries_by_name = unicode_entries_by_name(unicode_registry)
    normalized: list[dict[str, Any]] = []

    for entry in grapheme_registry["graphemes"]:
        unicode_sequence = entry["unicode_sequence"]
        normalized.append(
            {
                "id": entry["id"],
                "label": label_from_unicode_sequence(
                    unicode_sequence,
                    entries_by_name,
                ),
                "display": display_from_unicode_sequence(
                    unicode_sequence,
                    entries_by_name,
                ),
                "unicode_sequence": unicode_sequence,
                "unicode_keys": keys_from_unicode_sequence(
                    unicode_sequence,
                    entries_by_name,
                ),
                "codepoints": codepoints_from_unicode_sequence(
                    unicode_sequence,
                    entries_by_name,
                ),
            }
        )

    return normalized


def write_json(
    grapheme_registry: Mapping[str, Any],
    unicode_registry: Mapping[str, Any],
    graphemes: list[dict[str, Any]],
) -> None:
    """
    Write graphemes.json.
    """

    data = {
        "version": grapheme_registry["version"],
        "unicode_registry_version": unicode_registry["version"],
        "generated_at": (
            datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
        ),
        "graphemes": graphemes,
        "label_to_unicode_sequence": {
            entry["label"]: entry["unicode_sequence"]
            for entry in graphemes
        },
        "label_to_display": {
            entry["label"]: entry["display"]
            for entry in graphemes
        },
    }

    GRAPHEMES_JSON.parent.mkdir(parents=True, exist_ok=True)
    with GRAPHEMES_JSON.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def write_typescript(graphemes: list[dict[str, Any]]) -> None:
    """
    Write graphemes.ts.
    """

    lines = [
        "// AUTO-GENERATED. DO NOT EDIT.",
        "",
        "export const GRAPHEMES = {",
    ]

    for entry in graphemes:
        lines.append(
            f"  {json.dumps(entry['label'], ensure_ascii=False)}: "
            f"{json.dumps(entry, ensure_ascii=False)},"
        )

    lines.extend(
        [
            "} as const;",
            "",
            "export type GraphemeLabel = keyof typeof GRAPHEMES;",
            "",
            "export default GRAPHEMES;",
        ]
    )

    GRAPHEMES_TS.parent.mkdir(parents=True, exist_ok=True)
    GRAPHEMES_TS.write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
    )


def write_training_artifacts(graphemes: list[dict[str, Any]]) -> None:
    """
    Write grapheme label and class-index files.
    """

    labels = [
        entry["label"]
        for entry in graphemes
    ]
    class_to_index = {
        label: index
        for index, label in enumerate(labels)
    }
    index_to_class = {
        str(index): label
        for index, label in enumerate(labels)
    }

    GRAPHEME_LABELS_TXT.parent.mkdir(parents=True, exist_ok=True)
    GRAPHEME_LABELS_TXT.write_text(
        "\n".join(labels) + "\n",
        encoding="utf-8",
    )

    GRAPHEME_CLASS_TO_INDEX_JSON.parent.mkdir(parents=True, exist_ok=True)
    with GRAPHEME_CLASS_TO_INDEX_JSON.open("w", encoding="utf-8") as file:
        json.dump(class_to_index, file, ensure_ascii=False, indent=2)

    GRAPHEME_INDEX_TO_CLASS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with GRAPHEME_INDEX_TO_CLASS_JSON.open("w", encoding="utf-8") as file:
        json.dump(index_to_class, file, ensure_ascii=False, indent=2)


def validate_run() -> None:
    """
    Validate graphemes.yaml against characters.yaml.
    """

    unicode_registry = load_unicode_registry()
    grapheme_registry = load_grapheme_registry()

    unicode_errors = validate_unicode_registry(unicode_registry)
    if unicode_errors:
        raise RegistryValidationError("\n".join(unicode_errors))

    errors = validate(grapheme_registry, unicode_registry)
    if errors:
        raise RegistryValidationError("\n".join(errors))

    print("✓ Grapheme registry is valid.")


def build_run() -> None:
    """
    Generate all grapheme runtime and training artifacts.
    """

    unicode_registry = load_unicode_registry()
    grapheme_registry = load_grapheme_registry()

    unicode_errors = validate_unicode_registry(unicode_registry)
    if unicode_errors:
        raise RegistryValidationError("\n".join(unicode_errors))

    errors = validate(grapheme_registry, unicode_registry)
    if errors:
        raise RegistryValidationError("\n".join(errors))

    graphemes = build_graphemes(grapheme_registry, unicode_registry)

    write_json(grapheme_registry, unicode_registry, graphemes)
    write_typescript(graphemes)
    write_training_artifacts(graphemes)

    print(f"✓ Generated {GRAPHEMES_JSON.name}")
    print(f"✓ Generated {GRAPHEMES_TS.name}")
    print(f"✓ Generated {GRAPHEME_LABELS_TXT.name}")
    print(f"✓ Generated {GRAPHEME_CLASS_TO_INDEX_JSON.name}")
    print(f"✓ Generated {GRAPHEME_INDEX_TO_CLASS_JSON.name}")
