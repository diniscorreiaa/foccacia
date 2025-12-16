const FOOTBALL_API_URI = "https://api.football-data.org/v4";

export function initFapiTeams({ utils }) {
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
    buildCache = (parsedValue) => parsedValue,
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

  function parseCompetitions(apiJson) {
    const competitions = apiJson?.competitions ?? apiJson ?? [];
    return competitions.map((c) => ({ code: c.code, name: c.name }));
  }

  async function getCompetitions() {
    const cachePath = utils.getCompetitionsFilePath();
    if (!cachePath) return null;

    const url = `${FOOTBALL_API_URI}/competitions`;

    return fetchFromCacheOrApi({
      cachePath,
      url,
      logContext: "competitions",
      parse: parseCompetitions,
    });
  }

  function parseTeams(apiOrCacheJson) {
    return apiOrCacheJson?.teams ?? [];
  }

  async function getCompetitionTeams({ code, season }) {
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

  return { getCompetitions, getCompetitionTeams };
}
