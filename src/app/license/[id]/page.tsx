import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SKU_LABELS } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { DownloadButtons } from "@/components/DownloadButtons";
import { Alert, buttonClass, Card, Price } from "@/kit";

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
      <Alert variant="success" className="p-6 text-center">
        <div className="text-3xl text-accent">✓</div>
        <h1 className="mt-2 text-xl font-bold text-foreground">License đã mở</h1>
        <p className="mt-1 text-sm text-muted">Thanh toán OK · webhook verified</p>
      </Alert>

      <Card className="space-y-2 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Beat</span>
          <span className="text-foreground">{beat.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">SKU</span>
          <span className="text-foreground">{SKU_LABELS[license.sku]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Đã trả</span>
          <Price amount={license.order.amountVnd} className="text-sm" />
        </div>
        <div className="flex justify-between">
          <span className="text-muted">License ID</span>
          <span className="font-mono text-xs text-muted">{license.id}</span>
        </div>
        {beat.sampleFlag === "uncleared" ? (
          <Alert variant="warning" className="p-2 text-xs">
            PDF có disclaimer uncleared samples.
          </Alert>
        ) : null}
      </Card>

      <DownloadButtons licenseId={license.id} />

      <Link href="/library" className={buttonClass({ variant: "secondary", className: "w-full" })}>
        Xem Library →
      </Link>
    </div>
  );
}
