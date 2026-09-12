import Link from "next/link";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { formatVnd } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let beats: Array<{
    id: string;
    title: string;
    coverUrl: string | null;
    bpm: number;
    musicalKey: string;
    priceLease: number;
    sampleFlag: string;
    producer: { name: string };
  }> = [];
  let dbUnavailable = !hasDatabaseUrl();

  if (!dbUnavailable) {
    try {
      beats = await prisma.beat.findMany({
        where: { status: "available" },
        include: { producer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      dbUnavailable = true;
      beats = [];
    }
  }

  return (
    <div>
      {dbUnavailable ? (
        <div className="mb-6 rounded-xl border border-amber-700/50 bg-amber-950/40 p-4 text-sm text-amber-100">
          Database chưa sẵn sàng trên deploy này (thiếu <code>DATABASE_URL</code>). Demo local/tunnel vẫn dùng được; Vercel cần Neon + redeploy.
        </div>
      ) : null}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beats đang bán</h1>
          <p className="mt-1 text-[color:var(--muted)]">Chợ beat VN — lease / WAV+stems / exclusive</p>
        </div>
        <Link
          href="/upload"
          className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[#0B0B0C]"
        >
          Đăng beat
        </Link>
      </div>

      {beats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-[color:var(--surface)] p-12 text-center text-[color:var(--muted)]">
          Chưa có beat nào. Đăng cái đầu để mở bán.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {beats.map((b) => (
            <li key={b.id}>
              <Link
                href={`/beats/${b.id}`}
                className="block rounded-xl border border-zinc-800 bg-[color:var(--surface)] p-4 transition hover:border-[color:var(--accent)]/60"
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.coverUrl || "/covers/beat1.svg"}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover bg-zinc-800"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{b.title}</h2>
                    <p className="text-sm text-[color:var(--muted)]">
                      {b.producer.name} · {b.bpm} BPM · {b.musicalKey}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="text-[color:var(--accent)]">{formatVnd(b.priceLease)}</span>
                      <span className="text-[color:var(--muted)]"> · Lease</span>
                      {b.sampleFlag === "uncleared" && (
                        <span className="ml-2 rounded bg-amber-900/50 px-1.5 py-0.5 text-xs text-amber-300">
                          uncleared
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
