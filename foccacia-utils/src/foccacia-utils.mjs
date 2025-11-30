// TODO : depende de log-utils e json-utils e io-utils

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

export function isString(value) {
  return typeof value === "string" || value instanceof String;
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function getAgeFromDate(dateOfBirthStr) {
  if (!dateOfBirthStr) {
    return null;
  }

  const birth = new Date(dateOfBirthStr);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

export function hello(name = "world") {
  return `hello ${name}`;
}
