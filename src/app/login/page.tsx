import { redirect } from "next/navigation";
import { getSession, safeNextPath } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { AuthSessionPanel } from "@/components/AuthSessionPanel";
import { Container, PageHeader } from "@/kit";
import { getT } from "@/i18n/get-locale";

/** Deep next (checkout/studio/…) → bounce authed users there; bare /login stays for switch-account. */
function shouldBounceAuthed(next: string): boolean {
  return next !== "/" && next !== "/login" && next !== "/signup";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSession();
  const next = safeNextPath(searchParams.next, "/");
  if (user && shouldBounceAuthed(next)) redirect(next);
  const t = getT();
  const paywall = next.includes("/checkout");
  return (
    <Container className="mx-auto max-w-md space-y-4 py-8">
      <PageHeader
        title={paywall ? t("login.paywallTitle") : t("login.title")}
        description={paywall ? t("login.paywallBody") : undefined}
        icon="login"
      />
      {user ? (
        <AuthSessionPanel name={user.name} email={user.email} next={next} mode="login" />
      ) : (
        <LoginForm next={next} />
      )}
    </Container>
  );
}
