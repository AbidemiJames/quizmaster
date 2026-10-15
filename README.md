# QuizMaster

Next.js 14 (App Router), Tailwind CSS, Supabase (Postgres and Auth), `pdf-parse` and `mammoth`.

## 1. Supabase setup
1. Create a project at supabase.com.
2. Open SQL Editor, paste `supabase/schema.sql` and run it.
3. Go to Authentication > Users > Add user. Create your admin email and password (tick "Auto confirm").
4. Copy your user's UUID, then run:
   `insert into admins (user_id) values ('PASTE-UUID-HERE');`
5. In Authentication > Providers > Email, switch off "Allow new users to sign up" so nobody else can register.
6. Project Settings > API: copy the Project URL and the anon public key.

## 2. Run locally
```
npm install
cp .env.example .env.local   # fill in the two values
npm run dev
```
Open http://localhost:3000 and sign in at /admin.

## 3. Deploy on Vercel
1. Push the folder to a GitHub repository.
2. In Vercel choose Add New > Project and import the repository.
3. Add the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Share links look like `https://your-app.vercel.app/quiz/abc123xyz`.

## Accepted file layout
```
1. What is the powerhouse of the cell?
A. Nucleus
B. Mitochondrion *
C. Ribosome
D. Golgi body

2. ...

Answer Key
1. B
2. C
```
- Correct answer can be marked with `*` after (or before) the option, a line such as `Answer: B`, or an answer key at the bottom (`1. B`, `1-B`, `1) B`).
- Options may sit on one line (`A. x B. y C. z D. w`). Wrapped lines are joined.
- Word files lose bold or highlight formatting when read as text, so mark answers with `*` or use a key.
- Scanned PDFs (images) contain no text and cannot be read. Use a text-based PDF or Word file.
- Anything the parser is unsure of is flagged in amber on the Preview and Edit screen. Nothing goes live until you click Save and publish.

## Notes
- The 10 MB upload limit is set in `app/api/parse/route.js`. Vercel's free tier caps request bodies at about 4.5 MB, so use smaller files there.
- Quiz answers are readable by students through the public API because feedback is checked in the browser. For high-stakes exams, move marking to a server route.
