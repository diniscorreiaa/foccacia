import { Competition, Team, User } from "./domain-model.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

const INITIAL_COMPETITIONS = 3;

let nextId = 4;

const COMPETITIONS = [
  new Competition("PL", "Premier League"),
  new Competition("LL", "La Liga"),
  new Competition("PPL", "Primeira Liga"),
];

const TEAMS = [
  new Team("SL Benfica", "Portugal", [
    { playerName: "João Neves", position: "Midfielder" },
    { playerName: "Gonçalo Ramos", position: "Forward" },
  ]),
  new Team("SC Braga", "Portugal", [
    { playerName: "Ricardo Horta", position: "Forward" },
    { playerName: "Paulinho", position: "Midfielder" },
  ]),
  new Team("Vitória SC", "Portugal", [
    { playerName: "André Almeida", position: "Defender" },
    { playerName: "Óscar Estupiñán", position: "Forward" },
  ]),
];

const USERS = [];
const GROUPS = [];

export function getCompetitions() {
  return Promise.resolve(COMPETITIONS);
}
export function setCompetitions(competitions) {
  COMPETITIONS.length = 0; // Clear COMPETITIONS existing elements
  COMPETITIONS.push(...competitions); // Push to COMPETITIONS, competitions elements one by one
}

function createUser(name) {
  new User(nextId++, name, crypto.randomUUID());
}

export function addUser(user) {
  USERS.push(user);
  return user;
}

export function findUserByUsername(username) {
  return USERS.find((u) => u.username == username);
}

export function findUserByToken(token) {
  return USERS.find((u) => u.token == token);
}

export function getAllUsers() {
  return [...USERS];
}

export function addGroup(group) {
  GROUPS.push(group);
  return group;
}

export function getGroupById(groupId) {
  return GROUPS.find((g) => g.id === groupId);
}

export function getGroupsByUserId(userId) {
  return GROUPS.filter((g) => g.ownerUserId === userId);
}

export function updateGroup(updatedGroup) {
  const idx = GROUPS.findIndex((g) => g.id === updatedGroup.id);
  if (idx === -1) return null;
  GROUPS[idx] = updatedGroup;
  return updatedGroup;
}

export function deleteGroup(groupId) {
  const idx = GROUPS.findIndex((g) => g.id === groupId);
  if (idx === -1) return false;
  GROUPS.splice(idx, 1);
  return true;
}

// TODO: Apos implementar o domain-model, criar exemplos de dados e os funções para manipula-los
