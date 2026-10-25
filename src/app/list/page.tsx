import type { Metadata } from "next";
import { Suspense } from "react";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { readPostal } from "@/lib/postal";

export const metadata: Metadata = { title: "Shopping list | Flyerwatch" };

async function ListWithPostal() {
  return <ShoppingList serverPostal={await readPostal()} />;
}

export default function ListPage() {
  return (
    <>
      <div className="pt-10 pb-8 sm:pt-16 print:pt-0 print:pb-4">
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight font-stretch-extra-condensed sm:text-7xl print:text-4xl">
          Shopping list
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-shelf" aria-busy="true" />}>
        <ListWithPostal />
      </Suspense>
    </>
  );
}
