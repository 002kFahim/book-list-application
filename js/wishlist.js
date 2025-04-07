// Key for storing wishlist in localStorage
const WISHLIST_STORAGE_KEY = "bookListWishlist";

/**
 * Get wishlist from localStorage
 * @returns {Array} - Array of book IDs in the wishlist
 */
function getWishlist() {
  const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
  return wishlist ? JSON.parse(wishlist) : [];
}

/**
 * Save wishlist to localStorage
 * @param {Array} wishlist - Array of book IDs to save
 */
function saveWishlist(wishlist) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
}

/**
 * Check if a book is in the wishlist
 * @param {number} bookId - Book ID to check
 * @returns {boolean} - True if the book is in the wishlist
 */
function isBookInWishlist(bookId) {
  const wishlist = getWishlist();
  return wishlist.includes(bookId);
}

/**
 * Add a book to the wishlist
 * @param {number} bookId - Book ID to add
 */
function addToWishlist(bookId) {
  const wishlist = getWishlist();
  if (!wishlist.includes(bookId)) {
    wishlist.push(bookId);
    saveWishlist(wishlist);
  }
}

/**
 * Remove a book from the wishlist
 * @param {number} bookId - Book ID to remove
 */
function removeFromWishlist(bookId) {
  const wishlist = getWishlist();
  const index = wishlist.indexOf(bookId);
  if (index !== -1) {
    wishlist.splice(index, 1);
    saveWishlist(wishlist);
  }
}

/**
 * Toggle a book's wishlist status
 * @param {number} bookId - Book ID to toggle
 * @returns {boolean} - New wishlist status (true if added, false if removed)
 */
function toggleWishlist(bookId) {
  if (isBookInWishlist(bookId)) {
    removeFromWishlist(bookId);

    // Update UI if on book details page
    const wishlistBtn = document.querySelector(".wishlist-btn");
    if (wishlistBtn) {
      wishlistBtn.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
    }

    // Update UI if on wishlist page
    if (window.location.href.includes("wishlist.html")) {
      const bookCard = document.querySelector(
        `.book-card[data-id="${bookId}"]`
      );
      if (bookCard) {
        bookCard.style.animation = "fadeOut 0.3s forwards";
        setTimeout(() => {
          bookCard.remove();

          // Check if there are any books left
          const remainingBooks = document.querySelectorAll(
            "#wishlist-books .book-card"
          );
          if (remainingBooks.length === 0) {
            const noWishlistMessage = document.getElementById(
              "no-wishlist-message"
            );
            if (noWishlistMessage) {
              noWishlistMessage.style.display = "block";
            }
          }
        }, 300);
      }
    }

    return false;
  } else {
    addToWishlist(bookId);

    // Update UI if on book details page
    const wishlistBtn = document.querySelector(".wishlist-btn");
    if (wishlistBtn) {
      wishlistBtn.innerHTML =
        '<i class="fas fa-heart"></i> Remove from Wishlist';
    }

    return true;
  }
}

/**
 * Display wishlist books on the wishlist page
 */
async function displayWishlistBooks() {
  const wishlistContainer = document.getElementById("wishlist-books");
  const noWishlistMessage = document.getElementById("no-wishlist-message");

  const wishlist = getWishlist();

  if (wishlist.length === 0) {
    wishlistContainer.innerHTML = "";
    noWishlistMessage.style.display = "block";
    return;
  }

  noWishlistMessage.style.display = "none";
  wishlistContainer.innerHTML =
    '<div class="loading">Loading your wishlist...</div>';

  try {
    const books = [];

    // Fetch each book in the wishlist
    for (const bookId of wishlist) {
      try {
        const book = await getBookById(bookId);
        books.push(book);
      } catch (error) {
        console.error(`Error fetching book ${bookId}:`, error);
      }
    }

    if (books.length === 0) {
      wishlistContainer.innerHTML =
        '<div class="error">Failed to load wishlist books</div>';
      return;
    }

    // Display the books
    let booksHTML = "";

    books.forEach((book) => {
      const coverImage = book.formats["image/jpeg"] || "../images/no-cover.jpg";
      const authors = book.authors.map((author) => author.name).join(", ");
      const genres = book.subjects.slice(0, 3);

      booksHTML += `
                <div class="book-card" data-id="${book.id}">
                    <div class="book-cover">
                        <img src="${coverImage}" alt="${
        book.title
      } cover" onerror="this.src='../images/no-cover.jpg'">
                        <div class="wishlist-icon" onclick="toggleWishlist(${
                          book.id
                        })">
                            <i class="fas fa-heart"></i>
                        </div>
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">By ${authors}</p>
                        <div class="book-genres">
                            ${genres
                              .map(
                                (genre) =>
                                  `<span class="genre-tag">${genre}</span>`
                              )
                              .join("")}
                        </div>
                        <p class="book-id">ID: ${book.id}</p>
                        <a href="book-details.html?id=${
                          book.id
                        }" class="view-details">View Details</a>
                    </div>
                </div>
            `;
    });

    wishlistContainer.innerHTML = booksHTML;
  } catch (error) {
    wishlistContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
}
