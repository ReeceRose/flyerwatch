// Copies the shared JavaScript in src/shared into the extension, which loads
// its files directly and can't reach outside its own folder.
import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const from = new URL("../src/shared/", import.meta.url).pathname;
const to = new URL("../extension/lib/shared/", import.meta.url).pathname;

await rm(to, { recursive: true, force: true });
await mkdir(to, { recursive: true });
const files = (await readdir(from)).filter((file) => file.endsWith(".js"));
await Promise.all(files.map((file) => copyFile(join(from, file), join(to, file))));
console.log(`Copied ${files.length} shared files into extension/lib/shared`);
