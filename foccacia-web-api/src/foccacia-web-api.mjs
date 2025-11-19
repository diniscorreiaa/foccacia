import * as services from "foccacia-services/src/foccacia-services.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

function getToken(req) {
  const auth = req.get("Authorization");
  if (!auth) return "";
  const arr = auth.split(" ");
  if (arr.length !== 2 && arr[0].toLower() !== "bearer") return "";
  return arr[1];
}

export function getCompetitions(req, rsp) {
  const token = getToken(req);

  if (token == "") {
    return rsp.status(403).send({
      uri: req.path,
      description: "The access to the resource is forbidden",
    });
  }

  services.getCompetitions().then((competitions) => rsp.json(competitions));
  // rsp.set("Content-Type", "application/json");
  // rsp.send(JSON.stringify(COMPETITIONS));
  // rsp.json(JSON.stringify(COMPETITIONS))
}

// TODO: replace above function with data from foccacia-services

export function getCompetition(req, rsp) {
  let competition = services
    .getCompetitions()
    .find((competition) => req.params.code === competition.code);
  rsp.json(competition);
}

export function createCompetition(req, rsp) {
  rsp.send(`Create competition called`);
}

export function deleteCompetition(req, rsp) {
  let competitionCode = req.params.code;
  let idx = COMPETITIONS.findIndex(
    (competition) => competitionCode === competition.code
  );
  COMPETITIONS.splice(idx, 1);
  rsp.json({
    status: `Competition with code ${competitionCode} deleted`,
  });
}

export function updateCompetition(req, rsp) {
  rsp.send(`Update Competition with code ${req.params.code} called`);
}
