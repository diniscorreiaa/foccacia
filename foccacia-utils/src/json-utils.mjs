import fsPromises from "fs/promises";

export function initJsonUtils({ ioUtils }) {
  async function readJson(filePath) {
    try {
      const content = await fsPromises.readFile(filePath, "utf8");
      return JSON.parse(content);
    } catch (err) {
      return null;
    }
  }

  async function writeJson({ data, filePath }) {
    try {
      const dir = ioUtils.getDirName(filePath);
      await fsPromises.mkdir(dir, { recursive: true });
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
      return data;
    } catch (err) {
      return null;
    }
  }
  return { readJson, writeJson };
}
