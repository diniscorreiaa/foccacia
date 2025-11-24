import {
  Competition,
  createGroup as createGroupData,
  createUserMem,
  findUserByToken,
  getGroup as getGroupData,
  listGroups,
  Player,
  Team,
  updateGroup,
} from "foccacia-data-mem";
import {
  fetchCompetitions,
  fetchCompetitionTeams,
  fetchTeamWithSquad,
} from "fapi-teams-data";
import { logInfo } from "foccacia-utils";
import errors from "foccacia-errors";

// Competitions
export async function getCompetitions() {
  const raw = await fetchCompetitions();
  const competitions = raw.map(
    (competition) => new Competition(competition.code, competition.name)
  );
  logInfo(`Service: loaded ${competitions.length} competitions`, "");
  return competitions;
}

// Teams
export async function getTeams(code, season) {
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

  // TODO : players acrescentar o resto das propriedades do player e o seu dto
  const result = squads.map((teamJson) => {
    const players = (teamJson.squad ?? []).map(
      (player) =>
        new Player(
          player.id,
          player.name,
          teamJson.id,
          teamJson.name,
          player.position,
          player.nationality,
          player.dateOfBirth
        ) // calculateAge(player.dateOfBirth)
    );

    return new Team(
      teamJson.id,
      teamJson.name,
      teamJson.area?.name ?? null,
      players
    );
  });

  logInfo(
    `Service: built ${result.length} Team objects for competition ${code} season ${season}`,
    ""
  );
  return result;
}

export async function convertTokenToUserId(token) {
  if (!token) {
    throw errors.UNAUTHORIZED("Invalid token");
  }
  const user = findUserByToken(token);
  if (!user) {
    throw errors.NOT_FOUND("User not found");
  }
  return user.id;
}

export async function createUser(username) {
  if (!username || !username.trim()) {
    throw errors.INVALID_DATA("Username is required");
  }

  const user = createUserMem(username.trim());
  logInfo(
    `Service: created user ${user.id} with username '${user.username}'`,
    ""
  );

  return user.token;
}

export function getGroups(userId) {
  return { groups: listGroups(userId) };
}

export function createGroup(userId, name, description, competition, year) {
  if (!name || !description || !competition || !year) {
    throw errors.INVALID_DATA(
      "Make sure you provide userId, name, description, competition and year for this operation"
    );
  }
  return createGroupData(userId, name, description, competition, year);
}

export function getGroup(groupId) {
  if (!groupId) {
    throw errors.INVALID_DATA(
      "Make sure you provide the group id for this operation"
    );
  }
  return getGroupData(groupId);
}

export function replaceGroup(groupId, changes) {
  if (!groupId || !changes) {
    throw errors.INVALID_DATA(
      "Make sure you provide the group id and changes for this operation"
    );
  }
  return updateGroup(parseInt(groupId), changes);
}

export function deleteGroup(groupId) {}
export function addPlayerToGroup() {}
export function deletePlayerFromGroup() {}

// TODO : criar regras como max 11 jogadores
