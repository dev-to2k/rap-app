import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createDownloadToken } from "@/lib/signed-url";
import { formatVnd, SKU_LABELS } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: { orderId: string } }) {
  const user = await getSession();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { license: true, beat: true },
  });
  if (!order || order.buyerId !== user.id) redirect("/library");

  if (order.status !== "unlocked" || !order.license) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-lg">Chưa thanh toán — file chưa mở.</p>
        <Link href={`/checkout/${order.id}`} className="mt-4 inline-block text-emerald-400 underline">
          Quay lại checkout
        </Link>
      </div>
    );
  }

  const kinds: Array<"pdf" | "mp3" | "wav" | "stems"> = ["pdf", "mp3"];
  if (order.sku === "wav" || order.sku === "exclusive") kinds.push("wav", "stems");

  const downloads = kinds.map((fileKind) => {
    const { token } = createDownloadToken({
      licenseId: order.license!.id,
      beatId: order.beatId,
      sku: order.sku,
      fileKind,
    });
    return { fileKind, url: `/api/download/${token}` };
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-emerald-400">Thanh toán OK</h1>
      <p className="text-zinc-400">
        {order.beat.title} · {SKU_LABELS[order.sku]} · {formatVnd(order.amountVnd)}
      </p>
      <ul className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {downloads.map((d) => (
          <li key={d.fileKind}>
            <a className="text-emerald-400 underline" href={d.url}>
              Tải {d.fileKind.toUpperCase()}
            </a>
          </li>
        ))}
      </ul>
      <Link href="/library" className="inline-block text-sm text-zinc-400 underline">
        Vào Library
      </Link>
    </div>
  );
}
