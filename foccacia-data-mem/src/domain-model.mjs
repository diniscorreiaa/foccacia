export function Competition(code, name) {
  this.code = code;
  this.name = name;
}

export function Team(teamId, teamName, country, players) {
  this.id = teamId;
  this.teamName = teamName;
  this.country = country;
  this.players = players;
}

export function Player(
  playerId,
  playerName,
  teamId,
  teamName,
  position,
  nationality,
  age
) {
  this.id = playerId;
  this.playerName = playerName;
  this.teamId = teamId;
  this.teamName = teamName;
  this.position = position;
  this.nationality = nationality;
  this.age = age;
}

export function User(userId, username) {
  this.id = userId;
  this.username = username;
  this.token = crypto.randomUUID();
}

export function Group(
  userId,
  groupId,
  name,
  description,
  competitionCode,
  year,
  players = []
) {
  this.ownerId = userId;
  this.id = groupId;
  this.name = name;
  this.description = description;
  this.competitionCode = competitionCode;
  this.year = year;
  this.players = players;
}
