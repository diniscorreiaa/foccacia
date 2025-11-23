import fs from "fs/promises";
import { getDirName } from "./io-utils.mjs";

export async function readJson(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
    throw new Error(`Erro a ler JSON: ${filePath}\n${err.message}`);
  }
}

export async function writeJson(data, filePath) {
  try {
    const dir = getDirName(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
    throw new Error(`Erro a escrever JSON: ${filePath}\n${err.message}`);
  }
}
