# ============================================
# Lipi - Odia OCR Character Label System
# ============================================

# Unicode Character → ML Label
odia_ml_labels = {
    # ========================================
    # Independent Vowels (Svara Varna)
    # ========================================
    "ଅ": "VOW_A",
    "ଆ": "VOW_AA",
    "ଇ": "VOW_I",
    "ଈ": "VOW_II",
    "ଉ": "VOW_U",
    "ଊ": "VOW_UU",
    "ଋ": "VOW_RU",
    "ଏ": "VOW_E",
    "ଐ": "VOW_AI",
    "ଓ": "VOW_O",
    "ଔ": "VOW_AU",
    # ========================================
    # Consonants (Byanjana Varna)
    # ========================================
    "କ": "CONS_KA",
    "ଖ": "CONS_KHA",
    "ଗ": "CONS_GA",
    "ଘ": "CONS_GHA",
    "ଙ": "CONS_NGA",
    "ଚ": "CONS_CA",
    "ଛ": "CONS_CHA",
    "ଜ": "CONS_JA",
    "ଝ": "CONS_JHA",
    "ଞ": "CONS_NYA",
    "ଟ": "CONS_TTA",
    "ଠ": "CONS_TTHA",
    "ଡ": "CONS_DDA",
    "ଢ": "CONS_DDHA",
    "ଣ": "CONS_NNA",
    "ତ": "CONS_TA",
    "ଥ": "CONS_THA",
    "ଦ": "CONS_DA",
    "ଧ": "CONS_DHA",
    "ନ": "CONS_NA",
    "ପ": "CONS_PA",
    "ଫ": "CONS_PHA",
    "ବ": "CONS_BA",
    "ଭ": "CONS_BHA",
    "ମ": "CONS_MA",
    "ଯ": "CONS_YA",
    "ର": "CONS_RA",
    "ଳ": "CONS_LLA",
    "ଲ": "CONS_LA",
    "ଶ": "CONS_SHA",
    "ଷ": "CONS_SSHA",
    "ସ": "CONS_SA",
    "ହ": "CONS_HA",
    "ୟ": "CONS_YYA",
    # ========================================
    # Digits
    # ========================================
    "୦": "DIGIT_0",
    "୧": "DIGIT_1",
    "୨": "DIGIT_2",
    "୩": "DIGIT_3",
    "୪": "DIGIT_4",
    "୫": "DIGIT_5",
    "୬": "DIGIT_6",
    "୭": "DIGIT_7",
    "୮": "DIGIT_8",
    "୯": "DIGIT_9",
}

# ============================================
# Reverse Mapping
# ML Label → Unicode Character
# ============================================

reverse_label_map = {value: key for key, value in odia_ml_labels.items()}

# ============================================
# Create Class List
# ============================================

class_names = list(odia_ml_labels.values())

# ============================================
# ML Label → Numeric ID
# ============================================

class_to_id = {label: idx for idx, label in enumerate(class_names)}

# ============================================
# Numeric ID → ML Label
# ============================================

id_to_class = {idx: label for label, idx in class_to_id.items()}

# ============================================
# Print Summary
# ============================================

print("Total Classes:", len(class_names))

print("\nSample Mappings:\n")

for i, (char, label) in enumerate(odia_ml_labels.items()):

    print(f"{char}  →  {label}")

    if i >= 10:
        break
