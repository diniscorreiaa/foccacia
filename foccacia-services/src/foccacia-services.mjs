// TODO : Dinis & Francisco => Criar uma funcao que verifica todos os parametros obrigatorios e se estao no estado correcto, verificar quando faz sentido o tipo de cada parametro (exemplos isNumber)
// TODO : Dinis & Francisco => Criar uma funcao que verifica todos os dados returnados e se estao no estado correcto, verificar quando faz sentido o tipo de cada parametro (exemplos isNumber)
// TODO : Francisco => eliminar código repetido e modularizar ( Todas as funcoes estao com a seguinte estrutura : verificar parametros, buscar dados na dataMem, verificar dados, retornar dados)
export function initServices({ data, fapiTeams, utils, errors }) {
  // Competitions
  async function getCompetitions() {
    const competitions = await fapiTeams.getCompetitions();

    if (!competitions) {
      // TODO : Dinis throw the proper error
    }

    utils.logInfo(`Service: loaded ${competitions.length} competitions`, "");

    return competitions;
  }

  // Teams
  async function getTeams(code, season) {
    if (!code || !season) {
      throw errors.INVALID_DATA(
        "Make sure you specify a correct competition code and season"
      );
    }

    const teams = await fapiTeams.getTeamsWithSquads(code, season);

    if (!teams) {
      // TODO : Dinis throw the proper error
    }

    utils.logInfo(
      `Service: built ${teams.length} Team objects for competition ${code} season ${season}`,
      ""
    );

    return teams;
  }

  async function getUserIdFromToken(token) {
    if (!token) {
      throw errors.UNAUTHORIZED("Invalid token");
    }

    const user = data.getUserByToken(token);

    if (!user) {
      throw errors.UNAUTHORIZED("Invalid token");
    }

    return user.id;
  }
  // TODO : Tiago, Franciso e Dinis => verificar de dataMem precisa de await devido ao writeJson
  async function createUser(username) {
    // TODO : Dinis verificar se precisa mesmo de validar trim
    if (!username || !username.trim()) {
      throw errors.INVALID_DATA("Username is required");
    }

    const user = data.createUser(username.trim());

    if (!user) {
      // TODO : Dinis throw the proper error
    }

    utils.logInfo(
      `Service: created user ${user.id} with username '${user.username}'`,
      ""
    );

    return user;
  }

  function getGroups(userId) {
    if (!userId) {
      // TODO : Dinis throw the proper error
    }

    const groups = data.listGroups(userId);

    if (!groups) {
      // TODO : Dinis throw the proper error
    }

    utils.logInfo(
      `Service: loaded ${groups.length} groups for user ${userId}`,
      ""
    );

    return groups;
  }

  function createGroup(userId, name, description, competition, year) {
    if (!userId || !name || !description || !competition || !year) {
      throw errors.INVALID_DATA(
        "Make sure you provide userId, name, description, competition and year for this operation"
      );
    }

    const group = data.createGroup(
      userId,
      name,
      description,
      competition,
      year
    );

    if (!group) {
      // TODO : Dinis throw the proper error
    }

    return group;
  }

  // TODO : Francisco => verificar se podemos fazer um wrapper para reduzir repetição de código

  function getGroup(userId, groupId) {
    const id = parseInt(groupId);
    if (!userId || Number.isNaN(id)) {
      throw errors.INVALID_DATA(
        "Make sure you provide the group id for this operation"
      );
    }

    const group = data.getGroup(id);

    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    return group;
  }

  function updateGroup(userId, groupId, changes) {
    if (!userId || !groupId || !changes) {
      throw errors.INVALID_DATA(
        "Make sure you provide the group id and changes for this operation"
      );
    }

    const id = parseInt(groupId);

    // TODO : Dinis => tentar validar tudo no minimo ifs possiveis
    if (Number.isNaN(id)) {
      throw errors.INVALID_DATA(
        "Make sure you provide a valid numeric group id for this operation"
      );
    }

    const { name, description } = changes;

    if (!utils.isNonEmptyString(name) || !utils.isNonEmptyString(description)) {
      throw errors.INVALID_DATA(
        "Both name and description are required and must be non-empty strings"
      );
    }

    const group = data.getGroup(id);

    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }

    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const updated = data.updateGroup(id, {
      // TODO : ALL => trim e realmente necessario?
      name: name.trim(),
      description: description.trim(),
    });

    if (!updated) {
      throw errors.NOT_FOUND("Group not found");
    }

    return updated;
  }

  function deleteGroup(userId, groupId) {
    const id = parseInt(groupId);
    if (!userId || Number.isNaN(id)) {
      throw errors.INVALID_DATA(
        "Make sure you provide a valid numeric group id for this operation"
      );
    }

    const group = data.getGroup(id);
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const deleted = data.deleteGroup(id);

    if (!deleted) {
      throw errors.NOT_FOUND("Group not found");
    }

    return deleted;
  }

  async function addPlayerToGroup(userId, groupId, playerData) {
    // TODO : Dinis => tentar validar tudo no minimo ifs possiveis
    if (!playerData) {
      throw errors.INVALID_DATA(
        "Make sure you provide player data for this operation"
      );
    }

    const id = parseInt(groupId);
    if (!userId || Number.isNaN(id)) {
      throw errors.INVALID_DATA(
        "Make sure you provide a valid numeric group id for this operation"
      );
    }

    const group = data.getGroup(id);

    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const { playerId, playerName, teamCode, teamName } = playerData;

    if (!playerId || !playerName || !teamCode || !teamName) {
      throw errors.INVALID_DATA(
        "Make sure you provide playerId, playerName, teamCode and teamName"
      );
    }

    if (group.players.some((p) => p.id === playerId)) {
      throw errors.UNPROCESSABLE("Player is already in this group");
    }

    if (group.players.length >= 11) {
      throw errors.UNPROCESSABLE("Group already has 11 players");
    }

    const { competition, year } = group;

    const player = await fapiTeams.getPlayerForCompetition({
      competition,
      year,
      playerId,
      playerName,
      teamCode,
      teamName,
    });

    if (!player) {
      // TODO : Dinis throw the proper error
    }

    // TODO : ALL => verificar se em vez de reconstruir o objeto, passar o próprio fapiPlayer
    const added = data.addPlayerToGroup(id, player);

    if (!added) {
      throw errors.UNEXPECTED("Could not add player to group");
    }

    return added;
  }

  function deletePlayerFromGroup(userId, groupId, playerId) {
    const gId = parseInt(groupId);
    const pId = parseInt(playerId);
    if (!userId || Number.isNaN(gId) || Number.isNaN(pId)) {
      throw errors.INVALID_DATA(
        "Make sure you provide valid numeric ids for group and player"
      );
    }

    const group = data.getGroup(gId);

    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const removed = data.deletePlayerFromGroup(gId, pId);

    if (!removed) {
      throw errors.NOT_FOUND("Player not found in group");
    }

    return removed;
  }
  return {
    getCompetitions,
    getTeams,
    getUserIdFromToken,
    createUser,
    getGroups,
    createGroup,
    getGroup,
    updateGroup,
    deleteGroup,
    addPlayerToGroup,
    deletePlayerFromGroup,
  };
}
