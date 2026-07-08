# LiPy Shared Registries

This directory owns the character metadata used by LiPy. It now has two
separate registries with different responsibilities:

```text
Unicode Registry (atomic)
        |
        v
Grapheme Registry (trainable classes)
        |
        v
Dataset -> Training -> Model -> Inference
```

The Unicode registry remains canonical for atomic Unicode characters. The
grapheme registry is canonical for OCR classes, because each dataset image
represents one complete handwritten grapheme.

## Registry Files

```text
shared/
├── characters.yaml       # Atomic Unicode registry, source of truth
├── graphemes.yaml        # Grapheme registry, trainable class source of truth
├── config.py             # Shared paths
├── generate_registry.py  # CLI entry point
├── registry/
│   ├── bootstrap.py
│   ├── build.py
│   ├── graphemes.py
│   ├── validate.py
│   └── ...
└── README.md
```

`characters.yaml` should not be changed to fit dataset labels. It stores Unicode
atoms such as `ORIYA LETTER KA`, `ORIYA VOWEL SIGN I`, and
`ORIYA SIGN VIRAMA`.

`graphemes.yaml` stores complete trainable classes as Unicode-name sequences.
Labels and rendered displays are derived from `characters.yaml` and validated.

## Grapheme Schema

Each grapheme entry has:

- `id`: zero-based registry order
- `label`: deterministic folder/class label generated from Unicode registry keys
- `display`: rendered Unicode string generated from the sequence
- `unicode_sequence`: ordered list of Unicode names from `characters.yaml`

Example:

```yaml
- id: 1
  label: oriya_letter_ka__oriya_vowel_sign_i
  display: କି
  unicode_sequence:
    - ORIYA LETTER KA
    - ORIYA VOWEL SIGN I
```

Conjunct example:

```yaml
- id: 10
  label: oriya_letter_ka__oriya_sign_virama__oriya_letter_ra
  display: କ୍ର
  unicode_sequence:
    - ORIYA LETTER KA
    - ORIYA SIGN VIRAMA
    - ORIYA LETTER RA
```

Labels are never handwritten aliases. They are the Unicode registry keys joined
with `__`.

## Generated Files

Atomic Unicode artifacts:

- `characters.json`
- `characters.ts`
- `labels.txt`
- `class_to_index.json`
- `index_to_class.json`

Grapheme OCR artifacts:

- `graphemes.json`
- `graphemes.ts`
- `grapheme_labels.txt`
- `grapheme_class_to_index.json`
- `grapheme_index_to_class.json`

Dataset and training code should use the grapheme artifacts, not the atomic
Unicode label files.

## Dataset Contract

Dataset folders must use grapheme labels:

```text
dataset/
├── oriya_letter_ka/
│   └── 0001.png
├── oriya_letter_ka__oriya_vowel_sign_i/
│   └── 0001.png
└── oriya_letter_ka__oriya_sign_virama__oriya_letter_ra/
    └── 0001.png
```

Do not use rendered Odia text as folder names.

## Commands

Install the only external dependency:

```bash
python -m pip install pyyaml
```

Run commands from `shared/`.

Validate the atomic Unicode registry:

```bash
python generate_registry.py validate
```

Build atomic Unicode artifacts:

```bash
python generate_registry.py build
```

Validate graphemes against the Unicode registry:

```bash
python generate_registry.py validate-graphemes
```

Build grapheme artifacts:

```bash
python generate_registry.py build-graphemes
```

Build both layers:

```bash
python generate_registry.py build-all
```

## Synchronization Rules

The grapheme registry is synchronized with the Unicode registry by validation:

- every `unicode_sequence` name must exist in `characters.yaml`
- every `label` must match the derived Unicode key sequence
- every `display` must match the rendered Unicode sequence
- every `id` must match zero-based registry order
- duplicate grapheme labels and duplicate Unicode sequences are rejected
- `unicode_registry_version` must match the Unicode registry version

This keeps the future inference decoder mechanical:

```text
model output index
        |
        v
grapheme label
        |
        v
unicode_sequence
        |
        v
rendered Unicode string
```

No manual model-output mapping should exist outside the generated grapheme
artifacts.
