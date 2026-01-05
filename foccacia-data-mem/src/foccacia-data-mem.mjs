export function initDataMem({ domainModel, utils }) {
  let nextUserId = 1,
    nextGroupId = 1;

  const users = [],
    groups = [],
    USERS_CACHE_PATH = utils.getUsersFilePath();

  // USERS

  async function createUser({ username }) {
    if (!username) {
      return null;
    }
    const user = new domainModel.User({ id: nextUserId++, username });
    if (!user) {
      return null;
    }
    users.push(user);
    return user;
  }

  async function getUserByToken({ token }) {
    if (!token) {
      return null;
    }
    return users.find((user) => user.token === token) || null;
  }

  // GROUPS

  async function createGroup({ userId, name, description, competition, year }) {
    if (!userId || !name || !description || !competition || !year) {
      return null;
    }
    const group = new domainModel.Group({
      id: utils.toId(nextGroupId++),
      userId,
      name,
      description,
      competition,
      year,
    });
    if (!group) {
      return null;
    }
    groups.push(group);
    return group;
  }

  async function listGroups({ userId }) {
    if (!userId) {
      return null;
    }
    return groups.filter((group) => group.ownerId === userId);
  }

  async function updateGroup({ groupId, name, description }) {
    if (!groupId || !name || !description) return null;
    const group = groups.find((group) => group.id === groupId);
    if (!group) {
      return null;
    }

    if (utils.isString(name)) {
      group.name = name;
    }
    if (utils.isString(description)) {
      group.description = description;
    }

    return group;
  }

  async function deleteGroup({ groupId }) {
    if (!groupId) return false;
    const idx = groups.findIndex((group) => group.id === groupId);
    if (idx === -1) return false;
    groups.splice(idx, 1);
    return true;
  }

  async function getGroup({ groupId }) {
    if (!groupId) {
      return null;
    }
    return groups.find((group) => group.id === groupId) || null;
  }

  // GROUP PLAYERS

  async function addPlayerToGroup({ groupId, player }) {
    if (!groupId || !player) {
      return null;
    }
    const group = await getGroup({ groupId });
    if (!group) {
      return null;
    }

    player.id = utils.toId(player.id);
    group.players.push(player);
    return player;
  }

  async function deletePlayerFromGroup({ groupId, playerId }) {
    if (!groupId || !playerId) return false;

    const group = await getGroup({ groupId });
    if (!group) return false;

    const idx = group.players.findIndex((player) => player.id === playerId);
    if (idx === -1) return false;

    group.players.splice(idx, 1);
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
