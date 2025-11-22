import * as services from "foccacia-services/src/foccacia-services.mjs";
import { sendApplicationError } from "foccacia-server/src/application-to-http-errors.mjs";
import { teamToDto } from "./foccacia-dtos.mjs";
import errors from "foccacia-server/src/errors.mjs";
import { logInfo } from "foccacia-utils";

function getToken(req) {
  const auth = req.get("Authorization");
  if (!auth) return "";

  const arr = auth.split(" ");
  if (arr.length !== 2 || arr[0].toLowerCase() !== "bearer") return "";
  return arr[1];
}

export function verifyToken(req, res, next) {
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

// Inspiration for the options parameter:
// https://www.reddit.com/r/learnjavascript/comments/1c7hm3e/comment/l0872a2/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button
async function genericApiRoute(req, res, servicesFunc, {transformObj = (obj) => obj, servicesFuncArgs = []} = {}){
    try {
        const obj = await servicesFunc(...servicesFuncArgs)
        logInfo(`API: responding with ${obj.length} for path ${req.path}`, "")  // TODO think of useful generic log
        res.json(transformObj(obj))
    } catch(err) {
        sendApplicationError(err, req, res);
    }
}

export async function getCompetitions(req, res) {
    await genericApiRoute(req, res, services.getCompetitions)
}

export async function getTeams(req, res){
    const { competitionCode, seasonYear } = req.params;
    await genericApiRoute(req, res, services.getTeams,
        {
            transformObj: teamsArr => teamsArr.map(teamToDto),
            servicesFuncArgs: [competitionCode, seasonYear]
        })
}

// Users
export async function createUser(req, res){
    await genericApiRoute(req, res, services.createUser,
        {
            transformObj: (createdToken) => ({token: createdToken})
        })
}

// Groups
export async function getGroups(req, res){
    await genericApiRoute(req, res, services.getGroups)
}

export async function createGroup(req, res){
    await genericApiRoute(req, res, services.createGroup)
}

export async function getGroup(req, res){
    await genericApiRoute(req, res, services.getGroup)
}

export async function replaceGroup(req, res){
    await genericApiRoute(req, res, services.replaceGroup)
}

export async function deleteGroup(req, res){
    await genericApiRoute(req, res, services.deleteGroup)
}

export async function addPlayerToGroup(req, res){
    await genericApiRoute(req, res, services.addPlayerToGroup)
}

export async function deletePlayerFromGroup(req, res){
    await genericApiRoute(req, res, services.deletePlayerFromGroup)
}

export function hello(name = "world") {
    return `hello ${name}`;
}
