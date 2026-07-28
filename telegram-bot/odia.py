from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class OdiaCharacter:
    id: str
    char: str
    type: str
    unicode: str
    name: str


VOWELS: list[OdiaCharacter] = [
    OdiaCharacter("VOW_A", "\u0B05", "vowel", "U+0B05", "a"),
    OdiaCharacter("VOW_AA", "\u0B06", "vowel", "U+0B06", "aa"),
    OdiaCharacter("VOW_I", "\u0B07", "vowel", "U+0B07", "i"),
    OdiaCharacter("VOW_II", "\u0B08", "vowel", "U+0B08", "ii"),
    OdiaCharacter("VOW_U", "\u0B09", "vowel", "U+0B09", "u"),
    OdiaCharacter("VOW_UU", "\u0B0A", "vowel", "U+0B0A", "uu"),
    OdiaCharacter("VOW_RU", "\u0B0B", "vowel", "U+0B0B", "ru"),
    OdiaCharacter("VOW_E", "\u0B0F", "vowel", "U+0B0F", "e"),
    OdiaCharacter("VOW_AI", "\u0B10", "vowel", "U+0B10", "ai"),
    OdiaCharacter("VOW_O", "\u0B13", "vowel", "U+0B13", "o"),
    OdiaCharacter("VOW_AU", "\u0B14", "vowel", "U+0B14", "au"),
]

CONSONANTS: list[OdiaCharacter] = [
    OdiaCharacter("CONS_KA", "\u0B15", "consonant", "U+0B15", "ka"),
    OdiaCharacter("CONS_KHA", "\u0B16", "consonant", "U+0B16", "kha"),
    OdiaCharacter("CONS_GA", "\u0B17", "consonant", "U+0B17", "ga"),
    OdiaCharacter("CONS_GHA", "\u0B18", "consonant", "U+0B18", "gha"),
    OdiaCharacter("CONS_NGA", "\u0B19", "consonant", "U+0B19", "nga"),
    OdiaCharacter("CONS_CA", "\u0B1A", "consonant", "U+0B1A", "ca"),
    OdiaCharacter("CONS_CHA", "\u0B1B", "consonant", "U+0B1B", "cha"),
    OdiaCharacter("CONS_JA", "\u0B1C", "consonant", "U+0B1C", "ja"),
    OdiaCharacter("CONS_JHA", "\u0B1D", "consonant", "U+0B1D", "jha"),
    OdiaCharacter("CONS_NYA", "\u0B1E", "consonant", "U+0B1E", "nya"),
    OdiaCharacter("CONS_TTA", "\u0B1F", "consonant", "U+0B1F", "tta"),
    OdiaCharacter("CONS_TTHA", "\u0B20", "consonant", "U+0B20", "ttha"),
    OdiaCharacter("CONS_DDA", "\u0B21", "consonant", "U+0B21", "dda"),
    OdiaCharacter("CONS_DDHA", "\u0B22", "consonant", "U+0B22", "ddha"),
    OdiaCharacter("CONS_NNA", "\u0B23", "consonant", "U+0B23", "nna"),
    OdiaCharacter("CONS_TA", "\u0B24", "consonant", "U+0B24", "ta"),
    OdiaCharacter("CONS_THA", "\u0B25", "consonant", "U+0B25", "tha"),
    OdiaCharacter("CONS_DA", "\u0B26", "consonant", "U+0B26", "da"),
    OdiaCharacter("CONS_DHA", "\u0B27", "consonant", "U+0B27", "dha"),
    OdiaCharacter("CONS_NA", "\u0B28", "consonant", "U+0B28", "na"),
    OdiaCharacter("CONS_PA", "\u0B2A", "consonant", "U+0B2A", "pa"),
    OdiaCharacter("CONS_PHA", "\u0B2B", "consonant", "U+0B2B", "pha"),
    OdiaCharacter("CONS_BA", "\u0B2C", "consonant", "U+0B2C", "ba"),
    OdiaCharacter("CONS_BHA", "\u0B2D", "consonant", "U+0B2D", "bha"),
    OdiaCharacter("CONS_MA", "\u0B2E", "consonant", "U+0B2E", "ma"),
    OdiaCharacter("CONS_YA", "\u0B2F", "consonant", "U+0B2F", "ya"),
    OdiaCharacter("CONS_RA", "\u0B30", "consonant", "U+0B30", "ra"),
    OdiaCharacter("CONS_LLA", "\u0B33", "consonant", "U+0B33", "lla"),
    OdiaCharacter("CONS_LA", "\u0B32", "consonant", "U+0B32", "la"),
    OdiaCharacter("CONS_SHA", "\u0B36", "consonant", "U+0B36", "sha"),
    OdiaCharacter("CONS_SSHA", "\u0B37", "consonant", "U+0B37", "ssha"),
    OdiaCharacter("CONS_SA", "\u0B38", "consonant", "U+0B38", "sa"),
    OdiaCharacter("CONS_YYA", "\u0B5F", "consonant", "U+0B5F", "yya"),
    OdiaCharacter("CONS_HA", "\u0B39", "consonant", "U+0B39", "ha"),
]

DIGITS: list[OdiaCharacter] = [
    OdiaCharacter("DIGIT_0", "\u0B66", "digit", "U+0B66", "0"),
    OdiaCharacter("DIGIT_1", "\u0B67", "digit", "U+0B67", "1"),
    OdiaCharacter("DIGIT_2", "\u0B68", "digit", "U+0B68", "2"),
    OdiaCharacter("DIGIT_3", "\u0B69", "digit", "U+0B69", "3"),
    OdiaCharacter("DIGIT_4", "\u0B6A", "digit", "U+0B6A", "4"),
    OdiaCharacter("DIGIT_5", "\u0B6B", "digit", "U+0B6B", "5"),
    OdiaCharacter("DIGIT_6", "\u0B6C", "digit", "U+0B6C", "6"),
    OdiaCharacter("DIGIT_7", "\u0B6D", "digit", "U+0B6D", "7"),
    OdiaCharacter("DIGIT_8", "\u0B6E", "digit", "U+0B6E", "8"),
    OdiaCharacter("DIGIT_9", "\u0B6F", "digit", "U+0B6F", "9"),
]

ALL_CHARACTERS: list[OdiaCharacter] = VOWELS + CONSONANTS + DIGITS
_CHAR_BY_ID: dict[str, OdiaCharacter] = {c.id: c for c in ALL_CHARACTERS}
_CHAR_BY_UNICODE: dict[str, OdiaCharacter] = {c.char: c for c in ALL_CHARACTERS}
_CHAR_BY_NAME: dict[str, OdiaCharacter] = {c.name.lower(): c for c in ALL_CHARACTERS}


def lookup(text: str) -> OdiaCharacter | None:
    text = text.strip()
    if text in _CHAR_BY_ID:
        return _CHAR_BY_ID[text]
    if text in _CHAR_BY_UNICODE:
        return _CHAR_BY_UNICODE[text]
    if text.lower() in _CHAR_BY_NAME:
        return _CHAR_BY_NAME[text.lower()]
    return None
