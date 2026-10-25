"use client";

import { useSyncExternalStore } from "react";
import {
  BRIDGE,
  cleanPantry,
  DEFAULT_SETTINGS,
  EMPTY_LIST,
  normalizeList,
  normalizeTrip,
  type ShoppingList,
  type ShoppingSettings,
} from "@/lib/shopping/shared";

/**
 * Settings, pantry and shopping list. With the Flyerwatch extension installed
 * they live in the extension and reach the page through its bridge script;
 * without it they're kept in this browser's local storage.
 */
export type ShoppingState = {
  ready: boolean;
  connected: boolean;
  settings: ShoppingSettings;
  pantry: string[];
  list: ShoppingList;
};

type Stored = { settings: ShoppingSettings; pantry: string[]; list: ShoppingList };
type BridgeReply = { source: string; id?: string; type?: string; ok?: boolean; result?: unknown; error?: string };
type RawState = {
  settings?: Partial<ShoppingSettings> | null;
  pantry?: string[] | null;
  list?: Partial<ShoppingList> | null;
};

const LOCAL_KEY = "flyerwatch:shopping";
const HELLO_TIMEOUT = 700;

const INITIAL: ShoppingState = {
  ready: false,
  connected: false,
  settings: DEFAULT_SETTINGS,
  pantry: [],
  list: EMPTY_LIST,
};

let state: ShoppingState = INITIAL;
let started = false;
const listeners = new Set<() => void>();
const pending = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

function emit(next: ShoppingState) {
  state = next;
  for (const listener of listeners) listener();
}

function fromRaw(raw: RawState): Stored {
  return {
    settings: {
      postal: raw.settings?.postal ?? null,
      stores: raw.settings?.stores ?? [],
      trip: normalizeTrip(raw.settings?.trip ?? null),
    },
    pantry: cleanPantry(raw.pantry ?? []),
    list: normalizeList(raw.list ?? null),
  };
}

function readLocal(): Stored {
  try {
    return fromRaw(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}") as RawState);
  } catch {
    return fromRaw({});
  }
}

function writeLocal(stored: Stored) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(stored));
}

function request<T>(type: string, payload?: unknown, timeout = 4000): Promise<T> {
  const id = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`The extension didn't answer ${type}`));
    }, timeout);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value as T);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    window.postMessage({ source: BRIDGE.page, id, type, payload }, location.origin);
  });
}

function onMessage(event: MessageEvent<BridgeReply>) {
  if (event.source !== window || event.data?.source !== BRIDGE.extension) return;
  const { id, type, ok, result, error } = event.data;
  if (id && pending.has(id)) {
    const entry = pending.get(id);
    pending.delete(id);
    if (ok) entry?.resolve(result);
    else entry?.reject(new Error(error ?? "The extension couldn't do that"));
    return;
  }
  if (type === "changed" && state.connected) emit({ ...state, ...fromRaw(result as RawState) });
  if (type === "ready" && !state.connected && state.ready) connect();
}

/** Moves anything saved before the extension was installed into the extension. */
async function mergeLocal(remote: Stored): Promise<Stored> {
  const local = readLocal();
  const known = new Set(remote.list.recipes.map((recipe) => recipe.id));
  const recipes = local.list.recipes.filter((recipe) => !known.has(recipe.id));
  const extras = local.list.extras.filter((extra) => !remote.list.extras.includes(extra));
  const pantry = cleanPantry([...remote.pantry, ...local.pantry]);
  let merged = remote;

  if (recipes.length > 0 || extras.length > 0) {
    const list = { ...remote.list, recipes: [...remote.list.recipes, ...recipes], extras: [...remote.list.extras, ...extras] };
    merged = fromRaw(await request<RawState>("setList", list));
  }
  if (pantry.length !== remote.pantry.length) merged = fromRaw(await request<RawState>("setPantry", pantry));
  if (!remote.settings.postal && local.settings.postal) {
    merged = fromRaw(await request<RawState>("setSettings", local.settings));
  }
  localStorage.removeItem(LOCAL_KEY);
  return merged;
}

async function connect() {
  try {
    await request("hello", null, HELLO_TIMEOUT);
    const remote = await mergeLocal(fromRaw(await request<RawState>("getState")));
    emit({ ready: true, connected: true, ...remote });
  } catch {
    emit({ ready: true, connected: false, ...readLocal() });
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("message", onMessage);
  connect();
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useShopping(): ShoppingState {
  return useSyncExternalStore(subscribe, () => state, () => INITIAL);
}

async function save(update: Partial<Stored>) {
  const next: ShoppingState = { ...state, ...update };
  emit(next);
  if (!next.connected) {
    writeLocal({ settings: next.settings, pantry: next.pantry, list: next.list });
    return;
  }
  try {
    if (update.settings) await request("setSettings", update.settings);
    if (update.pantry) await request("setPantry", update.pantry);
    if (update.list) await request("setList", update.list);
  } catch {
    emit({ ...next, connected: false });
    writeLocal({ settings: next.settings, pantry: next.pantry, list: next.list });
  }
}

export function updateSettings(change: Partial<ShoppingSettings>) {
  return save({ settings: { ...state.settings, ...change, trip: normalizeTrip(change.trip ?? state.settings.trip) } });
}

export function updatePantry(items: string[]) {
  return save({ pantry: cleanPantry(items) });
}

export function updateList(change: (list: ShoppingList) => ShoppingList) {
  return save({ list: normalizeList(change(state.list)) });
}
