import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVnd } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const beats = await prisma.beat.findMany({
    where: { status: "available" },
    include: { producer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beats đang bán</h1>
          <p className="mt-1 text-zinc-400">Marketplace beat VN · take-rate 15%</p>
        </div>
        <Link
          href="/upload"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          Đăng beat
        </Link>
      </div>

      {beats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center text-zinc-400">
          Chưa có beat nào. Đăng cái đầu để mở bán.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {beats.map((b) => (
            <li key={b.id}>
              <Link
                href={`/beats/${b.id}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-emerald-700/60"
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
                    <p className="text-sm text-zinc-400">
                      {b.producer.name} · {b.bpm} BPM · {b.musicalKey}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="text-emerald-400">{formatVnd(b.priceLease)}</span>
                      <span className="text-zinc-500"> · Lease</span>
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
