import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatVnd, SKU_LABELS } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { DownloadButtons } from "@/components/DownloadButtons";

export const dynamic = "force-dynamic";

export default async function LicenseSuccessPage({ params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) redirect(`/login?next=/license/${params.id}`);

  const license = await prisma.license.findUnique({
    where: { id: params.id },
    include: {
      order: true,
      buyer: true,
    },
  });
  if (!license || license.buyerId !== user.id) notFound();

  const beat = await prisma.beat.findUnique({
    where: { id: license.beatId },
    include: { producer: { select: { name: true } } },
  });
  if (!beat) notFound();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-6 text-center">
        <div className="text-3xl">✓</div>
        <h1 className="mt-2 text-xl font-bold text-white">License unlocked</h1>
        <p className="mt-1 text-sm text-zinc-400">Thanh toán OK · webhook verified</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Beat</span>
          <span className="text-white">{beat.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">SKU</span>
          <span className="text-white">{SKU_LABELS[license.sku]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Paid</span>
          <span className="text-violet-300">{formatVnd(license.order.amountVnd)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">License ID</span>
          <span className="font-mono text-xs text-zinc-300">{license.id}</span>
        </div>
        {beat.sampleFlag === "uncleared" && (
          <p className="rounded-lg bg-amber-950/40 p-2 text-xs text-amber-300">
            PDF có disclaimer uncleared samples.
          </p>
        )}
      </div>

      <DownloadButtons licenseId={license.id} />

      <Link
        href="/library"
        className="block w-full rounded-full border border-zinc-700 py-3 text-center text-sm text-white hover:bg-zinc-900"
      >
        Xem Library →
      </Link>
    </div>
  );
}
