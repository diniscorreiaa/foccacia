import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, "..", "..");

function getInputFilePath(fileName = "") {
  return path.join(ROOT_DIR, "docs", "input", fileName);
}

function getOutputFootballApiFilePath(fileName = "") {
  return path.join(ROOT_DIR, "docs", "output", "football-api-cache", fileName);
}

function getOutputFilePath(fileName = "") {
  return path.join(ROOT_DIR, "docs", "output", fileName);
}

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export function getTeamPlayersFilePath(id) {
  if (!id) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  const fileName = `team-${id}-players.json`;
  return getOutputFootballApiFilePath(fileName);
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

export function getCompetitionsFilePath() {
  const fileName = "competitions.json";
  return getOutputFootballApiFilePath(fileName);
}

export function getCompetitionTeamsFilePath(code, season) {
  const fileName = `competition-${code}-${season}-teams.json`;
  return getOutputFootballApiFilePath(fileName);
}
