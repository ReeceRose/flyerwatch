/**
 * A shopping list packed into the part of a URL after the #. Browsers never
 * send that part to the server, so sharing a list stores nothing anywhere.
 */
export type SharedItem = {
  name: string;
  for: string[];
  deal: string | null;
  price: string | null;
  estimate: number | null;
};

export type SharedGroup = { store: string | null; items: SharedItem[] };

export type SharedList = {
  version: 1;
  createdAt: string;
  stores: string[];
  total: number;
  groups: SharedGroup[];
};

type Packed = {
  v: 1;
  at: string;
  s: string[];
  t: number;
  g: { s: string | null; i: [string, string[], string | null, string | null, number | null][] }[];
};

function pack(list: SharedList): Packed {
  return {
    v: 1,
    at: list.createdAt,
    s: list.stores,
    t: Math.round(list.total * 100) / 100,
    g: list.groups.map((group) => ({
      s: group.store,
      i: group.items.map((item) => [
        item.name,
        item.for,
        item.deal,
        item.price,
        item.estimate === null ? null : Math.round(item.estimate * 100) / 100,
      ]),
    })),
  };
}

const str = (value: unknown): string | null => (typeof value === "string" ? value : null);
const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

// Links can be edited by hand, so every field is checked before it's shown.
function unpack(packed: Record<string, unknown>): SharedList {
  return {
    version: 1,
    createdAt: str(packed.at) ?? "",
    stores: strings(packed.s),
    total: num(packed.t) ?? 0,
    groups: list(packed.g).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const group = raw as Record<string, unknown>;
      return {
        store: str(group.s),
        items: list(group.i).flatMap((item) => {
          const [name, uses, deal, price, estimate] = list(item);
          return typeof name === "string"
            ? { name, for: strings(uses), deal: str(deal), price: str(price), estimate: num(estimate) }
            : [];
        }),
      };
    }),
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

type ByteStream = TransformStream<Uint8Array, Uint8Array>;

// A real list is a few kilobytes. The cap stops a tiny link from unpacking
// into something huge.
const MAX_UNPACKED = 1_000_000;

async function transform(bytes: Uint8Array, stream: ByteStream): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_UNPACKED) {
      await reader.cancel();
      throw new Error("Shared list is too big");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function encodeShare(list: SharedList): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(pack(list)));
  const compress = new CompressionStream("deflate-raw") as unknown as ByteStream;
  return toBase64Url(await transform(json, compress));
}

export async function decodeShare(hash: string): Promise<SharedList | null> {
  try {
    const decompress = new DecompressionStream("deflate-raw") as unknown as ByteStream;
    const bytes = await transform(fromBase64Url(hash.replace(/^#/, "")), decompress);
    const packed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!packed || typeof packed !== "object") return null;
    const fields = packed as Record<string, unknown>;
    return fields.v === 1 ? unpack(fields) : null;
  } catch {
    return null;
  }
}
