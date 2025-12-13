export function initDataMem({ domainModel, utils, errors }) {
  let nextUserId = 1,
    nextGroupId = 1;

  const users = [],
    groups = [],
    USERS_CACHE_PATH = utils.getUsersFilePath();

  // USERS
  // TODO : Tiago => read persisted users from file on startup
  // TODO : PROFESSOR SIM! => Confirmar sendo o writeJson async todo depende dele tambem deve ser async?
  async function createUser(username) {
    if (!username) {
      return Promise.resolve(null);
    }
    const user = new domainModel.User({ id: nextUserId++, username });
    if (!user) {
      return Promise.resolve(null);
    }
    users.push(user);
    return Promise.resolve(user);
  }

  async function getUserByToken(token) {
    if (!token) {
      return Promise.resolve(null);
    }
    return Promise.resolve(users.find((user) => user.token === token) || null);
  }

  // GROUPS
  // TODO : Tiago => Create groups persistence on file
  // TODO : Tiago =>  read persisted groups from file on startup
  async function createGroup({ userId, name, description, competition, year }) {
    if (!userId || !name || !description || !competition || !year) {
      return Promise.resolve(null);
    }
    const group = new domainModel.Group({
      id: nextGroupId++,
      userId,
      name,
      description,
      competition,
      year,
    });
    if (!group) {
      return Promise.resolve(null);
    }
    groups.push(group);
    return Promise.resolve(group);
  }

  async function listGroups(userId) {
    if (!userId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(groups.filter((group) => group.ownerId === userId));
  }

  // TODO : Tiago => persist group changes on file
  async function updateGroup({ groupId, changes }) {
    if (!groupId || !changes) return Promise.resolve(null);
    const group = groups.find((group) => group.id === groupId);
    if (!group) {
      return Promise.resolve(null);
    }

    if (utils.isString(changes.name)) {
      group.name = changes.name;
    }
    if (utils.isString(changes.description)) {
      group.description = changes.description;
    }

    return Promise.resolve(group);
  }

  // TODO : Tiago => persist group deletion on file
  async function deleteGroup({ groupId }) {
    if (!groupId) return Promise.resolve(false);
    const idx = groups.findIndex((group) => group.id === groupId);
    if (idx === -1) return Promise.resolve(false);
    groups.splice(idx, 1);
    return Promise.resolve(true);
  }

  async function getGroup(groupId) {
    if (!groupId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(
      groups.find((group) => group.id === groupId) || null
    );
  }

  // GROUP PLAYERS
  // TODO : Tiago => persist group players changes on file
  async function addPlayerToGroup({ groupId, player }) {
    if (!groupId || !player) {
      return Promise.resolve(null);
    }
    const group = getGroup(groupId);
    if (!group) {
      return Promise.resolve(null);
    }

    group.players.push(player);
    return Promise.resolve(player);
  }

  // TODO : Tiago => persist group players changes on file
  async function deletePlayerFromGroup({ groupId, playerId }) {
    if (!groupId || !playerId) return Promise.resolve(false);

    const group = await getGroup(groupId);
    if (!group) return Promise.resolve(false);

    const idx = group.players.findIndex((player) => player.id === playerId);
    if (idx === -1) return Promise.resolve(false);

    group.players.splice(idx, 1);
    return Promise.resolve(true);
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
