export function initJsonUtils({ fsPromises, ioUtils, errors }) {
  async function readJson(filePath) {
    try {
      const content = await fsPromises.readFile(filePath, "utf8");
      return JSON.parse(content);
    } catch (err) {
      if (await ioUtils.fileExists(filePath)) {
        throw errors.INVALID_DATA(`Make sure the data at ${filePath} is valid`);
      }
      throw errors.IO_ERROR(`Error reading JSON: ${filePath}\n${err.message}`);
    }
  }

  async function writeJson(data, filePath) {
    try {
      const dir = ioUtils.getDirName(filePath);
      await fsPromises.mkdir(dir, { recursive: true });
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
      return data;
    } catch (err) {
      throw errors.IO_ERROR(`Error writing JSON: ${filePath}\n${err.message}`);
    }
  }
  return { readJson, writeJson };
}
