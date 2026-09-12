import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createDownloadToken } from "@/lib/signed-url";
import { formatVnd, SKU_LABELS } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const licenses = await prisma.license.findMany({
    where: { buyerId: user.id },
    include: {
      order: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const beatIds = licenses.map((l) => l.beatId);
  const beats = await prisma.beat.findMany({ where: { id: { in: beatIds } } });
  const beatMap = Object.fromEntries(beats.map((b) => [b.id, b]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Library</h1>
      {licenses.length === 0 ? (
        <p className="text-zinc-400">Chưa có license nào. Mua beat để mở khóa file + PDF.</p>
      ) : (
        <ul className="space-y-4">
          {licenses.map((lic) => {
            const beat = beatMap[lic.beatId];
            const { token: pdfToken } = createDownloadToken({
              licenseId: lic.id,
              beatId: lic.beatId,
              sku: lic.sku,
              fileKind: "pdf",
            });
            const { token: mp3Token } = createDownloadToken({
              licenseId: lic.id,
              beatId: lic.beatId,
              sku: lic.sku,
              fileKind: "mp3",
            });
            return (
              <li key={lic.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <h2 className="font-semibold">{beat?.title || lic.beatId}</h2>
                <p className="text-sm text-zinc-400">
                  {SKU_LABELS[lic.sku]} · {formatVnd(lic.order.amountVnd)} · {lic.order.status}
                </p>
                <div className="mt-2 flex gap-3 text-sm">
                  <a className="text-emerald-400 underline" href={`/api/download/${pdfToken}`}>
                    PDF
                  </a>
                  <a className="text-emerald-400 underline" href={`/api/download/${mp3Token}`}>
                    MP3
                  </a>
                  <Link className="text-zinc-400 underline" href={`/orders/${lic.orderId}/success`}>
                    Chi tiết
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
