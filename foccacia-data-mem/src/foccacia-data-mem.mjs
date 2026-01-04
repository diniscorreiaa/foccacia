export function initDataMem({ domainModel, utils }) {
  let nextUserId = 1,
    nextGroupId = 1;

  const users = [],
    groups = [],
    USERS_CACHE_PATH = utils.getUsersFilePath();

  // USERS
  // TODO : Tiago => read persisted users from file on startup
  // TODO : PROFESSOR SIM! => Confirmar sendo o writeJson async todo depende dele tambem deve ser async?
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
  // TODO : Tiago => Create groups persistence on file
  // TODO : Tiago =>  read persisted groups from file on startup
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

  // TODO : Tiago => persist group changes on file
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

  // TODO : Tiago => persist group deletion on file
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
  // TODO : Tiago => persist group players changes on file
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

  // TODO : Tiago => persist group players changes on file
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
