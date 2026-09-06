// A language change reloads localized course data. Carry practice settings across that reload.
export const practiceSessionKey = 'slow-strum-language-practice';
export function readPracticeSession(value, lesson) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.lesson !== lesson) return null;
  const result = {};
  if (Number.isInteger(value.step) && value.step >= 0 && value.step < 32) result.step = value.step;
  if (Number.isInteger(value.bpm) && value.bpm >= 40 && value.bpm <= 120) result.bpm = value.bpm;
  if (['down', 'island', 'slow', 'pluck', 'arp', 'mute'].includes(value.pattern)) result.pattern = value.pattern;
  if (['follow', 'single'].includes(value.mode)) result.mode = value.mode;
  if (['C', 'Am', 'F', 'G', 'G7'].includes(value.selectedChord)) result.selectedChord = value.selectedChord;
  for (const name of ['loop', 'metronome', 'melody', 'sound', 'contacts']) if (typeof value[name] === 'boolean') result[name] = value[name];
  if (['front', 'fret', 'angle', 'right'].includes(value.view)) result.view = value.view;
  return result;
}
