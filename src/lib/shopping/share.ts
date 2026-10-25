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

function unpack(packed: Packed): SharedList {
  return {
    version: 1,
    createdAt: packed.at,
    stores: packed.s,
    total: packed.t,
    groups: packed.g.map((group) => ({
      store: group.s,
      items: group.i.map(([name, uses, deal, price, estimate]) => ({ name, for: uses, deal, price, estimate })),
    })),
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

async function transform(bytes: Uint8Array, stream: ByteStream): Promise<Uint8Array> {
  const body = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(body).arrayBuffer());
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
    const packed = JSON.parse(new TextDecoder().decode(bytes)) as Packed;
    return packed.v === 1 ? unpack(packed) : null;
  } catch {
    return null;
  }
}
