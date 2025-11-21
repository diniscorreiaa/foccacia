import * as data from "foccacia-data-mem/src/foccacia-data-mem.mjs";

export function getCompetitions() {
  return data.getCompetitions();
}

// TODO : Adaptar as funcionalidades do nosso projecto

export default function (data, users) {
  return {
    getBooks: getBooks,
    getBook: getBook,
  };

  async function getBooks(token) {
    return data.getBooks();
  }

  export async function getBook(bookId, token) {
    return data
      .getBook(bookId)
      .then((book) =>
        users.convertTokenToId(token).then((id) => validateOwner(book, id))
      );

    function validateOwner(book, userId) {
      if (book.ownerId == userId) {
        return book;
      }
      return Promise.reject(
        errors.NOT_AUTHORIZED(
          `The user does not have access to the book with id ${bookId}`
        )
      );
    }
  }
}
// TODO: Implementar a logica de todas as funções da aplicação
