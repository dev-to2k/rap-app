import { redirect } from "next/navigation";
import { getSession, safeNextPath } from "@/lib/auth";
import { SignupForm } from "@/components/SignupForm";
import { AuthSessionPanel } from "@/components/AuthSessionPanel";
import { Container, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

function shouldBounceAuthed(next: string): boolean {
  return next !== "/" && next !== "/login" && next !== "/signup";
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSession();
  const next = safeNextPath(searchParams.next, "/");
  if (user && shouldBounceAuthed(next)) redirect(next);
  const t = getT();
  return (
    <Container className="mx-auto max-w-md space-y-4 py-8">
      <PageHeader title={t("signup.title")} description={t("signup.body")} icon="login" />
      {user ? (
        <AuthSessionPanel name={user.name} email={user.email} next={next} mode="signup" />
      ) : (
        <SignupForm next={next} />
      )}
    </Container>
  );
}
