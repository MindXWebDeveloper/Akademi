const storageKey = 'akademi.library';

const initialBooks = [
  { id: 'BOOK001', code: '9786042210011', title: 'Dế Mèn phiêu lưu ký', author: 'Tô Hoài', category: 'Văn học', totalQuantity: 12 },
  { id: 'BOOK002', code: '9786042210028', title: 'Lược sử thời gian', author: 'Stephen Hawking', category: 'Khoa học', totalQuantity: 8 },
  { id: 'BOOK003', code: '9786042210035', title: 'Tuổi trẻ đáng giá bao nhiêu', author: 'Rosie Nguyễn', category: 'Kỹ năng sống', totalQuantity: 10 },
];

const readStore = () => {
  try {
    const store = JSON.parse(localStorage.getItem(storageKey));
    if (store && Array.isArray(store.books) && Array.isArray(store.loans)) return store;
  } catch {
    return { books: initialBooks, loans: [] };
  }
  return { books: initialBooks, loans: [] };
};

const writeStore = (store) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
};

const getBorrowedQuantity = (loans, bookId) => loans.reduce((total, loan) => (
  loan.bookId === bookId ? total + Math.max(0, loan.quantity - loan.returnedQuantity) : total
), 0);

export const getBooks = () => {
  const { books, loans } = readStore();
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

export const createBook = (book) => {
  const store = readStore();
  const normalizedCode = book.code.trim().toLocaleUpperCase('vi');
  if (store.books.some((item) => item.code.toLocaleUpperCase('vi') === normalizedCode)) {
    return { saved: false, reason: 'duplicate' };
  }

  const highestId = store.books.reduce((highest, item) => {
    const match = /^BOOK(\d+)$/.exec(item.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  const newBook = {
    ...book,
    id: `BOOK${String(highestId + 1).padStart(3, '0')}`,
    code: normalizedCode,
  };
  return writeStore({ ...store, books: [...store.books, newBook] })
    ? { saved: true, book: newBook }
    : { saved: false, reason: 'storage' };
};

export const updateBookStock = (bookId, totalQuantity) => {
  const store = readStore();
  const book = store.books.find((item) => item.id === bookId);
  if (!book) return { saved: false, reason: 'not-found' };

  const borrowedQuantity = getBorrowedQuantity(store.loans, bookId);
  if (totalQuantity < borrowedQuantity) {
    return { saved: false, reason: 'below-borrowed', borrowedQuantity };
  }

  book.totalQuantity = totalQuantity;
  return writeStore(store) ? { saved: true } : { saved: false, reason: 'storage' };
};

export const getLoans = () => {
  const { books, loans } = readStore();
  const booksById = new Map(books.map((book) => [book.id, book]));
  return loans.map((loan) => ({
    ...loan,
    bookTitle: booksById.get(loan.bookId)?.title ?? 'Sách không còn trong danh mục',
    bookCode: booksById.get(loan.bookId)?.code ?? '',
    remainingQuantity: Math.max(0, loan.quantity - loan.returnedQuantity),
  }));
};

export const borrowBook = ({ bookId, studentId, studentName, className, quantity, dueDate }) => {
  const store = readStore();
  const book = store.books.find((item) => item.id === bookId);
  if (!book) return { saved: false, reason: 'book-not-found' };

  const availableQuantity = book.totalQuantity - getBorrowedQuantity(store.loans, bookId);
  if (quantity > availableQuantity) return { saved: false, reason: 'unavailable', availableQuantity };

  const highestId = store.loans.reduce((highest, loan) => {
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

  return writeStore({ ...store, loans: [...store.loans, loan] })
    ? { saved: true, loan }
    : { saved: false, reason: 'storage' };
};

export const returnLoanQuantity = (loanId, quantity) => {
  const store = readStore();
  const loan = store.loans.find((item) => item.id === loanId);
  if (!loan) return { saved: false, reason: 'not-found' };

  const remainingQuantity = loan.quantity - loan.returnedQuantity;
  if (quantity < 1 || quantity > remainingQuantity) {
    return { saved: false, reason: 'invalid-quantity', remainingQuantity };
  }

  loan.returnedQuantity += quantity;
  loan.returnedAt = loan.returnedQuantity === loan.quantity ? new Date().toISOString() : null;
  return writeStore(store) ? { saved: true } : { saved: false, reason: 'storage' };
};