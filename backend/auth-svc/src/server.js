// backend/auth-svc/src/server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 
require('dotenv').config();

const crypto = require('crypto');
global.crypto = crypto;

const User = require('./models');

const app = express();

// Wire up CORS middleware to whitelist the Nginx gateway and standalone ports
app.use(cors({
  origin: ['http://localhost', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'news_era_dev_secret_key_123S';

// Strict evaluation fallback string format
const mongoURI = process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb://')
  ? process.env.MONGO_URI 
  : 'mongodb://mongodb:27017/newsera_auth';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('Auth Service connected to MongoDB'))
  .catch(err => console.error('Auth DB connection error:', err));

// Route 1: Register a new user (PREFIX REMOVED)
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Route 2: Login user and return JWT (PREFIX REMOVED)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Create JWT containing essential user context
    const token = jwt.sign(
      { userId: user._index || user._id, username: user.username, isPremium: user.isPremium },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username, isPremium: user.isPremium });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Route 3: Internal verification token endpoint (PREFIX REMOVED)
app.get('/verify', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false, error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token is invalid or expired' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service running internally on port ${PORT}`);
});