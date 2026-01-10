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

  function renderView(req, res, view, model = {}) {
    res.render(view, { ...model, user: req.user ?? null });
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
    renderView(req, res, "home");
  }

  async function listCompetitions(req, res) {
    const competitions = await services.getCompetitionsWeb();
    renderView(req, res, "competitions", { competitions });
  }

  async function listTeams(req, res) {
    const teams = await services.getTeams({
      code: req.params.competitionCode,
      season: req.params.seasonYear,
    });
    renderView(req, res, "teams", { teams });
  }

  // ---------- AUTH (SSR) ----------

  async function showRegisterForm(req, res) {
    renderView(req, res, "register");
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
    renderView(req, res, "login");
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
    const competitionsRaw = await services.getCompetitions();

    const selectedCompetition =
      (req.query?.competition && String(req.query.competition)) ||
      (competitionsRaw[0] ? competitionsRaw[0].code : null);

    const seasons =
      selectedCompetition != null
        ? await services.getSeasonYears({ code: selectedCompetition })
        : [];

    const competitions = competitionsRaw.map((competition) => ({
      code: competition.code,
      name: competition.name,
      selected:
        selectedCompetition != null && competition.code === selectedCompetition,
    }));

    const groups = await services.getGroups({ userId: req.userId });

    res.render("groups", {
      groups,
      competitions,
      seasons,
      selectedCompetition,
    });
  }

  async function showGroup(req, res) {
    const group = await services.getGroup({
      userId: req.userId,
      groupId: req.params.groupId,
    });
    renderView(req, res, "group-detail", { group });
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

    const allTeams = await services.getTeams({
      code: group.competition,
      season: group.year,
    });

    const requestedTeamId = req.query.teamId ? String(req.query.teamId) : null;

    const defaultTeamId = allTeams.length > 0 ? String(allTeams[0].id) : null;

    const selectedTeamId = requestedTeamId ?? defaultTeamId;

    const selectedTeam =
      selectedTeamId != null
        ? allTeams.find((team) => String(team.id) === selectedTeamId) ?? null
        : null;

    const teamOptions = allTeams.map((team) => ({
      id: team.id,
      name: team.teamName,
      selected:
        selectedTeamId != null && String(team.id) === String(selectedTeamId),
    }));

    const teams = selectedTeam ? [selectedTeam] : [];

    renderView(req, res, "addPlayers", {
      group,
      teamOptions,
      teams,
    });
  }

  async function addPlayerToGroup(req, res) {
    await services.addPlayerToGroup({
      userId: req.userId,
      groupId: req.params.groupId,
      playerData: {
        playerId: req.body.playerId,
        playerName: req.body.playerName,
        teamCode: req.body.playerTeamCode,
        teamName: req.body.playerTeamName
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

  // Legacy redirects for /users to /register

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
