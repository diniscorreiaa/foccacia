const ELASTIC_SEARCH_BASE_URI = "http://localhost:9200";
const USERS_INDEX = "/foccacia-users";
const GROUPS_INDEX = "/foccacia-groups";

export function initDataElasticSearch({ domainModel, utils }) {
  // TODO : Tiago => At init PUT USERS_INDEX and GROUPS_INDEX on elasticsearch if not exists

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

    const response = await elasticSearchRequest(`${USERS_INDEX}/_doc`, {
      method: "POST",
      body,
    });

    if (!response || !response._id) return null;

    user.id = response._id;
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

    const hits = response?.hits?.hits ?? [];
    if (hits.length === 0) return null;

    const user = mapHitToUser(hits[0]);
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

    const response = await elasticSearchRequest(`${GROUPS_INDEX}/_doc`, {
      method: "POST",
      body,
    });

    if (!response || !response._id) return null;

    group.id = response._id;
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

    const body = groupToBody(group);

    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${groupId}`,
      {
        method: "PUT",
        body,
      }
    );
    if (!response || response.result !== "updated") return null;

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
  async function addPlayerToGroup(groupId, player) {
    const group = await getGroup(groupId);
    if (!group) return null;

    // TODO : Tiago => update group pushing player to players on elasticsearch
    return player;
  }

  async function deletePlayerFromGroup(groupId, playerId) {
    const group = await getGroup(groupId);
    if (!group) return false;

    // TODO : Tiago => get player from elasticsearch by playerId

    // TODO : Tiago => update group removing player from players on elasticsearch
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
