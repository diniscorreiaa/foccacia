import * as services from "foccacia-services/src/foccacia-services.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

function getToken(req) {
  const auth = req.get("Authorization");
  if (!auth) return "";

  const arr = auth.split(" ");
  if (arr.length !== 2 || arr[0].toLowerCase() !== "bearer") return "";
  return arr[1];
}

export function getCompetitions(req, rsp) {
  const token = getToken(req);

  if (!token) {
    return rsp.status(403).send({
      uri: req.path,
      description: "The access to the resource is forbidden",
    });
  }

  services.getCompetitions().then((competitions) => rsp.json(competitions));
}

export async function getCompetition(req, rsp) {
  const token = getToken(req);
  if (!token) {
    return rsp.status(403).json({
      uri: req.path,
      description: "The access to the resource is forbidden",
    });
  }

  const competitions = await services.getCompetitions();
  const competition = competitions.find((c) => c.code == req.params.code);

  if (!competition) {
    return rsp.status(404).json({
      uri: req.path,
      description: "Competition not found",
    });
  }

  rsp.json(competition);
}

// TODO: replace above function with data from foccacia-services

export function createCompetition(req, rsp) {
  rsp.send(`Create competition called`);
}

export function deleteCompetition(req, rsp) {
  let competitionCode = req.params.code;
  let idx = COMPETITIONS.findIndex(
    (competition) => competitionCode == competition.code
  );
  COMPETITIONS.splice(idx, 1);
  rsp.json({
    status: `Competition with code ${competitionCode} deleted`,
  });
}

export function updateCompetition(req, rsp) {
  rsp.send(`Update Competition with code ${req.params.code} called`);
}
