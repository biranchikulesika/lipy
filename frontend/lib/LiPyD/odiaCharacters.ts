export type CharacterType = 'vowel' | 'consonant' | 'digit' | 'matra';

export interface OdiaCharacter {
  id: string;
  char: string;
  type: CharacterType;
  unicode: string;
}

export const odiaCharacters: OdiaCharacter[] = [
  // Vowels
  { id: 'VOW_A', char: 'ଅ', type: 'vowel', unicode: 'U+0B05' },
  { id: 'VOW_AA', char: 'ଆ', type: 'vowel', unicode: 'U+0B06' },
  { id: 'VOW_I', char: 'ଇ', type: 'vowel', unicode: 'U+0B07' },
  { id: 'VOW_II', char: 'ଈ', type: 'vowel', unicode: 'U+0B08' },
  { id: 'VOW_U', char: 'ଉ', type: 'vowel', unicode: 'U+0B09' },
  { id: 'VOW_UU', char: 'ଊ', type: 'vowel', unicode: 'U+0B0A' },
  { id: 'VOW_RU', char: 'ଋ', type: 'vowel', unicode: 'U+0B0B'},
  { id: 'VOW_E', char: 'ଏ', type: 'vowel', unicode: 'U+0B0F'},
  { id: 'VOW_AI', char: 'ଐ', type: 'vowel', unicode: 'U+0B10'},
  { id: 'VOW_O', char: 'ଓ', type: 'vowel', unicode: 'U+0B13'},
  { id: 'VOW_AU', char: 'ଔ', type: 'vowel', unicode: 'U+0B14'},

  // Consonants
  { id: 'CONS_KA', char: 'କ', type: 'consonant', unicode: 'U+0B15' },
  { id: 'CONS_KHA', char: 'ଖ', type: 'consonant', unicode: 'U+0B16' },
  { id: 'CONS_GA', char: 'ଗ', type: 'consonant', unicode: 'U+0B17' },
  { id: 'CONS_GHA', char: 'ଘ', type: 'consonant', unicode: 'U+0B18' },
  { id: 'CONS_NGA', char: 'ଙ', type: 'consonant', unicode: 'U+0B19' },

  { id: 'CONS_CA', char: 'ଚ', type: 'consonant', unicode: 'U+0B1A' },
  { id: 'CONS_CHA', char: 'ଛ', type: 'consonant', unicode: 'U+0B1B' },
  { id: 'CONS_JA', char: 'ଜ', type: 'consonant', unicode: 'U+0B1C' },
  { id: 'CONS_JHA', char: 'ଝ', type: 'consonant', unicode: 'U+0B1D' },
  { id: 'CONS_NYA', char: 'ଞ', type: 'consonant', unicode: 'U+0B1E' },

  { id: 'CONS_TTA', char: 'ଟ', type: 'consonant', unicode: 'U+0B1F' },
  { id: 'CONS_TTHA', char: 'ଠ', type: 'consonant', unicode: 'U+0B20' },
  { id: 'CONS_DDA', char: 'ଡ', type: 'consonant', unicode: 'U+0B21' },
  { id: 'CONS_DDHA', char: 'ଢ', type: 'consonant', unicode: 'U+0B22' },
  { id: 'CONS_NNA', char: 'ଣ', type: 'consonant', unicode: 'U+0B23' },

  { id: 'CONS_TA', char: 'ତ', type: 'consonant', unicode: 'U+0B24' },
  { id: 'CONS_THA', char: 'ଥ', type: 'consonant', unicode: 'U+0B25' },
  { id: 'CONS_DA', char: 'ଦ', type: 'consonant', unicode: 'U+0B26' },
  { id: 'CONS_DHA', char: 'ଧ', type: 'consonant', unicode: 'U+0B27' },
  { id: 'CONS_NA', char: 'ନ', type: 'consonant', unicode: 'U+0B28' },

  { id: 'CONS_PA', char: 'ପ', type: 'consonant', unicode: 'U+0B2A' },
  { id: 'CONS_PHA', char: 'ଫ', type: 'consonant', unicode: 'U+0B2B' },
  { id: 'CONS_BA', char: 'ବ', type: 'consonant', unicode: 'U+0B2C' },
  { id: 'CONS_BHA', char: 'ଭ', type: 'consonant', unicode: 'U+0B2D' },
  { id: 'CONS_MA', char: 'ମ', type: 'consonant', unicode: 'U+0B2E' },

  { id: 'CONS_YA', char: 'ଯ', type: 'consonant', unicode: 'U+0B2F' },
  { id: 'CONS_RA', char: 'ର', type: 'consonant', unicode: 'U+0B30' },
  { id: 'CONS_LLA', char: 'ଳ', type: 'consonant', unicode: 'U+0B33'},
  { id: 'CONS_LA', char: 'ଲ', type: 'consonant', unicode: 'U+0B32' },

  { id: 'CONS_SHA', char: 'ଶ', type: 'consonant', unicode: 'U+0B36'},
  { id: 'CONS_SSHA', char: 'ଷ', type: 'consonant', unicode: 'U+0B37' },
  { id: 'CONS_SA', char: 'ସ', type: 'consonant', unicode: 'U+0B38' },
  { id: 'CONS_YYA', char: 'ୟ', type: 'consonant', unicode: 'U+0B5F'},
  { id: 'CONS_HA', char: 'ହ', type: 'consonant', unicode: 'U+0B39' },

  // Digits
  { id: 'DIGIT_0', char: '୦', type: 'digit', unicode: 'U+0B66' },
  { id: 'DIGIT_1', char: '୧', type: 'digit', unicode: 'U+0B67' },
  { id: 'DIGIT_2', char: '୨', type: 'digit', unicode: 'U+0B68' },
  { id: 'DIGIT_3', char: '୩', type: 'digit', unicode: 'U+0B69' },
  { id: 'DIGIT_4', char: '୪', type: 'digit', unicode: 'U+0B6A' },
  { id: 'DIGIT_5', char: '୫', type: 'digit', unicode: 'U+0B6B' },
  { id: 'DIGIT_6', char: '୬', type: 'digit', unicode: 'U+0B6C' },
  { id: 'DIGIT_7', char: '୭', type: 'digit', unicode: 'U+0B6D' },
  { id: 'DIGIT_8', char: '୮', type: 'digit', unicode: 'U+0B6E' },
  { id: 'DIGIT_9', char: '୯', type: 'digit', unicode: 'U+0B6F' },
];
