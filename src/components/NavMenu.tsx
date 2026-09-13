"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass, Button } from "@/kit";

type User = { name: string; role: string } | null;

const LINKS = [
  { href: "/", label: "Beats" },
  { href: "/waitlist", label: "Waitlist" },
  { href: "/upload", label: "Đăng beat" },
  { href: "/library", label: "Library" },
  { href: "/support", label: "Support" },
];

export function NavMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-4 text-sm text-muted md:flex">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
        {user ? (
          <span className="text-muted">
            {user.name} · {user.role}
            <form action="/api/auth/logout" method="post" className="ml-2 inline">
              <button type="submit" className="text-muted underline hover:text-foreground">
                Đăng xuất
              </button>
            </form>
          </span>
        ) : (
          <Link href="/login" className={buttonClass({ size: "sm" })}>
            Đăng nhập
          </Link>
        )}
      </nav>

      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        aria-expanded={open}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Đóng" : "Menu"}
      </Button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-border bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <span className="text-muted">
                {user.name} · {user.role}
                <form action="/api/auth/logout" method="post" className="mt-2">
                  <Button variant="secondary" size="sm" type="submit">
                    Đăng xuất
                  </Button>
                </form>
              </span>
            ) : (
              <Link href="/login" className={buttonClass({ size: "sm" })} onClick={() => setOpen(false)}>
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </>
  );
}
