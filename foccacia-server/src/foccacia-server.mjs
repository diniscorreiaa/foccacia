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
  sendApplicationError,
  updateGroup,
  verifyToken,
} from "foccacia-web-api";
import errors from "foccacia-errors";

const PORT = 1904;

// TODO : Francisco => Make routes dynamic based on available resources
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
app.get(ROUTES.GROUP, getGroup);
app.post(ROUTES.GROUPS, createGroup);
app.put(ROUTES.GROUP, updateGroup);
app.delete(ROUTES.GROUP, deleteGroup);
app.post(ROUTES.GROUP_PLAYERS, addPlayerToGroup);
app.delete(ROUTES.GROUP_PLAYER, deletePlayerFromGroup);

// Quando nenhuma rota anterior corresponde ao pedido
app.use((req, res, next) => {
  next(errors.NOT_FOUND("Route not found"));
});

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
