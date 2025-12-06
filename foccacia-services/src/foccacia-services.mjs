// TODO : Francisco => eliminar código repetido e modularizar
export function initServices({
  domainModel,
  dataMem,
  fapiTeams,
  utils,
  errors,
}) {
  // Competitions
  async function getCompetitionsServices() {
    const raw = await fapiTeams.fetchCompetitions();
    const competitions = raw.map(
      (competition) =>
        new domainModel.Competition(competition.code, competition.name)
    );
    utils.logInfo(`Service: loaded ${competitions.length} competitions`, "");
    return competitions;
  }

  // Teams
  async function getTeamsServices(code, season) {
    if (!code || !season) {
      throw errors.INVALID_DATA(
        "Make sure you specify a correct competition code and season"
      );
    }
    const teams = await fapiTeams.fetchCompetitionTeams(code, season);
    utils.logInfo(
      `Service: fetched ${teams.length} teams for competition ${code} season ${season}`,
      ""
    );

    const squads = await Promise.all(
      teams.map((team) => fapiTeams.fetchTeamWithSquad(team.id))
    );

    const result = squads.map((teamJson) => {
      const players = (teamJson.squad ?? []).map(
        (player) =>
          new domainModel.Player(
            player.id,
            player.name,
            teamJson.id,
            teamJson.tla,
            teamJson.name,
            player.position,
            player.nationality,
            utils.getAgeFromDate(player.dateOfBirth)
          )
      );

      return new domainModel.Team(
        teamJson.id,
        teamJson.name,
        teamJson.area?.name ?? null,
        players
      );
    });

    // TODO : Tiago => persist teams and players
    utils.logInfo(
      `Service: built ${result.length} Team objects for competition ${code} season ${season}`,
      ""
    );
    return result;
  }

  function getUserIdFromTokenServices(token) {
    if (!token) {
      throw errors.UNAUTHORIZED("Invalid token");
    }
    const user = dataMem.getUserByTokenMem(token);
    if (!user) {
      throw errors.UNAUTHORIZED("Invalid token");
    }
    return user.id;
  }
  // TODO : Tiago, Franciso e Dinis => verificar de dataMem precisa de await devido ao writeJson
  function createUserServices(username) {
    if (!username || !username.trim()) {
      throw errors.INVALID_DATA("Username is required");
    }

    const user = dataMem.createUserMem(username.trim());
    utils.logInfo(
      `Service: created user ${user.id} with username '${user.username}'`,
      ""
    );

    return user;
  }

  function getGroupsServices(userId) {
    return dataMem.listGroupsMem(userId);
  }

  function createGroupServices(userId, name, description, competition, year) {
    if (!name || !description || !competition || !year) {
      throw errors.INVALID_DATA(
        "Make sure you provide userId, name, description, competition and year for this operation"
      );
    }
    return dataMem.createGroupMem(userId, name, description, competition, year);
  }

  // TODO : Francisco => verificar se podemos fazer um wrapper para reduzir repetição de código

  function getGroupServices(userId, groupId) {
    const id = parseInt(groupId);
    if (Number.isNaN(id)) {
      throw errors.INVALID_DATA(
        "Make sure you provide the group id for this operation"
      );
    }

    const group = dataMem.getGroupMem(id);
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    return group;
  }

  function updateGroupServices(userId, groupId, changes) {
    if (!changes) {
      throw errors.INVALID_DATA(
        "Make sure you provide the group id and changes for this operation"
      );
    }
    const id = parseInt(groupId);
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

    const group = dataMem.getGroupMem(id);
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const updated = dataMem.updateGroupMem(id, {
      name: name.trim(),
      description: description.trim(),
    });

    if (!updated) {
      throw errors.NOT_FOUND("Group not found");
    }

    return updated;
  }

  function deleteGroupServices(userId, groupId) {
    const id = parseInt(groupId);
    if (Number.isNaN(id)) {
      throw errors.INVALID_DATA(
        "Make sure you provide a valid numeric group id for this operation"
      );
    }

    const group = dataMem.getGroupMem(id);
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const deleted = dataMem.deleteGroupMem(id);
    if (!deleted) {
      throw errors.NOT_FOUND("Group not found");
    }
    return true;
  }

  async function addPlayerToGroupServices(userId, groupId, playerData) {
    if (!playerData) {
      throw errors.INVALID_DATA(
        "Make sure you provide player data for this operation"
      );
    }

    const id = parseInt(groupId);
    if (Number.isNaN(id)) {
      throw errors.INVALID_DATA(
        "Make sure you provide a valid numeric group id for this operation"
      );
    }

    const group = dataMem.getGroupMem(id);
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const { playerId, playerName, teamCode, teamName } = playerData;

    if (playerId == null || !playerName || !teamCode || !teamName) {
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

    const teams = await fapiTeams.fetchCompetitionTeams(competition, year);
    if (!Array.isArray(teams) || teams.length === 0) {
      throw errors.UNEXPECTED(
        "Could not load teams for the competition and year of this group"
      );
    }

    const teamHeader = teams.find(
      (t) =>
        t.tla === teamCode && (t.shortName === teamName || t.name === teamName)
    );
    if (!teamHeader) {
      throw errors.UNPROCESSABLE(
        "Player does not belong to this competition/year"
      );
    }

    const teamDetails = await fapiTeams.fetchTeamWithSquad(teamHeader.id);
    const squad = teamDetails?.squad;
    if (!Array.isArray(squad)) {
      throw errors.UNEXPECTED("Could not load squad for this team");
    }

    const squadPlayer = squad.find(
      (p) => p.id === playerId && p.name === playerName
    );
    if (!squadPlayer) {
      throw errors.UNPROCESSABLE(
        "Player does not belong to this competition/year"
      );
    }

    const player = dataMem.addPlayerToGroupMem(id, {
      id: playerId,
      playerName: squadPlayer.name,
      teamId: teamDetails.id,
      teamCode: teamDetails.tla,
      teamName: teamDetails.shortName ?? teamDetails.name,
      position: squadPlayer.position,
      nationality: squadPlayer.nationality,
      age: utils.getAgeFromDate(squadPlayer.dateOfBirth),
    });

    if (!player) {
      throw errors.UNEXPECTED("Could not add player to group");
    }

    return player;
  }

  function deletePlayerFromGroupServices(userId, groupId, playerId) {
    const gId = parseInt(groupId);
    const pId = parseInt(playerId);

    if (Number.isNaN(gId) || Number.isNaN(pId)) {
      throw errors.INVALID_DATA(
        "Make sure you provide valid numeric ids for group and player"
      );
    }

    const group = dataMem.getGroupMem(gId);
    if (!group) {
      throw errors.NOT_FOUND("Group not found");
    }
    if (group.ownerId !== userId) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    const removed = dataMem.deletePlayerFromGroupMem(gId, pId);
    if (!removed) {
      throw errors.NOT_FOUND("Player not found in group");
    }
    return true;
  }
  return {
    getCompetitions: getCompetitionsServices,
    getTeams: getTeamsServices,
    getUserIdFromToken: getUserIdFromTokenServices,
    createUser: createUserServices,
    getGroups: getGroupsServices,
    createGroup: createGroupServices,
    getGroup: getGroupServices,
    updateGroup: updateGroupServices,
    deleteGroup: deleteGroupServices,
    addPlayerToGroup: addPlayerToGroupServices,
    deletePlayerFromGroup: deletePlayerFromGroupServices,
  };
}
