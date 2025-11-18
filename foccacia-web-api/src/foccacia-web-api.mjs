export function hello(name = "world") {
  return `hello ${name}`;
}

function Competition(code, name) {
  this.code = code;
  this.name = name;
}

const COMPETITIONS = [
  new Competition("PL", "Premier League"),
  new Competition("LL", "La Liga"),
  new Competition("PPL", "Primeira Liga"),
];

export function getCompetitions(req, rsp) {
  rsp.set("Content-Type", "application/json");
  rsp.send(JSON.stringify(COMPETITIONS));
  // rsp.json(JSON.stringify(COMPETITIONS))
}

export function getCompetition(req, rsp) {
  let competition = COMPETITIONS.find(
    (competition) => req.params.code === competition.id
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
