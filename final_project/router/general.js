const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Register a new user
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if user already exists
    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Register the user
    users.push({ username, password });
    return res.status(200).json({ message: "User registered successfully" });
});

// Get the book list available in the shop
public_users.get('/', (req, res) => {
    // Respond with all books
    return res.status(200).send(JSON.stringify(books, null, 2));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    // Find the book with the given ISBN
    const book = books[isbn];
    if (book) {
        return res.status(200).json({ book });
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

// Get book details based on author
public_users.get('/author/:author', (req, res) => {
    const author = req.params.author;

    // Filter books by author
    const filteredBooks = Object.values(books).filter(book => book.author === author);
    if (filteredBooks.length > 0) {
        return res.status(200).json({ books: filteredBooks });
    } else {
        return res.status(404).json({ message: "No books found for the given author" });
    }
});

// Get all books based on title
public_users.get('/title/:title', (req, res) => {
    const title = req.params.title;

    // Filter books by title
    const filteredBooks = Object.values(books).filter(book => book.title === title);
    if (filteredBooks.length > 0) {
        return res.status(200).json({ books: filteredBooks });
    } else {
        return res.status(404).json({ message: "No books found for the given title" });
    }
});

// Get book review
public_users.get('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    // Find the book and return its review
    const book = books[isbn];
    if (book && book.reviews) {
        return res.status(200).json({ reviews: book.reviews });
    } else {
        return res.status(404).json({ message: "No reviews found for the given ISBN" });
    }
});
public_users.get('/books', (req, res) => {
    axios.get('https://sandeep22210-5001.theianext-1-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai/books')  // Replace with the actual API URL to fetch books
        .then(response => {
            // Send the books list if successful
            res.status(200).json(response.data);
        })
        .catch(error => {
            // Handle errors (e.g., API not reachable)
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch books' });
        });
});

module.exports.general = public_users;
