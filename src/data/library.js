import {
  createResourceRecord,
  getResourceRecords,
  updateResourceRecord,
} from './apiClient';

const readBooks = () => getResourceRecords('books').map((item) => ({
  ...item,
  id: String(item.bookKey ?? item.id ?? item._id ?? ''),
}));
const readLoans = () => getResourceRecords('loans').map((item) => ({
  ...item,
  id: String(item.loanKey ?? item.id ?? item._id ?? ''),
}));

const getBorrowedQuantity = (loans, bookId) => loans.reduce((total, loan) => (
  loan.bookId === bookId ? total + Math.max(0, loan.quantity - loan.returnedQuantity) : total
), 0);

export const getBooks = () => {
  const books = readBooks();
  const loans = readLoans();
  return books.map((book) => {
    const borrowedQuantity = getBorrowedQuantity(loans, book.id);
    return {
      ...book,
      borrowedQuantity,
      availableQuantity: Math.max(0, book.totalQuantity - borrowedQuantity),
    };
  });
};

export const getBookById = (bookId) => getBooks().find((book) => book.id === bookId);

export const createBook = async (book) => {
  const books = readBooks();
  const normalizedCode = book.code.trim().toLocaleUpperCase('vi');
  if (books.some((item) => item.code.toLocaleUpperCase('vi') === normalizedCode)) {
    return { saved: false, reason: 'duplicate' };
  }
  const highestId = books.reduce((highest, item) => {
    const match = /^BOOK(\d+)$/.exec(item.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  const newBook = { ...book, id: `BOOK${String(highestId + 1).padStart(3, '0')}`, code: normalizedCode };
  try {
    const created = await createResourceRecord('books', newBook);
    return { saved: true, book: created };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const updateBookStock = async (bookId, totalQuantity) => {
  const book = readBooks().find((item) => item.id === bookId);
  if (!book) return { saved: false, reason: 'not-found' };
  const borrowedQuantity = getBorrowedQuantity(readLoans(), bookId);
  if (totalQuantity < borrowedQuantity) return { saved: false, reason: 'below-borrowed', borrowedQuantity };
  try {
    await updateResourceRecord('books', { ...book, totalQuantity });
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const getLoans = () => {
  const booksById = new Map(readBooks().map((book) => [book.id, book]));
  return readLoans().map((loan) => ({
    ...loan,
    bookTitle: booksById.get(loan.bookId)?.title ?? 'Sách không còn trong danh mục',
    bookCode: booksById.get(loan.bookId)?.code ?? '',
    remainingQuantity: Math.max(0, loan.quantity - loan.returnedQuantity),
  }));
};

export const borrowBook = async ({ bookId, studentId, studentName, className, quantity, dueDate }) => {
  const book = readBooks().find((item) => item.id === bookId);
  if (!book) return { saved: false, reason: 'book-not-found' };
  const loans = readLoans();
  const availableQuantity = book.totalQuantity - getBorrowedQuantity(loans, bookId);
  if (quantity > availableQuantity) return { saved: false, reason: 'unavailable', availableQuantity };
  const highestId = loans.reduce((highest, loan) => {
    const match = /^LOAN(\d+)$/.exec(loan.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  const loan = {
    id: `LOAN${String(highestId + 1).padStart(4, '0')}`,
    bookId,
    studentId,
    studentName,
    className,
    quantity,
    returnedQuantity: 0,
    borrowedAt: new Date().toISOString(),
    dueDate,
  };
  try {
    const created = await createResourceRecord('loans', loan);
    return { saved: true, loan: created };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};

export const returnLoanQuantity = async (loanId, quantity) => {
  const loan = readLoans().find((item) => item.id === loanId);
  if (!loan) return { saved: false, reason: 'not-found' };
  const remainingQuantity = loan.quantity - loan.returnedQuantity;
  if (quantity < 1 || quantity > remainingQuantity) {
    return { saved: false, reason: 'invalid-quantity', remainingQuantity };
  }
  const returnedQuantity = loan.returnedQuantity + quantity;
  try {
    await updateResourceRecord('loans', {
      ...loan,
      returnedQuantity,
      returnedAt: returnedQuantity === loan.quantity ? new Date().toISOString() : null,
    });
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: 'api', error };
  }
};
