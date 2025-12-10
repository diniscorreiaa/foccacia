// TODO : Dinis => verifica todos os erros e se faz sentido return null ou throw

const ELASTIC_SEARCH_BASE_URI = "http://localhost:9200";
const USERS_INDEX = "/foccacia-users";
const GROUPS_INDEX = "/foccacia-groups";

export function initDataElasticSearch({ domainModel, utils }) {
  if (!domainModel || !utils) {
    // TODO : Dinis => proper error handling
  }

  // TODO : Tiago => At init PUT USERS_INDEX and GROUPS_INDEX on elasticsearch if not exists

  async function elasticSearchRequest(path, { method = "GET", body } = {}) {
    if (!path) {
      // TODO : Dinis => proper error handling, !method, !body with defaults values (maybe we should do this in other functions)
    }

    const url = `${ELASTIC_SEARCH_BASE_URI}${path}`;
    const request = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    // TODO : Dinis => ve se faz sentido manter a logica das outras funcoes de testar !body (caso negativo)
    if (body !== undefined) {
      request.body = JSON.stringify(body);
    }

    const response = await fetch(url, request);

    if (!response.ok) {
      const text = await response.text().catch(() => null);
      utils.logError(
        `ElasticSearch error ${method} ${url}: ${response.status} ${text}`
      );
      // TODO : Dinis => Aqui podemos decidir: mappear erro como no fapi ou devolver null.
      throw new Error("ElasticSearch request failed");
    }

    return response.json();
  }

  // USERS
  async function createUser(username) {
    if (!username) {
      return null;
    }

    const user = new domainModel.User({ username: username.trim() });

    const body = {
      username: user.username,
      token: user.token,
      createdAt: new Date().toISOString(),
    };

    const response = await elasticSearchRequest(`${USERS_INDEX}/_doc`, {
      method: "POST",
      body,
    });

    const id = response._id;
    if (!id) {
      return null;
    }

    user.id = id;
    return user;
  }

  async function getUserByToken(token) {
    if (!token) {
      return null;
    }

    // TODO : Tiago => get user from elasticsearch by token

    const query = {
      query: {
        term: { "token.keyword": token },
      },
      size: 1,
    };

    const response = await elasticSearchRequest(`${USERS_INDEX}/_search`, {
      method: "POST",
      body: query,
    });

    const hits = response.hits?.hits ?? [];
    if (hits.length === 0) {
      return null;
    }

    const hit = hits[0];
    const src = hit._source;

    return new domainModel.User({
      id: hit._id,
      username: src.username,
      token: src.token,
    });
  }

  // GROUPS
  async function createGroup({ userId, name, description, competition, year }) {
    if (!userId || !name || !description || !competition || !year) {
      return null;
    }

    const group = new domainModel.Group({
      userId,
      name,
      description,
      competition,
      year,
    });

    const body = {
      ownerId: group.ownerId,
      name: group.name,
      description: group.description,
      competition: group.competition,
      year: group.year,
      players: group.players,
      createdAt: new Date().toISOString(),
    };

    const response = await elasticSearchRequest(`${GROUPS_INDEX}/_doc`, {
      method: "POST",
      body,
    });

    const id = response._id;
    if (!id) {
      return null;
    }

    group.id = id;
    return group;
  }

  async function listGroups(userId) {
    if (!userId) {
      return [];
    }

    const query = {
      query: {
        term: { "ownerId.keyword": userId },
      },
      size: 1000,
    };

    const response = await elasticSearchRequest(`${GROUPS_INDEX}/_search`, {
      method: "POST",
      body: query,
    });

    const hits = response.hits?.hits ?? [];

    return hits.map((hit) => {
      const src = hit._source;
      return new domainModel.Group({
        id: hit._id,
        userId: src.ownerId,
        name: src.name,
        description: src.description,
        competition: src.competition,
        year: src.year,
        players: src.players ?? [],
      });
    });
  }

  async function updateGroup(groupId, changes) {
    if (!groupId || !changes) {
      return null;
    }

    const existing = await getGroup(groupId);
    if (!existing) {
      return null;
    }

    if (changes.name !== undefined) existing.name = changes.name;
    if (changes.description !== undefined)
      existing.description = changes.description;
    if (changes.competition !== undefined)
      existing.competition = changes.competition;
    if (changes.year !== undefined) existing.year = changes.year;

    const body = {
      ownerId: existing.ownerId,
      name: existing.name,
      description: existing.description,
      competition: existing.competition,
      year: existing.year,
      players: existing.players,
    };

    await elasticSearchRequest(`${GROUPS_INDEX}/_doc/${groupId}`, {
      method: "PUT",
      body,
    });

    return existing;
  }

  async function deleteGroup(groupId) {
    if (!groupId) return false;

    await elasticSearchRequest(`${GROUPS_INDEX}/_doc/${groupId}`, {
      method: "DELETE",
    });

    return true;
  }

  async function getGroup(groupId) {
    if (!groupId) {
      return null;
    }

    const response = await elasticSearchRequest(
      `${GROUPS_INDEX}/_doc/${groupId}`,
      { method: "GET" }
    );

    if (!response.found) {
      return null;
    }

    const src = response._source;

    return new domainModel.Group({
      id: response._id,
      userId: src.ownerId, // idem
      name: src.name,
      description: src.description,
      competition: src.competition,
      year: src.year,
      players: src.players ?? [],
    });
  }

  // GROUP PLAYERS
  function addPlayerToGroup(groupId, player) {
    if (!groupId || !player) {
      return null;
    }

    const group = getGroup(groupId);
    if (!group) {
      return null;
    }

    // TODO : Tiago => update group pushing player to players on elasticsearch
    return player;
  }

  function deletePlayerFromGroup(groupId, playerId) {
    if (!groupId || !playerId) return false;

    const group = getGroup(groupId);
    if (!group) return false;

    // TODO : Tiago => get player from elasticsearch by playerId
    const idx = group.players.findIndex((player) => player.id === playerId);
    if (idx === -1) return false;

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
