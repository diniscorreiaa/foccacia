// TODO : Francisco => modular codigo para evitar duplicação

const FOOTBALL_API_URI = "https://api.football-data.org/v4";

export function initFapiTeams({ domainModel, utils, errors }) {
  async function loadAuthHeaders() {
    const headersJson = await utils.readJson(utils.getHeadersFilePath());
    if (!headersJson) return null;
    const token = headersJson["X-Auth-Token"];
    if (!token) {
      return null;
    }
    return { "X-Auth-Token": token };
  }

  function buildFootballApiError(url, status) {
    switch (status) {
      case 401:
        return errors.UNAUTHORIZED(
          "Invalid external service Football API token"
        );
      case 403:
        return errors.FORBIDDEN(
          "Access denied to external service Football API"
        );
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
    if (!headers || headers["X-Auth-Token"] == undefined) {
      utils.utils.logError(
        `Missing or invalid X-Auth-Token while fetching ${logContext}`,
        ""
      );
      return null;
    }
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const err = buildFootballApiError(url, response.status);
      utils.utils.logError(
        `Error fetching ${logContext} from Football API`,
        err
      );
      return null;
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
    const cacheExists = await utils.fileExists(cachePath);
    if (cacheExists) {
      utils.logInfo(`Using cache for ${logContext} at ${cachePath}`, "");
      const cached = await utils.readJson(cachePath);
      if (!cached) {
        utils.logError(`Couldnt read JSON at ${cachePath}`);
        return null;
      }
      return fromCache(cached);
    }

    utils.logInfo(`Fetching ${logContext} from Football Data API`, "");
    const body = await fetchJsonFromFootballApi(url, logContext);
    if (!body) return null;

    const result = buildResult(body);
    if (!result) return null;

    const toCache = buildCacheData(result, body);
    if (!toCache) {
      utils.logError("Couldn't generate file content to save in server");
      return null;
    }
    if (!toCache) {
      utils.logError("Couldn't generate file content to save in server");
      return null;
    }

    const saveCache = await utils.writeJson(toCache, cachePath);
    if (!saveCache) {
      utils.logError("Couldn't save data in server");
      return null;
    }

    utils.logSuccess(`Saved ${logContext} cache to ${cachePath}`, "");

    return result;
  }

  // TODO : Francisco => Conseguimos modular isto melhor para evitar duplicação de código? Exemplo: Extrair cachePath e url
  // Competitions
  async function fetchCompetitions() {
    const cachePath = utils.getCompetitionsFilePath();
    if (!cachePath) {
      utils.logError(
        "Couldn't process path to cache for Football API competitions"
      ); // TODO: Tiago => Mudar quando for com DB ?
      return null;
    }
    const url = `${FOOTBALL_API_URI}/competitions`;
    if (!url) {
      utils.logError("Couldn't process URL to Football API competitions");
      return null;
    }

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
  async function fetchCompetitionTeams(code, season) {
    if (!code || !season) {
      utils.logError("Make sure you provide both competition code and season");
      return null;
    }

    const cachePath = utils.getCompetitionTeamsFilePath(code, season);
    if (!cachePath) {
      utils.logError("Couldn't process path to cache for Football API teams"); // TODO: Tiago => Mudar quando for com DB ?
      return null;
    }

    const url = `${FOOTBALL_API_URI}/competitions/${code}/teams?season=${season}`;
    if (!url) {
      utils.logError("Couldn't process URL to Football API teams");
      return null;
    }

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
    if (!teamId) {
      utils.logError("Make sure you provide a team id");
      return null;
    }

    const cachePath = utils.getTeamPlayersFilePath(teamId);
    if (!cachePath) {
      utils.logError(
        "Couldn't process path to cache for Football API team squad"
      );
      return null;
    }
    const url = `${FOOTBALL_API_URI}/teams/${teamId}`;
    if (!url) {
      utils.logError("Couldn't process URL to Football API team squad");
      return null;
    }

    return fetchWithCache({
      cachePath,
      url,
      logContext: `team ${teamId}`,
      fromCache: (cached) => cached,
      buildResult: (body) => body,
      buildCacheData: (result) => result,
    });
  }

  async function getCompetitionsDomainMapper() {
    const raw = await fetchCompetitions();
    if (!raw) {
      utils.logError("Unresolved error getting competitions data");
      return null;
    }

    const competitions = raw.map(
      (competition) =>
        new domainModel.Competition(competition.code, competition.name)
    );
    if (!competitions) {
      utils.logError(
        "Error converting external data competitions to internal data type"
      );
      return null;
    }

    return competitions;
  }

  async function getTeamsWithSquadsDomainMapper(code, season) {
    if (!code || !season) {
      return null;
    }
    const teams = await fetchCompetitionTeams(code, season);
    if (!teams) {
      utils.logError(
        "Unexpected error getting teams from Football API for internal domain mapper"
      );
    }

    const squads = await Promise.all(
      teams.map((team) => fetchTeamWithSquad(team.id))
    );
    if (!squads) {
      return null;
    }

    const result = squads.map((teamJson) => {
      const players = (teamJson.squad ?? []).map(
        (player) =>
          new domainModel.Player(
            player.id,
            player.name,
            teamJson.id,
            teamJson.tla,
            teamJson.name,
            player.position,
            player.nationality,
            utils.getAgeFromDate(player.dateOfBirth)
          )
      );
      if (!players) {
        utils.logError(
          "Error converting player data to match internal domain model"
        );
        return null;
      }

      const team = new domainModel.Team(
        teamJson.id,
        teamJson.name,
        teamJson.area?.name ?? null,
        players
      );
      if (!team) {
        utils.logError(
          "Error converting team data to match internal domain model"
        );
        return null;
      }
      return team;
    });
    if (!result) {
      utils.logError("Unknown error for teams with squad domain model mapper");
      return null;
    }
    // TODO : Tiago => persist teams and players
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
    if (!Array.isArray(teams) || teams.length === 0) {
      utils.logError(
        "Could not load teams for the competition and year of this group"
      );
      return null;
    }

    const teamHeader = teams.find(
      (team) =>
        team.tla === teamCode &&
        (team.shortName === teamName || team.name === teamName)
    );
    if (!teamHeader || Number.isNaN(teamHeader.id)) {
      utils.logError("Team does not belong to this competition/year");
      return null;
    }

    const teamDetails = await fetchTeamWithSquad(teamHeader.id);

    if (!teamDetails) {
      utils.logError(
        "Unresolved error getting team details for player domain mapper"
      );
      return null;
    }

    const squad = teamDetails.squad;
    if (!Array.isArray(squad) || squad.length < 11) {
      utils.logError("Could not load squad for this team");
      return null;
    }

    const squadPlayer = squad.find(
      (player) => player.id === playerId && player.name === playerName
    );
    if (!squadPlayer) {
      utils.logError("Player does not belong to this competition/year");
      return null;
    }

    const player = new domainModel.Player(
      squadPlayer.id,
      squadPlayer.name,
      teamDetails.id,
      teamDetails.tla,
      teamDetails.shortName ?? teamDetails.name,
      squadPlayer.position,
      squadPlayer.nationality,
      utils.getAgeFromDate(squadPlayer.dateOfBirth)
    );
    if (!player) {
      utils.logError(
        "Internal error during conversion of player data to domain model"
      );
      return null;
    }
    return player;
  }

  return {
    getCompetitions: getCompetitionsDomainMapper,
    getTeamsWithSquads: getTeamsWithSquadsDomainMapper,
    getPlayerForCompetition: getPlayerForCompetitionDomainMapper,
  };
}
