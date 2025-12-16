import { isNumeric } from "mocha/lib/utils.js";

const FOOTBALL_API_URI = "https://api.football-data.org/v4";

export function initFapiTeams({ domainModel, utils }) {
  let cachedHeaders = null;

  async function loadAuthHeaders() {
    if (cachedHeaders) return cachedHeaders;

    const headersJson = await utils.readJson(utils.getHeadersFilePath());
    if (!headersJson) return null;

    const token = headersJson?.["X-Auth-Token"];
    if (!token) return null;

    cachedHeaders = { "X-Auth-Token": token };
    return cachedHeaders;
  }

  async function fetchJsonFromApi({ url, logContext }) {
    const headers = await loadAuthHeaders();
    if (!headers?.["X-Auth-Token"]) {
      utils.logError(
        `Missing or invalid X-Auth-Token while fetching ${logContext}`,
        ""
      );
      return null;
    }

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        utils.logError(
          `Football API ${response.status} while fetching ${logContext}`,
          ""
        );
        return null;
      }

      return await response.json();
    } catch (err) {
      utils.logError(`Network error while fetching ${logContext}`, err);
      return null;
    }
  }

  async function fetchFromCacheOrApi({
    cachePath,
    url,
    logContext,
    parse = (json) => json,
    buildCache = (parsed) => parsed,
  }) {
    const cacheExists = await utils.fileExists(cachePath);

    if (cacheExists) {
      utils.logInfo(`Using cache for ${logContext} at ${cachePath}`, "");
      const cachedJson = await utils.readJson(cachePath);

      if (cachedJson) return parse(cachedJson);

      utils.logError(
        `Invalid cache JSON at ${cachePath} (treating as miss)`,
        ""
      );
    }

    utils.logInfo(`Fetching ${logContext} from Football Data API`, "");
    const apiJson = await fetchJsonFromApi({ url, logContext });
    if (!apiJson) return null;

    const parsedValue = parse(apiJson);
    if (parsedValue == null) return null;

    const cacheJson = buildCache(parsedValue, apiJson);
    if (cacheJson == null) return null;

    const saved = await utils.writeJson({
      data: cacheJson,
      filePath: cachePath,
    });
    if (!saved) {
      utils.logError(
        `Couldn't save cache for ${logContext} at ${cachePath}`,
        ""
      );
      return parsedValue;
    }

    utils.logSuccess(`Saved ${logContext} cache to ${cachePath}`, "");
    return parsedValue;
  }

  function parseCompetitions(json) {
    const competitions = json?.competitions ?? json ?? [];
    return competitions.map((c) => ({ code: c.code, name: c.name }));
  }

  async function fetchCompetitionsRaw() {
    const cachePath = utils.getCompetitionsFilePath();
    if (!cachePath) return null;

    const url = `${FOOTBALL_API_URI}/competitions`;

    return fetchFromCacheOrApi({
      cachePath,
      url,
      logContext: "competitions",
      parse: parseCompetitions,
      buildCache: (list) => list,
    });
  }

  function parseSeasonsYears(json) {
    const items = Array.isArray(json)
      ? json
      : Array.isArray(json?.seasons)
      ? json.seasons
      : [];

    if (items.length > 0 && isNumeric(items[0])) {
      return items;
    }

    const seasons = items
      .map((item) => utils.getYearFromDate(item?.startDate))
      .filter((year) => year != null);

    return seasons;
  }

  async function fetchSeasonsYearsRaw(code) {
    const cachePath = utils.getSeasonsYearsFilePath(code);
    if (!cachePath) return null;

    const url = `${FOOTBALL_API_URI}/competitions/${code}`;

    return fetchFromCacheOrApi({
      cachePath,
      url,
      logContext: `seasons for competition ${code}`,
      parse: parseSeasonsYears,
      buildCache: (seasons) => seasons,
    });
  }

  function parseTeams(json) {
    return json?.teams ?? [];
  }

  async function fetchCompetitionTeamsRaw({ code, season }) {
    if (!code || !season) return null;

    const cachePath = utils.getCompetitionTeamsFilePath({ code, season });
    if (!cachePath) return null;

    const url = `${FOOTBALL_API_URI}/competitions/${code}/teams?season=${season}`;

    return fetchFromCacheOrApi({
      cachePath,
      url,
      logContext: `teams for competition ${code} season ${season}`,
      parse: parseTeams,
      buildCache: (teams) => ({ teams }),
    });
  }

  function toCompetitionDomain(rawCompetition) {
    return new domainModel.Competition(
      rawCompetition.code,
      rawCompetition.name,
      rawCompetition.seasons
    );
  }

  function toPlayerDomain({ playerJson, teamJson }) {
    return new domainModel.Player({
      playerId: playerJson.id,
      playerName: playerJson.name,
      teamId: teamJson.id,
      teamCode: teamJson.tla,
      teamName: teamJson.shortName ?? teamJson.name,
      position: playerJson.position ?? null,
      nationality: playerJson.nationality ?? null,
      age: utils.getAgeFromDate(playerJson.dateOfBirth),
    });
  }

  function toTeamDomain(teamJson) {
    const squad = Array.isArray(teamJson.squad) ? teamJson.squad : [];
    const players = squad.map((p) =>
      toPlayerDomain({ playerJson: p, teamJson })
    );

    return new domainModel.Team({
      teamId: teamJson.id,
      teamName: teamJson.name,
      country: teamJson.area?.name ?? null,
      players,
    });
  }

  async function getCompetitions() {
    const raw = await fetchCompetitionsRaw();
    if (!raw) return null;
    return raw.map(toCompetitionDomain);
  }

  async function getSeasonsYears(code) {
    if (!code) return null;

    const raw = await fetchSeasonsYearsRaw(code);
    if (!raw) return null;

    return raw;
  }

  async function getTeamsWithSquads({ code, season }) {
    if (!code || !season) return null;

    const teamsRaw = await fetchCompetitionTeamsRaw({ code, season });
    if (!teamsRaw) return null;

    return teamsRaw.map(toTeamDomain);
  }

  async function getPlayerForCompetition({
    competition,
    year,
    playerId,
    playerName,
    teamCode,
    teamName,
  }) {
    if (
      !competition ||
      !year ||
      !playerId ||
      !playerName ||
      !teamCode ||
      !teamName
    ) {
      return null;
    }

    const teamsRaw = await fetchCompetitionTeamsRaw({
      code: competition,
      season: year,
    });
    if (!Array.isArray(teamsRaw) || teamsRaw.length === 0) return null;

    const team = teamsRaw.find(
      (team) =>
        team?.tla === teamCode &&
        (team.shortName === teamName || team.name === teamName)
    );
    if (!team) return null;

    const squad = Array.isArray(team.squad) ? team.squad : [];
    const found = squad.find(
      (player) =>
        String(player.id) === String(playerId) && player.name === playerName
    );
    if (!found) return null;

    return toPlayerDomain({ playerJson: found, teamJson: team });
  }

  return {
    getCompetitions,
    getTeamsWithSquads,
    getPlayerForCompetition,
    getSeasonsYears,
  };
}
