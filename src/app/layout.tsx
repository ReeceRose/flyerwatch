import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Flyerwatch",
  description: "Compare this week's grocery flyer prices near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 sm:px-8">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-5 pb-10 text-sm text-muted sm:px-8 print:hidden">
          Prices come from each store&apos;s weekly flyer through{" "}
          <a href="https://flipp.com" className="underline decoration-2 underline-offset-4 hover:text-ink">
            Flipp
          </a>
          . Flyerwatch isn&apos;t affiliated with or endorsed by Flipp. Check the store before you go.
        </footer>
      </body>
    </html>
  );
}
