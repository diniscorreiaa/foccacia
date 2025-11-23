import { Group, Player, User } from "./domain-model.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

export { Competition, Team, Player, User, Group } from "./domain-model.mjs";

let nextUserId = 1,
  nextGroupId = 1;

// TODO: Micro-optimizations: Discuss an array is the best data structure here
const USERS = [],
  GROUPS = [];

// USERS
// TODO: Discuss the possibility of a MAP with user token as key and User object as value
export function createUserMem(username) {
  const user = new User(nextUserId++, username);
  USERS.push(user);
  return user;
}

export function findUserByToken(token) {
  return USERS.find((u) => u.token === token) || null;
}

export function getAllUsers() {
  return [...USERS];
}

// GROUPS
export function createGroup(userId, name, description, competition, year) {
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

export function listGroups(userId) {
  return GROUPS.filter((g) => g.ownerId === userId);
}

export function updateGroup(groupId, changes) {
  // changes is going to be obtained by filtering relevant properties from the group object received in the body
  // TODO : usar find em vez de filter
  const group = GROUPS.filter((g) => g.id === groupId);
  if (changes.name) group.name = changes.name;
  if (changes.description) group.description = changes.description;
  return group;
}

export function deleteGroup(groupId) {
  const idx = GROUPS.findIndex((g) => g.id === groupId);
  if (idx === -1) return false;
  GROUPS.splice(idx, 1);
  return true;
}

export function getGroup(groupId) {
  return GROUPS.find((g) => g.id === groupId) || null;
}

// GROUP PLAYERS
export function addPlayerToGroup(groupId, playerData) {
  // A mesma coisa da função update se aplica aqui para playerData
  const group = getGroup(groupId);
  if (!group) return null;

  const player = new Player(
    playerData.id,
    playerData.name,
    playerData.teamId,
    playerData.teamName
  );
  group.players.push(player);
  return player;
}

export function removePlayerFromGroup(groupId, playerId) {
  const group = getGroup(groupId);
  if (!group) return null;

  const idx = group.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return null;
  group.players.splice(idx, 1);
  return playerId;
}
