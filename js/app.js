// Global state
let currentPage = 1;
let totalPages = 1;
let currentSearchQuery = "";
let currentGenreFilter = "";
let allGenres = [];
let userPreferences = {
  searchQuery: "",
  genreFilter: "",
  page: 1,
};

// DOM Elements
const booksListElement = document.getElementById("books-list");
const searchInput = document.getElementById("search-input");
const genreFilter = document.getElementById("genre-filter");
const paginationElement = document.getElementById("pagination");

// Load saved preferences from localStorage
function loadUserPreferences() {
  const savedPreferences = localStorage.getItem("bookListPreferences");
  if (savedPreferences) {
    userPreferences = JSON.parse(savedPreferences);
    currentPage = userPreferences.page;
    currentSearchQuery = userPreferences.searchQuery;
    currentGenreFilter = userPreferences.genreFilter;

    // Update UI to reflect saved preferences
    if (searchInput) searchInput.value = currentSearchQuery;
    if (genreFilter) genreFilter.value = currentGenreFilter;
  }
}

// Save user preferences to localStorage
function saveUserPreferences() {
  userPreferences = {
    searchQuery: currentSearchQuery,
    genreFilter: currentGenreFilter,
    page: currentPage,
  };
  localStorage.setItem("bookListPreferences", JSON.stringify(userPreferences));
}

// Display books in the UI
function displayBooks(books) {
  if (!booksListElement) return;

  if (books.length === 0) {
    booksListElement.innerHTML =
      '<div class="no-books-message">No books found matching your criteria.</div>';
    return;
  }

  let booksHTML = "";

  books.forEach((book) => {
    const coverImage = book.formats["image/jpeg"] || "images/no-cover.jpg";
    const authors = book.authors.map((author) => author.name).join(", ");
    const genres = book.subjects.slice(0, 3);
    const isWishlisted = isBookInWishlist(book.id);
    const heartIcon = isWishlisted ? "fas fa-heart" : "far fa-heart";

    booksHTML += `
            <div class="book-card" data-id="${book.id}">
                <div class="book-cover">
                    <img src="${coverImage}" alt="${
      book.title
    } cover" onerror="this.src='images/no-cover.jpg'">
                    <div class="wishlist-icon" onclick="toggleWishlist(${
                      book.id
                    }); updateWishlistIcon(this, ${book.id})">
                        <i class="${heartIcon}"></i>
                    </div>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">By ${authors}</p>
                    <div class="book-genres">
                        ${genres
                          .map(
                            (genre) => `<span class="genre-tag">${genre}</span>`
                          )
                          .join("")}
                    </div>
                    <p class="book-id">ID: ${book.id}</p>
                    <a href="pages/book-details.html?id=${
                      book.id
                    }" class="view-details">View Details</a>
                </div>
            </div>
        `;
  });

  booksListElement.innerHTML = booksHTML;
}

// Update wishlist icon when clicked
function updateWishlistIcon(iconElement, bookId) {
  const icon = iconElement.querySelector("i");
  if (isBookInWishlist(bookId)) {
    icon.className = "fas fa-heart";
  } else {
    icon.className = "far fa-heart";

    // Check if we're on the wishlist page and refresh the display
    if (window.location.href.includes("wishlist.html")) {
      // Remove the book card from the UI immediately
      const bookCard = iconElement.closest(".book-card");
      if (bookCard) {
        bookCard.style.animation = "fadeOut 0.3s forwards";
        setTimeout(() => {
          bookCard.remove();

          // Check if there are any books left in the wishlist
          const wishlistBooks = document.querySelectorAll(
            "#wishlist-books .book-card"
          );
          if (wishlistBooks.length === 0) {
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
  }
}

// Create pagination controls
function createPagination(count, page) {
  if (!paginationElement) return;

  totalPages = Math.ceil(count / 32); // API returns 32 books per page

  let paginationHTML = `
    <div class="pagination-wrapper">
      <div class="pagination">
        <!-- Previous button -->
        <button ${page === 1 ? "disabled" : ""} onclick="changePage(${
    page - 1
  })">
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        
        <!-- First page -->
        <button class="${
          page === 1 ? "active" : ""
        }" onclick="changePage(1)">1</button>
        
        <!-- Dots if needed -->
        ${page > 4 ? '<span class="pagination-dots">...</span>' : ''}
        
        <!-- Page numbers -->
  `;

  // Determine which page numbers to show
  let startPage = Math.max(2, page - 1);
  let endPage = Math.min(totalPages - 1, page + 1);
  
  // Adjust if we're near the beginning
  if (page <= 3) {
    startPage = 2;
    endPage = Math.min(5, totalPages - 1);
  }
  
  // Adjust if we're near the end
  if (page >= totalPages - 2) {
    startPage = Math.max(2, totalPages - 4);
    endPage = totalPages - 1;
  }

  // Add page buttons
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="${
        i === page ? "active" : ""
      }" onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  paginationHTML += `
        <!-- Dots if needed -->
        ${page < totalPages - 3 ? '<span class="pagination-dots">...</span>' : ''}
        
        <!-- Last page if not the first page -->
        ${totalPages > 1 ? `<button class="${
          page === totalPages ? "active" : ""
        }" onclick="changePage(${totalPages})">${totalPages}</button>` : ''}
        
        <!-- Next button -->
        <button ${
          page === totalPages ? "disabled" : ""
        } onclick="changePage(${page + 1})">
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      
      <!-- Go to page input -->
      <div class="goto-page">
        <label for="goto-page-input">Go to page:</label>
        <input type="number" id="goto-page-input" min="1" max="${totalPages}" value="${page}">
        <button onclick="gotoPage()">Go</button>
      </div>
    </div>
  `;

  paginationElement.innerHTML = paginationHTML;
  
  // Add event listener for the goto page input
  const gotoInput = document.getElementById('goto-page-input');
  if (gotoInput) {
    gotoInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        gotoPage();
      }
    });
  }
}

// Function to handle "go to page" functionality
function gotoPage() {
  const input = document.getElementById('goto-page-input');
  if (input) {
    let pageNum = parseInt(input.value);
    if (isNaN(pageNum)) pageNum = 1;
    
    // Ensure page is within valid range
    pageNum = Math.max(1, Math.min(pageNum, totalPages));
    
    changePage(pageNum);
  }
}

// Change page and reload books
function changePage(page) {
  currentPage = page;
  saveUserPreferences();
  loadBooks();
}

// Populate genre filter dropdown
function populateGenreFilter(genres) {
  if (!genreFilter) return;

  // Keep the first option (All Genres)
  let options = '<option value="">All Genres</option>';

  genres.forEach((genre) => {
    const selected = genre === currentGenreFilter ? "selected" : "";
    options += `<option value="${genre}" ${selected}>${genre}</option>`;
  });

  genreFilter.innerHTML = options;
}

// Load books from API
async function loadBooks() {
  if (!booksListElement) return;

  booksListElement.innerHTML = '<div class="loading">Loading books...</div>';

  try {
    const data = await fetchBooks(
      currentPage,
      currentSearchQuery,
      currentGenreFilter
    );

    // Extract all genres if this is the first load
    if (allGenres.length === 0 && data.results.length > 0) {
      allGenres = extractGenres(data.results);
      populateGenreFilter(allGenres);
    }

    displayBooks(data.results);
    createPagination(data.count, currentPage);
  } catch (error) {
    booksListElement.innerHTML = `<div class="error">Error loading books: ${error.message}</div>`;
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Only run on the homepage
  if (booksListElement) {
    // Load saved preferences
    loadUserPreferences();

    // Initial load of books
    loadBooks();

    // Search input event listener
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        debounce(() => {
          currentSearchQuery = searchInput.value.trim();
          currentPage = 1; // Reset to first page on new search
          saveUserPreferences();
          loadBooks();
        }, 500)
      );
    }

    // Genre filter event listener
    if (genreFilter) {
      genreFilter.addEventListener("change", () => {
        currentGenreFilter = genreFilter.value;
        currentPage = 1; // Reset to first page on new filter
        saveUserPreferences();
        loadBooks();
      });
    }
  }
});

// Debounce function to limit how often a function can be called
function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}
