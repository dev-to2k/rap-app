import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DownloadButtons } from "@/components/DownloadButtons";
import { Badge, buttonClass, Card, Container, CoverArt, EmptyState, PageHeader, Price } from "@/kit";
import { getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

const SKU_FILTERS = ["lease", "wav", "exclusive"] as const;

function statusBadge(status: string): "accent" | "warning" | "danger" {
  // Map trạng thái thô sang màu Badge chuẩn
  if (status === "unlocked" || status === "paid") return "accent";
  if (status === "failed") return "danger";
  return "warning";
}

export default async function LibraryPage({ searchParams }: { searchParams: { sku?: string } }) {
  const t = getT();
  const user = await getSession();
  if (!user) redirect("/login");
  const skuFilter = SKU_FILTERS.includes(searchParams.sku as (typeof SKU_FILTERS)[number])
    ? searchParams.sku!
    : "all";

  const licenses = await prisma.license.findMany({
    where: { buyerId: user.id, ...(skuFilter !== "all" ? { sku: skuFilter } : {}) },
    include: {
      order: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const beatIds = licenses.map((l) => l.beatId);
  const beats = await prisma.beat.findMany({
    where: { id: { in: beatIds } },
    select: { id: true, title: true, coverUrl: true, status: true },
  });
  const beatMap = Object.fromEntries(beats.map((b) => [b.id, b]));

  return (
    <Container className="py-8">
      <PageHeader title={t("library.title")} description={t("library.description")} icon="library" />
      {/* Lọc server theo ?sku= */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/library"
          className={buttonClass({
            variant: skuFilter === "all" ? "primary" : "secondary",
            size: "sm",
            className: "tap-target shrink-0",
          })}
          aria-current={skuFilter === "all" ? "page" : undefined}
        >
          {t("home.filterAll")}
        </Link>
        {SKU_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/library?sku=${s}`}
            className={buttonClass({
              variant: skuFilter === s ? "primary" : "secondary",
              size: "sm",
              className: "tap-target shrink-0",
            })}
            aria-current={skuFilter === s ? "page" : undefined}
          >
            {t(`sku.${s}`)}
          </Link>
        ))}
      </div>
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
                  <div className="flex items-center gap-3">
                    <CoverArt
                      src={beat?.coverUrl || "/covers/beat1.svg"}
                      alt={beat?.title || lic.beatId}
                      className="h-12 w-12 shrink-0 rounded-md"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{beat?.title || lic.beatId}</h2>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                        <span>{t(`sku.${lic.sku}`)}</span>
                        <span>·</span>
                        <Price amount={lic.order.amountVnd} className="text-sm" />
                        <span>·</span>
                        <Badge variant={statusBadge(lic.order.status)}>{lic.order.status}</Badge>
                        {beat && beat.status !== "available" && beat.status !== "reserved" ? (
                          <span className="text-muted"> · {t("library.beatUnlisted")}</span>
                        ) : null}
                      </p>
                    </div>
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
