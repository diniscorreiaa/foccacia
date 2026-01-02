import express from "express";

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

export function initWebSite({ services, errors }) {
  let userInfo = {};

  function insertToken(req, res, next) {
    if (!userInfo?.id || !userInfo?.token || !userInfo?.username) {
      throw errors.UNAUTHORIZED(
        "You must create a user before using this page"
      );
    }
    req.userId = userInfo.id;
    req.token = userInfo.token;
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

  async function showCreateUserForm(req, res) {
    res.render("create-user-form");
  }

  async function createUser(req, res) {
    userInfo = await services.createUser({ username: req.body.username });
    res.redirect("/");
  }

  // TODO : Francisco & Dinis => Apenas competitions validas usar getCompetitionsWeb que ja tem as competitions validas
  async function listGroups(req, res) {
    const competitions = await services.getCompetitions();

    const currentYear = new Date().getFullYear();
    const seasons = Array.from(
      { length: currentYear - 1999 },
      (_, i) => currentYear - i
    );

    const groups = await services.getGroups({ userId: req.userId });
    res.render("groups", { groups, competitions, seasons });
  }

  async function showGroup(req, res) {
    const group = await services.getGroup({
      userId: req.userId,
      groupId: req.params.groupId,
    });
    res.render("group-detail", { group });
  }

  async function createGroup(req, res) {
    await services.createGroup({
      userId: req.userId,
      name: req.body.name,
      description: req.body.description,
      competition: req.body.competitions,
      year: req.body.seasons,
    });
    res.redirect("/groups");
  }

  async function deleteGroup(req, res) {
    await services.deleteGroup({
      userId: req.userId,
      groupId: req.params.groupId, // from URL
    });
    res.redirect("/groups");
  }

  async function updateGroup(req, res) {
    await services.updateGroup({
      userId: req.userId,
      groupId: req.params.groupId, // from URL
      changes: { name: req.body.name, description: req.body.description },
    });
    res.redirect("/groups");
  }

  async function showPlayers(req, res) {
    const group = await services.getGroup({
      userId: req.userId,
      groupId: req.params.groupId,
    });

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

  const router = express.Router();

  router.get(ROUTES.HOME, home);
  router.get(ROUTES.COMPETITIONS, listCompetitions);
  router.get(ROUTES.TEAMS, listTeams);

  router.get(ROUTES.USERS, showCreateUserForm);
  router.post(ROUTES.USERS, createUser);

  // Middleware de Autenticação
  router.use(insertToken);

  // Rotas Privadas
  router.get(ROUTES.GROUPS, listGroups);
  router.get(ROUTES.GROUP, showGroup);

  router.post(ROUTES.GROUPS, createGroup);
  router.post(ROUTES.GROUP_UPDATE, updateGroup);
  router.post(ROUTES.GROUP, deleteGroup);

  router.get(ROUTES.GROUP_PLAYERS, showPlayers);
  router.post(ROUTES.GROUP_PLAYERS, addPlayerToGroup);
  router.post(ROUTES.GROUP_PLAYER, deletePlayerFromGroup);

  return router;
}
