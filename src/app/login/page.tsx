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
  if (user) redirect(searchParams.next || "/");
  const t = getT();
  return (
    <Container className="mx-auto max-w-md space-y-4 py-8">
      <PageHeader title={t("login.title")} icon="login" />
      <LoginForm next={searchParams.next || "/"} />
    </Container>
  );
}
