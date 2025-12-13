import express from "express/lib/express.js";

const ROUTES = {
  COMPETITIONS: "/competitions",
  TEAMS: "/competitions/:competitionCode/seasons/:seasonYear/teams",
  USERS: "/users",
  GROUPS: "/groups",
  GROUP: "/groups/:groupId",
  GROUP_PLAYERS: "/groups/:groupId/players",
  GROUP_PLAYER: "/groups/:groupId/players/:playerId",
};

export function initWebSite({ services, dto, errors, utils }) {
  async function home(req, res) {
    /* TODO : Fransisco & Dinis */
  }
  async function listCompetitions(req, res) {
    /* TODO : Fransisco & Dinis */
  }
  async function listTeams(req, res) {
    /* TODO : Fransisco & Dinis */
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

  const getCompetitions = (req, res) => {};
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
  router.get(ROUTES.COMPETITIONS, getCompetitions);
  router.get(ROUTES.TEAMS, getTeams);
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

  return router;
}
