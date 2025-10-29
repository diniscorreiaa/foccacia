
import fs from "fs/promises";
import { getDirName } from "./io-utils.mjs";

export async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

export async function writeJson(data, filePath) {
  const dir = getDirName(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return data;
}
