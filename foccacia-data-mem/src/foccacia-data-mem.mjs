import { Group, User } from "./domain-model.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

let nextUserId = 1;
let nextGroupId = 1;

const USERS = [];
const GROUPS = [];

// Users

export function createUser(username, token) {
  const user = new User(nextUserId++, username, token);
  USERS.push(user);
  return user;
}

export function findUserByUsername(username) {
  return USERS.find((u) => u.username === username) || null;
}

export function findUserByToken(token) {
  return USERS.find((u) => u.token === token) || null;
}

export function getAllUsers() {
  return [...USERS];
}

// Groups

export function createGroup(
  name,
  ownerUserId,
  description,
  competitionCode,
  season
) {
  const group = new Group(
    nextGroupId++,
    name,
    ownerUserId,
    description,
    competitionCode,
    season,
    []
  );
  GROUPS.push(group);
  return group;
}

export function getGroupById(id) {
  return GROUPS.find((g) => g.id === id) || null;
}

export function getGroupsByUser(ownerUserId) {
  return GROUPS.filter((g) => g.ownerUserId === ownerUserId);
}

export function updateGroup(group) {
  const idx = GROUPS.findIndex((g) => g.id === group.id);
  if (idx === -1) return null;
  GROUPS[idx] = group;
  return group;
}

export function deleteGroup(id) {
  const idx = GROUPS.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  GROUPS.splice(idx, 1);
  return true;
}

// TODO: Apos implementar o domain-model, criar exemplos de dados e os funções para manipula-los

export function getCompetitions() {
  return Promise.resolve(COMPETITIONS);
}
