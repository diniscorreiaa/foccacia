// TODO : Dinis & Francisco => Criar uma funcao que verifica todos os parametros obrigatorios e se estao no estado correcto, verificar quando faz sentido o tipo de cada parametro (exemplos isNumber)
// TODO : Dinis & Francisco => Criar uma funcao que verifica todos os dados returnados e se estao no estado correcto, verificar quando faz sentido o tipo de cada parametro (exemplos isNumber)
// TODO : Francisco => eliminar código repetido e modularizar ( Todas as funcoes estao com a seguinte estrutura : verificar parametros, buscar dados na dataMem, verificar dados, retornar dados)

// TODO : PROFESSOR SIM! => Todos as funções vai ter de ser async para evitar que alguns devolvam promises e outros nao
// TODO : Dinis => userId and groupId can be numbers or strings, change the verification to accept both

// TODO : TIAGO => Verificar as calls e as funcoes async que nao estao a usar await ou que nao estao async

export function initServices({ data, fapiTeams, utils, errors }) {
  // Competitions
  async function getCompetitions() {
    const competitions = await fapiTeams.getCompetitions();
    // TODO: Dinis => Inverter a logica dos erros relativos à camada fapi
    if (!competitions) {
      throw errors.UNEXPECTED("Unhandled error for get competitions operation");
    }

    utils.logInfo(`Service: loaded ${competitions.length} competitions`, "");

    return competitions;
  }

  // Teams
  async function getTeams({ code, season }) {
    if (
      typeof code !== "string" ||
      code.trim().length === 0 ||
      Number.isNaN(season)
    ) {
      throw errors.INVALID_DATA(
        "You must provide both competition code and season for this operation"
      );
    }

    const teams = await fapiTeams.getTeamsWithSquads({ code, season });

    if (!teams) {
      throw errors.UNEXPECTED("Unhandled error for get teams operation");
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

    const user = await data.getUserByToken(token);

    if (!user || !user.id) {
      throw errors.UNAUTHORIZED("Invalid token");
    }

    return Promise.resolve(user.id);
  }
  async function createUser(username) {
    if (!username || !username.trim()) {
      throw errors.INVALID_DATA("Username is required");
    }
    if (typeof username !== "string" || username.trim().length < 3)
      // Tinha de verificar que não era string vazia acrescentei logo regras de negocio
      throw errors.INVALID_DATA("Username must contain at least 3 characters");

    const user = await data.createUser(username.trim());

    if (!user) {
      throw errors.UNEXPECTED("Unexpected error at user creation");
    }

    utils.logInfo(
      `Service: created user ${user.id} with username '${user.username}'`,
      ""
    );

    return user;
  }

  async function getGroups(userId) {
    if (!userId) {
      throw errors.INVALID_DATA("You must provide user Id for getting groups");
    }

    const groups = await data.listGroups(userId);

    if (!groups) {
      throw errors.UNEXPECTED("Unexpected error at getting groups");
    }

    utils.logInfo(
      `Service: loaded ${groups.length} groups for user ${userId}`,
      ""
    );

    return groups;
  }

  async function createGroup({ userId, name, description, competition, year }) {
    if (!userId)
      throw errors.UNAUTHORIZED(
        "You must authenticate yourself for group creation"
      );

    if (!name || !description || !competition || !year) {
      throw errors.INVALID_DATA(
        "Make sure you provide userId, name, description, competition and year for this operation"
      );
    }

    const group = await data.createGroup({
      userId,
      name,
      description,
      competition,
      year,
    });

    if (!group) {
      throw errors.UNEXPECTED("Unexpected error at group creation");
    }

    return group;
  }

  // TODO : Francisco => verificar se podemos fazer um wrapper para reduzir repetição de código

  async function getGroup(userId, groupId) {
    if (!userId)
      throw errors.UNAUTHORIZED(
        "You must authenticate yourself for getting group details"
      );

    if (!groupId) {
      throw errors.INVALID_DATA(
        "Make sure you provide the group id for this operation"
      );
    }

    const group = await data.getGroup(groupId);

    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    return group;
  }

  async function updateGroup(userId, groupId, changes) {
    if (!userId)
      throw errors.UNAUTHORIZED(
        "You must authenticate yourself before updating groups"
      );

    const { name, description } = changes;

    if (
      !groupId ||
      !changes ||
      typeof name !== "string" ||
      name.trim().length < 3 ||
      typeof description !== "string" ||
      description.length < 3
    ) {
      throw errors.INVALID_DATA(
        "Make sure you provide the group id and changes for this operation\nChanges must have name " +
          "and description and both need to be a string with more than 3 digits"
      );
    }

    const group = await data.getGroup(groupId);
    
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }

    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const updated = await data.updateGroup(groupId, {
      name: name.trim(),
      description: description.trim(),
    });

    if (!updated) {
      throw errors.NOT_FOUND("Group not found");
    }

    return updated;
  }

  async function deleteGroup({ userId, groupId }) {

    if (!userId) {
      throw errors.UNAUTHORIZED(
        "You must authenticate yourself before deleting groups"
      );
    }
    
    if (!groupId) {
      throw errors.INVALID_DATA(
        "Make sure you provide a valid numeric group id for this operation"
      );
    }

    const group = await data.getGroup(groupId);
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const deleted = await data.deleteGroup(groupId);

    if (!deleted) {
      throw errors.NOT_FOUND("Group not found");
    }

    return deleted;
  }

  async function addPlayerToGroup(userId, groupId, playerData) {
    if (!playerData) {
      throw errors.INVALID_DATA(
        "Make sure you provide player data for this operation"
      );
    }

    const { playerId, playerName, teamCode, teamName } = playerData;

    if (!userId) {
      throw errors.UNAUTHORIZED(
        "You must authenticate yourself before adding players to a group"
      );
    }

    if (
      !groupId ||
      Number.isNaN(playerId) ||
      typeof playerName !== "string" ||
      playerName.trim() === 0 ||
      typeof teamCode !== "string" ||
      teamCode.trim().length < 2 ||
      teamCode.trim().length > 4 ||
      typeof teamName !== "string" ||
      teamName.trim() === 0
    ) {
      throw errors.INVALID_DATA(
        "Make sure you provide a valid numeric group id for this operation\nPlayer data must have" +
          "valid numeric playerId, playerName, teamName and teamCode\n playerName and teamName must be valid" +
          "and non empty and teamCode must be an acronym between 2 and 4 characters"
      );
    }
    const group = await data.getGroup(groupId);
    
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    if (group.players.some((player) => player.id === playerId)) {
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
    if (
      typeof competition !== "string" ||
      competition.trim().length === 0 ||
      Number.isNaN(year) ||
      year.toString().length !== 4 ||
      Number.isNaN(playerId) ||
      typeof playerName !== "string" ||
      playerName.trim().length === 0 ||
      typeof teamCode != "string" ||
      teamCode.trim().length < 2 ||
      teamCode.trim().length > 4 ||
      typeof teamName != "string"
    ) {
      throw errors.INVALID_DATA(
        "Make sure you provide competition, year, playerId, playerName, teamCode and teamName for this operation"
      );
    }
    if (!player) {
      throw errors.UNEXPECTED("Unexpected error processing given player");
    }

    const added = await data.addPlayerToGroup(groupId, player);

    if (!added) {
      throw errors.UNEXPECTED("Could not add player to group");
    }

    return added;
  }

  async function deletePlayerFromGroup(userId, groupId, playerId) {
    if (!userId)
      throw errors.UNAUTHORIZED(
        "You must authenticate yourself before deleting players from a group"
      );

    if (!groupId || !playerId || Number.isNaN(playerId)) {
      throw errors.INVALID_DATA(
        "Make sure you provide valid ids for group and player"
      );
    }

    const group = await data.getGroup(groupId);

    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }
    
    // TODO : Tiago => Porque nao passar logo o grupo?
    const removed = await data.deletePlayerFromGroup(groupId, playerId);

    // TODO : TIAGO => Algo esta errado aqui
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
