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

const ROUTES = {
  COMPETITIONS: "/competitions",
  TEAMS: "/competitions/:competitionCode/seasons/:seasonYear/teams",
  USERS: "/users",
  GROUPS: "/groups",
  GROUP: "/groups/:groupId",
  GROUP_PLAYERS: "/groups/:groupId/players",
  GROUP_PLAYER: "/groups/:groupId/players/:playerId",
};

const app = express();
app.use(express.json());

//Rotas Públicas
app.get(ROUTES.COMPETITIONS, getCompetitions);
app.get(ROUTES.TEAMS, getTeams);
app.post(ROUTES.USERS, createUser);

// Middleware de Autenticação
app.use(verifyToken);

// Rotas Privadas
app.get(ROUTES.GROUPS, getGroups);
app.post(ROUTES.GROUPS, createGroup);
app.get(ROUTES.GROUP, getGroup);
app.put(ROUTES.GROUP, replaceGroup);
app.delete(ROUTES.GROUP, deleteGroup);
app.post(ROUTES.GROUP_PLAYERS, addPlayerToGroup);
app.delete(ROUTES.GROUP_PLAYER, deletePlayerFromGroup);

// Error Handling Middleware
app.use(sendApplicationError);

logSuccess(
  "FOCCACIA (Football Complete Clubs API and Chelas Internet Application) by Grupo 1 LEIC31D",
  ""
);

app.listen(PORT, () => logSuccess(`Server listening on port ${PORT}`, ""));

export function hello(name = "world") {
  return `hello ${name}`;
}
