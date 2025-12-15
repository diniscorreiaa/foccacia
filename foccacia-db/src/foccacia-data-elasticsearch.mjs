const ELASTIC_SEARCH_BASE_URI = "http://localhost:9200";
const USERS_INDEX = "/foccacia-users";
const GROUPS_INDEX = "/foccacia-groups";

export function initDataElasticSearch({ domainModel, utils }) {
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
      {
        method: "POST",
        body,
      }
    );

    return response?._id ?? null;
  }

  async function persistGroup(group) {
    if (!group?.id) return false;

    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${group.id}?refresh=wait_for`,
      {
        method: "PUT",
        body: groupToBody(group),
      }
    );

    return response?.result === "updated" || response?.result === "created";
  }

  async function createUser(username) {
    if (typeof username !== "string") return null;

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
    if (!token) return null;

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

  async function createGroup({ userId, name, description, competition, year }) {
    const group = new domainModel.Group({
      userId,
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
    if (!groupId) return null;

    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${groupId}`,
      {
        method: "GET",
      }
    );

    if (!response?.found) return null;

    const group = mapHitToGroup(response);

    return group;
  }

  async function listGroups(userId) {
    if (!userId) return [];

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

    if (typeof changes?.name === "string") group.name = changes.name;
    if (typeof changes?.description === "string")
      group.description = changes.description;

    const updated = await persistGroup(group);
    if (!updated) return null;

    return group;
  }

  async function deleteGroup(groupId) {
    if (!groupId) return false;

    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${groupId}?refresh=wait_for`,
      {
        method: "DELETE",
      }
    );

    return response?.result === "deleted";
  }

  async function addPlayerToGroup(groupId, player) {
    const group = await getGroup(groupId);
    if (!group) return null;

    group.players.push(player);

    const updated = await persistGroup(group);
    if (!updated) return null;

    return player;
  }

  async function deletePlayerFromGroup(groupId, playerId) {
    const group = await getGroup(groupId);
    if (!group) return false;

    const idx = group.players.findIndex(
      (player) => String(player.id) === String(playerId)
    );
    if (idx === -1) return false;

    group.players.splice(idx, 1);

    const updated = await persistGroup(group);
    return updated;
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
