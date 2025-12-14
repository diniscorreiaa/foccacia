import express from "express";

const ROUTES = {
  COMPETITIONS: "/competitions",
  TEAMS: "/competitions/:competitionCode/seasons/:seasonYear/teams",
  USERS: "/users",
  GROUPS: "/groups",
  GROUP: "/groups/:groupId",
  GROUP_PLAYERS: "/groups/:groupId/players",
  GROUP_PLAYER: "/groups/:groupId/players/:playerId",
};

// TODO : TIAGO => Verificar as calls a funcoes async que nao estao a usar await
const wrapAsync = (fn) => (request, response, next) =>
  Promise.resolve(fn(request, response, next)).catch(next);

async function getToken(request) {
  const auth = await request.get("Authorization");
  if (!auth) return "";

  const [type, value] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !value) return "";
  return value;
}

export function initWebApi({ services, dto, errors, utils }) {
  async function genericApiRoute(
    request,
    response,
    servicesFunc,
    { transformObj = (obj) => obj, servicesFuncArgs = [] } = {}
  ) {
    const obj = await servicesFunc(...servicesFuncArgs);
    const size = Array.isArray(obj) ? obj.length : 1;

    utils.logInfo(
      `API: responding with ${size} item(s) for path ${request.path}`,
      ""
    );
    response.json(transformObj(obj));
  }

  // TODO : ALL => Em modular ainda mais as funcoes para evitar duplicacao de codigo, os middlewares, etc, podem ser chamados no return para nao contaminar visualmente as funcoes
  const verifyToken = wrapAsync(async (request, response, next) => {
    const token = await getToken(request);
    if (!token) {
      throw errors.UNAUTHORIZED("Missing or invalid Bearer token");
    }

    const userId = await services.getUserIdFromToken(token);
    request.token = token;
    request.userId = userId;
    utils.logInfo(
      `Request authorized for user ${userId} ${request.method} ${request.path}`,
      ""
    );

    next();
  });

  // Competitions
  const getCompetitions = wrapAsync((request, response) =>
    genericApiRoute(request, response, services.getCompetitions)
  );

  // Teams
  const getTeams = wrapAsync((request, response) =>
    genericApiRoute(request, response, services.getTeams, {
      servicesFuncArgs: [
        request.params.competitionCode,
        request.params.seasonYear,
      ],
      transformObj: (teamsArr) => teamsArr.map(dto.teamToDto),
    })
  );

  // Users
  const createUser = wrapAsync(async (req, res) => {
    const username = req.body?.username;
    const user = await services.createUser(username);
    return res.status(201).json(dto.userToDto(user));
  });

  // Groups
  const getGroups = wrapAsync((req, res) =>
    genericApiRoute(req, res, services.getGroups, {
      servicesFuncArgs: [req.userId],
      transformObj: (groups) => groups.map(dto.groupToDto),
    })
  );

  const createGroup = wrapAsync(async (req, res) => {
    const { name, description, competition, year } = req.body ?? {};
    const group = await services.createGroup({
      userId: req.userId,
      name,
      description,
      competition,
      year,
    });
    return res.status(201).json(dto.groupToDto(group));
  });

  const getGroup = wrapAsync((req, res) =>
    genericApiRoute(req, res, services.getGroup, {
      servicesFuncArgs: [req.userId, req.params.groupId],
      transformObj: dto.groupToDto,
    })
  );

  const updateGroup = wrapAsync((req, res) => {
    const { name, description } = req.body ?? {};
    return genericApiRoute(req, res, services.updateGroup, {
      servicesFuncArgs: [req.userId, req.params.groupId, { name, description }],
      transformObj: dto.groupToDto,
    });
  });

  const deleteGroup = wrapAsync(async (req, res) => {
    const result = await services.deleteGroup(req.userId, req.params.groupId);
    if (!result) {
      throw errors.UNEXPECTED("Unexpected internal error");
    }
    return res.sendStatus(204);
  });

  const addPlayerToGroup = wrapAsync((req, res) =>
    genericApiRoute(req, res, services.addPlayerToGroup, {
      servicesFuncArgs: [req.userId, req.params.groupId, req.body],
      transformObj: dto.playerToGroupDto,
    })
  );

  // TODO : Tiago => Verificar se o deletePlayerFromGroup deve ser async
  const deletePlayerFromGroup = wrapAsync(async (req, res) => {
    const result = await services.deletePlayerFromGroup(
      req.userId,
      req.params.groupId,
      req.params.playerId
    );
    if (!result) {
      throw errors.UNEXPECTED("Unexpected internal error");
    }
    return res.sendStatus(204);
  });

  // TODO : Francisco => warpers before return to clean functions
  const router = express.Router();

  //Rotas Públicas
  router.get(ROUTES.COMPETITIONS, getCompetitions);
  router.get(ROUTES.TEAMS, getTeams);
  router.post(ROUTES.USERS, createUser);

  // Middleware de Autenticação
  router.use(verifyToken);

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

// TODO : ALL => Exemplo de modularizacao das funcoes em vez cada uma ter o wrapAsync, fazer o wrap aqui no return
