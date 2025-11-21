export function teamToDto(team) {
  return {
    teamName: team.teamName,
    country: team.country,
    players: team.players.map(playerToDto),
  };
}

export function playerToDto(player) {
  return {
    playerName: player.playerName,
    position: player.position,
  };
}
