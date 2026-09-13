import { Container, EmptyState, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

export default function ChartsPage() {
  const t = getT();
  return (
    <Container className="py-8">
      <PageHeader title={t("shell.charts")} icon="chart" />
      <EmptyState icon="chart" title={t("home.emptyTitle")} description={t("studio.mockNote")} />
    </Container>
  );
}
