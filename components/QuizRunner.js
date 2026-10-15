'use client';
import { useState } from 'react';
import Link from 'next/link';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizRunner({ quiz, questions }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({}); // question id -> letter
  const [done, setDone] = useState(false);
  const instant = quiz.feedback_mode === 'instant';

  if (!questions.length) return <p>This quiz has no questions yet.</p>;

  if (done) return <Results quiz={quiz} questions={questions} answers={answers}
    onRetry={() => { setAnswers({}); setI(0); setDone(false); }} />;

  const q = questions[i];
  const picked = answers[q.id];
  const locked = instant && picked;

  const style = (L) => {
    const base = 'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition';
    if (locked && L === q.correct_option) return `${base} border-green-600 bg-green-50`;
    if (locked && L === picked) return `${base} border-red-600 bg-red-50`;
    if (picked === L) return `${base} border-brand bg-blue-50`;
    return `${base} border-slate-200 bg-white hover:border-slate-400`;
  };

  return (
    <div>
      <p className="text-sm text-slate-500">{quiz.subjects?.name} · {quiz.title}</p>
      <div className="mt-2 h-1.5 rounded bg-slate-200">
        <div className="h-1.5 rounded bg-brand" style={{ width: `${((i + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="mt-2 text-sm text-slate-500">Question {i + 1} of {questions.length}</p>
      <h1 className="mt-3 text-xl font-semibold leading-snug">{q.question_text}</h1>

      <div role="radiogroup" className="mt-5 space-y-3">
        {LETTERS.map((L) => (
          <button key={L} role="radio" aria-checked={picked === L} disabled={!!locked}
            onClick={() => setAnswers({ ...answers, [q.id]: L })} className={style(L)}>
            <span className="font-semibold">{L}</span>
            <span>{q['option_' + L.toLowerCase()]}</span>
          </button>
        ))}
      </div>

      {locked && (
        <p className={`mt-4 text-sm font-medium ${picked === q.correct_option ? 'text-green-700' : 'text-red-700'}`}>
          {picked === q.correct_option ? 'Correct.' : `Wrong. The correct answer is ${q.correct_option}.`}
        </p>
      )}

      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
        {i < questions.length - 1
          ? <button className="btn" disabled={!picked} onClick={() => setI(i + 1)}>Next</button>
          : <button className="btn" disabled={!picked} onClick={() => setDone(true)}>Finish quiz</button>}
      </div>
    </div>
  );
}

function Results({ quiz, questions, answers, onRetry }) {
  const score = questions.filter((q) => answers[q.id] === q.correct_option).length;
  const pct = Math.round((score / questions.length) * 100);
  return (
    <div>
      <h1 className="text-2xl font-bold">{quiz.title}: results</h1>
      <p className="mt-4 text-5xl font-bold">{score} / {questions.length}</p>
      <p className="mt-1 text-slate-600">{pct}% correct</p>
      <div className="mt-5 flex gap-3">
        <button className="btn" onClick={onRetry}>Try again</button>
        <Link href="/" className="btn-ghost">All courses</Link>
      </div>
      <h2 className="mt-8 text-lg font-semibold">Review</h2>
      <ol className="mt-3 space-y-3">
        {questions.map((q, n) => {
          const ok = answers[q.id] === q.correct_option;
          return (
            <li key={q.id} className={`rounded-lg border p-3 ${ok ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
              <p className="font-medium">{n + 1}. {q.question_text}</p>
              <p className="mt-1 text-sm">Your answer: {answers[q.id]} {!ok && `· Correct answer: ${q.correct_option}`}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
