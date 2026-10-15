'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import QuestionEditor from '@/components/QuestionEditor';

const slugify = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

export default function Admin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('instant');
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) load(); }, [session]);

  async function load() {
    const { data: a } = await supabase.from('admins').select('user_id').maybeSingle();
    setIsAdmin(!!a);
    const { data: s } = await supabase.from('subjects').select('*').order('name');
    setSubjects(s || []);
    const { data: q } = await supabase.from('quizzes').select('id, title, share_link_slug, subjects(name)').order('created_at', { ascending: false });
    setQuizzes(q || []);
  }

  async function signIn(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
    setMsg(error ? error.message : '');
  }

  async function parse(e) {
    e.preventDefault();
    if (!file) return setMsg('Choose a file first.');
    if (!subjectId && !newSubject.trim()) return setMsg('Select or create a subject.');
    setBusy(true); setMsg('');
    const body = new FormData(); body.append('file', file);
    const res = await fetch('/api/parse', { method: 'POST', body, headers: { Authorization: `Bearer ${session.access_token}` } });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(json.error);
    setQuestions(json.questions);
  }

  async function save() {
    const bad = questions.some((q) => !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_option);
    if (bad) return setMsg('Every question needs text, four options and a correct answer.');
    setBusy(true); setMsg('');
    try {
      let sid = subjectId;
      if (!sid) {
        const name = newSubject.trim();
        const { data, error } = await supabase.from('subjects').upsert({ name }, { onConflict: 'name' }).select().single();
        if (error) throw error; sid = data.id;
      }
      const slug = slugify();
      const { data: quiz, error } = await supabase.from('quizzes')
        .insert({ subject_id: sid, title, share_link_slug: slug, feedback_mode: mode }).select().single();
      if (error) throw error;
      const rows = questions.map((q, n) => ({
        quiz_id: quiz.id, position: n + 1, question_text: q.question_text,
        option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
        correct_option: q.correct_option,
      }));
      const { error: e2 } = await supabase.from('questions').insert(rows);
      if (e2) { await supabase.from('quizzes').delete().eq('id', quiz.id); throw e2; }
      setQuestions(null); setFile(null); setTitle(''); setNewSubject(''); setSubjectId('');
      setMsg(`Published. Share link: ${location.origin}/quiz/${slug}`);
      load();
    } catch (err) { setMsg(err.message); }
    setBusy(false);
  }

  async function remove(id) {
    if (!confirm('Delete this quiz and its questions?')) return;
    await supabase.from('quizzes').delete().eq('id', id); load();
  }

  if (!session) return (
    <form onSubmit={signIn} className="mx-auto max-w-sm space-y-3">
      <h1 className="text-2xl font-bold">Admin sign in</h1>
      <input name="email" type="email" required placeholder="Email" className="input" />
      <input name="password" type="password" required placeholder="Password" className="input" />
      <button className="btn w-full">Sign in</button>
      {msg && <p className="text-sm text-red-700">{msg}</p>}
    </form>
  );
  if (isAdmin === false) return <p>This account is not an admin. Add its user id to the admins table (see README).</p>;
  if (isAdmin === null) return <p>Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      {msg && <p className="rounded-md bg-blue-50 p-3 text-sm break-all">{msg}</p>}

      {!questions ? (
        <form onSubmit={parse} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Upload a question bank</h2>
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select a subject, or create one below</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {!subjectId && <input className="input" placeholder="New subject, e.g. Biology" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />}
          <input className="input" required placeholder="Course title, e.g. Biology 101" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="instant">Show correct or wrong after each answer</option>
            <option value="end">Show results at the end only</option>
          </select>
          <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm" />
          <button className="btn" disabled={busy}>{busy ? 'Reading file…' : 'Upload and preview'}</button>
        </form>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold">Preview and edit ({questions.length} questions)</h2>
          <QuestionEditor questions={questions} onChange={setQuestions} />
          <div className="flex gap-3">
            <button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save and publish'}</button>
            <button className="btn-ghost" onClick={() => setQuestions(null)}>Cancel</button>
          </div>
        </div>
      )}

      <section>
        <h2 className="font-semibold">Published quizzes</h2>
        <ul className="mt-3 space-y-2">
          {quizzes.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <span>{q.subjects?.name}: {q.title}</span>
              <span className="flex gap-2">
                <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(`${location.origin}/quiz/${q.share_link_slug}`).then(() => setMsg('Link copied.'))}>Copy link</button>
                <button className="btn-ghost" onClick={() => remove(q.id)}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
