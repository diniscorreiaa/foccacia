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

const FOOTBALL_API_URI = "https://api.football-data.org/v4";

async function loadAuthHeaders() {
  const headersJson = await readJson(getHeadersFilePath());
  const token = headersJson["X-Auth-Token"];
  if (!token) {
    throw errors.UNAUTHORIZED("You must have a valid token for this operation");
  }
  return { "X-Auth-Token": token };
}

function buildFootballApiError(url, status) {
  switch (status) {
    case 401:
      return errors.UNAUTHORIZED("Invalid external service Football API token");
    case 403:
      return errors.FORBIDDEN("Access denied to external service Football API");
    case 404:
      return errors.NOT_FOUND(
        `Resource not found in external service Football API (${url})`
      );
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

async function fetchJsonFromFootballApi(url, logContext) {
  const headers = await loadAuthHeaders();
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const err = buildFootballApiError(url, response.status);
    logError(`Error fetching ${logContext} from Football API`, err);
    throw err;
  }

  return response.json();
}

async function fetchWithCache({
  cachePath,
  url,
  logContext,
  fromCache,
  buildResult,
  buildCacheData,
}) {
  if (fileExists(cachePath)) {
    logInfo(`Using cache for ${logContext} at ${cachePath}`, "");
    const cached = await readJson(cachePath);
    return fromCache(cached);
  }

  logInfo(`Fetching ${logContext} from Football Data API`, "");
  const body = await fetchJsonFromFootballApi(url, logContext);

  const result = buildResult(body);
  const toCache = buildCacheData(result, body);

  await writeJson(toCache, cachePath);
  logSuccess(`Saved ${logContext} cache to ${cachePath}`, "");

  return result;
}

// TODO : Francisco => Conseguimos modular isto melhor para evitar duplicação de código? Exemplo: Extrair cachePath e url
// Competitions
export async function fetchCompetitions() {
  const cachePath = getCompetitionsFilePath();
  const url = `${FOOTBALL_API_URI}/competitions`;

  return fetchWithCache({
    cachePath,
    url,
    logContext: "competitions",
    fromCache: (cached) => cached,
    buildResult: (body) =>
      (body.competitions ?? []).map((competition) => ({
        code: competition.code,
        name: competition.name,
      })),
    buildCacheData: (result) => result,
  });
}

// Teams
export async function fetchCompetitionTeams(code, season) {
  if (!code || !season) {
    throw errors.INVALID_DATA(
      "Make sure you provide both competition code and season"
    );
  }

  const cachePath = getCompetitionTeamsFilePath(code, season);
  const url = `${FOOTBALL_API_URI}/competitions/${code}/teams?season=${season}`;

  return fetchWithCache({
    cachePath,
    url,
    logContext: `teams for competition ${code} season ${season}`,
    fromCache: (cached) => cached.teams ?? [],
    buildResult: (body) => body.teams ?? [],
    buildCacheData: (result) => ({ teams: result }),
  });
}

export async function fetchTeamWithSquad(teamId) {
  if (!teamId) {
    throw errors.INVALID_DATA("Make sure you provide a team id");
  }

  const cachePath = getTeamPlayersFilePath(teamId);
  const url = `${FOOTBALL_API_URI}/teams/${teamId}`;

  return fetchWithCache({
    cachePath,
    url,
    logContext: `team ${teamId}`,
    fromCache: (cached) => cached,
    buildResult: (body) => body,
    buildCacheData: (result) => result,
  });
}

export function hello(name = "world") {
  return `hello ${name}`;
}
