// Base URL for the Gutendex API
const API_BASE_URL = "https://gutendex.com";

/**
 * Fetch books from the API with pagination
 * @param {number} page - Page number to fetch
 * @param {string} searchQuery - Optional search query
 * @param {string} genreFilter - Optional genre filter
 * @returns {Promise} - Promise that resolves to the API response
 */
async function fetchBooks(page = 1, searchQuery = "", genreFilter = "") {
  try {
    let url = `${API_BASE_URL}/books?page=${page}`;

    // Add search query if provided
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    // Add topic/genre filter if provided
    if (genreFilter) {
      url += `&topic=${encodeURIComponent(genreFilter)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
}

/**
 * Get a book by its ID
 * @param {number} id - Book ID
 * @returns {Promise} - Promise that resolves to the book object
 */
async function getBookById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/books?ids=${id}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0];
    } else {
      throw new Error("Book not found");
    }
  } catch (error) {
    console.error(`Error fetching book with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Extract unique genres from books
 * @param {Array} books - Array of book objects
 * @returns {Array} - Array of unique genres
 */
function extractGenres(books) {
  const genresSet = new Set();

  books.forEach((book) => {
    if (book.subjects && Array.isArray(book.subjects)) {
      book.subjects.forEach((subject) => {
        genresSet.add(subject);
      });
    }
  });

  return Array.from(genresSet).sort();
}
