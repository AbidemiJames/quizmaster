// Pattern-based question parser. Takes raw text, returns questions plus a list of issues per question
// so the admin can fix them on the Preview & Edit screen.

const Q_START = /^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.):\-]\s*(.+)$/i;
const OPT = /^\s*\(?([A-Da-d])\s*[.):]\s*(.*)$/;
const INLINE_ANS = /^\s*(?:correct\s+)?(?:answer|ans)\s*[:\-]?\s*\(?([A-Da-d])\)?\b/i;
const KEY_HEADER = /^\s*(?:answer\s*key|answers?|key|marking\s*scheme)\s*:?\s*$/i;
const KEY_PAIR = /(\d{1,3})\s*[.):\-]?\s*\(?([A-Da-d])\)?(?=\s|,|;|$)/g;

function splitInlineOptions(line) {
  // "A. one B. two C. three D. four" on one line
  if (/^\s*\(?A[.):]\s/.test(line)) {
    const parts = line.split(/\s+(?=\(?[B-D][.):]\s)/);
    if (parts.length > 1) return parts;
  }
  return [line];
}

function extractKey(lines) {
  let start = lines.findIndex((l) => KEY_HEADER.test(l));
  let keyLines;
  let bodyEnd = lines.length;
  if (start !== -1) {
    keyLines = lines.slice(start + 1);
    bodyEnd = start;
  } else {
    // Fallback: trailing block made up only of "1. B" style pairs
    let i = lines.length;
    while (i > 0 && /^[\s\d.):\-A-Da-d,;()]+$/.test(lines[i - 1]) && /\d/.test(lines[i - 1])) i--;
    keyLines = lines.slice(i);
    if (keyLines.join(' ').match(KEY_PAIR)?.length >= 3) bodyEnd = i;
    else keyLines = [];
  }
  const key = {};
  for (const m of keyLines.join(' ').matchAll(KEY_PAIR)) key[Number(m[1])] = m[2].toUpperCase();
  return { key, bodyEnd };
}

export function parseQuestions(rawText) {
  const lines = rawText
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const { key, bodyEnd } = extractKey(lines);
  const questions = [];
  let q = null;
  let last = 'question';

  const push = () => q && questions.push(q);

  for (const line of lines.slice(0, bodyEnd)) {
    for (const piece of splitInlineOptions(line)) {
      const opt = q && piece.match(OPT);
      const start = !opt && piece.match(Q_START);
      const ans = q && piece.match(INLINE_ANS);

      if (ans) {
        q.correct_option = ans[1].toUpperCase();
      } else if (opt) {
        let text = opt[2].trim();
        const starred = /^\*/.test(text) || /\*$/.test(text) || /^\*/.test(piece.trim());
        text = text.replace(/^\*+\s*|\s*\*+$/g, '');
        const k = opt[1].toUpperCase();
        q['option_' + k.toLowerCase()] = text;
        if (starred) q.correct_option = k;
        last = 'option_' + k.toLowerCase();
      } else if (start) {
        push();
        q = {
          number: Number(start[1]),
          question_text: start[2].trim(),
          option_a: '', option_b: '', option_c: '', option_d: '',
          correct_option: '',
        };
        last = 'question_text';
      } else if (q) {
        q[last] = (q[last] + ' ' + piece).trim(); // wrapped line
      }
    }
  }
  push();

  return questions.map((x) => {
    if (!x.correct_option && key[x.number]) x.correct_option = key[x.number];
    const issues = [];
    ['a', 'b', 'c', 'd'].forEach((k) => !x['option_' + k] && issues.push(`Option ${k.toUpperCase()} is missing`));
    if (!x.correct_option) issues.push('No correct answer found');
    return { ...x, issues };
  });
}
