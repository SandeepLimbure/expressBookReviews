const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// In-memory user store (for simplicity)
let users = [];
let reviews = {};  // Store reviews with ISBN as keys

// User Registration (as before)
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Check if username already exists
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ message: 'Username already exists.' });
    }

    // Register the new user (simple in-memory storage)
    users.push({ username, password });

    return res.status(201).json({ message: 'User registered successfully.' });
});

// Login Endpoint
app.post('/customer/login', (req, res) => {
    const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Find user based on username
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Validate password
    if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid password.' });
    }

    // Generate JWT token
    const accessToken = jwt.sign({ username: user.username }, 'access', { expiresIn: '1h' });

    // Save JWT token in session
    req.session.authorization = { accessToken };

    return res.status(200).json({ message: 'Login successful', accessToken });
});

// Session management for customer authentication
app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

// Middleware to authenticate customer (for routes requiring login)
app.use("/customer/auth/*", function auth(req, res, next) {
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken'];

        // Verify JWT token
        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next(); // Proceed to the next middleware
            } else {
                return res.status(403).json({ message: "User not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }
});

// Add or Modify Book Review
app.post('/customer/review', (req, res) => {
    const { isbn, review } = req.query;
    const username = req.user.username;  // Get the username from the session

    if (!isbn || !review) {
        return res.status(400).json({ message: 'ISBN and review are required.' });
    }

    // Initialize reviews array if it doesn't exist for the ISBN
    if (!reviews[isbn]) {
        reviews[isbn] = [];
    }

    // Check if the user already reviewed this ISBN
    const existingReviewIndex = reviews[isbn].findIndex(r => r.username === username);

    if (existingReviewIndex !== -1) {
        // Modify the existing review
        reviews[isbn][existingReviewIndex].review = review;
        return res.status(200).json({ message: 'Review modified successfully.' });
    } else {
        // Add a new review for the ISBN
        reviews[isbn].push({ username, review });
        return res.status(201).json({ message: 'Review added successfully.' });
    }
});

const PORT = 5001;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
