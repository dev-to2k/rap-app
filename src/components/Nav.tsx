import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function Nav() {
  const user = await getSession();
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-5xl flex items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-bold text-lg tracking-tight text-emerald-400">
          Rap App
        </Link>
        <nav className="flex items-center gap-3 text-sm text-zinc-300">
          <Link href="/" className="hover:text-white">Beats</Link>
          <Link href="/waitlist" className="text-zinc-500 hover:text-zinc-300">Waitlist</Link>
          <Link href="/upload" className="hover:text-white">Đăng beat</Link>
          <Link href="/library" className="hover:text-white">Library</Link>
          <Link href="/support" className="hover:text-white">Support</Link>
          {user ? (
            <span className="text-zinc-500">
              {user.name} · {user.role}
              <form action="/api/auth/logout" method="post" className="inline ml-2">
                <button type="submit" className="text-zinc-400 hover:text-white underline">Logout</button>
              </form>
            </span>
          ) : (
            <Link href="/login" className="rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-500">
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
