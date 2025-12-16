const ELASTIC_SEARCH_BASE_URI = "http://localhost:9200";
const USERS_INDEX = "/foccacia-users";
const GROUPS_INDEX = "/foccacia-groups";

export function initDataElasticSearch({ domainModel, utils }) {
  function toPlayerBody(player) {
    if (!player) return null;

    const playerId = utils.toId(player.id ?? player.playerId);
    if (!playerId) return null;

    return {
      id: playerId,
      playerName: player.playerName ?? null,
      teamId: utils.toId(player.teamId) ?? player.teamId ?? null,
      teamCode: player.teamCode ?? null,
      teamName: player.teamName ?? null,
      position: player.position ?? null,
      nationality: player.nationality ?? null,
      age: player.age ?? null,
    };
  }

  function toPlayerDomain(playerBody) {
    if (!playerBody) return null;

    const playerId = utils.toId(playerBody.id ?? playerBody.playerId);
    if (!playerId) return null;

    return new domainModel.Player({
      playerId,
      playerName: playerBody.playerName,
      teamId: playerBody.teamId,
      teamCode: playerBody.teamCode,
      teamName: playerBody.teamName,
      position: playerBody.position,
      nationality: playerBody.nationality,
      age: playerBody.age,
    });
  }

  function groupToBody(group) {
    const playersBody = Array.isArray(group.players)
      ? group.players.map(toPlayerBody).filter(Boolean)
      : [];

    return {
      ownerId: utils.toId(group.ownerId) ?? group.ownerId,
      name: group.name,
      description: group.description,
      competition: group.competition,
      year: group.year,
      players: playersBody,
    };
  }

  function mapHit(hit, mapFn) {
    if (!hit || !hit._source) return null;
    return mapFn(hit._id, hit._source);
  }

  function mapHitToUser(hit) {
    return mapHit(
      hit,
      (id, src) =>
        new domainModel.User({
          id,
          username: src.username,
          token: src.token,
        })
    );
  }

  function mapHitToGroup(hit) {
    return mapHit(hit, (id, src) => {
      const players = Array.isArray(src.players)
        ? src.players.map(toPlayerDomain).filter(Boolean)
        : [];

      return new domainModel.Group({
        id,
        userId: src.ownerId,
        name: src.name,
        description: src.description,
        competition: src.competition,
        year: src.year,
        players,
      });
    });
  }

  function mapSearchResponse(response, mapFn) {
    const hits = response?.hits?.hits ?? [];
    return hits.map((hit) => mapFn(hit)).filter((entity) => entity !== null);
  }

  async function ensureIndex(indexName) {
    const url = `${ELASTIC_SEARCH_BASE_URI}${indexName}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok && response.status !== 400) {
        utils.logError(
          `ElasticSearch create index ${indexName} -> ${response.status}`,
          ""
        );
      }
    } catch (err) {
      utils.logError(`ElasticSearch error creating index ${indexName}`, err);
    }
  }

  async function elasticSearchRequest(path, { method = "GET", body } = {}) {
    const url = `${ELASTIC_SEARCH_BASE_URI}${path}`;
    const request = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body !== undefined) request.body = JSON.stringify(body);

    try {
      const response = await fetch(url, request);

      if (!response.ok) {
        utils.logError(
          `ElasticSearch ${method} ${url} -> ${response.status}`,
          ""
        );
        return null;
      }

      try {
        return await response.json();
      } catch {
        return { result: "ok" };
      }
    } catch (err) {
      utils.logError(`ElasticSearch fetch error ${method} ${url}`, err);
      return null;
    }
  }

  async function createDocument(indexBasePath, body) {
    const response = await elasticSearchRequest(
      `${indexBasePath}/_doc?refresh=wait_for`,
      { method: "POST", body }
    );
    return response?._id ?? null;
  }

  async function persistGroup(group) {
    const groupId = utils.toId(group?.id);
    if (!groupId) return false;

    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${groupId}?refresh=wait_for`,
      { method: "PUT", body: groupToBody(group) }
    );
    if (!response) return false;

    const result = response.result;
    if (result === "updated" || result === "created" || result === "ok")
      return true;

    if (response._id || response._index) return true;

    return false;
  }

  async function createUser(username) {
    const normalizedUsername = utils.toTrimmedString(username);
    if (!normalizedUsername) return null;

    const user = new domainModel.User({ username: normalizedUsername });

    const id = await createDocument(USERS_INDEX, {
      username: user.username,
      token: user.token,
    });

    if (!id) return null;

    user.id = id;
    return user;
  }

  async function getUserByToken(token) {
    const normalizedToken = utils.toTrimmedString(token);
    if (!normalizedToken) return null;

    const query = {
      query: { term: { "token.keyword": normalizedToken } },
      size: 1,
    };

    const response = await elasticSearchRequest(`${USERS_INDEX}/_search`, {
      method: "POST",
      body: query,
    });

    const users = mapSearchResponse(response, mapHitToUser);
    return users[0] ?? null;
  }

  async function createGroup({ userId, name, description, competition, year }) {
    const uid = utils.toId(userId);
    if (!uid) return null;

    const group = new domainModel.Group({
      userId: uid,
      name,
      description,
      competition,
      year,
    });

    const id = await createDocument(GROUPS_INDEX, groupToBody(group));
    if (!id) return null;

    group.id = id;
    return group;
  }

  async function getGroup(groupId) {
    const gid = utils.toId(groupId);
    if (!gid) return null;

    const response = await elasticSearchRequest(`${GROUPS_INDEX}/_doc/${gid}`, {
      method: "GET",
    });

    if (!response?.found) return null;
    return mapHitToGroup(response);
  }

  async function listGroups(userId) {
    const uid = utils.toId(userId);
    if (!uid) return null;

    const query = {
      query: { term: { "ownerId.keyword": uid } },
      size: 25,
    };

    const response = await elasticSearchRequest(`${GROUPS_INDEX}/_search`, {
      method: "POST",
      body: query,
    });

    return mapSearchResponse(response, mapHitToGroup);
  }

  async function updateGroup({ groupId, name, description }) {
    const gid = utils.toId(groupId);
    if (!gid || !name || !description) return null;

    const group = await getGroup(gid);
    if (!group) return null;

    if (utils.isString(name)) group.name = name;
    if (utils.isString(description)) group.description = description;

    const updated = await persistGroup(group);
    return updated ? group : null;
  }

  async function deleteGroup(groupId) {
    const gid = utils.toId(groupId);
    if (!gid) return false;

    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${gid}?refresh=wait_for`,
      { method: "DELETE" }
    );

    return response?.result === "deleted";
  }

  async function addPlayerToGroup({ groupId, player }) {
    const gid = utils.toId(groupId);
    if (!gid || !player) return null;

    const group = await getGroup(gid);
    if (!group) return null;

    const playerBody = toPlayerBody(player);
    if (!playerBody) return null;

    const playerDomain = toPlayerDomain(playerBody);
    if (!playerDomain) return null;

    group.players.push(playerDomain);

    const updated = await persistGroup(group);
    return updated ? group : null;
  }

  async function deletePlayerFromGroup({ groupId, playerId }) {
    const gid = utils.toId(groupId);
    const pid = utils.toId(playerId);
    if (!gid || !pid) return false;

    const group = await getGroup(gid);
    if (!group) return false;

    const idx = group.players.findIndex((p) => utils.areSameId(p.id, pid));
    if (idx === -1) return false;

    group.players.splice(idx, 1);

    const updated = await persistGroup(group);
    return updated ? group : null;
  }

  void ensureIndex(USERS_INDEX);
  void ensureIndex(GROUPS_INDEX);

  return {
    createUser,
    getUserByToken,
    createGroup,
    getGroup,
    listGroups,
    updateGroup,
    deleteGroup,
    addPlayerToGroup,
    deletePlayerFromGroup,
  };
}
