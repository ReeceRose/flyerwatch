"use client";

import { useEffect, useId, useState } from "react";
import { formatDay } from "@/lib/format";
import { formatMoney } from "@/lib/price";
import { decodeShare, type SharedItem, type SharedList } from "@/lib/shopping/share";
import { useOfflineCopy } from "@/lib/shopping/use-offline-copy";

type Status = "loading" | "ready" | "invalid";

function storageKey(hash: string) {
  return `flyerwatch:share:${hash.slice(0, 40)}`;
}

function SharedRow({ item, checked, onToggle }: { item: SharedItem; checked: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li>
      <label htmlFor={id} className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-4 py-4">
        <input id={id} type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5 size-6 accent-ink" />
        <span className={`min-w-0 ${checked ? "opacity-45" : ""}`}>
          <span className={`block text-lg font-semibold capitalize ${checked ? "line-through" : ""}`}>{item.name}</span>
          {item.deal ? <span className={`block text-sm ${item.price ? "" : "text-muted"}`}>{item.deal}</span> : null}
          {item.for.length > 0 ? <span className="block text-sm text-muted">For {item.for.join(", ")}</span> : null}
        </span>
        <span className="max-w-[38%] text-right">
          {item.price ? <span className="block whitespace-nowrap font-bold">{item.price}</span> : null}
          {item.estimate !== null ? (
            <span className="block whitespace-nowrap text-sm text-muted">≈ {formatMoney(item.estimate)}</span>
          ) : null}
        </span>
      </label>
    </li>
  );
}

export function SharedListView() {
  const [status, setStatus] = useState<Status>("loading");
  const [list, setList] = useState<SharedList | null>(null);
  const [hash, setHash] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const offline = useOfflineCopy();

  useEffect(() => {
    const current = location.hash.replace(/^#/, "");
    setHash(current);
    if (!current) {
      setStatus("invalid");
      return;
    }
    decodeShare(current).then((decoded) => {
      setList(decoded);
      setStatus(decoded ? "ready" : "invalid");
      try {
        setChecked(new Set(JSON.parse(localStorage.getItem(storageKey(current)) ?? "[]") as string[]));
      } catch {
        setChecked(new Set());
      }
    });
  }, []);

  const toggle = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
    localStorage.setItem(storageKey(hash), JSON.stringify([...next]));
  };

  if (status === "loading") {
    return <div className="mt-10 h-64 animate-pulse rounded-2xl bg-shelf" aria-busy="true" />;
  }

  if (status === "invalid" || !list) {
    return (
      <div className="pt-10">
        <h1 className="text-5xl font-black tracking-tight font-stretch-extra-condensed">This link is incomplete</h1>
        <p className="mt-3 text-lg text-muted">
          The list lives inside the link, so it needs to be copied in full. Send it again from your shopping list.
        </p>
      </div>
    );
  }

  const count = list.groups.reduce((sum, group) => sum + group.items.length, 0);
  const left = count - checked.size;

  return (
    <div className="mx-auto max-w-xl">
      <div className="pt-8 pb-6">
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight font-stretch-extra-condensed">Shopping list</h1>
        <p className="mt-3 text-muted">
          Made {formatDay(list.createdAt)} with that week&apos;s flyer prices.
          {list.total > 0 ? ` About ${formatMoney(list.total)} for the items on sale.` : ""}
        </p>
        <p className="mt-1 font-semibold">{left === 0 ? "All done" : `${left} of ${count} left`}</p>
        {offline === "ready" ? (
          <p className="mt-3 rounded-xl bg-shelf px-3 py-2 text-sm">
            Saved on this phone. This link opens without signal from now on.
          </p>
        ) : offline === "saving" ? (
          <p className="mt-3 text-sm text-muted">Saving for use without signal</p>
        ) : null}
      </div>
      <div className="space-y-8">
        {list.groups.map((group) => (
          <section key={group.store ?? "anywhere"}>
            <h2 className="border-b-2 border-ink pb-1 text-3xl font-black tracking-tight font-stretch-extra-condensed">
              {group.store ?? "Buy anywhere"}
            </h2>
            <ul className="divide-y divide-rule">
              {group.items.map((item, index) => {
                const key = `${group.store ?? ""}|${item.name}|${index}`;
                return <SharedRow key={key} item={item} checked={checked.has(key)} onToggle={() => toggle(key)} />;
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
