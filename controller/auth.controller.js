const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Token = require('../models/token');
const sendEmail = require('../utils/sendEmail');

// Register route
async function registerUser(req, res) {
  console.log('Register route hit:', req.body);
  const { fullName, email, password } = req.body;

  try {
    // Ensure full name, email, and password are provided
    if (!fullName || !email || !password) {
      console.error('Full name, email, or password not provided');
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create a new user
    const user = new User({ fullName, email, password });
    await user.save();
    console.log('User registered:', user);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ error: 'User registration failed' });
  }
}

// Login route
async function loginUser(req, res) {
  console.log('Login route hit:', req.body);
  const { email, password } = req.body;

  try {
    // Ensure email and password are provided
    if (!email || !password) {
      console.error('Email or password not provided');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.error('Password does not match for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful, token generated:', token);
    res.json({ token });
  } catch (error) {
    console.error('Error in login process:', error);
    res.status(500).json({ error: 'Login failed due to server error' });
  }
}

// Function to handle forgot password
async function forgotPassword(req, res) {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User with this email does not exist' });
    }
    const token = new Token({ userId: user._id, token: uuidv4() });
    await token.save();
    await sendEmail(user.email, 'Password Reset', `Your password reset token is ${token.token}`);
    res.json({ message: 'Password reset token sent to your email' });
  } catch (error) {
    console.error('Error in sending password reset token:', error);
    res.status(500).json({ error: 'Error in sending password reset token' });
  }
}

// Function to handle reset password
async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  try {
    const resetToken = await Token.findOne({ token });
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }
    const user = await User.findById(resetToken.userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    user.password = newPassword;
    await user.save();
    await resetToken.deleteOne();
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in resetting password:', error);
    res.status(500).json({ error: 'Error in resetting password' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword
};
