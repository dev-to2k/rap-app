"use client";

import Link from "next/link";
import { Alert, Button, Card, Icon, buttonClass } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

/** Shown on /login|/signup when rap_session already exists (avoids silent redirect→home). */
export function AuthSessionPanel({
  name,
  email,
  next,
  mode,
}: {
  name: string;
  email: string;
  next: string;
  mode: "login" | "signup";
}) {
  const t = useT();
  const logoutNext = mode === "signup" ? "/signup" : "/login";
  const continueHref = next && next !== "/" ? next : "/";
  return (
    <Card className="space-y-3 p-6">
      <Alert variant="info">{t("login.alreadyIn", { name, email })}</Alert>
      <Link href={continueHref} className={buttonClass({ className: "w-full" })}>
        <Icon name="login" size="sm" />
        {t("login.continueAs")}
      </Link>
      <form action="/api/auth/logout" method="post" className="w-full">
        <input type="hidden" name="next" value={logoutNext} />
        <Button type="submit" variant="secondary" className="w-full">
          <Icon name="logout" size="sm" />
          {t("nav.logout")}
        </Button>
      </form>
    </Card>
  );
}
