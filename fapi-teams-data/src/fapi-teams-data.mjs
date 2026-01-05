const FOOTBALL_API_URI = "https://api.football-data.org/v4";
const MIN_SEASON_YEAR = 2023;

export function initFapiTeams({ domainModel, utils }) {
  let cachedHeaders = null;

  const isRateLimit = (x) => x === false;
  const isMissing = (x) => x == null;

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

      if (response.status === 429) {
        utils.logError(`FAPI rate limit on ${logContext}`, "");
        return false;
      }

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
      const cachedJson = await utils.readJson(cachePath);
      if (cachedJson) return parse(cachedJson);

      utils.logError(
        `Invalid cache JSON at ${cachePath} (treating as miss)`,
        ""
      );
    }

    utils.logInfo(
      `Cache miss -> fetching ${logContext} from Football Data API`,
      ""
    );

    const apiJson = await fetchJsonFromApi({ url, logContext });
    if (isRateLimit(apiJson)) return false;
    if (isMissing(apiJson)) return null;

    const parsedValue = parse(apiJson);
    if (isMissing(parsedValue)) return null;

    const cacheJson = buildCache(parsedValue, apiJson);
    if (isMissing(cacheJson)) return null;

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

  // --------- Competitions ---------

  function parseCompetitions(json) {
    const competitions = json?.competitions ?? json ?? [];
    return competitions.map((competition) => ({
      code: competition.code,
      name: competition.name,
    }));
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

  function toCompetitionDomain(rawCompetition) {
    const seasons = Array.isArray(rawCompetition?.seasons)
      ? rawCompetition.seasons
      : [];
    return new domainModel.Competition(
      rawCompetition.code,
      rawCompetition.name,
      seasons
    );
  }

  async function getCompetitions() {
    const raw = await fetchCompetitionsRaw();
    if (isRateLimit(raw)) return false;
    if (isMissing(raw)) return null;

    return raw.map(toCompetitionDomain);
  }

  // --------- Seasons (Years) ---------

  function extractSeasons(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.seasons)) return payload.seasons;
    return [];
  }

  function uniqueDescending(years) {
    return [...new Set(years)].sort((a, b) => b - a);
  }

  function parseSeasonsYears(payload) {
    const seasons = extractSeasons(payload);

    const years = seasons
      .map((season) => {
        const cachedYear = utils.toYear(season);
        if (cachedYear != null) return cachedYear;

        return utils.getYearFromDate(season?.startDate);
      })
      .filter((year) => year != null && year >= MIN_SEASON_YEAR);

    return uniqueDescending(years);
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
      buildCache: (years) => years,
    });
  }

  async function getSeasonsYears({ code }) {
    if (!code) return null;

    const raw = await fetchSeasonsYearsRaw(code);
    if (isRateLimit(raw)) return false;
    if (!raw) return null;

    return raw;
  }

  // --------- Teams + Squad ---------

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

  async function getTeamsWithSquads({ code, season }) {
    if (!code || !season) return null;

    const teamsRaw = await fetchCompetitionTeamsRaw({ code, season });
    if (isRateLimit(teamsRaw)) return false;
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
    if (isRateLimit(teamsRaw)) return false;
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
    getSeasonsYears,
    getTeamsWithSquads,
    getPlayerForCompetition,
  };
}
