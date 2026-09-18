import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { Card, Container, PageHeader, Price } from "@/kit";
import { getT } from "@/i18n/get-locale";
import { PayoutSettings } from "@/components/PayoutSettings";

export const dynamic = "force-dynamic";

export default async function StudioWalletPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/studio/wallet");
  const t = getT();

  let rows: Array<{
    id: string;
    title: string;
    gmvVnd: number;
    takeVnd: number;
    payableVnd: number;
    status: string;
    payableAt: Date | null;
    creditedAt: Date | null;
  }> = [];
  if (hasDatabaseUrl()) {
    try {
      const orders = await prisma.order.findMany({
        where: { beat: { producerId: user.id }, status: { in: ["paid", "unlocked"] } },
        include: { beat: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      rows = orders.map((o) => ({
        id: o.id,
        title: o.beat.title,
        gmvVnd: o.gmvVnd || o.amountVnd,
        takeVnd: o.takeVnd || Math.round((o.amountVnd * o.takeRateBps) / 10_000),
        payableVnd: o.payableVnd || o.amountVnd - Math.round((o.amountVnd * o.takeRateBps) / 10_000),
        status: o.status,
        payableAt: o.payableAt,
        creditedAt: o.creditedAt,
      }));
    } catch {
      rows = [];
    }
  }

  const now = Date.now();
  const pending = rows
    .filter((r) => !r.creditedAt && r.payableAt && r.payableAt.getTime() > now)
    .reduce((s, r) => s + r.payableVnd, 0);
  const available = rows
    .filter((r) => !r.creditedAt && r.payableAt && r.payableAt.getTime() <= now)
    .reduce((s, r) => s + r.payableVnd, 0);
  const withdrawn = rows.filter((r) => r.creditedAt).reduce((s, r) => s + r.payableVnd, 0);

  return (
    <Container className="space-y-6 py-8">
      <PageHeader title={t("studio.wallet")} description={t("studio.mockNote")} icon="wallet" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted">{t("studio.walletPending")}</p>
          <Price amount={pending} className="text-xl" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t("studio.walletAvailable")}</p>
          <Price amount={available} className="text-xl" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t("studio.walletWithdrawn")}</p>
          <Price amount={withdrawn} className="text-xl" />
        </Card>
      </div>
      <PayoutSettings />
      {rows.length ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("license.beat")}</th>
                <th className="px-4 py-3 font-medium">{t("studio.colGmv")}</th>
                <th className="px-4 py-3 font-medium">{t("studio.colTake")}</th>
                <th className="px-4 py-3 font-medium">{t("studio.colNet")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-4 py-3">{r.title}</td>
                  <td className="px-4 py-3">
                    <Price amount={r.gmvVnd} className="text-sm" />
                  </td>
                  <td className="px-4 py-3">
                    <Price amount={r.takeVnd} className="text-sm" />
                  </td>
                  <td className="px-4 py-3">
                    <Price amount={r.payableVnd} className="text-sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </Container>
  );
}
