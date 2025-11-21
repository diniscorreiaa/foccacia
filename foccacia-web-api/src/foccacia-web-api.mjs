import * as services from "foccacia-services/src/foccacia-services.mjs";
import { sendApplicationError } from "foccacia-server/src/application-to-http-errors.mjs";
import { teamToDto } from "./foccacia-dtos.mjs";
import errors from "foccacia-server/src/errors.mjs";
import { logInfo } from "foccacia-utils";

export function hello(name = "world") {
  return `hello ${name}`;
}

export const getCompetitions = getCompetitionsInternal;
export const getCompetition = getCompetitionInternal;
export const getTeamsForCompetitionAndSeason =
  getTeamsForCompetitionAndSeasonInternal;
export const verifyToken = verifyTokenInternal;

// TODO : createUser, deleteUser, updateUser, createGroup, deleteGroup, updateGroup, getTeams

function getToken(req) {
  const auth = req.get("Authorization");
  if (!auth) return "";

  const arr = auth.split(" ");
  if (arr.length !== 2 || arr[0].toLowerCase() !== "bearer") return "";
  return arr[1];
}

async function verifyTokenInternal(req, res, next) {
  const token = getToken(req);
  if (!token) {
    const err = errors.NOT_AUTHORIZED("Missing or invalid Bearer token");
    return sendApplicationError(err, req, res);
  }

  // TODO : Apos validacao da token em services
  // return services
  //   .convertTokenToUserId(token)
  //   .then((userId) => {
  //     req.token = token;
  //     req.userId = userId;
  //     logInfo(`Request authorized for user ${userId} ${req.method} ${req.path}`);
  //     next();
  //   })
  //   .catch((err) => sendApplicationError(err, req, res));

  req.token = token;
  logInfo(`Request authorized for ${req.method} ${req.path}`, "");
  next();
}

// Get Competitions

function getCompetitionsInternal(req, res) {
  services
    .getCompetitions()
    .then((competitions) => {
      logInfo(
        `API: responding with ${competitions.length} competitions for ${req.path}`,
        ""
      );
      res.json(competitions);
    })
    .catch((err) => {
      sendApplicationError(err, req, res);
    });
}

// TODO : usar promises e remover try catch
async function getCompetitionInternal(req, res) {
  try {
    const competition = await services.getCompetitionByCode(req.params.code);
    res.json(competition);
  } catch (err) {
    sendApplicationError(err, req, res);
  }
}

// Get Teams

function getTeamsForCompetitionAndSeasonInternal(req, res) {
  const { code, season } = req.params;

  services
    .getTeamsForCompetitionAndSeason(code, season)
    .then((teams) => {
      logInfo(
        `API: responding with ${teams.length} teams for ${code} season ${season}`,
        ""
      );
      res.json(teams.map(teamToDto));
    })
    .catch((err) => {
      sendApplicationError(err, req, res);
    });
}

// async function verifyTokenInternal(req, res, next) {
//   const token = getToken(req);
//   if (!token) {
//     return res.status(403).json({
//       uri: req.path,
//       description: "The access to the resource is forbidden",
//     });
//   }
//
//   try {
//     const userId = await services.convertTokenToUserId(token);
//     req.token = token;
//     req.userId = userId;
//     next();
//   } catch (err) {
//     return sendApplicationError(err, req, res);
//   }
// }
