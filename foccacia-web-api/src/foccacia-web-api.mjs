import * as services from "foccacia-services/src/foccacia-services.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

export function getCompetitions(req, rsp) {
  services.getCompetitions().then((competitions) => rsp.json(competitions));
  // rsp.set("Content-Type", "application/json");
  // rsp.send(JSON.stringify(COMPETITIONS));
  // rsp.json(JSON.stringify(COMPETITIONS))
}

// TODO: replace above function with data from foccacia-services

export function getCompetition(req, rsp) {
  let competition = COMPETITIONS.find(
    (competition) => req.params.code === competition.code
  );
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
