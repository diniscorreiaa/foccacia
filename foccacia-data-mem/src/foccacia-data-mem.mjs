import { Competition, Team } from "./domain-model.mjs";

export function hello(name = "world") {
  return `hello ${name}`;
}

const COMPETITIONS = [
  new Competition("PL", "Premier League"),
  new Competition("LL", "La Liga"),
  new Competition("PPL", "Primeira Liga"),
];

const TEAMS = [
  new Team("SL Benfica", "Portugal", [
    { playerName: "João Neves", position: "Midfielder" },
    { playerName: "Gonçalo Ramos", position: "Forward" },
  ]),
  new Team("SC Braga", "Portugal", [
    { playerName: "Ricardo Horta", position: "Forward" },
    { playerName: "Paulinho", position: "Midfielder" },
  ]),
  new Team("Vitória SC", "Portugal", [
    { playerName: "André Almeida", position: "Defender" },
    { playerName: "Óscar Estupiñán", position: "Forward" },
  ]),
];

export function getCompetitions() {
  return Promise.resolve(COMPETITIONS);
}

// TODO: Apos implementar o domain-model, criar exemplos de dados e os funções para manipula-los
