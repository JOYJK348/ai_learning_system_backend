const fs = require('fs');
const filePath = 'D:\\FreeLance\\AI-LearningPortal\\frontend\\src\\app\\[locale]\\student\\Learn\\page.tsx';

let c = fs.readFileSync(filePath, 'utf8');

const old = `  return { emoji: '📖', mascot: '📚', color: 'from-indigo-400 to-purple-500', sound: \`\${name}!\` };`;

const tamil = `  // Tamil chapters
  if (lower.includes('முன்')) return { emoji: '🖍️', mascot: '✍️', color: 'from-amber-400 to-orange-500', sound: 'Tamil writing!' };
  if (lower.includes('உயிர்')) return { emoji: '🕉️', mascot: '🅰️', color: 'from-red-400 to-rose-500', sound: 'Uyir ezhuthukkal!' };
  if (lower.includes('மெய்')) return { emoji: '🔤', mascot: '🔠', color: 'from-blue-400 to-indigo-500', sound: 'Mei ezhuthukkal!' };
  if (lower.includes('எளிய') || lower.includes('சொல்')) return { emoji: '📝', mascot: '🆒', color: 'from-green-400 to-emerald-500', sound: 'Tamil words!' };
  if (lower.includes('பாடல்') || lower.includes('கதை')) return { emoji: '🎵', mascot: '🎶', color: 'from-purple-400 to-pink-500', sound: 'Paadalgal!' };
  return { emoji: '📖', mascot: '📚', color: 'from-indigo-400 to-purple-500', sound: \`\${name}!\` };`;

if (c.includes(old)) {
  c = c.replace(old, tamil);
  fs.writeFileSync(filePath, c, 'utf8');
  console.log('✅ Tamil visuals added to getChapterVisuals');
} else {
  console.log('❌ Pattern not found — file may already be updated');
}
