import { logSuccess } from "foccacia-utils";
import express from "express";
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

app.get(GROUPS, verifyToken, getGroups);
app.post(GROUPS, verifyToken, createGroup);
app.get(GROUP, verifyToken, getGroup);
app.put(GROUP, verifyToken, replaceGroup);
app.delete(GROUP, verifyToken, deleteGroup);
app.post(GROUP_PLAYERS, verifyToken, addPlayerToGroup);
app.delete(GROUP_PLAYER, verifyToken, deletePlayerFromGroup);

/*app.use(verifyToken);
app.get(COMPETITIONS, getCompetitions);
app.get(COMPETITION, getCompetition);
app.get(TEAMS, getTeamsForCompetitionAndSeason);
Previous commit */

logSuccess(
  "FOCCACIA (Football Complete Clubs API and Chelas Internet Application) by Grupo 1 LEIC31D",
  ""
);

app.listen(PORT, () => logSuccess(`Server listening on port ${PORT}`, ""));

export function hello(name = "world") {
  return `hello ${name}`;
}
