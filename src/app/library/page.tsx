import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createDownloadToken } from "@/lib/signed-url";
import { buttonClass, Card, Container, EmptyState, PageHeader, Price } from "@/kit";
import { getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const t = getT();
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
    <Container className="py-8">
      <PageHeader title={t("library.title")} description={t("library.description")} icon="library" />
      {licenses.length === 0 ? (
        <EmptyState
          icon="headphones"
          title={t("library.emptyTitle")}
          description={t("library.emptyDescription")}
          action={
            <Link href="/" className={buttonClass({ size: "sm" })}>
              {t("library.browse")}
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
                    {t(`sku.${lic.sku}`)} · <Price amount={lic.order.amountVnd} className="text-sm" /> ·{" "}
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
                      {t("library.details")}
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
