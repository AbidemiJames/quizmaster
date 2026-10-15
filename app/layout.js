import './globals.css';
import Link from 'next/link';
import { Public_Sans } from 'next/font/google';

const font = Public_Sans({ subsets: ['latin'] });

export const metadata = { title: 'QuizMaster', description: 'Practise multiple-choice quizzes by subject' };

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className={font.className}>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold">QuizMaster</Link>
            <Link href="/admin" className="text-sm text-slate-500 hover:text-ink">Admin</Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
