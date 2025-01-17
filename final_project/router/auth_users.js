const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");  // Books database (replace with your actual data)
const regd_users = express.Router();

let users = [];

// Function to check if the username is valid
const isValid = (username) => {
    return users.some(user => user.username === username);
}

// Function to authenticate user (check if username and password match)
const authenticatedUser = (username, password) => {
    const user = users.find(user => user.username === username && user.password === password);
    return user ? true : false;
}

// Register/Login Route
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Authenticate user
    if (authenticatedUser(username, password)) {
        // Generate JWT token
        const accessToken = jwt.sign({ username }, "your_secret_key", { expiresIn: "1h" });
        req.session.authorization = { accessToken };

        return res.status(200).json({
            message: "Login successful",
            accessToken: accessToken
        });
    } else {
        return res.status(403).json({ message: "Invalid credentials" });
    }
});

// Middleware to check authentication (JWT token validation)
const authenticateJWT = (req, res, next) => {
    const token = req.session.authorization?.accessToken;

    if (!token) {
        return res.status(403).json({ message: "Access denied, please log in" });
    }

    jwt.verify(token, "your_secret_key", (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
};

// Add or Modify Book Review Route
regd_users.put("/auth/review/:isbn", authenticateJWT, (req, res) => {
    const { isbn } = req.params;
    const { review } = req.body;
    const { username } = req.user;  // Get the username from the decoded JWT

    if (!review) {
        return res.status(400).json({ message: "Review is required" });
    }

    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    // If the review already exists for this user, modify it
    if (book.reviews && book.reviews[username]) {
        book.reviews[username] = review;
        return res.status(200).json({ message: "Review updated successfully" });
    } else {
        // Otherwise, add the review
        book.reviews = book.reviews || {};
        book.reviews[username] = review;
        return res.status(200).json({ message: "Review added successfully" });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
