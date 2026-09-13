import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Container, EmptyState, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

export default async function StudioWalletPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/studio/wallet");
  const t = getT();
  return (
    <Container className="py-8">
      <PageHeader title={t("studio.wallet")} icon="wallet" />
      <EmptyState icon="wallet" title={t("studio.emptyWallet")} />
    </Container>
  );
}
