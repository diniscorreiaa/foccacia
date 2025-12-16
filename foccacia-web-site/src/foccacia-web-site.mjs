import express from "express";

// TODO : Francisco => Fazer Routes dinâmicas
const ROUTES = {
  HOME: "/",
  COMPETITIONS: "/competitions",
  TEAMS: "/competitions/:competitionCode/seasons/:seasonYear/teams",
  USERS: "/users",
  GROUPS: "/groups",
  GROUP: "/groups/:groupId",
  GROUP_PLAYERS: "/groups/:groupId/players",
  GROUP_PLAYER: "/groups/:groupId/players/:playerId",
};

// TODO : ALL => Confirmar a necessidade de todos os parâmetros das funções

export function initWebSite({ services, dto, errors, utils }) {
  async function home(req, res) {
    res.render("home");
  }
  async function listCompetitions(req, res) {
    const competitions = await services.getCompetitions();

    // TODO: this is business logic, likely belongs in services. not gonna do it now not to cause conflicts
    const seasons = [];
    for (let i = new Date().getFullYear(); i >= 2000; i--) {
      seasons.push(i);
    }

    res.render("competitions", { competitions, seasons });
  }
  async function listTeams(req, res) {
    const teams = await services.getTeams({
      code: req.params.competitionCode,
      season: req.params.seasonYear,
    });
    res.render("teams", { teams });
  }
  async function listGroups(req, res) {
    /* TODO : Fransisco & Dinis */
  }
  async function showGroup(req, res) {
    /* TODO : Fransisco & Dinis */
  }
  async function showCreateGroupForm(req, res) {
    /* TODO : Fransisco & Dinis */
  }
  async function postCreateGroup(req, res) {
    /* TODO : Fransisco & Dinis */
  }

  const getTeams = (req, res) => {};
  const createUser = (req, res) => {};
  const getGroups = (req, res) => {};
  const createGroup = (req, res) => {};
  const getGroup = (req, res) => {};
  const updateGroup = (req, res) => {};
  const deleteGroup = (req, res) => {};
  const addPlayerToGroup = (req, res) => {};
  const deletePlayerFromGroup = (req, res) => {};

  const router = express.Router();

  //Rotas Públicas
  router.get(ROUTES.COMPETITIONS, listCompetitions);
  router.get(ROUTES.TEAMS, listTeams);
  router.post(ROUTES.USERS, createUser);

  // Middleware de Autenticação
  //router.use(verifyToken);

  // Rotas Privadas
  router.get(ROUTES.GROUPS, getGroups);
  router.get(ROUTES.GROUP, getGroup);
  router.post(ROUTES.GROUPS, createGroup);
  router.put(ROUTES.GROUP, updateGroup);
  router.delete(ROUTES.GROUP, deleteGroup);
  router.post(ROUTES.GROUP_PLAYERS, addPlayerToGroup);
  router.delete(ROUTES.GROUP_PLAYER, deletePlayerFromGroup);

  // Precisa estar em último
  router.get(ROUTES.HOME, home);

  return router;
}
