let nextUserId = 1,
  nextGroupId = 1;

export function initDataMem({ utils, domainModel }) {
  const users = [],
    groups = [],
    USERS_CACHE_PATH = utils.getUsersFilePath();

  // USERS
  // TODO : Tiago => read persisted users from file on startup
  // TODO : Confirmar com Professor sendo o writeJson async todo depende dele tambem deve ser async?
  function persistUsers() {
    utils.writeJson(users, USERS_CACHE_PATH).catch((err) => {
      utils.logError("Error writing users cache", err);
    });
  }

  function createUserMem(username) {
    const user = new domainModel.User(nextUserId++, username);
    users.push(user);
    persistUsers();
    return user;
  }

  function getUserByTokenMem(token) {
    return users.find((u) => u.token === token) || null;
  }

  // GROUPS
  // TODO : Tiago => Create groups persistence on file
  // TODO : Tiago =>  read persisted groups from file on startup
  function createGroupMem(userId, name, description, competition, year) {
    const group = new domainModel.Group(
      userId,
      nextGroupId++,
      name,
      description,
      competition,
      year
    );
    groups.push(group);
    return group;
  }

  function listGroupsMem(userId) {
    return groups.filter((g) => g.ownerId === userId);
  }

  // TODO : Tiago => persist group changes on file
  function updateGroupMem(groupId, changes) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      return null;
    }

    if (utils.isString(changes.name)) {
      group.name = changes.name;
    }
    if (utils.isString(changes.description)) {
      group.description = changes.description;
    }

    return group;
  }

  // TODO : Tiago => persist group deletion on file
  function deleteGroupMem(groupId) {
    const idx = groups.findIndex((g) => g.id === groupId);
    if (idx === -1) return false;
    groups.splice(idx, 1);
    return true;
  }

  function getGroupMem(groupId) {
    return groups.find((g) => g.id === groupId) || null;
  }

  // GROUP PLAYERS
  // TODO : Tiago => persist group players changes on file
  function addPlayerToGroupMem(groupId, playerData) {
    const group = getGroupMem(groupId);
    if (!group) {
      return null;
    }

    const player = new domainModel.Player(
      playerData.id,
      playerData.playerName,
      playerData.teamId,
      playerData.teamCode,
      playerData.teamName,
      playerData.position,
      playerData.nationality,
      playerData.age
    );

    group.players.push(player);
    return player;
  }

  // TODO : Tiago => persist group players changes on file
  function deletePlayerFromGroupMem(groupId, playerId) {
    const group = getGroupMem(groupId);
    if (!group || !playerId) {
      return false;
    }

    const idx = group.players.findIndex((p) => p.id === playerId);
    if (idx === -1) {
      return false;
    }

    group.players.splice(idx, 1);
    return true;
  }
  return {
    createUserMem,
    getUserByTokenMem,
    createGroupMem,
    listGroupsMem,
    updateGroupMem,
    deleteGroupMem,
    getGroupMem,
    addPlayerToGroupMem,
    deletePlayerFromGroupMem,
  };
}
