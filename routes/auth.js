const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import your User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');

// STEP 1: Check if email exists
router.post('/check-email', async (req, res) => {
  const { email } = req.body;

  try {
    // Look for a user with this email in MongoDB
    const user = await User.findOne({ email });
    
    // Return true if user exists, false if not
    res.json({ exists: !!user }); 
  } catch (err) {
    res.status(500).json({ message: "Server error checking email", error: err.message });
  }
});

// STEP 2: Authenticate (Login or Signup)
router.post('/authenticate', async (req, res) => {
  const { email, password, name, isSignup } = req.body;

  try {
    if (isSignup) {
      // Logic for new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ 
        name, 
        email, 
        password: hashedPassword 
      });
      await newUser.save();
      
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      res.status(201).json({ token, user: { id: newUser._id, name: newUser.name } });
    } else {
      // Logic for existing user
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ token, user: { id: user._id, name: user.name } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-credentials', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ message: "Server error during verification", error: err.message });
  }
});

router.put('/update-password', async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error updating password", error: err.message });
  }
});

router.delete('/delete-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await Workout.deleteMany({ userId });

    await Exercise.deleteMany({ userId });

    await User.findByIdAndDelete(userId);

    res.json({ message: "Profile and all associated data deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error during deletion", error: err.message });
  }
});

module.exports = router;