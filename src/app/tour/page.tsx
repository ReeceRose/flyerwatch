import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import extensionShot from "./screens/extension.webp";
import flyerShot from "./screens/flyer.webp";
import flyersShot from "./screens/flyers.webp";
import listShot from "./screens/list.webp";
import phoneShot from "./screens/phone.webp";
import searchShot from "./screens/search.webp";
import shareShot from "./screens/share.webp";

export const metadata: Metadata = {
  title: "Tour | Flyerwatch",
  description: "See what Flyerwatch and its Chrome extension can do, with screenshots.",
};

const REPO = "https://github.com/ReeceRose/flyerwatch";

// The screenshots in ./screens are real captures of the site and extension,
// taken near N2G 1A1 with two sample recipes on the list.

function BrowserFrame({ url, shot, alt, preload = false }: { url: string; shot: StaticImageData; alt: string; preload?: boolean }) {
  return (
    <figure className="overflow-hidden rounded-2xl border-2 border-ink bg-shelf shadow-[8px_8px_0_var(--color-ink)]">
      <div className="flex items-center gap-3 border-b-2 border-ink bg-paper px-4 py-2.5" aria-hidden="true">
        <span className="flex gap-1.5">
          <span className="size-3 rounded-full bg-sale" />
          <span className="size-3 rounded-full bg-tag" />
          <span className="size-3 rounded-full bg-rule" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-shelf px-3 py-1 text-xs text-muted">{url}</span>
      </div>
      <Image
        src={shot}
        alt={alt}
        placeholder="blur"
        preload={preload}
        sizes="(min-width: 1024px) 640px, 100vw"
        className="block h-auto w-full"
      />
    </figure>
  );
}

function PhoneFrame({ shot, alt }: { shot: StaticImageData; alt: string }) {
  return (
    <figure className="w-full max-w-[15rem] rounded-[2.5rem] border-2 border-ink bg-ink p-2 shadow-[8px_8px_0_var(--color-tag-edge)]">
      <div className="overflow-hidden rounded-[2rem] bg-paper pt-6">
        <Image src={shot} alt={alt} placeholder="blur" sizes="240px" className="block h-auto w-full" />
      </div>
    </figure>
  );
}

/** A recipe page with the extension's popup open over it. */
function ExtensionMockup() {
  return (
    <figure className="relative overflow-hidden rounded-2xl border-2 border-ink bg-shelf shadow-[8px_8px_0_var(--color-ink)]">
      <div className="flex items-center gap-3 border-b-2 border-ink bg-paper px-4 py-2.5" aria-hidden="true">
        <span className="flex gap-1.5">
          <span className="size-3 rounded-full bg-sale" />
          <span className="size-3 rounded-full bg-tag" />
          <span className="size-3 rounded-full bg-rule" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-shelf px-3 py-1 text-xs text-muted">
          example.com/recipes/sheet-pan-chicken-fajitas
        </span>
        <span className="grid size-6 place-items-center rounded-md bg-ink" title="Flyerwatch extension">
          <span className="block h-2 w-3 -rotate-12 rounded-sm bg-tag" />
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto]">
        <div className="hidden space-y-4 p-8 sm:block" aria-hidden="true">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">Dinner, 30 minutes</p>
          <p className="text-3xl leading-none font-black font-stretch-extra-condensed">Sheet pan chicken fajitas</p>
          <div className="aspect-[4/3] rounded-xl bg-[repeating-linear-gradient(135deg,var(--color-paper)_0_12px,var(--color-rule)_12px_14px)]" />
          <p className="font-semibold">Ingredients</p>
          <ul className="space-y-2 text-sm text-muted">
            {["1 1/2 lb chicken breasts", "3 bell peppers", "1 red onion", "8 small flour tortillas", "1 cup sour cream"].map(
              (line) => (
                <li key={line} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-muted" />
                  {line}
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="sm:p-4 sm:pl-0">
          <div className="overflow-hidden sm:w-[18rem] sm:rounded-xl sm:border-2 sm:border-ink sm:shadow-[6px_6px_0_var(--color-tag-edge)]">
            <Image
              src={extensionShot}
              alt="The Flyerwatch popup on a fajita recipe: 4 of 7 ingredients on sale at your stores, with the cheapest two-store trip and the best deal for each ingredient."
              placeholder="blur"
              sizes="(min-width: 640px) 288px, 100vw"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </div>
    </figure>
  );
}

function Feature({
  number,
  title,
  children,
  points,
  action,
  visual,
  flip = false,
}: {
  number: string;
  title: string;
  children: ReactNode;
  points: string[];
  action?: ReactNode;
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <section className="grid items-center gap-10 border-t border-rule py-16 lg:grid-cols-[5fr_7fr] lg:gap-14 lg:py-24">
      <div className={flip ? "min-w-0 lg:order-2" : "min-w-0"}>
        <span className="inline-block rounded-md border-b-4 border-tag-edge bg-tag px-2.5 py-1 text-sm font-extrabold font-stretch-condensed">
          {number}
        </span>
        <h2 className="mt-4 text-4xl leading-[0.95] font-black tracking-tight font-stretch-extra-condensed sm:text-5xl">
          {title}
        </h2>
        <div className="mt-4 space-y-3 text-lg text-muted">{children}</div>
        <ul className="mt-6 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="mt-2 size-2 shrink-0 rotate-45 bg-sale" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {action ? <div className="mt-8">{action}</div> : null}
      </div>
      <div className={flip ? "min-w-0 lg:order-1" : "min-w-0"}>{visual}</div>
    </section>
  );
}

function ActionLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  const className =
    "inline-block rounded-xl bg-ink px-5 py-3 font-semibold text-paper transition-colors hover:bg-ink/90";
  return external ? (
    <a href={href} className={className} target="_blank" rel="noopener">
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const STEPS = [
  { title: "Open a recipe", body: "Click the extension on any recipe page. It shows which ingredients are on sale near you." },
  { title: "Add it to your list", body: "Save a few recipes. The list combines them and picks the cheapest stores to visit." },
  { title: "Shop from your phone", body: "Scan the QR code. The list opens on your phone and works without signal." },
];

export default function TourPage() {
  return (
    <>
      <div className="pt-10 pb-12 sm:pt-16">
        <h1 className="max-w-4xl text-5xl leading-[0.95] font-black tracking-tight font-stretch-extra-condensed sm:text-7xl">
          This week&apos;s flyers, sorted for you
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Flyerwatch reads the grocery flyers near you so you don&apos;t have to. Compare prices across every store, check
          a recipe against this week&apos;s sales, and walk into the store with a list that knows where each item is
          cheapest. Here&apos;s what it does.
        </p>
        <ol className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border-2 border-ink bg-shelf p-5">
              <span className="text-5xl leading-none font-black text-tag-edge font-stretch-extra-condensed">
                {index + 1}
              </span>
              <p className="mt-3 text-xl font-bold">{step.title}</p>
              <p className="mt-1 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <Feature
        number="Compare prices"
        title="Who has it cheapest this week?"
        points={[
          "Searches every grocery flyer near your postal code at once",
          "Sort by lowest price or lowest price per pound",
          "Filter to one store, and see sale savings and end dates",
        ]}
        action={<ActionLink href="/?q=chicken+breast">Try a search</ActionLink>}
        visual={
          <BrowserFrame
            url="flyerwatch / ?q=chicken breast"
            shot={searchShot}
            alt="Search results for chicken breast: 18 deals at 13 stores, sorted by lowest price, with a yellow price tag on each deal."
            preload
          />
        }
      >
        <p>Type what you need and get one list of every matching deal, cheapest first.</p>
      </Feature>

      <Feature
        flip
        number="Flyers"
        title="Every flyer, page by page"
        points={[
          "All of this week's grocery flyers near you in one grid",
          "Find a store by name",
          "Tap any deal on a flyer page for its price details, or switch to a plain list of deals",
        ]}
        action={<ActionLink href="/flyers">Browse flyers</ActionLink>}
        visual={
          <div className="relative pb-16 sm:pb-24">
            <BrowserFrame
              url="flyerwatch / flyers"
              shot={flyersShot}
              alt="This week's flyers: a grid of flyer covers from stores near N2G 1A1."
            />
            <div className="absolute right-0 bottom-0 w-3/5 sm:-right-4">
              <BrowserFrame
                url="flyerwatch / flyers / food basics"
                shot={flyerShot}
                alt="The Food Basics flyer open in Flyerwatch, with 14 pages and 375 deals."
              />
            </div>
          </div>
        }
      >
        <p>Prefer flipping through? Open any store&apos;s flyer and see every deal in it.</p>
      </Feature>

      <Feature
        number="Chrome extension"
        title="Check a recipe against the flyers"
        points={[
          "Reads the ingredients on any recipe page that includes recipe data",
          "Shows the best deal for each one, at your stores or anywhere nearby",
          "Skips staples and anything in your pantry",
          "Fix a bad match with Change search or Wrong item",
        ]}
        action={
          <ActionLink href={`${REPO}/blob/main/docs/extension-install.md`} external>
            Install the extension
          </ActionLink>
        }
        visual={<ExtensionMockup />}
      >
        <p>
          Open a recipe, click Flyerwatch, and see how many ingredients are on sale this week, and what the trip would
          cost.
        </p>
      </Feature>

      <Feature
        flip
        number="Shopping list"
        title="A trip plan, not just a list"
        points={[
          "Combines every recipe you've added, with amounts added up",
          "Picks the best 1, 2 or 3 stores, from your stores and from any store nearby",
          "Groups items by store with a rough total at sale prices",
          "Mark an item as the wrong match or not at a store, and the plan updates",
        ]}
        action={<ActionLink href="/list">Open your list</ActionLink>}
        visual={
          <BrowserFrame
            url="flyerwatch / list"
            shot={listShot}
            alt="The shopping list for two recipes: Food Basics and Zehrs cover 7 of 14 items for about $35.95, with items grouped by store."
          />
        }
      >
        <p>Add recipes from the extension and Flyerwatch works out where to shop.</p>
      </Feature>

      <Feature
        number="Send to phone"
        title="Take it to the store"
        points={[
          "Scan a QR code or share a link",
          "The whole list lives in the link, so nothing is stored on a server",
          "Works offline once it's opened, and check-offs stay on your phone",
          "Or print it",
        ]}
        visual={
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <BrowserFrame
                url="flyerwatch / list"
                shot={shareShot}
                alt="The Send to your phone dialog, showing a QR code with Copy link and Share buttons."
              />
            </div>
            <PhoneFrame
              shot={phoneShot}
              alt="The shared list on a phone: items grouped under Food Basics with checkboxes and sale prices."
            />
          </div>
        }
      >
        <p>Send the list to your phone in one scan, then tick things off as you go.</p>
      </Feature>

      <section className="mt-8 rounded-3xl bg-ink p-8 text-paper sm:p-12">
        <h2 className="text-4xl leading-[0.95] font-black tracking-tight font-stretch-extra-condensed sm:text-5xl">
          Start with what&apos;s on your list
        </h2>
        <p className="mt-3 max-w-xl text-lg text-paper/75">
          No account needed. Your postal code, pantry and list stay in your browser or the extension.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-xl bg-tag px-5 py-3 font-semibold text-ink hover:bg-tag/90">
            Compare prices
          </Link>
          <a
            href={REPO}
            target="_blank"
            rel="noopener"
            className="rounded-xl border-2 border-paper/40 px-5 py-3 font-semibold hover:border-paper"
          >
            View on GitHub
          </a>
        </div>
      </section>
    </>
  );
}
