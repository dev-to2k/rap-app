import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Container, EmptyState, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

export default async function StudioOrdersPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/studio/orders");
  const t = getT();
  return (
    <Container className="py-8">
      <PageHeader title={t("studio.orders")} icon="ticket" />
      <EmptyState icon="ticket" title={t("studio.emptyOrders")} description={t("studio.mockNote")} />
    </Container>
  );
}
