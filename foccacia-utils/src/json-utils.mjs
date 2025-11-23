import fs from "fs/promises";
import { fileExists, getDirName } from "./io-utils.mjs";
import errors from "foccacia-errors";

export async function readJson(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    if (fileExists(filePath)) {
      throw errors.INVALID_DATA(`Make sure the data at ${filePath} is valid`);
    }
    throw errors.IO_ERROR(`Error reading JSON: ${filePath}\n${err.message}`);
  }
}

export async function writeJson(data, filePath) {
  try {
    const dir = getDirName(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    throw errors.IO_ERROR(`Error writing JSON: ${filePath}\n${err.message}`);
  }
}
