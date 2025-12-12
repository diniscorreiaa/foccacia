const ELASTIC_SEARCH_BASE_URI = "http://localhost:9200";
const USERS_INDEX = "/foccacia-users";
const GROUPS_INDEX = "/foccacia-groups";

export function initDataElasticSearch({ domainModel, utils }) {
  async function createIndexIfMissing(indexPath) {
    const url = `${ELASTIC_SEARCH_BASE_URI}${indexPath}`;

    try {
      const headResponse = await fetch(url, { method: "HEAD" });

      if (headResponse.ok) {
        return;
      }

      const createResponse = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // mapping dinâmico, simples
      });

      if (!createResponse.ok) {
        utils.logError(
          `ElasticSearch create index ${indexPath} -> ${createResponse.status}`
        );
      }
    } catch (err) {
      utils.logError(`ElasticSearch error creating index ${indexPath}`, err);
    }
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
    return mapHit(
      hit,
      (id, src) =>
        new domainModel.Group({
          id,
          userId: src.ownerId,
          name: src.name,
          description: src.description,
          competition: src.competition,
          year: src.year,
          players: src.players ?? [],
        })
    );
  }

  function mapSearchResponse(response, mapFn) {
    const hits = response?.hits?.hits ?? [];
    return hits.map((hit) => mapFn(hit)).filter((entity) => entity !== null);
  }

  function groupToBody(group) {
    return {
      ownerId: group.ownerId,
      name: group.name,
      description: group.description,
      competition: group.competition,
      year: group.year,
      players: group.players,
    };
  }

  async function createDocument(indexPath, body) {
    const response = await elasticSearchRequest(`${indexPath}/_doc`, {
      method: "POST",
      body,
    });

    return response?._id ?? null;
  }

  async function persistGroup(group) {
    if (!group || !group.id) return false;

    const body = groupToBody(group);

    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${group.id}`,
      {
        method: "PUT",
        body,
      }
    );

    return !!response && response.result === "updated";
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
        utils.logError(`ElasticSearch ${method} ${url} -> ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (err) {
      utils.logError(`ElasticSearch fetch error ${method} ${url}`, err);
      return null;
    }
  }

  // USERS
  async function createUser(username) {
    const user = new domainModel.User({ username: username.trim() });

    const body = {
      username: user.username,
      token: user.token,
    };

    const id = await createDocument(USERS_INDEX, body);
    if (!id) return null;

    user.id = id;
    return user;
  }

  async function getUserByToken(token) {
    const query = {
      query: {
        term: { "token.keyword": String(token) },
      },
      size: 1,
    };

    const response = await elasticSearchRequest(`${USERS_INDEX}/_search`, {
      method: "POST",
      body: query,
    });

    const users = mapSearchResponse(response, mapHitToUser);
    const user = users[0] ?? null;
    return user;
  }

  // GROUPS
  async function createGroup({ userId, name, description, competition, year }) {
    const group = new domainModel.Group({
      userId,
      name,
      description,
      competition,
      year,
    });

    const body = groupToBody(group);

    const id = await createDocument(GROUPS_INDEX, body);
    if (!id) return null;

    group.id = id;
    return group;
  }

  async function listGroups(userId) {
    const query = {
      query: {
        term: { "ownerId.keyword": String(userId) },
      },
      size: 25,
    };

    const response = await elasticSearchRequest(`${GROUPS_INDEX}/_search`, {
      method: "POST",
      body: query,
    });

    const groups = mapSearchResponse(response, mapHitToGroup);

    return groups;
  }

  async function updateGroup(groupId, changes) {
    const group = await getGroup(groupId);
    if (!group) return null;

    group.name = changes.name;
    group.description = changes.description;

    const updated = await persistGroup(group);
    if (!updated) return null;

    return group;
  }

  async function deleteGroup(groupId) {
    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${groupId}`,
      {
        method: "DELETE",
      }
    );

    return response && response.result === "deleted";
  }

  async function getGroup(groupId) {
    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${groupId}`,
      { method: "GET" }
    );

    if (!response || !response.found) return null;

    const group = mapHitToGroup(response);

    return group;
  }

  // GROUP PLAYERS
  // TODO : Tiago => Porque nao recebe logo o grupo?
  async function addPlayerToGroup(groupId, player) {
    const group = await getGroup(groupId);
    if (!group) return null;

    group.players.push(player);

    const updated = await persistGroup(group);
    if (!updated) return null;

    return player;
  }

  // TODO : Tiago => Porque nao recebe logo o grupo?
  async function deletePlayerFromGroup(groupId, playerId) {
    const group = await getGroup(groupId);
    if (!group) return false;

    const idx = group.players.findIndex(
      (player) => String(player.id) === String(playerId)
    );
    if (idx === -1) return false;

    group.players.splice(idx, 1);

    const updated = await persistGroup(group);
    if (!updated) return false;

    return true;
  }

  return {
    createUser,
    getUserByToken,
    createGroup,
    listGroups,
    updateGroup,
    deleteGroup,
    getGroup,
    addPlayerToGroup,
    deletePlayerFromGroup,
  };
}
