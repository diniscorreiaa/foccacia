import * as services from "foccacia-services/src/foccacia-services.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

export const getCompetitions = getCompetitionsInternal;
export const getCompetition = getCompetitionInternal;
export const createCompetition = createCompetitionInternal;
export const deleteCompetition = deleteCompetitionInternal;
export const updateCompetition = updateCompetitionInternal;

function getToken(req) {
  const auth = req.get("Authorization");
  if (!auth) return "";

  const arr = auth.split(" ");
  if (arr.length !== 2 || arr[0].toLowerCase() !== "bearer") return "";
  return arr[1];
}

export function verifyToken(req, rsp, next) {
  const token = getToken(req);
  if (!token) {
    return rsp.status(403).send({
      uri: req.path,
      description: "The access to the resource is forbidden",
    });
  }
  req.token = token;
  next();
}

function getCompetitionsInternal(req, rsp) {
  services.getCompetitions(req.token).then((competitions) => {
    console.log("getCompetitions response generated");
    rsp.json(competitions);
  });
}

// TODO : Adapatar as funcionalidade da nossa api
function getCompetitionInternal(req, rsp) {
  services
    .getCompetitions(req.params.code, req.token)
    .then((competition) => rsp.json(competition))
    .catch((ae) => {});
}

// TODO: replace above function with data from foccacia-services

function createCompetitionInternal(req, rsp) {
  rsp.send(`Create competition called`);
}

function deleteCompetitionInternal(req, rsp) {
  let competitionCode = req.params.code;
  let idx = COMPETITIONS.findIndex(
    (competition) => competitionCode == competition.code
  );
  COMPETITIONS.splice(idx, 1);
  rsp.json({
    status: `Competition with code ${competitionCode} deleted`,
  });
}

function updateCompetitionInternal(req, rsp) {
  rsp.send(`Update Competition with code ${req.params.code} called`);
}
