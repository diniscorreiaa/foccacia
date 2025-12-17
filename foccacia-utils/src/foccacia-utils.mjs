export function initUtils({ logUtils, ioUtils, jsonUtils }) {
  const { logInfo, logSuccess, logError } = logUtils;

  const {
    fileExists,
    getHeadersFilePath,
    getCompetitionsFilePath,
    getCompetitionTeamsFilePath,
    getTeamPlayersFilePath,
    getUsersFilePath,
    getViewsDirPath,
    getSeasonsYearsFilePath,
  } = ioUtils;

  const { readJson, writeJson } = jsonUtils;

  function isString(input) {
    return typeof input === "string" || input instanceof String;
  }

  function isNonEmptyString(input) {
    return typeof input === "string" && input.trim().length > 0;
  }

  function toTrimmedString(input) {
    if (input === null || input === undefined) return null;

    const trimmedText = String(input).trim();
    return trimmedText.length ? trimmedText : null;
  }

  function toTrimmedStringMinLen(input, minLen) {
    const trimmedText = toTrimmedString(input);
    if (!trimmedText || trimmedText.length < minLen) return null;
    return trimmedText;
  }

  function toId(input) {
    return toTrimmedString(input);
  }

  function areSameId(idA, idB) {
    const normalizedA = toId(idA);
    const normalizedB = toId(idB);

    if (!normalizedA || !normalizedB) return false;
    return normalizedA === normalizedB;
  }

  function toYear(input) {
    const yearNumber = Number(input);
    if (!Number.isInteger(yearNumber) || String(yearNumber).length !== 4)
      return null;
    return yearNumber;
  }

  function getYearFromDate(dateText) {
    if (!dateText) return null;

    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return null;

    return date.getFullYear();
  }

  function getAgeFromDate(birthDateText) {
    if (!birthDateText) return null;

    const birthDate = new Date(birthDateText);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;

    return age;
  }

  return {
    logInfo,
    logSuccess,
    logError,
    fileExists,
    readJson,
    writeJson,
    getHeadersFilePath,
    getViewsDirPath,
    getCompetitionsFilePath,
    getCompetitionTeamsFilePath,
    getTeamPlayersFilePath,
    getUsersFilePath,
    isString,
    isNonEmptyString,
    getAgeFromDate,
    getYearFromDate,
    toTrimmedString,
    toTrimmedStringMinLen,
    toId,
    areSameId,
    toYear,
    getSeasonsYearsFilePath,
  };
}
