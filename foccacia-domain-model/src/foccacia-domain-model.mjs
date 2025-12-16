// TODO : ALL => change Domain Functions to receive single object parameters
import { randomUUID } from "node:crypto";

export function initDomainModel() {
  function Competition(code, name) {
    this.code = code;
    this.name = name;
  }

  function Team({ teamId, teamName, country, players }) {
    this.id = teamId;
    this.teamName = teamName;
    this.country = country;
    this.players = players;
  }

  function Player({
    playerId,
    playerName,
    teamId,
    teamCode,
    teamName,
    position,
    nationality,
    age,
  }) {
    this.id = playerId;
    this.playerName = playerName;
    this.teamId = teamId;
    this.teamCode = teamCode;
    this.teamName = teamName;
    this.position = position;
    this.nationality = nationality;
    this.age = age;
  }

  function User({ id = null, username, token = randomUUID() }) {
    this.id = id;
    this.username = username;
    this.token = token;
  }

  function Group({
    id = null,
    userId,
    name,
    description,
    competition,
    year,
    players = [],
  }) {
    this.id = id;
    this.ownerId = userId;
    this.name = name;
    this.description = description;
    this.competition = competition;
    this.year = year;
    this.players = players;
  }

  return {
    Competition,
    Team,
    Player,
    User,
    Group,
  };
}
