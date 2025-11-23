import {
  fileExists,
  getCompetitionsFilePath,
  getCompetitionTeamsFilePath,
  getHeadersFilePath,
  getTeamPlayersFilePath,
  logError,
  logInfo,
  logSuccess,
  readJson,
  writeJson,
} from "foccacia-utils";
import errors from "foccacia-errors";

export function hello(name = "world") {
  return `hello ${name}`;
}

const FOOTBALL_API_URI = "https://api.football-data.org/v4";

// TODO : Mapping do erro para erros possiveis da API
async function loadAuthHeaders() {
  const headersJson = await readJson(getHeadersFilePath());
  const token = headersJson["X-Auth-Token"];
  if (!token) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
    throw new Error("Missing X-Auth-Token in headers.json");
  }
  return { "X-Auth-Token": token };
}

function buildFootballApiError(url, status) {
  switch (status) {
    case 401:
      return errors.UNAUTHORIZED("Invalid external service Football API token");
    case 403:
      return errors.FORBIDDEN("Access denied to external service Football API");
    case 429:
      return errors.TOO_MANY_REQUESTS(
        "Reached limit of requests to external service Football API, try again in a few moments"
      );
    default:
      return errors.BAD_GATEWAY(
        `Error ${status} while fetching external service ${url} from Football API`
      );
  }
}

// Competitions
export async function fetchCompetitions() {
  const cachePath = getCompetitionsFilePath();

  if (fileExists(cachePath)) {
    logInfo(`Using competitions cache at ${cachePath}`, "");
    return readJson(cachePath);
  }

  logInfo("Fetching competitions from Football Data API", "");
  const headers = await loadAuthHeaders();

  const competitions_url = `${FOOTBALL_API_URI}/competitions`;
  if (!competitions_url) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  const response = await fetch(competitions_url, { headers: headers });

  if (!response.ok) {
    const err = buildFootballApiError(competitions_url, response.status);
    logError("Error fetching competitions", err);
    throw err;
  }

  const body = await response.json();

  const competitions = body.competitions.map((competition) => ({
    code: competition.code,
    name: competition.name,
  }));

  await writeJson(competitions, cachePath);
  logSuccess(`Saved competitions cache to ${cachePath}`, "");

  return competitions;
}

// Teams
export async function fetchCompetitionTeams(code, season) {
  if (!code) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  if (!season) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  const cachePath = getCompetitionTeamsFilePath(code, season);

  if (!cachePath) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  if (fileExists(cachePath)) {
    logInfo(`Using teams cache for competition ${code} season ${season}`, "");
    const cached = await readJson(cachePath);
    return cached.teams;
  }

  logInfo(
    `Fetching teams for ${code} season ${season} from Football Data API`,
    ""
  );

  const headers = await loadAuthHeaders();
  const url_teams = `${FOOTBALL_API_URI}/competitions/${code}/teams?season=${season}`;
  if (!url_teams) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  const response = await fetch(url_teams, { headers });

  if (!response.ok) {
    const err = buildFootballApiError(url_teams, response.status);
    logError("Error fetching competition teams", err);
    throw err;
  }

  const body = await response.json();
  await writeJson({ teams: body.teams }, cachePath);
  logSuccess(`Saved teams cache for ${code} ${season} to ${cachePath}`, "");
  return body.teams;
}

// Team with Squad
export async function fetchTeamWithSquad(teamId) {
  if (!teamId) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  const cachePath = getTeamPlayersFilePath(teamId);
  if (!cachePath) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  if (fileExists(cachePath)) {
    logInfo(`Using team cache for id ${teamId}`, "");
    return readJson(cachePath);
  }

  logInfo(`Fetching team with squad for id ${teamId}`, "");
  const headers = await loadAuthHeaders();
  const url_team = `${FOOTBALL_API_URI}/teams/${teamId}`;
  if (!url_team) {
    // TODO : Usar erros personalizados da nossa biblioteca de erros
  }
  const response = await fetch(url_team, { headers: headers });

  if (!response.ok) {
    const err = buildFootballApiError(url_team, response.status);
    logError(`Error fetching team ${teamId}`, err);
    throw err;
  }

  const body = await response.json();
  await writeJson(body, cachePath);
  logSuccess(`Saved team cache for id ${teamId} to ${cachePath}`, "");
  return body;
}

// TODO : Modular e eliminar duplicacao de codigo, pequeno exemplo abaixo

// async function fetchWithCache(url, cachePath) {
//   if (fileExists(cachePath)) {
//     return readJson(cachePath);
//   }
//
//   const headers = await getAuthHeaders();
//   const resp = await fetch(url, { headers });
//   if (!resp.ok) {
//     throw new Error(`Football API error ${resp.status} for ${url}`);
//   }
//   const data = await resp.json();
//   await writeJson(data, cachePath);
//   return data;
// }
//
// export async function getCompetitionsFromApi(cachePath) {
//   const url = `${FOOTBALL_API}/competitions`;
//   return fetchWithCache(url, cachePath);
// }
//
// export async function getTeamPlayersFromApi(teamId) {
//   const cachePath = getTeamPlayersFilePath(teamId);
//   const url = `${FOOTBALL_API}/teams/${teamId}`;
//   return fetchWithCache(url, cachePath);
// }
