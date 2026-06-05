import { useState } from 'react';

export default function useCharacterSelection(initial = null) {
  const [selected, setSelected] = useState(initial);
  return { selected, setSelected };
}
