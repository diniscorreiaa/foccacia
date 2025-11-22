import {
  Competition,
  Player,
  Team,
} from "foccacia-data-mem/src/domain-model.mjs";
import {
  fetchCompetitions,
  fetchCompetitionTeams,
  fetchTeamWithSquad,
} from "fapi-teams-data/src/fapi-teams-data.mjs";
import errors from "foccacia-server/src/errors.mjs";
import { logError, logInfo } from "foccacia-utils";

// Competitions

export async function getCompetitions() {
  return fetchCompetitions()
    .then((raw) => {
      const competitions = raw.map(
        (competition) => new Competition(competition.code, competition.name)
      );

      logInfo(`Service: loaded ${competitions.length} competitions`, "");
      return competitions;
    })
    .catch((err) => {
      if(err.status == 500) {   // Erro 500 (internal error) do football api corresponde a bad_gateway para a nossa api
      logError("Error fetching external service competitions from Football Data Api", err);
      return Promise.reject(errors.BAD_GATEWAY("Impossível obter informação ao serviço externo Football Api"));
      }
      if(err.status == 429) {   
      logError("Error: reached limit of requests to Football Api", err);
      return Promise.reject(errors.RATE_LIMIT("Não tens esta informação em cache e atingiste o limite de pedidos à Football Api"));
      }
      logError("Unexpected error fetching for all competitions")
      return Promise.reject(err)
    });
}

// TODO : Adaptar para usar Promises e logs
export async function getCompetitionByCode(code) {
  const competitions = await getCompetitions();
  const competition = competitions.find(
    (competition) => competition.code === code
  );
  if (!competition) {
    throw errors.NOT_FOUND(`Competition with code ${code} not found`);
  }
  return competition;
}

// Teams and Players

export async function getTeamsForCompetitionAndSeason(code, season) {
  return fetchCompetitionTeams(code, season)
    .then((teams) => {
      logInfo(
        `Service: fetched ${teams.length} teams for competition ${code} season ${season}`,
        ""
      );

      return Promise.all(
        teams.map((team) =>
          fetchTeamWithSquad(team.id).catch((err) => {
            if (err.status === 404) {
              logError(
                `The combination competition ${code} and season ${season} was not found`,
                err
              );
              return Promise.reject(
                errors.NOT_FOUND(
                  "Não foi possível encontrar um resultado para a competição com época respetiva"
                )
              );
            }
            if (err.status === 429) {
              logError(
                `Rate limit from Football API while fetching team ${team.id}`,
                err
              );
              return Promise.reject(
                errors.RATE_LIMIT(
                  "Atingido o limite de pedidos à Football Data API. Tente novamente dentro de alguns segundos."
                )
              );
            }
            if (err.status === 500) {
              logError("Error fetching external service teams from Football Data Api", err);
              return Promise.reject(errors.BAD_GATEWAY("Impossível obter informação ao serviço externo Football Api"));
            }
            logError(
              `Unexpected error fetching team ${team.id} for ${code} ${season}`,
              err
            );
            return Promise.reject(err);
          })
        )
      );
    })
    .then((teamsWithSquad) => {
      const result = teamsWithSquad.map((teamJson) => {
        const players = (teamJson.squad ?? []).map(
          (player) => new Player(player.id, player.name, player.position)
        );
        return new Team(
          teamJson.id,
          teamJson.name,
          teamJson.area?.name ?? null,
          players
        );
      });
      logInfo(
        `Service: built ${result.length} Team objects for competition ${code} season ${season}`,
        ""
      );
      return result;
    })
  }

// TODO : diferente estrutura em baixo

// export async function getCompetitions() {
//   // 1) tentar usar cache
//   const cached = dataMem.getCompetitionCache();
//   if (cached.length > 0) return cached;
//   // 2) fetch Football Data API
//   const competitions = await teamsApi.fetchCompetitions();
//   // aqui transforma resultado raw da FAPI em objetos Competition, save em cache
//   dataMem.setCompetitionCache(competitions);
//   return competitions;
// }

// Users

// export async function createUser(username) {
//   const existing = dataMem.findUserByUsername(username);
//   if (existing) {
//     throw errors.INVALID_DATA(`Username ${username} already exists`);
//   }
//   const token = randomUUID();
//   const user = dataMem.createUser(username, token);
//   return user;
// }
//
// // usado pelo middleware para validar token
// export async function convertTokenToUserId(token) {
//   const user = dataMem.findUserByToken(token);
//   if (!user) {
//     throw errors.NOT_AUTHORIZED("Invalid token");
//   }
//   return user.id;
// }

// Groups
// TODO : criar regras como max 11 jogadores
// export async function getGroupsByUser(userId) {
//   return dataMem.getGroupsByUser(userId);
// }

// TODO : Adaptar as funcionalidades do nosso projecto

// export default function (data, users) {
//   return {
//     getBooks: getBooks,
//     getBook: getBook,
//   };
//
//   async function getBooks(token) {
//     return data.getBooks();
//   }
//
//   export async function getBook(bookId, token) {
//     return data
//       .getBook(bookId)
//       .then((book) =>
//         users.convertTokenToId(token).then((id) => validateOwner(book, id))
//       );
//
//     function validateOwner(book, userId) {
//       if (book.ownerId == userId) {
//         return book;
//       }
//       return Promise.reject(
//         errors.NOT_AUTHORIZED(
//           `The user does not have access to the book with id ${bookId}`
//         )
//       );
//     }
//   }
// }
