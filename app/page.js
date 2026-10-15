import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, quizzes(id, title, share_link_slug, questions(count))')
    .order('name');
  const list = (subjects || []).filter((s) => s.quizzes.length);

  return (
    <div>
      <h1 className="text-2xl font-bold">Choose a course</h1>
      <p className="mt-1 text-slate-600">Pick a course to start a multiple-choice quiz.</p>
      {!list.length && <p className="mt-8 text-slate-500">No quizzes have been published yet.</p>}
      {list.map((s) => (
        <section key={s.id} className="mt-8">
          <h2 className="text-lg font-semibold">{s.name}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {s.quizzes.map((q) => (
              <li key={q.id}>
                <Link href={`/quiz/${q.share_link_slug}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand">
                  <span className="font-medium">{q.title}</span>
                  <span className="mt-1 block text-sm text-slate-500">{q.questions?.[0]?.count ?? 0} questions</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
