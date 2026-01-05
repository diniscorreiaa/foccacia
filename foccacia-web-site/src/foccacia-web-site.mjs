import express from "express";

const ROUTES = {
  HOME: "/",

  REGISTER: "/register",
  LOGIN: "/login",
  LOGOUT: "/logout",

  COMPETITIONS: "/competitions",
  TEAMS: "/competitions/:competitionCode/seasons/:seasonYear/teams",

  USERS: "/users",

  GROUPS: "/groups",
  GROUP: "/groups/:groupId",
  GROUP_UPDATE: "/groups/:groupId/update",
  GROUP_PLAYERS: "/groups/:groupId/players",
  GROUP_PLAYER: "/groups/:groupId/players/:playerId",
};

export function initWebSite({ services }) {
  function isAuthenticated(req) {
    if (typeof req.isAuthenticated === "function") return req.isAuthenticated();
    return !!req.user;
  }

  function redirectIfAuthenticated(req, res, next) {
    if (isAuthenticated(req)) return res.redirect(ROUTES.GROUPS);
    next();
  }

  function requireAuth(req, res, next) {
    if (!isAuthenticated(req) || !req.user?.id)
      return res.redirect(ROUTES.LOGIN);

    req.userId = req.user.id;
    next();
  }

  // ---------- PUBLIC ----------

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

  // ---------- AUTH (SSR) ----------

  async function showRegisterForm(req, res) {
    res.render("register");
  }

  async function register(req, res, next) {
    const user = await services.registerUser({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.redirect(ROUTES.GROUPS);
    });
  }

  async function showLoginForm(req, res) {
    res.render("login");
  }

  async function login(req, res, next) {
    const user = await services.validateCredentials({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.redirect(ROUTES.GROUPS);
    });
  }

  async function logout(req, res, next) {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect(ROUTES.HOME);
    });
  }

  // ---------- GROUPS (SSR, session-protected) ----------

  async function listGroups(req, res) {
    const competitions = await services.getCompetitions();

    const currentYear = new Date().getFullYear();
    const seasons = [];
    for (let year = 2023; year <= currentYear; year++) seasons.push(year);

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
    res.redirect(ROUTES.GROUPS);
  }

  async function deleteGroup(req, res) {
    await services.deleteGroup({
      userId: req.userId,
      groupId: req.params.groupId,
    });
    res.redirect(ROUTES.GROUPS);
  }

  async function updateGroup(req, res) {
    await services.updateGroup({
      userId: req.userId,
      groupId: req.params.groupId,
      changes: { name: req.body.name, description: req.body.description },
    });
    res.redirect(ROUTES.GROUPS);
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

  // Public routes

  router.get(ROUTES.HOME, home);
  router.get(ROUTES.COMPETITIONS, listCompetitions);
  router.get(ROUTES.TEAMS, listTeams);

  // Auth routes

  router.get(ROUTES.REGISTER, redirectIfAuthenticated, showRegisterForm);
  router.post(ROUTES.REGISTER, redirectIfAuthenticated, register);

  router.get(ROUTES.LOGIN, redirectIfAuthenticated, showLoginForm);
  router.post(ROUTES.LOGIN, redirectIfAuthenticated, login);

  router.post(ROUTES.LOGOUT, logout);

  // Legacy redirect (P2)

  router.get(ROUTES.USERS, (req, res) => res.redirect(ROUTES.REGISTER));
  router.post(ROUTES.USERS, (req, res) => res.redirect(ROUTES.REGISTER));

  // Private routes (require authentication)

  router.use(ROUTES.GROUPS, requireAuth);

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
