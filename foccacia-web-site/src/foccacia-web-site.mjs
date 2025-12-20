import express from "express";

// TODO : Francisco => Fazer Routes dinâmicas
const ROUTES = {
  HOME: "/",
  COMPETITIONS: "/competitions",
  TEAMS: "/competitions/:competitionCode/seasons/:seasonYear/teams",
  USERS: "/users",
  GROUPS: "/groups",
  GROUP: "/groups/:groupId",
  GROUP_UPDATE: "/groups/:groupId/update",
  GROUP_PLAYERS: "/groups/:groupId/players",
  GROUP_PLAYER: "/groups/:groupId/players/:playerId",
};

// TODO : ALL => Confirmar a necessidade de todos os parâmetros das funções

export function initWebSite({ services, dto, errors, utils }) {
  let userInfo = {};

  async function insertToken(req, res, next) {
    if (userInfo.id && userInfo.token && userInfo.username) {
      req.userId = userInfo.id;
      req.token = userInfo.token;
    }

    next();
  }

  async function home(req, res) {
    res.render("home");
  }

  async function listCompetitions(req, res) {
    const competitions = await services.getCompetitionsWeb();
    res.render("competitions", { competitions });
  }

  async function listTeams(req, res) {
    const teams = await services.getTeams({
      code: req.params.competitionCode,
      season: req.params.seasonYear,
    });
    res.render("teams", { teams });
  }
  async function listGroups(req, res) {
    const competitions = await services.getCompetitions();
    const seasons = [];
    for (let i = new Date().getFullYear(); i >= 2000; i--) {
      seasons.push(i);
    }
    const groups = await services.getGroups(req.userId);
    res.render("groups", { groups, competitions, seasons });
  }
  async function showGroup(req, res) {
    const groupId = req.params.groupId;
    const group = await services.getGroup({ userId: req.userId, groupId });
    res.render("group-detail", { group });
  }
  async function showCreateGroupForm(req, res) {
    await services.createGroup({
      userId: req.userId,
      name: req.body.name,
      description: req.body.description,
      competition: req.body.competitions,
      year: req.body.seasons,
    });
    res.redirect("/groups");
  }
  async function postCreateGroup(req, res) {
    /* TODO : Fransisco & Dinis */
  }

  async function showDeleteGroupForm(req, res) {
    await services.deleteGroup({
      userId: req.userId,
      groupId: req.body.groupId,
    });
    res.redirect("/groups");
  }

  async function showUpdateGroupForm(req, res) {
    await services.updateGroup({
      userId: req.userId,
      groupId: req.body.groupId,
      changes: {
        name: req.body.name,
        description: req.body.description,
      },
    });
    res.redirect("/groups");
  }

  async function showPlayers(req, res) {
    const groupId = req.params.groupId;
    const group = await services.getGroup({ userId: req.userId, groupId });
    const teams = await services.getTeams({
      code: group.competition,
      season: group.year,
    });
    res.render("addPlayers", { group, teams });
  }

  async function addPlayerToGroup(req, res) {
    await services.addPlayerToGroup({
      userId: req.userId,
      groupId: req.params.groupId,
      playerData: {
        playerId: req.body.playerId,
        playerName: req.body.playerName,
        teamId: req.body.playerTeamId,
        teamCode: req.body.playerTeamCode,
        teamName: req.body.playerTeamName,
        position: req.body.playerPosition,
        nationality: req.body.playerNationality,
        age: req.body.playerAge,
      },
    });
    res.redirect(`/groups/${req.params.groupId}/players`);
  }

  async function deletePlayerFromGroup(req, res) {
    await services.deletePlayerFromGroup({
      userId: req.userId,
      groupId: req.params.groupId,
      playerId: req.params.playerId,
    });
    res.redirect(`/groups/${req.params.groupId}`);
  }

  async function showCreateUserForm(req, res) {
    res.render("create-user-form");
  }

  async function createUser(req, res) {
    const username = req.body.username;
    userInfo = await services.createUser(username);
    res.redirect("/");
  }

  const router = express.Router();

  router.get(ROUTES.HOME, home);

  //Rotas Públicas
  router.get(ROUTES.COMPETITIONS, listCompetitions);
  router.get(ROUTES.TEAMS, listTeams);

  router.get(ROUTES.USERS, showCreateUserForm);
  router.post(ROUTES.USERS, createUser);

  // Middleware de Autenticação
  router.use(insertToken);

  // Rotas Privadas
  router.get(ROUTES.GROUPS, listGroups);
  router.get(ROUTES.GROUP, showGroup);
  router.post(ROUTES.GROUPS, showCreateGroupForm);
  router.post(ROUTES.GROUP_UPDATE, showUpdateGroupForm); // PUT
  router.post(ROUTES.GROUP, showDeleteGroupForm); // DELETE
  router.get(ROUTES.GROUP_PLAYERS, showPlayers);
  router.post(ROUTES.GROUP_PLAYERS, addPlayerToGroup);
  router.post(ROUTES.GROUP_PLAYER, deletePlayerFromGroup); // DELETE

  return router;
}
