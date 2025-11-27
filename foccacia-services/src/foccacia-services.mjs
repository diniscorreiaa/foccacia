import {
  addPlayerToGroupMem,
  Competition,
  createGroupMem,
  createUserMem,
  deleteGroupMem,
  deletePlayerFromGroupMem,
  getGroupMem,
  getUserByTokenMem,
  listGroupsMem,
  Player,
  Team,
  updateGroupMem,
} from "foccacia-data-mem";
import {
  fetchCompetitions,
  fetchCompetitionTeams,
  fetchTeamWithSquad,
} from "fapi-teams-data";
import { getAgeFromDate, isNonEmptyString, logInfo } from "foccacia-utils";
import errors from "foccacia-errors";

// Competitions
export async function getCompetitionsServices() {
  const raw = await fetchCompetitions();
  const competitions = raw.map(
    (competition) => new Competition(competition.code, competition.name)
  );
  logInfo(`Service: loaded ${competitions.length} competitions`, "");
  return competitions;
}

// Teams
export async function getTeamsServices(code, season) {
  if (!code || !season) {
    throw errors.INVALID_DATA(
      "Make sure you specify a correct competition code and season"
    );
  }
  const teams = await fetchCompetitionTeams(code, season);
  logInfo(
    `Service: fetched ${teams.length} teams for competition ${code} season ${season}`,
    ""
  );

  const squads = await Promise.all(
    teams.map((team) => fetchTeamWithSquad(team.id))
  );

  const result = squads.map((teamJson) => {
    const players = (teamJson.squad ?? []).map(
      (player) =>
        new Player(
          player.id,
          player.name,
          teamJson.id,
          teamJson.tla,
          teamJson.name,
          player.position,
          player.nationality,
          getAgeFromDate(player.dateOfBirth)
        )
    );

    return new Team(
      teamJson.id,
      teamJson.name,
      teamJson.area?.name ?? null,
      players
    );
  });

  // TODO : Tiago => persist teams and players
  logInfo(
    `Service: built ${result.length} Team objects for competition ${code} season ${season}`,
    ""
  );
  return result;
}

export function getUserIdFromTokenServices(token) {
  if (!token) {
    throw errors.UNAUTHORIZED("Invalid token");
  }
  const user = getUserByTokenMem(token);
  if (!user) {
    throw errors.UNAUTHORIZED("Invalid token");
  }
  return user.id;
}

export function createUserServices(username) {
  if (!username || !username.trim()) {
    throw errors.INVALID_DATA("Username is required");
  }

  const user = createUserMem(username.trim());
  logInfo(
    `Service: created user ${user.id} with username '${user.username}'`,
    ""
  );

  return user;
}

export function getGroupsServices(userId) {
  return listGroupsMem(userId);
}

export function createGroupServices(
  userId,
  name,
  description,
  competition,
  year
) {
  if (!name || !description || !competition || !year) {
    throw errors.INVALID_DATA(
      "Make sure you provide userId, name, description, competition and year for this operation"
    );
  }
  return createGroupMem(userId, name, description, competition, year);
}

// TODO : Francisco => verificar se podemos fazer um wrapper para reduzir repetição de código

export function getGroupServices(userId, groupId) {
  const id = parseInt(groupId);
  if (Number.isNaN(id)) {
    throw errors.INVALID_DATA(
      "Make sure you provide the group id for this operation"
    );
  }

  const group = getGroupMem(id);
  if (!group) {
    throw errors.NOT_FOUND("Group not found");
  }
  if (group.ownerId !== userId) {
    throw errors.FORBIDDEN("You do not have access to this group");
  }

  return group;
}

export function updateGroupServices(userId, groupId, changes) {
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
  if (!isNonEmptyString(name) || !isNonEmptyString(description)) {
    throw errors.INVALID_DATA(
      "Both name and description are required and must be non-empty strings"
    );
  }

  const group = getGroupMem(id);
  if (!group) {
    throw errors.NOT_FOUND("Group not found");
  }
  if (group.ownerId !== userId) {
    throw errors.FORBIDDEN("You do not have access to this group");
  }

  const updated = updateGroupMem(id, {
    name: name.trim(),
    description: description.trim(),
  });

  if (!updated) {
    throw errors.NOT_FOUND("Group not found");
  }

  return updated;
}

export function deleteGroupServices(userId, groupId) {
  const id = parseInt(groupId);
  if (Number.isNaN(id)) {
    throw errors.INVALID_DATA(
      "Make sure you provide a valid numeric group id for this operation"
    );
  }

  const group = getGroupMem(id);
  if (!group) {
    throw errors.NOT_FOUND("Group not found");
  }
  if (group.ownerId !== userId) {
    throw errors.FORBIDDEN("You do not have access to this group");
  }

  const deleted = deleteGroupMem(id);
  if (!deleted) {
    throw errors.NOT_FOUND("Group not found");
  }
  return true;
}

// TODO : Dinis => verificar porque nao faz throw 400 (Body(playerData) inválido ao adicionar jogador)
export async function addPlayerToGroupServices(userId, groupId, playerData) {
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

  const group = getGroupMem(id);
  if (!group) {
    throw errors.NOT_FOUND("Group not found");
  }
  if (group.ownerId !== userId) {
    throw errors.FORBIDDEN("You do not have access to this group");
  }

  const { playerId, playerName, teamCode, teamName } = playerData;

  // TODO : Dinis => Testar este novo throw
  if (playerId == null || !playerName || !teamCode || !teamName) {
    throw errors.INVALID_DATA(
      "Make sure you provide playerId, playerName, teamCode and teamName"
    );
  }

  // TODO : Dinis => Testar este novo throw
  if (group.players.some((p) => p.id === playerId)) {
    throw errors.UNPROCESSABLE("Player is already in this group");
  }

  // TODO : Dinis => Testar este novo throw
  if (group.players.length >= 11) {
    throw errors.UNPROCESSABLE("Group already has 11 players");
  }

  const { competition, year } = group;

  const teams = await fetchCompetitionTeams(competition, year);
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

  const teamDetails = await fetchTeamWithSquad(teamHeader.id);
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

  const player = addPlayerToGroupMem(id, {
    id: playerId,
    playerName: squadPlayer.name,
    teamId: teamDetails.id,
    teamCode: teamDetails.tla,
    teamName: teamDetails.shortName ?? teamDetails.name,
    position: squadPlayer.position,
    nationality: squadPlayer.nationality,
    age: getAgeFromDate(squadPlayer.dateOfBirth),
  });

  if (!player) {
    throw errors.UNEXPECTED("Could not add player to group");
  }

  return player;
}

export function deletePlayerFromGroupServices(userId, groupId, playerId) {
  const gId = parseInt(groupId);
  const pId = parseInt(playerId);

  if (Number.isNaN(gId) || Number.isNaN(pId)) {
    throw errors.INVALID_DATA(
      "Make sure you provide valid numeric ids for group and player"
    );
  }

  const group = getGroupMem(gId);
  if (!group) {
    throw errors.NOT_FOUND("Group not found");
  }
  if (group.ownerId !== userId) {
    throw errors.FORBIDDEN("You do not have access to this group");
  }

  const removed = deletePlayerFromGroupMem(gId, pId);
  if (!removed) {
    throw errors.NOT_FOUND("Player not found in group");
  }
  return true;
}
