import { logSuccess } from "foccacia-utils";
import express from "express";
import {
  createCompetition,
  deleteCompetition,
  getCompetition,
  getCompetitions,
  updateCompetition,
} from "foccacia-web-api";

const app = express();

const COMPETITIONS = "/competitions";
const COMPETITION = "/competitions:code";

export function hello(name = "world") {
  return `hello ${name}`;
}

logSuccess(hello());

app.get(COMPETITIONS, getCompetitions);
app.post(COMPETITIONS, createCompetition);

app.get(COMPETITION, getCompetition);
app.put(COMPETITION, updateCompetition);
app.delete(COMPETITION, deleteCompetition);

const PORT = 1904;
app.listen(PORT, () => logSuccess(`Server listening on port ${PORT}`));

/* TODO: implement foccacia-server


 */
