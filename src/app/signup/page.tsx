import { redirect } from "next/navigation";
import { getSession, safeNextPath } from "@/lib/auth";
import { SignupForm } from "@/components/SignupForm";
import { Container, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSession();
  const next = safeNextPath(searchParams.next, "/");
  if (user) redirect(next);
  const t = getT();
  return (
    <Container className="mx-auto max-w-md space-y-4 py-8">
      <PageHeader title={t("signup.title")} description={t("signup.body")} icon="login" />
      <SignupForm next={next} />
    </Container>
  );
}
