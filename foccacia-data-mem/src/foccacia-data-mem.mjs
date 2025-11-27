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

const users = [],
  groups = [],
  USERS_CACHE_PATH = getUsersFilePath();

// USERS
// TODO : Tiago => read persisted users from file on startup
// TODO : Confirmar com Professor sendo o writeJson async todo depende dele tambem deve ser async?
function persistUsers() {
  writeJson(users, USERS_CACHE_PATH).catch((err) => {
    logError("Error writing users cache", err);
  });
}

export function createUserMem(username) {
  const user = new User(nextUserId++, username);
  users.push(user);
  persistUsers();
  return user;
}

export function getUserByTokenMem(token) {
  return users.find((u) => u.token === token) || null;
}

// GROUPS
// TODO : Tiago => Create groups persistence on file
// TODO : Tiago =>  read persisted groups from file on startup
export function createGroupMem(userId, name, description, competition, year) {
  const group = new Group(
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

export function listGroupsMem(userId) {
  return groups.filter((g) => g.ownerId === userId);
}

// TODO : Tiago => persist group changes on file
export function updateGroupMem(groupId, changes) {
  const group = groups.find((g) => g.id === groupId);
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

// TODO : Tiago => persist group deletion on file
export function deleteGroupMem(groupId) {
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx === -1) return false;
  groups.splice(idx, 1);
  return true;
}

export function getGroupMem(groupId) {
  return groups.find((g) => g.id === groupId) || null;
}

// GROUP PLAYERS
// TODO : Tiago => persist group players changes on file
export function addPlayerToGroupMem(groupId, playerData) {
  const group = getGroupMem(groupId);
  if (!group) {
    return null;
  }

  const player = new Player(
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
export function deletePlayerFromGroupMem(groupId, playerId) {
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
