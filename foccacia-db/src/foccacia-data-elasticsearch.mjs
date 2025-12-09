const ELASTIC_SEARCH_BASE_URL = "http://localhost:9200";
const USERS_INDEX = "foccacia-users";
const GROUPS_INDEX = "foccacia-groups";

export function initDataElasticSearch({ domainModel, utils }) {
  if (!domainModel || !utils) {
    // TODO : Dinis => proper error handling
  }

  async function elasticSearchRequest(path, { method = "GET", body } = {}) {
    if (!path) {
      // TODO : Dinis => proper error handling, !method, !body with defaults values (maybe we should do this in other functions)
    }

    const url = `${ELASTIC_SEARCH_BASE_URL}/${path}`;
    const options = { method, headers: { "Content-Type": "application/json" } };

    // TODO : Dinis => ve se faz sentido manter a logica das outras funcoes de testar !body (caso negativo)
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      utils.logError(
        `ElasticSearch error ${method} ${url}: ${response.status} ${text}`
      );
      // TODO : Dinis => Aqui podemos decidir: mappear erro como no fapi ou devolver null.
      throw new Error("ElasticSearch request failed");
    }

    return response.json();
  }

  function createUser(username) {
    if (!username) {
      return null;
    }
    const user = new domainModel.User(nextUserId++, username);
    if (!user) {
      return null;
    }

    // TODO : Tiago => push user in elasticsearch

    return user;
  }

  function getUserByToken(token) {
    if (!token) {
      return null;
    }

    // TODO : Tiago => get user from elasticsearch by token
    return users.find((u) => u.token === token) || null;
  }

  // GROUPS

  function createGroup(userId, name, description, competition, year) {
    if (!userId || !name || !description || !competition || !year) {
      return null;
    }

    // TODO : Tiago => getNextGroupId from elasticsearch

    const group = new domainModel.Group(
      userId,
      nextGroupId,
      name,
      description,
      competition,
      year
    );
    if (!group) {
      return null;
    }

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
