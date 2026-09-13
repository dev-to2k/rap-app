import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createDownloadToken } from "@/lib/signed-url";
import { SKU_LABELS } from "@/lib/config";
import { buttonClass, Card, EmptyState, PageHeader, Price } from "@/kit";

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
      <PageHeader title="Library" description="License đã unlock — PDF + file tải bằng signed URL." />
      {licenses.length === 0 ? (
        <EmptyState
          title="Chưa có license nào"
          description="Mua beat để mở khóa file + PDF."
          action={
            <Link href="/" className={buttonClass({ size: "sm" })}>
              Xem beats
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
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
              <li key={lic.id}>
                <Card className="p-4">
                  <h2 className="font-semibold">{beat?.title || lic.beatId}</h2>
                  <p className="text-sm text-muted">
                    {SKU_LABELS[lic.sku]} · <Price amount={lic.order.amountVnd} className="text-sm" /> ·{" "}
                    {lic.order.status}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`/api/download/${pdfToken}`} className={buttonClass({ size: "sm" })}>
                      PDF
                    </a>
                    <a href={`/api/download/${mp3Token}`} className={buttonClass({ variant: "secondary", size: "sm" })}>
                      MP3
                    </a>
                    <Link
                      href={`/orders/${lic.orderId}/success`}
                      className={buttonClass({ variant: "ghost", size: "sm" })}
                    >
                      Chi tiết
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
