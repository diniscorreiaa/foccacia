import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, "..", "..");

function getInputFilePath(fileName = "") {
  return path.join(ROOT_DIR, "docs", "input", fileName);
}

function getOutputFilePath(fileName = "") {
  return path.join(ROOT_DIR, "docs", "output", fileName);
}

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export function getTeamPlayersFilePath(id) {
  const fileName = `team-${id}-players.json`;
  return getOutputFilePath(fileName);
}

export function getHeadersFilePath() {
  const fileName = `headers.json`;
  return getInputFilePath(fileName);
}

export function getTeamsIdsFilePath() {
  const fileName = `teams-ids.json`;
  return getInputFilePath(fileName);
}

export function getDirName(filePath) {
  return path.dirname(filePath);
}
