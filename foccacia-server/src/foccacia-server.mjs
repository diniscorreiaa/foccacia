import { logSuccess } from "foccacia-utils";
import express from "express";
import {
  createCompetition,
  deleteCompetition,
  getCompetition,
  getCompetitions,
  updateCompetition,
  verifyToken,
} from "foccacia-web-api";

export function hello(name = "world") {
  return `hello ${name}`;
}

const app = express();

// TODO : criar todos os endpoints necessarios

const COMPETITIONS = "/api/competitions";
const COMPETITION = `${COMPETITIONS}/:code`;
const TEAMS = `${COMPETITION}/seasons/:season/teams`;

// TODO : understand middleware and use it properly
function callMe(req, rsp, next) {
  console.log("I've been called");
  next();
  console.log("I've been called after next");
}

app.use(verifyToken);
app.get(COMPETITIONS, getCompetitions);
app.post(COMPETITIONS, createCompetition);

app.get(COMPETITION, getCompetition);
app.put(COMPETITION, updateCompetition);
app.delete(COMPETITION, deleteCompetition);

const PORT = 1904;
logSuccess(
  "FOCCACIA (Football Complete Clubs API and Chelas Internet Application) by Grupo 1 LEIC31D",
  ""
);
app.listen(PORT, () => logSuccess(`Server listening on port ${PORT}`, ""));
