import { Group, Player, User } from "./domain-model.mjs";
import {
  getUsersFilePath,
  isString,
  logError,
  writeJson,
} from "foccacia-utils";

export function hello(name = "world") {
  return `hello ${name}`;
}

export { Competition, Team, Player, User, Group } from "./domain-model.mjs";

let nextUserId = 1,
  nextGroupId = 1;

const USERS = [],
  GROUPS = [],
  USERS_CACHE_PATH = getUsersFilePath();

// USERS
function persistUsers() {
  writeJson(USERS, USERS_CACHE_PATH).catch((err) => {
    logError("Error writing users cache", err);
  });
}

export function createUserMem(username) {
  const user = new User(nextUserId++, username);
  USERS.push(user);
  persistUsers();
  return user;
}

export function findUserByToken(token) {
  return USERS.find((u) => u.token === token) || null;
}

export function getAllUsersMem() {
  return [...USERS];
}

// GROUPS
export function createGroupMem(userId, name, description, competition, year) {
  const group = new Group(
    userId,
    nextGroupId++,
    name,
    description,
    competition,
    year
  );
  GROUPS.push(group);
  return group;
}

export function listGroupsMem(userId) {
  return GROUPS.filter((g) => g.ownerId === userId);
}

export function updateGroupMem(groupId, changes) {
  const group = GROUPS.find((g) => g.id === groupId);
  if (!group) {
    return null;
  }

  if (isString(changes.name)) {
    group.name = changes.name;
  }
  if (isString(changes.description)) {
    group.description = changes.description;
  }

  return group;
}

export function deleteGroupMem(groupId) {
  const idx = GROUPS.findIndex((g) => g.id === groupId);
  if (idx === -1) return false;
  GROUPS.splice(idx, 1);
  return true;
}

export function getGroupMem(groupId) {
  return GROUPS.find((g) => g.id === groupId) || null;
}

// GROUP PLAYERS
export function addPlayerToGroup(groupId, playerData) {
  const group = getGroupMem(groupId);
  if (!group) {
    return null;
  }

  const playerName = playerData.playerName ?? playerData.name;

  const player = new Player(
    playerData.id,
    playerName,
    playerData.teamId,
    playerData.teamName,
    playerData.position,
    playerData.nationality,
    playerData.age
  );
  group.players.push(player);
  return player;
}

export function removePlayerFromGroup(groupId, playerId) {
  const group = getGroupMem(groupId);
  if (!group || !playerId) {
    return null;
  }

  const idx = group.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return null;
  group.players.splice(idx, 1);
  return playerId;
}
