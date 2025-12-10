// TODO : Francisco => modular codigo para evitar duplicação
// TODO : Dinis => Nao usar throw mas null/false/undifined (Service e que mappeia o erro)
const FOOTBALL_API_URI = "https://api.football-data.org/v4";

export function initFapiTeams({ domainModel, utils, errors }) {
  async function loadAuthHeaders() {
    const headersJson = await utils.readJson(utils.getHeadersFilePath());
    if (!headersJson)
      throw errors.IO_ERROR(
        `Couldn't read JSON at ${utils.getHeadersFilePath}`
      );
    const token = headersJson["X-Auth-Token"];
    if (!token) {
      throw errors.UNAUTHORIZED(
        "You must have a valid token for this operation"
      );
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
    if (!headers || headers["X-Auth-Token"] == undefined)
      throw errors.UNEXPECTED("Couldn't load authentication headers");
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const err = buildFootballApiError(url, response.status);
      if (!err)
        throw errors.UNEXPECTED(
          "Couldn't provide apropriate error for Football API's bad response"
        ); // Aqui estou na duvida se meto internal nosso ou bad gateway pois tecnicamente algo errado aconteceu do outro lado mas nós não conseguimos definir o erro apropriado (que é falha do nosso lado)
      utils.logError(`Error fetching ${logContext} from Football API`, err);
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
    const cacheExists = await utils.fileExists(cachePath);
    if (cacheExists) {
      utils.logInfo(`Using cache for ${logContext} at ${cachePath}`, "");
      const cached = await utils.readJson(cachePath);
      if (!cached) throw errors.IO_ERROR(`Couldnt read JSON at ${cachePath}`);
      return fromCache(cached);
    }

    utils.logInfo(`Fetching ${logContext} from Football Data API`, "");
    const body = await fetchJsonFromFootballApi(url, logContext);
    if (!body)
      throw errors.UNEXPECTED(
        "Couldn't process the response from Football API and specify the error properly"
      );

    const result = buildResult(body);
    if (!result)
      throw errors.UNEXPECTED(
        "Couldn't process Football API data to local domain model"
      );

    if (!result)
      throw errors.UNEXPECTED(
        "Couldn't process Football API data to local domain model"
      );

    const toCache = buildCacheData(result, body);
    if (!toCache)
      throw errors.UNEXPECTED(
        "Couldn't generate file content to save in server"
      );
    if (!toCache)
      throw errors.UNEXPECTED(
        "Couldn't generate file content to save in server"
      );

    const saveCache = await utils.writeJson(toCache, cachePath);
    if (!saveCache) throw errors.IO_ERROR("Couldn't save data in server");

    utils.logSuccess(`Saved ${logContext} cache to ${cachePath}`, "");

    return result;
  }

  // TODO : Francisco => Conseguimos modular isto melhor para evitar duplicação de código? Exemplo: Extrair cachePath e url
  // Competitions
  async function fetchCompetitions() {
    const cachePath = utils.getCompetitionsFilePath();
    if (!cachePath)
      throw errors.UNEXPECTED(
        "Couldn't process path to cache for Football API competitions"
      ); // TODO: Tiago => Mudar quando for com DB ?
    const url = `${FOOTBALL_API_URI}/competitions`;
    if (!url)
      throw errors.UNEXPECTED(
        "Couldn't process URL to Football API competitions"
      );

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
      throw errors.INVALID_DATA(
        "Make sure you provide both competition code and season"
      );
    }

    const cachePath = utils.getCompetitionTeamsFilePath(code, season);
    if (!cachePath)
      throw errors.UNEXPECTED(
        "Couldn't process path to cache for Football API teams"
      ); // TODO: Tiago => Mudar quando for com DB ?

    const url = `${FOOTBALL_API_URI}/competitions/${code}/teams?season=${season}`;
    if (!url)
      throw errors.UNEXPECTED("Couldn't process URL to Football API teams");

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
      throw errors.INVALID_DATA("Make sure you provide a team id");
    }

    const cachePath = utils.getTeamPlayersFilePath(teamId);
    if (!cachePath)
      throw errors.UNEXPECTED(
        "Couldn't process path to cache for Football API team squad"
      );
    const url = `${FOOTBALL_API_URI}/teams/${teamId}`;
    if (!url)
      throw errors.UNEXPECTED(
        "Couldn't process URL to Football API team squad"
      );

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
      throw errors.UNEXPECTED("Unresolved error getting competitions data");
    }

    const competitions = raw.map(
      (competition) =>
        new domainModel.Competition(competition.code, competition.name)
    );
    if (!competitions) {
      throw errors.UNEXPECTED(
        "Error converting external data competitions to internal data type"
      );
    }

    return competitions;
  }

  async function getTeamsWithSquadsDomainMapper(code, season) {
    if (
      typeof code !== "string" ||
      code.trim().length === 0 ||
      Number.isNaN(season)
    )
      throw errors.INVALID_DATA(
        "You must provide both competition code and season for this operation"
      );
    const teams = await fetchCompetitionTeams(code, season);
    if (!teams) {
      throw errors.UNEXPECTED(
        "Unexpected error getting teams from Football API for internal domain mapper"
      );
    }

    const squads = await Promise.all(
      teams.map((team) => fetchTeamWithSquad(team.id))
    );
    if (!squads) {
      throw errors.UNEXPECTED(
        "Unexpected error getting team squad from Football API for internal domain mapper"
      );
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
        throw errors.UNEXPECTED(
          "Error converting player data to match internal domain model"
        );
      }

      const team = new domainModel.Team(
        teamJson.id,
        teamJson.name,
        teamJson.area?.name ?? null,
        players
      );
      if (!team) {
        throw errors.UNEXPECTED(
          "Error converting team data to match internal domain model"
        );
      }
      return team;
    });
    if (!result)
      throw errors.UNEXPECTED(
        "Unknown error for teams with squad domain model mapper"
      );
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
      typeof competition !== "string" ||
      competition.trim().length === 0 ||
      Number.isNaN(year) ||
      year.toString().length !== 4 ||
      Number.isNaN(playerId) ||
      typeof playerName !== "string" ||
      playerName.trim().length === 0 ||
      typeof teamCode != "string" ||
      teamCode.trim().length < 2 ||
      teamCode.trim().length > 4 ||
      typeof teamName != "string"
    ) {
      throw errors.INVALID_DATA(
        "Make sure you provide competition and year for this operation"
      );
    }

    const teams = await fetchCompetitionTeams(competition, year);
    if (!Array.isArray(teams) || teams.length === 0) {
      throw errors.UNEXPECTED(
        "Could not load teams for the competition and year of this group"
      );
    }

    const teamHeader = teams.find(
      (team) =>
        team.tla === teamCode &&
        (team.shortName === teamName || team.name === teamName)
    );
    if (!teamHeader || Number.isNaN(teamHeader.id)) {
      throw errors.UNPROCESSABLE(
        "Team does not belong to this competition/year"
      );
    }

    const teamDetails = await fetchTeamWithSquad(teamHeader.id);

    if (!teamDetails) {
      throw errors.UNEXPECTED(
        "Unresolved error getting team details for player domain mapper"
      );
    }

    const squad = teamDetails.squad;
    if (!Array.isArray(squad) || squad.length < 11) {
      throw errors.UNEXPECTED("Could not load squad for this team");
    }

    const squadPlayer = squad.find(
      (player) => player.id === playerId && player.name === playerName
    );
    if (!squadPlayer) {
      throw errors.UNPROCESSABLE(
        "Player does not belong to this competition/year"
      );
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
      throw errors.UNEXPECTED(
        "Internal error during conversion of player data to domain model"
      );
    }
    return player;
  }

  return {
    getCompetitions: getCompetitionsDomainMapper,
    getTeamsWithSquads: getTeamsWithSquadsDomainMapper,
    getPlayerForCompetition: getPlayerForCompetitionDomainMapper,
  };
}
