import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Container, Icon } from "@/kit";
import { MobileNav, NavAuth, NavLinks } from "./NavMenu";
import { LocaleSwitch } from "./LocaleSwitch";

export async function Nav() {
  const user = await getSession();
  const session = user ? { name: user.name, role: user.role } : null;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container className="relative max-w-6xl py-2.5">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 justify-self-start text-lg font-bold tracking-tight text-accent"
          >
            <Icon name="flame" size="md" />
            Rap App
          </Link>
          <NavLinks />
          <div className="flex items-center justify-end gap-2 justify-self-end">
            <LocaleSwitch />
            <NavAuth user={session} />
            <MobileNav user={session} />
          </div>
        </div>
      </Container>
    </header>
  );
}
