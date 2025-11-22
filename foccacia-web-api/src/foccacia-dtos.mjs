export function teamToDto(team) {
  return {
    teamName: team.teamName,
    country: team.country,
    players: team.players.map(playerToTeamDto),
  };
}

function playerToTeamDto(player) {
  return {
    playerName: player.playerName,
    position: player.position,
  };
}

// TODO : adicionar todos 4 parametros
export function playerToGroupDto(player) {
  return {
    playerName: player.playerName,
    position: player.position,
  };
}
