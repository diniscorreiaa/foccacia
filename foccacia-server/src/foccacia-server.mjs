import { createFoccaciaApp } from "./foccacia-module-resolver.mjs";

const { app, api, errors, sendApplicationError, utils } = createFoccaciaApp();

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

//Rotas Públicas
app.get(ROUTES.COMPETITIONS, api.getCompetitions);
app.get(ROUTES.TEAMS, api.getTeams);
app.post(ROUTES.USERS, api.createUser);

// Middleware de Autenticação
app.use(api.verifyToken);

// Rotas Privadas
app.get(ROUTES.GROUPS, api.getGroups);
app.get(ROUTES.GROUP, api.getGroup);
app.post(ROUTES.GROUPS, api.createGroup);
app.put(ROUTES.GROUP, api.updateGroup);
app.delete(ROUTES.GROUP, api.deleteGroup);
app.post(ROUTES.GROUP_PLAYERS, api.addPlayerToGroup);
app.delete(ROUTES.GROUP_PLAYER, api.deletePlayerFromGroup);

// Quando nenhuma rota anterior corresponde ao pedido
app.use((req, res, next) => {
  next(errors.NOT_FOUND("Route not found"));
});

// Error Handling Middleware
app.use(sendApplicationError);

utils.logSuccess(
  "FOCCACIA (Football Complete Clubs API and Chelas Internet Application) by Grupo 1 LEIC31D",
  ""
);

app.listen(PORT, () =>
  utils.logSuccess(`Server listening on port ${PORT}`, "")
);
