import type { Metadata } from "next";
import { SharedListView } from "@/components/shopping/shared-list-view";

export const metadata: Metadata = { title: "Shopping list | Flyerwatch", robots: { index: false } };

export default function SharePage() {
  return <SharedListView />;
}
