'use client';

export default function QuestionEditor({ questions, onChange }) {
  const set = (i, patch) => onChange(questions.map((q, n) => (n === i ? { ...q, ...patch, issues: [] } : q)));
  const del = (i) => onChange(questions.filter((_, n) => n !== i));

  return (
    <ol className="space-y-4">
      {questions.map((q, i) => (
        <li key={i} className={`rounded-lg border bg-white p-4 ${q.issues?.length ? 'border-amber-500' : 'border-slate-200'}`}>
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold">{i + 1}.</span>
            <button className="text-sm text-red-700" onClick={() => del(i)}>Remove</button>
          </div>
          {q.issues?.length > 0 && <p className="mt-1 text-sm text-amber-700">Check: {q.issues.join('; ')}</p>}
          <textarea className="input mt-2" rows={2} value={q.question_text} onChange={(e) => set(i, { question_text: e.target.value })} />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {['a', 'b', 'c', 'd'].map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="radio" name={`c${i}`} checked={q.correct_option === k.toUpperCase()}
                  onChange={() => set(i, { correct_option: k.toUpperCase() })} aria-label={`Mark ${k.toUpperCase()} correct`} />
                <span className="font-semibold">{k.toUpperCase()}</span>
                <input className="input" value={q['option_' + k]} onChange={(e) => set(i, { ['option_' + k]: e.target.value })} />
              </label>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
