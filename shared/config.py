"""
Shared paths used by the LiPy registry.
"""

from pathlib import Path

SHARED_DIR = Path(__file__).resolve().parent

SOURCE_DIR = SHARED_DIR / "registry_source"
GENERATED_DIR = SHARED_DIR / "generated"

UNICODE_GENERATED_DIR = GENERATED_DIR / "unicode"
GRAPHEME_GENERATED_DIR = GENERATED_DIR / "graphemes"

CHARACTERS_YAML = SOURCE_DIR / "characters.yaml"
CHARACTERS_JSON = UNICODE_GENERATED_DIR / "characters.json"
CHARACTERS_TS = UNICODE_GENERATED_DIR / "characters.ts"

LABELS_TXT = UNICODE_GENERATED_DIR / "labels.txt"
CLASS_TO_INDEX_JSON = UNICODE_GENERATED_DIR / "class_to_index.json"
INDEX_TO_CLASS_JSON = UNICODE_GENERATED_DIR / "index_to_class.json"

GRAPHEMES_YAML = SOURCE_DIR / "graphemes.yaml"
GRAPHEMES_JSON = GRAPHEME_GENERATED_DIR / "graphemes.json"
GRAPHEMES_TS = GRAPHEME_GENERATED_DIR / "graphemes.ts"

GRAPHEME_LABELS_TXT = GRAPHEME_GENERATED_DIR / "labels.txt"
GRAPHEME_CLASS_TO_INDEX_JSON = GRAPHEME_GENERATED_DIR / "class_to_index.json"
GRAPHEME_INDEX_TO_CLASS_JSON = GRAPHEME_GENERATED_DIR / "index_to_class.json"

MAX_CONSONANTS_PER_GRAPHEME = 2
