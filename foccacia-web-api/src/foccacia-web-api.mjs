import * as services from "foccacia-services";
import { groupToDto, teamToDto } from "./foccacia-dtos.mjs";
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

  // TODO: implementar em services
  // Deve devolver o userId correspondente ao token ou lançar UNAUTHORIZED
  const userId = await services.convertTokenToUserId(token); // quando existirem services

  // TODO : if(token nao pertence a nenhum user) throw UNAUTHORIZED
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
    transformObj: (teamsArr) => teamsArr.map(teamToDto),
    servicesFuncArgs: [req.params.competitionCode, req.params.seasonYear],
  })
);

// Users
export const createUser = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.createUser, {
    transformObj: (createdToken) => ({ token: createdToken }),
    servicesFuncArgs: [req.body?.username],
  })
);

// Groups
export const getGroups = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.getGroups, {
    servicesFuncArgs: [req.userId],
  })
);

export const createGroup = wrapAsync((req, res) => {
  const { name, description, competition, year } = req.body;
  return genericApiRoute(req, res, services.createGroup, {
    servicesFuncArgs: [req.userId, name, description, competition, year],
  });
});

export const getGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.getGroup, {
    servicesFuncArgs: [parseInt(req.params.groupId)],
  })
);

export const replaceGroup = wrapAsync((req, res) => {
  const { name, description } = req.body;
  return genericApiRoute(req, res, services.replaceGroup, {
    servicesFuncArgs: [req.params.groupId, { name, description }],
    transformObj: groupToDto,
  });
});

export const deleteGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.deleteGroup, {
    servicesFuncArgs: [req.params.groupId],
  })
);

export const addPlayerToGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.addPlayerToGroup, {
    servicesFuncArgs: [req.params.groupId, req.body],
  })
);

export const deletePlayerFromGroup = wrapAsync((req, res) =>
  genericApiRoute(req, res, services.deletePlayerFromGroup, {
    servicesFuncArgs: [req.params.groupId, req.params.playerId],
  })
);

export function hello(name = "world") {
  return `hello ${name}`;
}
