export function initDataMem({ domainModel, utils, errors }) {
  let nextUserId = 1,
    nextGroupId = 1;

  const users = [],
    groups = [],
    USERS_CACHE_PATH = utils.getUsersFilePath();

  // USERS
  // TODO : Tiago => read persisted users from file on startup
  // TODO : PROFESSOR => Confirmar sendo o writeJson async todo depende dele tambem deve ser async?
  function persistUsers() {
    utils.writeJson(users, USERS_CACHE_PATH).catch((err) => {
      utils.logError("Error writing users cache", err);
    });
  }

  function createUser(username) {
    if (!username) {
      throw errors.UNEXPECTED("Unhandled error validating username");
    }
    const user = new domainModel.User({ id: nextUserId++, username });
    if (!user) {
      throw errors.UNEXPECTED("Unhandled error at user creation");
    }
    users.push(user);
    persistUsers();
    return user;
  }

  function getUserByToken(token) {
    if (!token) {
      return errors.UNEXPECTED("Unhandled error at token detection");
    }
    return users.find((user) => user.token === token) || null;
  }

  // GROUPS
  // TODO : Tiago => Create groups persistence on file
  // TODO : Tiago =>  read persisted groups from file on startup
  async function createGroup({ userId, name, description, competition, year }) {
    if (!userId || !name || !description || !competition || !year)
      throw errors.UNEXPECTED(
        "Unhandled error verifying requirements for group creation"
      );
    const group = new domainModel.Group({
      id: nextGroupId++,
      userId,
      name,
      description,
      competition,
      year,
    });
    if (!group) {
      throw errors.UNEXPECTED("Unhandled error at group creation");
    }
    groups.push(group);
    return Promise.resolve(group);
  }

  function listGroups(userId) {
    if (!userId) {
      throw errors.UNEXPECTED("Unhandled error at verification of user Id");
    }
    return groups.filter((group) => group.ownerId === userId);
  }

  // TODO : Tiago => persist group changes on file
  function updateGroup(groupId, changes) {
    if (!groupId || !changes)
      throw errors.UNEXPECTED(
        "Unhandled error verifying requirements for group update"
      );
    const group = groups.find((group) => group.id === groupId);
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
    const idx = groups.findIndex((group) => group.id === groupId);
    if (idx === -1) return false;
    groups.splice(idx, 1);
    return true;
  }

  function getGroup(groupId) {
    if (!groupId) {
      return null;
    }
    return groups.find((group) => group.id === groupId) || null;
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
