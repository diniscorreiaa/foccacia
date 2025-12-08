// TODO : ALL -> e dado pelo services a quem enviar-lhe e recebe dados dele, e esses sao responsaveis por mapear os seus dados para essa estrutura

export function initDomainModel({ randomUUID }) {
  function Competition(code, name) {
    this.code = code;
    this.name = name;
  }

  function Team(teamId, teamName, country, players) {
    this.id = teamId;
    this.teamName = teamName;
    this.country = country;
    this.players = players;
  }

  function Player(
    playerId,
    playerName,
    teamId,
    teamCode,
    teamName,
    position,
    nationality,
    age
  ) {
    this.id = playerId;
    this.playerName = playerName;
    this.teamId = teamId;
    this.teamCode = teamCode;
    this.teamName = teamName;
    this.position = position;
    this.nationality = nationality;
    this.age = age;
  }

  function User(userId, username) {
    this.id = userId;
    this.username = username;
    this.token = randomUUID();
  }

  function Group(
    userId,
    groupId,
    name,
    description,
    competition,
    year,
    players = []
  ) {
    this.ownerId = userId;
    this.id = groupId;
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
