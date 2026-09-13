import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, Container, Icon, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

export default async function StudioOverviewPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/studio");
  const t = getT();
  const stats = [
    { icon: "wallet" as const, label: t("studio.revenue"), value: "0 ₫" },
    { icon: "ticket" as const, label: t("studio.ordersCount"), value: "0" },
    { icon: "headphones" as const, label: t("studio.plays"), value: "—" },
    { icon: "disc" as const, label: t("studio.listed"), value: "—" },
  ];
  return (
    <Container className="py-8">
      <PageHeader title={t("studio.overview")} description={t("studio.mockNote")} icon="dashboard" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <Icon name={s.icon} className="text-accent" />
            <p className="mt-3 text-xs text-muted">{s.label}</p>
            <p className="text-xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>
    </Container>
  );
}
