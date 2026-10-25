// Renders brand/logo.svg into every icon the site and extension use. Run it
// after changing the logo: pnpm build:icons
import { copyFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("../", import.meta.url).pathname;
const source = `${root}brand/logo.svg`;

const png = (size) => sharp(source, { density: 72 * Math.ceil(size / 128) * 4 }).resize(size, size).png().toBuffer();

// An .ico can hold PNGs directly, so the favicon is just a header around them.
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const outputs = {
  "src/app/apple-icon.png": 180,
  "public/icon-192.png": 192,
  "public/icon-512.png": 512,
  "extension/icons/icon-16.png": 16,
  "extension/icons/icon-32.png": 32,
  "extension/icons/icon-48.png": 48,
  "extension/icons/icon-128.png": 128,
};

await Promise.all(Object.entries(outputs).map(async ([path, size]) => writeFile(`${root}${path}`, await png(size))));
const favicon = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(size) })));
await writeFile(`${root}src/app/favicon.ico`, ico(favicon));
await copyFile(source, `${root}src/app/icon.svg`);
await copyFile(source, `${root}extension/icons/logo.svg`);
console.log(`Wrote ${Object.keys(outputs).length + 3} icons from brand/logo.svg`);
