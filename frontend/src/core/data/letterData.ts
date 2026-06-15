// Shared letter → word/emoji/color data for all kid-friendly activities
// Source: curriculum — Chapter 1: Letters A-M, Chapter 2: Letters N-Z

export const LETTER_DATA: Record<string, { word: string; emoji: string; color: string }> = {
  A: { word: 'Apple', emoji: '🍎', color: '#FF6B6B' },
  B: { word: 'Ball', emoji: '⚽', color: '#FB923C' },
  C: { word: 'Cat', emoji: '🐱', color: '#FACC15' },
  D: { word: 'Dog', emoji: '🐶', color: '#4ADE80' },
  E: { word: 'Elephant', emoji: '🐘', color: '#2DD4BF' },
  F: { word: 'Fish', emoji: '🐟', color: '#38BDF8' },
  G: { word: 'Grapes', emoji: '🍇', color: '#A78BFA' },
  H: { word: 'Hat', emoji: '🎩', color: '#F472B6' },
  I: { word: 'Ice cream', emoji: '🍦', color: '#FB7185' },
  J: { word: 'Jug', emoji: '🏺', color: '#818CF8' },
  K: { word: 'Kite', emoji: '🪁', color: '#C084FC' },
  L: { word: 'Lion', emoji: '🦁', color: '#22D3EE' },
  M: { word: 'Mango', emoji: '🥭', color: '#A3E635' },
  N: { word: 'Nest', emoji: '🪹', color: '#F97316' },
  O: { word: 'Orange', emoji: '🍊', color: '#34D399' },
  P: { word: 'Parrot', emoji: '🦜', color: '#E879F9' },
  Q: { word: 'Queen', emoji: '👑', color: '#FBBF24' },
  R: { word: 'Rabbit', emoji: '🐰', color: '#F472B6' },
  S: { word: 'Sun', emoji: '☀️', color: '#FDE047' },
  T: { word: 'Tiger', emoji: '🐯', color: '#FB923C' },
  U: { word: 'Umbrella', emoji: '☂️', color: '#60A5FA' },
  V: { word: 'Van', emoji: '🚐', color: '#A78BFA' },
  W: { word: 'Watch', emoji: '⌚', color: '#E879F9' },
  X: { word: 'Xylophone', emoji: '🎹', color: '#2DD4BF' },
  Y: { word: 'Yak', emoji: '🦬', color: '#F97316' },
  Z: { word: 'Zebra', emoji: '🦓', color: '#818CF8' },
};

export function getLetterData(letter: string) {
  return LETTER_DATA[letter.toUpperCase()] || { word: letter, emoji: '🔤', color: '#6366F1' };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
