import { Container, EmptyState, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

export default function FavoritesPage() {
  const t = getT();
  return (
    <Container className="py-8">
      <PageHeader title={t("shell.likes")} icon="heart" />
      <EmptyState icon="heart" title={t("home.emptyTitle")} />
    </Container>
  );
}
