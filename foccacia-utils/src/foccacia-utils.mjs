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
  } = ioUtils;
  const { readJson, writeJson } = jsonUtils;

  // TODO : Dinis => requireNonEmptyString, requirePositiveInt, and other to validate inputs no services

  function isString(value) {
    return typeof value === "string" || value instanceof String;
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function getAgeFromDate(dateOfBirthStr) {
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
  };
}
