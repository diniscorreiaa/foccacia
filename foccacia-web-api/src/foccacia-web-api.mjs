import express from "express";

// TODO : Francisco => Fazer Routes dinâmicas
const ROUTES = {
  COMPETITIONS: "/competitions",
  TEAMS: "/competitions/:competitionCode/seasons/:seasonYear/teams",
  USERS: "/users",
  GROUPS: "/groups",
  GROUP: "/groups/:groupId",
  GROUP_PLAYERS: "/groups/:groupId/players",
  GROUP_PLAYER: "/groups/:groupId/players/:playerId",
};

// TODO : TIAGO => Verificar as calls a funções async que nao estao a usar await
// TODO : ALL => Refatorar para evitar duplicação de código, melhorar e modular
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

  // TODO : Tiago => Sem get seasons
  const getCompetitions = wrapAsync((request, response) =>
    genericApiRoute(request, response, services.getCompetitions, {
      transformObj: (competitions) => competitions.map(dto.competitionToDto),
    })
  );

  const getTeams = wrapAsync((request, response) =>
    genericApiRoute(request, response, services.getTeams, {
      servicesFuncArgs: [
        {
          code: request.params.competitionCode,
          season: request.params.seasonYear,
        },
      ],
      transformObj: (teamsArr) => teamsArr.map(dto.teamToDto),
    })
  );

  const createUser = wrapAsync(async (request, response) => {
    const username = request.body?.username;
    const user = await services.createUser(username);
    return response.status(201).json(dto.userToDto(user));
  });

  const getGroups = wrapAsync((request, response) =>
    genericApiRoute(request, response, services.getGroups, {
      servicesFuncArgs: [request.userId],
      transformObj: (groups) => groups.map(dto.groupToDto),
    })
  );

  const createGroup = wrapAsync(async (request, response) => {
    const { name, description, competition, year } = request.body ?? {};
    const group = await services.createGroup({
      userId: request.userId,
      name,
      description,
      competition,
      year,
    });
    return response.status(201).json(dto.groupToDto(group));
  });

  const getGroup = wrapAsync((request, response) =>
    genericApiRoute(request, response, services.getGroup, {
      servicesFuncArgs: [
        { userId: request.userId, groupId: request.params.groupId },
      ],
      transformObj: dto.groupToDto,
    })
  );

  const updateGroup = wrapAsync((request, response) => {
    const { name, description } = request.body ?? {};
    return genericApiRoute(request, response, services.updateGroup, {
      servicesFuncArgs: [
        {
          userId: request.userId,
          groupId: request.params.groupId,
          changes: request.body,
        },
      ],
      transformObj: dto.groupToDto,
    });
  });

  const deleteGroup = wrapAsync(async (request, response) => {
    const result = await services.deleteGroup({
      userId: request.userId,
      groupId: request.params.groupId,
    });
    if (!result) {
      throw errors.UNEXPECTED("Unexpected internal error");
    }
    return response.sendStatus(204);
  });

  const addPlayerToGroup = wrapAsync((request, response) =>
    genericApiRoute(request, response, services.addPlayerToGroup, {
      servicesFuncArgs: [
        {
          userId: request.userId,
          groupId: request.params.groupId,
          playerData: request.body,
        },
      ],
      transformObj: dto.playerToGroupDto,
    })
  );

  const deletePlayerFromGroup = wrapAsync(async (request, response) => {
    const result = await services.deletePlayerFromGroup({
      userId: request.userId,
      groupId: request.params.groupId,
      playerId: request.params.playerId,
    });
    if (!result) {
      throw errors.UNEXPECTED("Unexpected internal error");
    }
    return response.sendStatus(204);
  });

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
