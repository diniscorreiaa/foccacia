import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export function initIoUtils() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const ROOT_DIR = path.resolve(__dirname, "..", "..");

  async function fileExists(filePath) {
    try {
      await fsPromises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  function getDirName(filePath) {
    return path.dirname(filePath);
  }

  function getInputFilePath(fileName = "") {
    return path.join(ROOT_DIR, "docs", "input", fileName);
  }

  function getViewsDirPath(fileName = "") {
    return path.join(ROOT_DIR, "views", fileName);
  }

  function getHeadersFilePath() {
    const fileName = `headers.json`;
    return getInputFilePath(fileName);
  }

  function getOutputFootballApiFilePath(fileName = "") {
    return path.join(
      ROOT_DIR,
      "docs",
      "output",
      "football-api-cache",
      fileName
    );
  }

  function getOutputFoccaciaApiFilePath(fileName = "") {
    return path.join(
      ROOT_DIR,
      "docs",
      "output",
      "foccacia-api-cache",
      fileName
    );
  }

  function getTeamPlayersFilePath(id) {
    const fileName = `team-${id}-players.json`;
    return getOutputFootballApiFilePath(fileName);
  }

  function getCompetitionsFilePath() {
    const fileName = "competitions.json";
    return getOutputFootballApiFilePath(fileName);
  }

  function getCompetitionTeamsFilePath(code, season) {
    const fileName = `competition-${code}-${season}-teams.json`;
    return getOutputFootballApiFilePath(fileName);
  }

  function getUsersFilePath() {
    const fileName = "usersToken.json";
    return getOutputFoccaciaApiFilePath(fileName);
  }
  return {
    fileExists,
    getTeamPlayersFilePath,
    getHeadersFilePath,
    getDirName,
    getCompetitionsFilePath,
    getCompetitionTeamsFilePath,
    getUsersFilePath,
    getViewsDirPath,
  };
}
