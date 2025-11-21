import * as services from "foccacia-services/src/foccacia-services.mjs";
import { sendApplicationError } from "foccacia-server/src/application-to-http-errors.mjs";
import { teamToDto } from "./foccacia-dtos.mjs";

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

function verifyTokenInternal(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(403).json({
      uri: req.path,
      description: "The access to the resource is forbidden",
    });
  }

  req.token = token; // guardado para futura lógica (users/groups)
  next();
}

async function getCompetitionsInternal(req, res) {
  try {
    const competitions = await services.getCompetitions();
    res.json(competitions);
  } catch (err) {
    console.error(err);
    sendApplicationError(err, req, res);
  }
}

async function getTeamsForCompetitionAndSeasonInternal(req, res) {
  const { code, season } = req.params;

  try {
    const teams = await services.getTeamsForCompetitionAndSeason(code, season);
    res.json(teams.map(teamToDto));
  } catch (err) {
    console.error(err);
    sendApplicationError(err, req, res);
  }
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

// async function getCompetitionsInternal(req, res) {
//   try {
//     const competitions = await services.getCompetitions();
//     res.json(competitions);
//   } catch (err) {
//     sendApplicationError(err, req, res);
//   }
// }

async function getCompetitionInternal(req, res) {
  try {
    const competition = await services.getCompetitionByCode(req.params.code);
    res.json(competition);
  } catch (err) {
    sendApplicationError(err, req, res);
  }
}
