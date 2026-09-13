import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Container } from "@/kit";
import { NavMenu } from "./NavMenu";

export async function Nav() {
  const user = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container className="relative flex items-center justify-between gap-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-accent">
          Rap App
        </Link>
        <NavMenu user={user ? { name: user.name, role: user.role } : null} />
      </Container>
    </header>
  );
}
