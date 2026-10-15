import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QuizRunner from '@/components/QuizRunner';

export const dynamic = 'force-dynamic';

export default async function QuizPage({ params }) {
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, feedback_mode, subjects(name)')
    .eq('share_link_slug', params.slug)
    .maybeSingle();
  if (!quiz) notFound();
  const { data: questions } = await supabase
    .from('questions').select('*').eq('quiz_id', quiz.id).order('position');
  return <QuizRunner quiz={quiz} questions={questions || []} />;
}
