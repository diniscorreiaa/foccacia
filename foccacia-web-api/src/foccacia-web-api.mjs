import {
  addPlayerToGroupServices,
  convertTokenToUserIdServices,
  createGroupServices,
  createUserServices,
  deleteGroupServices,
  deletePlayerFromGroupServices,
  getCompetitionsServices,
  getGroupServices,
  getGroupsServices,
  getTeamsServices,
  replaceGroupServices,
} from "foccacia-services";
import {
  groupToDto,
  playerToGroupDto,
  teamToDto,
  userToDto,
} from "./foccacia-dtos.mjs";
import errors from "foccacia-errors";
import { logInfo } from "foccacia-utils";

export { sendApplicationError } from "./application-to-http-errors.mjs";

const wrapAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function getToken(req) {
  const auth = req.get("Authorization");
  if (!auth) return "";

  const [type, value] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !value) return "";
  return value;
}

export const verifyToken = wrapAsync(async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    throw errors.UNAUTHORIZED("Missing or invalid Bearer token");
  }

  const userId = await convertTokenToUserIdServices(token);
  req.token = token;
  req.userId = userId;
  logInfo(
    `Request authorized for user ${userId} ${req.method} ${req.path}`,
    ""
  );

  next();
});

async function genericApiRoute(
  req,
  res,
  servicesFunc,
  { transformObj = (obj) => obj, servicesFuncArgs = [] } = {}
) {
  const obj = await servicesFunc(...servicesFuncArgs);
  const size = Array.isArray(obj) ? obj.length : 1;

  logInfo(`API: responding with ${size} item(s) for path ${req.path}`, "");
  res.json(transformObj(obj));
}

// Competitions
export const getCompetitions = wrapAsync((req, res) =>
  genericApiRoute(req, res, getCompetitionsServices)
);

// Teams
export const getTeams = wrapAsync((req, res) =>
  genericApiRoute(req, res, getTeamsServices, {
    servicesFuncArgs: [req.params.competitionCode, req.params.seasonYear],
    transformObj: (teamsArr) => teamsArr.map(teamToDto),
  })
);

// Users
export const createUser = wrapAsync((req, res) => {
  const username = req.body?.username;
  const user = createUserServices(username);
  return res.status(201).json(userToDto(user));
});

// Groups
export const getGroups = wrapAsync((req, res) =>
  genericApiRoute(req, res, getGroupsServices, {
    servicesFuncArgs: [req.userId],
    transformObj: (groups) => groups.map(groupToDto),
  })
);

export const createGroup = wrapAsync(async (req, res) => {
  const { name, description, competition, year } = req.body ?? {};
  const group = await createGroupServices(
    req.userId,
    name,
    description,
    competition,
    year
  );
  return res.status(201).json(groupToDto(group));
});

export const getGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, getGroupServices, {
    servicesFuncArgs: [req.userId, req.params.groupId],
    transformObj: groupToDto,
  })
);

export const replaceGroup = wrapAsync((req, res) => {
  const { name, description } = req.body ?? {};
  return genericApiRoute(req, res, replaceGroupServices, {
    servicesFuncArgs: [req.userId, req.params.groupId, { name, description }],
    transformObj: groupToDto,
  });
});

// TODO : Tiago => Verificar se o deleteGroup deve ser async
export const deleteGroup = wrapAsync((req, res) => {
  const result = deleteGroupServices(req.userId, req.params.groupId);
  if (!result) {
    // TODO : David => Ver qual erro retornar aqui
  }
  return res.sendStatus(204);
});

export const addPlayerToGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, addPlayerToGroupServices, {
    servicesFuncArgs: [req.userId, req.params.groupId, req.body],
    transformObj: playerToGroupDto,
  })
);

// TODO : Tiago => Verificar se o deletePlayerFromGroup deve ser async
export const deletePlayerFromGroup = wrapAsync((req, res) => {
  const result = deletePlayerFromGroupServices(
    req.userId,
    req.params.groupId,
    req.params.playerId
  );
  if (!result) {
    // TODO : David => Ver qual erro retornar aqui
  }
  return res.sendStatus(204);
});

export function hello(name = "world") {
  return `hello ${name}`;
}
