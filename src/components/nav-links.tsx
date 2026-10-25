"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Compare prices" },
  { href: "/flyers", label: "Flyers" },
  { href: "/list", label: "Shopping list" },
  { href: "/tour", label: "Tour" },
];

export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}

export function NavLinksFallback() {
  return <NavList pathname={null} />;
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex flex-wrap gap-1 text-[15px] font-medium">
      {LINKS.map((link) => {
        const active =
          pathname !== null && (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className="rounded-full px-3 py-1.5 whitespace-nowrap text-muted transition-colors hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
