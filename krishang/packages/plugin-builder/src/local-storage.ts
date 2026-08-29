import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.env.ARTEFACT_DIR ?? join(process.cwd(), "artefacts");

export async function putOnce(
  key: string,
  body: Uint8Array,
  _contentType: string,
): Promise<string> {
  const path = join(root, key);
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, body, { flag: "wx" });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "EEXIST") {
      throw new Error(`write-once object already exists: ${key}`);
    }
    throw error;
  }
  return `file://${path}`;
}

export async function getBytes(key: string): Promise<Uint8Array> {
  return await readFile(join(root, key));
}
