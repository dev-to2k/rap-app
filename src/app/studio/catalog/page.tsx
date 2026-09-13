import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { buttonClass, Card, Container, EmptyState, Icon, PageHeader, Price } from "@/kit";
import { getT } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

export default async function StudioCatalogPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/studio/catalog");
  const t = getT();
  let beats: Array<{
    id: string;
    title: string;
    status: string;
    priceLease: number;
    sampleFlag: string;
  }> = [];
  if (hasDatabaseUrl()) {
    try {
      beats = await prisma.beat.findMany({
        where: { producerId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, priceLease: true, sampleFlag: true },
      });
    } catch {
      beats = [];
    }
  }

  return (
    <Container className="py-8">
      <PageHeader
        title={t("studio.catalog")}
        icon="disc"
        action={
          <Link href="/upload" className={buttonClass({ size: "sm" })}>
            <Icon name="upload" size="sm" />
            {t("studio.upload")}
          </Link>
        }
      />
      {beats.length === 0 ? (
        <EmptyState
          icon="disc"
          title={t("home.emptyTitle")}
          action={
            <Link href="/upload" className={buttonClass({ size: "sm" })}>
              {t("studio.upload")}
            </Link>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("upload.fieldTitle")}</th>
                <th className="px-4 py-3 font-medium">{t("home.sortPrice")}</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {beats.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <Link href={`/beats/${b.id}`} className="hover:text-accent">
                      {b.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Price amount={b.priceLease} className="text-sm" />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {b.status === "sold_exclusive" ? t("buy.soldExclusive") : b.status}
                    {b.sampleFlag === "uncleared" ? " · uncleared" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </Container>
  );
}
