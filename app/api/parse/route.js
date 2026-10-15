import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseQuestions } from '@/lib/parser';

export const runtime = 'nodejs';

export async function POST(req) {
  // Only signed-in admins may parse files
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: user } = await sb.auth.getUser(token);
  if (!user?.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { data: admin } = await sb.from('admins').select('user_id').maybeSingle();
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const file = (await req.formData()).get('file');
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File is larger than 10 MB' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let text = '';
  try {
    if (name.endsWith('.pdf')) {
      const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
      text = (await pdf(buffer)).text;
    } else if (name.endsWith('.docx')) {
      const mammoth = (await import('mammoth')).default;
      text = (await mammoth.extractRawText({ buffer })).value;
    } else {
      return NextResponse.json({ error: 'Upload a .pdf or .docx file' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Could not read this file' }, { status: 422 });
  }

  const questions = parseQuestions(text);
  if (!questions.length) {
    return NextResponse.json({ error: 'No numbered questions found. Check the file layout.' }, { status: 422 });
  }
  return NextResponse.json({ questions });
}
