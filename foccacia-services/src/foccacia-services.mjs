export function initServices({ data, fapiTeams, utils, errors }) {
  // TODO : Francisco => Modular estes mustSomething
  function mustAuthUserId(userId, message) {
    const normalized = utils.toId(userId);
    if (!normalized) throw errors.UNAUTHORIZED(message);
    return normalized;
  }

  function mustId(value, message) {
    const normalized = utils.toId(value);
    if (!normalized) throw errors.INVALID_DATA(message);
    return normalized;
  }

  function mustString(value, message) {
    const normalized = utils.toTrimmedString(value);
    if (!normalized) throw errors.INVALID_DATA(message);
    return normalized;
  }

  function mustMinString(value, minLen, message) {
    const normalized = utils.toTrimmedStringMinLen(value, minLen);
    if (!normalized) throw errors.INVALID_DATA(message);
    return normalized;
  }

  function mustYear(value, message) {
    const normalized = utils.toYear(value);
    if (!normalized) throw errors.INVALID_DATA(message);
    return normalized;
  }

  async function getOwnedGroupOrThrow({ userId, groupId, action }) {
    const uid = mustAuthUserId(
      userId,
      `You must authenticate yourself before ${action}`
    );
    const gid = mustId(
      groupId,
      "Make sure you provide the group id for this operation"
    );

    const group = await data.getGroup({ groupId: gid });
    if (!group) throw errors.NOT_FOUND("Group not found");

    if (!utils.areSameId(group.ownerId, uid)) {
      throw errors.FORBIDDEN("You do not have access to this group");
    }

    return group;
  }

  async function getCompetitions() {
    const competitions = await fapiTeams.getCompetitions();
    if (!Array.isArray(competitions)) {
      throw errors.UNEXPECTED("Unhandled error for get competitions operation");
    }

    utils.logInfo(`Service: loaded ${competitions.length} competitions`, "");
    return competitions;
  }

  async function getCompetitionsWeb() {
    const competitions = await getCompetitions();

    const competitionsWithSeasons = await Promise.all(
      competitions.map(async (competition) => {
        competition.seasons = await getSeasonYears({ code: competition.code });
      })
    );

    return competitionsWithSeasons;
  }

  async function getSeasonYears({ code }) {
    const competitionCode = mustString(
      code,
      "You must provide competition code for this operation"
    );

    const seasons = await fapiTeams.getSeasonsYears({ code: competitionCode });
    if (seasons === false) {
      throw errors.TOO_MANY_REQUESTS(
        "Rate limit exceeded for external API, try again in 1 minute"
      );
    }
    if (!seasons) {
      throw errors.UNEXPECTED(
        "Unhandled error for get available seasons operation"
      );
    }
    return seasons;
  }

  async function getTeams({ code, season }) {
    const competitionCode = mustString(
      code,
      "You must provide both competition code and season for this operation"
    );
    const seasonYear = mustYear(
      season,
      "You must provide both competition code and season for this operation"
    );

    const teams = await fapiTeams.getTeamsWithSquads({
      code: competitionCode,
      season: seasonYear,
    });

    if (!teams) {
      throw errors.UNEXPECTED("Unhandled error for get teams operation");
    }

    utils.logInfo(
      `Service: loaded ${teams.length} teams for competition ${competitionCode} season ${seasonYear}`,
      ""
    );
    return teams;
  }

  async function getUserIdFromToken({ token }) {
    const normalizedToken = utils.toTrimmedString(token);
    if (!normalizedToken) throw errors.UNAUTHORIZED("Invalid token");

    const user = await data.getUserByToken({ token: normalizedToken });
    if (!user || !user.id) throw errors.UNAUTHORIZED("Invalid token");

    return user.id;
  }

  async function createUser({ username }) {
    const normalizedUsername = mustMinString(
      username,
      3,
      "Username must contain at least 3 characters"
    );

    const user = await data.createUser({ username: normalizedUsername });
    if (!user) throw errors.UNEXPECTED("Unexpected error at user creation");

    utils.logInfo(
      `Service: created user ${user.id} with username '${user.username}'`,
      ""
    );
    return user;
  }

  async function getGroups({ userId }) {
    const uid = mustId(userId, "You must provide user Id for getting groups");

    const groups = await data.listGroups({ userId: uid });
    if (!groups) throw errors.UNEXPECTED("Unexpected error at getting groups");

    utils.logInfo(
      `Service: loaded ${groups.length} groups for user ${uid}`,
      ""
    );
    return groups;
  }

  async function createGroup({ userId, name, description, competition, year }) {
    const uid = mustAuthUserId(
      userId,
      "You must authenticate yourself for group creation"
    );
    const groupName = mustMinString(name, 3, "Invalid group name");
    const groupDescription = mustMinString(
      description,
      3,
      "Invalid group description"
    );
    const competitionCode = mustString(competition, "Invalid competition");
    const seasonYear = mustYear(year, "Invalid year");

    const group = await data.createGroup({
      userId: uid,
      name: groupName,
      description: groupDescription,
      competition: competitionCode,
      year: seasonYear,
    });

    if (!group) throw errors.UNEXPECTED("Unexpected error at group creation");
    return group;
  }

  async function getGroup({ userId, groupId }) {
    return getOwnedGroupOrThrow({
      userId,
      groupId,
      action: "getting group details",
    });
  }

  async function updateGroup({ userId, groupId, changes }) {
    await getOwnedGroupOrThrow({ userId, groupId, action: "updating groups" });

    if (!changes) {
      throw errors.INVALID_DATA(
        "Make sure you provide changes for this operation"
      );
    }

    const name = mustMinString(changes.name, 3, "Invalid group name");
    const description = mustMinString(
      changes.description,
      3,
      "Invalid group description"
    );

    const updated = await data.updateGroup({ groupId, name, description });
    if (!updated) throw errors.UNEXPECTED("Unexpected error at group update");

    return updated;
  }

  async function deleteGroup({ userId, groupId }) {
    await getOwnedGroupOrThrow({ userId, groupId, action: "deleting groups" });

    const deleted = await data.deleteGroup({ groupId });
    if (!deleted) throw errors.NOT_FOUND("Group not found");

    return deleted;
  }

  async function addPlayerToGroup({ userId, groupId, playerData }) {
    const group = await getOwnedGroupOrThrow({
      userId,
      groupId,
      action: "adding players to a group",
    });

    if (!playerData) {
      throw errors.INVALID_DATA(
        "Make sure you provide player data for this operation"
      );
    }

    const playerId = mustId(playerData.playerId, "Invalid playerId");
    const playerName = mustString(playerData.playerName, "Invalid playerName");
    const teamCode = mustString(playerData.teamCode, "Invalid teamCode");
    const teamName = mustString(playerData.teamName, "Invalid teamName");

    const players = group.players ?? [];

    if (players.some((p) => utils.areSameId(p.id, playerId))) {
      throw errors.UNPROCESSABLE("Player is already in this group");
    }

    if (players.length >= 11) {
      throw errors.UNPROCESSABLE("Group already has 11 players");
    }

    const player = await fapiTeams.getPlayerForCompetition({
      competition: group.competition,
      year: group.year,
      playerId,
      playerName,
      teamCode,
      teamName,
    });

    if (!player) {
      throw errors.UNPROCESSABLE(
        "Player does not belong to the competition/year of the group"
      );
    }

    const added = await data.addPlayerToGroup({ groupId, player });
    if (!added) throw errors.UNEXPECTED("Could not add player to group");

    return added;
  }

  async function deletePlayerFromGroup({ userId, groupId, playerId }) {
    await getOwnedGroupOrThrow({
      userId,
      groupId,
      action: "deleting players from a group",
    });

    const pid = mustId(playerId, "Make sure you provide a valid player id");

    const removed = await data.deletePlayerFromGroup({
      groupId,
      playerId: pid,
    });
    if (!removed) throw errors.NOT_FOUND("Player not found in group");

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
    getCompetitionsWeb,
  };
}
