import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DownloadButtons } from "@/components/DownloadButtons";
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
            const unlocked = lic.order.status === "unlocked";
            const frozen = lic.order.status === "failed";
            return (
              <li key={lic.id}>
                <Card className="space-y-3 p-4">
                  <div>
                    <h2 className="font-semibold">{beat?.title || lic.beatId}</h2>
                    <p className="text-sm text-muted">
                      {t(`sku.${lic.sku}`)} · <Price amount={lic.order.amountVnd} className="text-sm" /> ·{" "}
                      {lic.order.status}
                      {beat && beat.status !== "available" && beat.status !== "reserved" ? (
                        <span className="text-muted"> · {t("library.beatUnlisted")}</span>
                      ) : null}
                    </p>
                  </div>
                  {unlocked && !frozen ? (
                    <DownloadButtons licenseId={lic.id} />
                  ) : (
                    <p className="text-sm text-danger">
                      {frozen ? t("library.frozen") : t("library.notUnlocked")}
                    </p>
                  )}
                  <Link
                    href={`/orders/${lic.orderId}/success`}
                    className={buttonClass({ variant: "ghost", size: "sm" })}
                  >
                    {t("library.details")}
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
