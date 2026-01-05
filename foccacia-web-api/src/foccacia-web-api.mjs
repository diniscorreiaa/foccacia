import { initDto } from "./foccacia-dto.mjs";

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

const DEFAULT_ROUTE_STATUS_CODE = 200;

function getToken(request) {
  const auth = request.get("Authorization");
  if (!auth) return "";

  const [type, value] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !value) return "";
  return value;
}

export function initWebApi({ services, errors, utils }) {
  const dto = initDto();

  const routesConfig = {
    getCompetitions: () => ({
      servicesFunction: services.getCompetitions,
      dtoApply: (competitions) => competitions.map(dto.competitionToDto),
    }),
    getTeams: (request) => ({
      servicesFunction: services.getTeams,
      parametersToServicesFunction: {
        code: request.params.competitionCode,
        season: request.params.seasonYear,
      },
      dtoApply: (teams) => teams.map(dto.teamToDto),
    }),
    createUser: (request) => ({
      servicesFunction: services.createUser,
      parametersToServicesFunction: { username: request.body?.username },
      statusCode: 201,
      dtoApply: dto.userToDto,
    }),
    getGroups: (request) => ({
      servicesFunction: services.getGroups,
      parametersToServicesFunction: { userId: request.userId },
      dtoApply: (groups) => groups.map(dto.groupToDto),
    }),
    createGroup: (request) => ({
      servicesFunction: services.createGroup,
      parametersToServicesFunction: {
        userId: request.userId,
        name: request.body.name,
        description: request.body.description,
        competition: request.body.competition,
        year: request.body.year,
      },
      dtoApply: dto.groupToDto,
      statusCode: 201,
    }),
    getGroup: (request) => ({
      servicesFunction: services.getGroup,
      parametersToServicesFunction: {
        userId: request.userId,
        groupId: request.params.groupId,
      },
      dtoApply: dto.groupToDto,
    }),
    updateGroup: (request) => ({
      servicesFunction: services.updateGroup,
      parametersToServicesFunction: {
        userId: request.userId,
        groupId: request.params.groupId,
        changes: request.body,
      },
      dtoApply: dto.groupToDto,
    }),
    deleteGroup: (request) => ({
      servicesFunction: services.deleteGroup,
      parametersToServicesFunction: {
        userId: request.userId,
        groupId: request.params.groupId,
      },
      statusCode: 204,
    }),
    addPlayerToGroup: (request) => ({
      servicesFunction: services.addPlayerToGroup,
      parametersToServicesFunction: {
        userId: request.userId,
        groupId: request.params.groupId,
        playerData: request.body,
      },
      dtoApply: dto.playerToGroupDto,
    }),
    deletePlayerFromGroup: (request) => ({
      servicesFunction: services.deletePlayerFromGroup,
      parametersToServicesFunction: {
        userId: request.userId,
        groupId: request.params.groupId,
        playerId: request.params.playerId,
      },
      statusCode: 204,
    }),
  };

  async function genericApiRoute(
    request,
    response,
    {
      servicesFunction,
      dtoApply = (servicesFunctionReturn) => servicesFunctionReturn,
      parametersToServicesFunction = {},
      statusCode = DEFAULT_ROUTE_STATUS_CODE,
    } = {}
  ) {
    if (statusCode < 200 || statusCode > 299)
      throw errors.NOT_IMPLEMENTED("Not Implemented");

    const servicesReturn = await servicesFunction(parametersToServicesFunction);

    if (statusCode === 204) {
      return response.status(204).end();
    }

    const size = Array.isArray(servicesReturn) ? servicesReturn.length : 1;

    utils.logInfo(
      `API: responding with ${size} item(s) for path ${request.path}`,
      ""
    );
    response.status(statusCode).json(dtoApply(servicesReturn));
  }

  const verifySessionOrToken = async (request, response, next) => {
    if (request.user?.id) {
      request.userId = request.user.id;

      utils.logInfo(
        `Request authorized (session) for user ${request.userId} ${request.method} ${request.path}`,
        ""
      );

      return next();
    }

    const token = getToken(request);
    if (!token) {
      throw errors.UNAUTHORIZED(
        "Missing authentication (session or Bearer token)"
      );
    }

    const userId = await services.getUserIdFromToken({ token });
    request.token = token;
    request.userId = userId;

    utils.logInfo(
      `Request authorized (token) for user ${userId} ${request.method} ${request.path}`,
      ""
    );

    next();
  };

  const routesCallbacks = {};
  for (const [methodName, getObjParams] of Object.entries(routesConfig)) {
    routesCallbacks[methodName] = async function (request, response) {
      const objParams = getObjParams(request);
      await genericApiRoute(request, response, objParams);
    };
  }

  const router = express.Router();

  // Rotas Públicas
  router.get(ROUTES.COMPETITIONS, routesCallbacks.getCompetitions);
  router.get(ROUTES.TEAMS, routesCallbacks.getTeams);
  router.post(ROUTES.USERS, routesCallbacks.createUser);

  // Middleware de Autenticação (sessão ou token)
  router.use(verifySessionOrToken);

  // Rotas Privadas
  router.get(ROUTES.GROUPS, routesCallbacks.getGroups);
  router.get(ROUTES.GROUP, routesCallbacks.getGroup);
  router.post(ROUTES.GROUPS, routesCallbacks.createGroup);
  router.put(ROUTES.GROUP, routesCallbacks.updateGroup);
  router.delete(ROUTES.GROUP, routesCallbacks.deleteGroup);
  router.post(ROUTES.GROUP_PLAYERS, routesCallbacks.addPlayerToGroup);
  router.delete(ROUTES.GROUP_PLAYER, routesCallbacks.deletePlayerFromGroup);

  return router;
}
