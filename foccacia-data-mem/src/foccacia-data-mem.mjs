// TODO : ALL -> Receber Domain-model, mapear segundo o domain-model e retornar para o service num formato que ele conhece

export function initDataMem({ utils, domainModel, errors }) {
  let nextUserId = 1,
    nextGroupId = 1;

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

  function createUser(username) {
    if (!username) {
      throw errors.UNEXPECTED("Unhandled error validating username");
    }
    const user = new domainModel.User(nextUserId++, username);
    if (!user) {
      throw errors.UNEXPECTED("Unhandled error at user creation");
    }
    users.push(user);
    persistUsers();
    return user;
  }

  function getUserByToken(token) {
    if (!token) {
      return UNEXPECTED("Unhandled error at token detection");
    }
    return users.find((u) => u.token === token) || null;
  }

  // GROUPS
  // TODO : Tiago => Create groups persistence on file
  // TODO : Tiago =>  read persisted groups from file on startup
  function createGroup(userId, name, description, competition, year) {
    if (!userId || !name || !description || !competition || !year)
      throw errors.UNEXPECTED(
        "Unhandled error verifying requirements for group creation"
      );
    const group = new domainModel.Group(
      userId,
      nextGroupId++,
      name,
      description,
      competition,
      year
    );
    if (!group) {
      throw errors.UNEXPECTED("Unhandled error at group creation");
    }
    groups.push(group);
    return group;
  }

  function listGroups(userId) {
    if (!userId) {
      throw errors.UNEXPECTED("Unhandled error at verification of user Id");
    }
    return groups.filter((g) => g.ownerId === userId);
  }

  // TODO : Tiago => persist group changes on file
  function updateGroup(groupId, changes) {
    if (!groupId || !changes)
      throw errors.UNEXPECTED(
        "Unhandled error verifying requirements for group update"
      );
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
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
  function deleteGroup(groupId) {
    if (!groupId) return false;
    const idx = groups.findIndex((g) => g.id === groupId);
    if (idx === -1) return false;
    groups.splice(idx, 1);
    return true;
  }

  function getGroup(groupId) {
    if (!groupId) {
      return null;
    }
    return groups.find((g) => g.id === groupId) || null;
  }

  // GROUP PLAYERS
  // TODO : Tiago => persist group players changes on file
  function addPlayerToGroup(groupId, player) {
    if (!groupId || !player) {
      return null;
    }
    const group = getGroup(groupId);
    if (!group) {
      return null;
    }

    group.players.push(player);
    return player;
  }

  // TODO : Tiago => persist group players changes on file
  function deletePlayerFromGroup(groupId, playerId) {
    if (!groupId || !playerId) return false;

    const group = getGroup(groupId);
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
