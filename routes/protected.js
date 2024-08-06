const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.userId;
    next();
  });
}

// Function to get user profile
async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ fullName: user.fullName, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving user profile' });
  }
}

// Route declarations
router.get('/profile', verifyToken, getUserProfile);

module.exports = router;
