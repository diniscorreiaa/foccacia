const FOOTBALL_API_URI = "https://api.football-data.org/v4";

export function initFapiTeams({ domainModel, utils }) {
  let cachedHeaders = null;

  async function loadAuthHeaders() {
    if (cachedHeaders) return cachedHeaders;

    const headersJson = await utils.readJson(utils.getHeadersFilePath());
    const token = headersJson?.["X-Auth-Token"];
    if (!token) return null;

    cachedHeaders = { "X-Auth-Token": token };
    return cachedHeaders;
  }

  async function fetchJsonFromFootballApi(url, logContext) {
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

  async function fetchWithCache({
    cachePath,
    url,
    logContext,
    fromCache = (x) => x,
    buildResult = (body) => body,
    buildCacheData = (result) => result,
  }) {
    const cacheExists = await utils.fileExists(cachePath);

    if (cacheExists) {
      utils.logInfo(`Using cache for ${logContext} at ${cachePath}`, "");
      const cached = await utils.readJson(cachePath);
      if (!cached) {
        utils.logError(`Couldn't read JSON at ${cachePath}`, "");
        return null;
      }
      return fromCache(cached);
    }

    utils.logInfo(`Fetching ${logContext} from Football Data API`, "");
    const body = await fetchJsonFromFootballApi(url, logContext);
    if (!body) return null;

    const result = buildResult(body);
    if (result == null) return null;

    const toCache = buildCacheData(result, body);
    if (toCache == null) {
      utils.logError("Couldn't generate file content to save in server", "");
      return null;
    }

    const saved = await utils.writeJson(toCache, cachePath);
    if (!saved) {
      utils.logError("Couldn't save data in server", "");
      return null;
    }

    utils.logSuccess(`Saved ${logContext} cache to ${cachePath}`, "");
    return result;
  }

  async function fetchCompetitions() {
    const cachePath = utils.getCompetitionsFilePath();
    if (!cachePath) return null;

    const url = `${FOOTBALL_API_URI}/competitions`;

    return fetchWithCache({
      cachePath,
      url,
      logContext: "competitions",
      buildResult: (body) =>
        (body.competitions ?? []).map((c) => ({ code: c.code, name: c.name })),
    });
  }

  async function fetchCompetitionTeams(code, season) {
    if (!code || !season) return null;

    const cachePath = utils.getCompetitionTeamsFilePath(code, season);
    if (!cachePath) return null;

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

  async function fetchTeamWithSquad(teamId) {
    if (!teamId) return null;

    const cachePath = utils.getTeamPlayersFilePath(teamId);
    if (!cachePath) return null;

    const url = `${FOOTBALL_API_URI}/teams/${teamId}`;

    return fetchWithCache({
      cachePath,
      url,
      logContext: `team ${teamId}`,
    });
  }

  function toPlayer(player, teamJson) {
    return new domainModel.Player(
      player.id,
      player.name,
      teamJson.id,
      teamJson.tla,
      teamJson.name,
      player.position,
      player.nationality,
      utils.getAgeFromDate(player.dateOfBirth)
    );
  }

  function toTeam(teamJson) {
    const squad = Array.isArray(teamJson.squad) ? teamJson.squad : [];
    const players = squad.map((p) => toPlayer(p, teamJson));

    return new domainModel.Team(
      teamJson.id,
      teamJson.name,
      teamJson.area?.name ?? null,
      players
    );
  }

  async function getCompetitionsDomainMapper() {
    const raw = await fetchCompetitions();
    if (!raw) return null;

    return raw.map((c) => new domainModel.Competition(c.code, c.name));
  }

  async function getTeamsWithSquadsDomainMapper(code, season) {
    if (!code || !season) return null;

    const teams = await fetchCompetitionTeams(code, season);
    if (!Array.isArray(teams) || teams.length === 0) return null;

    const squads = await Promise.all(
      teams.map((t) => fetchTeamWithSquad(t.id))
    );
    const okSquads = squads.filter(Boolean);

    if (okSquads.length === 0) return null;

    if (okSquads.length !== squads.length) {
      utils.logError(
        `Fapi: failed to load ${
          squads.length - okSquads.length
        } team detail(s) for ${code} ${season}`,
        ""
      );
    }

    const result = okSquads.map(toTeam);

    utils.logInfo(
      `Fapi: built ${result.length} Team objects for competition ${code} season ${season}`,
      ""
    );

    return result;
  }

  async function getPlayerForCompetitionDomainMapper({
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

    const teams = await fetchCompetitionTeams(competition, year);
    if (!Array.isArray(teams) || teams.length === 0) return null;

    const teamHeader = teams.find(
      (team) =>
        team.tla === teamCode &&
        (team.shortName === teamName || team.name === teamName)
    );
    if (!teamHeader?.id) return null;

    const teamDetails = await fetchTeamWithSquad(teamHeader.id);
    if (!teamDetails) return null;

    const squad = teamDetails.squad;
    if (!Array.isArray(squad) || squad.length === 0) return null;

    const squadPlayer = squad.find(
      (player) =>
        String(player.id) === String(playerId) && player.name === playerName
    );
    if (!squadPlayer) return null;

    return new domainModel.Player(
      squadPlayer.id,
      squadPlayer.name,
      teamDetails.id,
      teamDetails.tla,
      teamDetails.shortName ?? teamDetails.name,
      squadPlayer.position,
      squadPlayer.nationality,
      utils.getAgeFromDate(squadPlayer.dateOfBirth)
    );
  }

  return {
    getCompetitions: getCompetitionsDomainMapper,
    getTeamsWithSquads: getTeamsWithSquadsDomainMapper,
    getPlayerForCompetition: getPlayerForCompetitionDomainMapper,
  };
}
