import express from "express";
import { logSuccess } from "foccacia-utils";
import {
  addPlayerToGroup,
  createGroup,
  createUser,
  deleteGroup,
  deletePlayerFromGroup,
  getCompetitions,
  getGroup,
  getGroups,
  getTeams,
  replaceGroup,
  sendApplicationError,
  verifyToken,
} from "foccacia-web-api";

const PORT = 1904;

const COMPETITIONS = "/competitions"; // Se aqui houver algum problema, é pq antes tinha /api/
const TEAMS = `${COMPETITIONS}/:competitionCode/seasons/:seasonYear/teams`;
const USERS = "/users";
const GROUPS = "/groups";
const GROUP = `${GROUPS}/:groupId`;
const GROUP_PLAYERS = `${GROUPS}/:groupId/player`;
const GROUP_PLAYER = `${GROUP_PLAYERS}/:playerId`;

const app = express();

app.use(express.json());

app.get(COMPETITIONS, getCompetitions);
app.get(TEAMS, getTeams);
app.post(USERS, createUser);

app.use(verifyToken);

app.get(GROUPS, getGroups);
app.post(GROUPS, createGroup);
app.get(GROUP, getGroup);
app.put(GROUP, replaceGroup);
app.delete(GROUP, deleteGroup);
app.post(GROUP_PLAYERS, addPlayerToGroup);
app.delete(GROUP_PLAYER, deletePlayerFromGroup);

// error handler no fim
app.use(sendApplicationError);

logSuccess(
  "FOCCACIA (Football Complete Clubs API and Chelas Internet Application) by Grupo 1 LEIC31D",
  ""
);

app.listen(PORT, () => logSuccess(`Server listening on port ${PORT}`, ""));

export function hello(name = "world") {
  return `hello ${name}`;
}
