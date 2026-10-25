import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { NavLinks, NavLinksFallback } from "@/components/nav-links";
import { PostalForm } from "@/components/postal-form";
import { PostalSync } from "@/components/postal-sync";
import { formatPostal } from "@/lib/format";
import { readPostal } from "@/lib/postal";

async function PostalControl() {
  const postal = await readPostal();
  return (
    <>
      <PostalForm current={formatPostal(postal)} />
      <PostalSync serverPostal={postal} />
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-5 sm:px-8 print:hidden">
      <Link
        href="/"
        className="flex items-center gap-2 text-2xl font-black tracking-tight font-stretch-extra-condensed"
      >
        <Logo className="size-8" />
        Flyerwatch
      </Link>
      <Suspense fallback={<NavLinksFallback />}>
        <NavLinks />
      </Suspense>
      <div className="ml-auto">
        <Suspense fallback={<span className="text-sm text-muted">Finding your stores</span>}>
          <PostalControl />
        </Suspense>
      </div>
    </header>
  );
}
