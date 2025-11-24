import * as services from "foccacia-services";
import { groupToDto, playerToGroupDto, teamToDto } from "./foccacia-dtos.mjs";
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

  const userId = await services.convertTokenToUserId(token);
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
  genericApiRoute(req, res, services.getCompetitions)
);

// Teams
export const getTeams = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.getTeams, {
    servicesFuncArgs: [req.params.competitionCode, req.params.seasonYear],
    transformObj: (teamsArr) => teamsArr.map(teamToDto),
  })
);

// Users
export const createUser = wrapAsync(async (req, res) => {
  const username = req.body?.username;
  const user = await services.createUser(username);
  return res.status(201).json(user);
});

// Groups
export const getGroups = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.getGroups, {
    servicesFuncArgs: [req.userId],
    transformObj: (groups) => groups.map(groupToDto),
  })
);

export const createGroup = wrapAsync(async (req, res) => {
  const { name, description, competition, year } = req.body ?? {};
  const group = await services.createGroup(
    req.userId,
    name,
    description,
    competition,
    year
  );
  return res.status(201).json(groupToDto(group));
});

export const getGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.getGroup, {
    servicesFuncArgs: [req.userId, req.params.groupId],
    transformObj: groupToDto,
  })
);

export const replaceGroup = wrapAsync((req, res) => {
  const { name, description } = req.body ?? {};
  return genericApiRoute(req, res, services.replaceGroup, {
    servicesFuncArgs: [req.userId, req.params.groupId, { name, description }],
    transformObj: groupToDto,
  });
});

export const deleteGroup = wrapAsync(async (req, res) => {
  await services.deleteGroup(req.userId, req.params.groupId);
  return res.status(204).end();
});

export const addPlayerToGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.addPlayerToGroup, {
    servicesFuncArgs: [req.userId, req.params.groupId, req.body],
    transformObj: playerToGroupDto,
  })
);

export const deletePlayerFromGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.deletePlayerFromGroup, {
    servicesFuncArgs: [req.userId, req.params.groupId, req.params.playerId],
    transformObj: (result) => result,
  })
);

export function hello(name = "world") {
  return `hello ${name}`;
}
