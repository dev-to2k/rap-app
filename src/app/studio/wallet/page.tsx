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

  let rows: Array<{ id: string; title: string; amountVnd: number; takeRateBps: number; status: string }> = [];
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
        amountVnd: o.amountVnd,
        takeRateBps: o.takeRateBps,
        status: o.status,
      }));
    } catch {
      rows = [];
    }
  }

  const gmv = rows.reduce((s, r) => s + r.amountVnd, 0);
  const take = rows.reduce((s, r) => s + Math.round((r.amountVnd * r.takeRateBps) / 10_000), 0);
  const net = gmv - take;

  return (
    <Container className="space-y-6 py-8">
      <PageHeader title={t("studio.wallet")} description={t("studio.mockNote")} icon="wallet" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted">{t("studio.walletPending")}</p>
          <Price amount={0} className="text-xl" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t("studio.walletAvailable")}</p>
          <Price amount={net} className="text-xl" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t("studio.walletWithdrawn")}</p>
          <Price amount={0} className="text-xl" />
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
              {rows.map((r) => {
                const fee = Math.round((r.amountVnd * r.takeRateBps) / 10_000);
                return (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="px-4 py-3">{r.title}</td>
                    <td className="px-4 py-3">
                      <Price amount={r.amountVnd} className="text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <Price amount={fee} className="text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <Price amount={r.amountVnd - fee} className="text-sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : null}
    </Container>
  );
}
