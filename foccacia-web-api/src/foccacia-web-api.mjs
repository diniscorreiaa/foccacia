import { initDto } from "./foccacia-dto.mjs";

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

function getToken(request) {
  const auth = request.get("Authorization");
  if (!auth) return "";

  const [type, value] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !value) return "";
  return value;
}

export function initWebApi({ services, errors, utils }) {
  const dto = initDto();

  async function genericApiRoute(
    request,
    response,
    {
      servicesFunc,
      transformObj = (obj) => obj,
      servicesFuncArgs = {},
      statusCode = 200,
    } = {}
  ) {
    if (statusCode < 200 || statusCode > 299)
      console.log("TEMP: Status code inválido.");
    const obj = await servicesFunc(servicesFuncArgs);
    const size = Array.isArray(obj) ? obj.length : 1;

    utils.logInfo(
      `API: responding with ${size} item(s) for path ${request.path}`,
      ""
    );
    response.status(statusCode).json(transformObj(obj));
  }

  const verifyToken = async (request, response, next) => {
    const token = getToken(request);
    if (!token) {
      throw errors.UNAUTHORIZED("Missing or invalid Bearer token");
    }

    const userId = await services.getUserIdFromToken({ token });
    request.token = token;
    request.userId = userId;

    utils.logInfo(
      `Request authorized for user ${userId} ${request.method} ${request.path}`,
      ""
    );

    next();
  };

  const getCompetitions = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.getCompetitions,
      transformObj: (competitions) => competitions.map(dto.competitionToDto),
    });

  const getTeams = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.getTeams,
      servicesFuncArgs: {
        code: request.params.competitionCode,
        season: request.params.seasonYear,
      },
      transformObj: (teamsArr) => teamsArr.map(dto.teamToDto),
    });

  const createUser = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.createUser,
      servicesFuncArgs: { username: request.body?.username },
      statusCode: 201,
      transformObj: dto.userToDto,
    });

  const getGroups = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.getGroups,
      servicesFuncArgs: { userId: request.userId },
      transformObj: (groups) => groups.map(dto.groupToDto),
    });

  const createGroup = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.createGroup,
      servicesFuncArgs: {
        userId: request.userId,
        name: request.body.name,
        description: request.body.description,
        competition: request.body.competition,
        year: request.body.year,
      },
      transformObj: dto.groupToDto,
      statusCode: 201,
    });

  const getGroup = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.getGroup,
      servicesFuncArgs: {
        userId: request.userId,
        groupId: request.params.groupId,
      },
      transformObj: dto.groupToDto,
    });

  const updateGroup = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.updateGroup,
      servicesFuncArgs: {
        userId: request.userId,
        groupId: request.params.groupId,
        changes: request.body,
      },
      transformObj: dto.groupToDto,
    });

  const deleteGroup = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.deleteGroup,
      servicesFuncArgs: {
        userId: request.userId,
        groupId: request.params.groupId,
      },
      statusCode: 204,
    });

  const addPlayerToGroup = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.addPlayerToGroup,
      servicesFuncArgs: {
        userId: request.userId,
        groupId: request.params.groupId,
        playerData: request.body,
      },
      transformObj: dto.playerToGroupDto,
    });

  const deletePlayerFromGroup = async (request, response) =>
    await genericApiRoute(request, response, {
      servicesFunc: services.deletePlayerFromGroup,
      servicesFuncArgs: {
        userId: request.userId,
        groupId: request.params.groupId,
        playerId: request.params.playerId,
      },
      statusCode: 204,
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
