export { logInfo, logSuccess, logError } from "./log-utils.mjs";
export { readJson, writeJson } from "./json-utils.mjs";
export {
  fileExists,
  getCompetitionsFilePath,
  getCompetitionTeamsFilePath,
  getHeadersFilePath,
  getTeamPlayersFilePath,
  getUsersFilePath,
} from "./io-utils.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

// TODO: implement foccacia-utils
