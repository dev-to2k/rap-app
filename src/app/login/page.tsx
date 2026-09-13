import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { Container, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSession();
  const next = searchParams.next || "/";
  if (user) redirect(next);
  const t = getT();
  const paywall = next.includes("/checkout");
  return (
    <Container className="mx-auto max-w-md space-y-4 py-8">
      <PageHeader
        title={paywall ? t("login.paywallTitle") : t("login.title")}
        description={paywall ? t("login.paywallBody") : undefined}
        icon="login"
      />
      <LoginForm next={next} />
    </Container>
  );
}
