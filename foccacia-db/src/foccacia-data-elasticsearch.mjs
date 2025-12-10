// TODO : Dinis => verifica todos os erros e se faz sentido return null ou throw

const ELASTIC_SEARCH_BASE_URI = "http://localhost:9200";
const USERS_INDEX = "foccacia-users";
const GROUPS_INDEX = "foccacia-groups";

export function initDataElasticSearch({ domainModel, utils }) {
  if (!domainModel || !utils) {
    // TODO : Dinis => proper error handling
  }

  // TODO : Tiago => At init PUT USERS_INDEX and GROUPS_INDEX on elasticsearch if not exists

  async function elasticSearchRequest(path, { method = "GET", body } = {}) {
    if (!path) {
      // TODO : Dinis => proper error handling, !method, !body with defaults values (maybe we should do this in other functions)
    }

    const url = `${ELASTIC_SEARCH_BASE_URI}/${path}`;
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
    if (!body) {
      return null;
    }

    const response = await elasticSearchRequest(`${USERS_INDEX}/_doc`, {
      method: "POST",
      body,
    });
    if (!response) {
      return null;
    }

    const id = response._id;
    if (!id) {
      return null;
    }

    user.id = id;

    return user;
  }

  // TODO : Tiago => Fix Bug nao esta encontrar o user pela token
  async function getUserByToken(token) {
    if (!token) {
      return null;
    }

    // TODO : Tiago => get user from elasticsearch by token

    const query = {
      query: {
        term: { token },
      },
      size: 1,
    };
    if (!query) {
      return null;
    }

    const response = await elasticSearchRequest(`${USERS_INDEX}/_search`, {
      method: "POST",
      body: query,
    });
    if (!response) {
      return null;
    }

    const hits = response.hits?.hits ?? [];
    if (hits.length === 0) {
      return null;
    }

    const hit = hits[0];
    const src = hit._source;
    const id = hit._id;

    const user = new domainModel.User({
      id,
      username: src.username,
      token: src.token,
    });
    if (!user) {
      return null;
    }

    return user;
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
    if (!group) {
      return null;
    }

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
    if (!response) {
      return null;
    }

    const id = response._id;
    if (!id) {
      return null;
    }

    group.id = id;

    // TODO : Tiago => push group in elasticsearch

    return group;
  }

  function listGroups(userId) {
    if (!userId) {
      return null;
    }

    // TODO : Tiago => get groups from elasticsearch by userId

    return groups.filter((g) => g.ownerId === userId);
  }

  function updateGroup(groupId, changes) {
    if (!groupId || !changes) {
      return null;
    }

    // TODO : Tiago => get group from elasticsearch by groupId

    const group = groups.find((group) => group.id === groupId);

    if (!group) {
      return null;
    }

    if (utils.isString(changes.name)) {
      // TODO : Tiago => update group name in elasticsearch
      group.name = changes.name;
    }
    if (utils.isString(changes.description)) {
      // TODO : Tiago => update group description in elasticsearch
      group.description = changes.description;
    }

    return group;
  }

  function deleteGroup(groupId) {
    if (!groupId) return false;

    // TODO : Tiago => delete group from elasticsearch by groupId
    const idx = groups.findIndex((g) => g.id === groupId);
    if (idx === -1) return false;

    return true;
  }

  function getGroup(groupId) {
    if (!groupId) {
      return null;
    }

    // TODO : Tiago => get group from elasticsearch by groupId
    return groups.find((g) => g.id === groupId) || null;
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
