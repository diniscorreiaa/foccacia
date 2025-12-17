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
  async function insertDummyToken(req, res, next) {
    const token = "a42bc68d-23b0-40e7-a621-f85a87c627c6";
    const userId = await services.getUserIdFromToken(token);
    req.token = token;
    req.userId = userId;

    next();
  }
  async function home(req, res) {
    res.render("home");
  }

  async function getAvailableSeasons(code) {
    const seasons = await services.getSeasonYears(code);
    if (!seasons) {
      return [];
    }
    return seasons;
  }

  async function listCompetitions(req, res) {
    const competitions = await services.getCompetitions();
    // TODO: this is business logic, likely belongs in services. not gonna do it now not to cause conflicts
    for (const competition of competitions) {
      const seasons = await getAvailableSeasons(competition.code);
      competitions.competition = { ...competition, seasons };
    }
    console.log(competitions);
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
    console.log(req.body);
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

  const router = express.Router();

  router.get(ROUTES.HOME, home);

  //Rotas Públicas
  router.get(ROUTES.COMPETITIONS, listCompetitions);
  router.get(ROUTES.TEAMS, listTeams);
  //router.post(ROUTES.USERS, createUser);

  // Middleware de Autenticação
  router.use(insertDummyToken);

  // Rotas Privadas
  router.get(ROUTES.GROUPS, listGroups);
  router.get(ROUTES.GROUP, showGroup);
  router.post(ROUTES.GROUPS, showCreateGroupForm);
  router.post(ROUTES.GROUP_UPDATE, showUpdateGroupForm); // PUT
  router.post(ROUTES.GROUP, showDeleteGroupForm); // DELETE
  /*
  router.post(ROUTES.GROUP_PLAYERS, addPlayerToGroup);
  router.post(ROUTES.GROUP_PLAYER, deletePlayerFromGroup); // DELETE
*/

  return router;
}
