export function Competition(code, name) {
  this.code = code;
  this.name = name;
}

export function Team(id, teamName, country, players = []) {
  this.id = id;
  this.teamName = teamName;
  this.country = country;
  this.players = players;
}

export function Player(id, playerName, position) {
  this.id = id; // id da Football Data API
  this.playerName = playerName;
  this.position = position;
}

export function User(id, username, token) {
  this.id = id; // usar um contador simples
  this.username = username;
  this.token = token; // crypto.randomUUID() guardado aqui
}

export function Group(
  id,
  name,
  ownerUserId,
  description,
  competitionCode,
  season,
  players = []
) {
  this.id = id;
  this.name = name;
  this.ownerUserId = ownerUserId; // referencia User
  this.description = description;
  this.competitionCode = competitionCode;
  this.season = season;
  this.players = players;
}
