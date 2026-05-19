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

// ─────────────────────────────────────────────────────────────────────────
// PROFILE + BODY METRICS
// ─────────────────────────────────────────────────────────────────────────

// Get the user's full profile (basic info + all body metric entries).
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile', error: err.message });
  }
});

// Update the static profile fields (name, gender, dob).
router.put('/update-profile/:userId', async (req, res) => {
  try {
    const { name, gender, dob } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (gender !== undefined) update.gender = gender;
    if (dob !== undefined) update.dob = dob;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: update },
      { new: true, runValidators: true },
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile', error: err.message });
  }
});

// List all body metric entries for a user (newest first).
router.get('/body-metrics/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('bodyMetrics');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sorted = (user.bodyMetrics || [])
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching metrics', error: err.message });
  }
});

// Add a new body metric entry.
router.post('/body-metrics/:userId', async (req, res) => {
  try {
    const { date, weight, height, bodyFatMass, muscleMass } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bodyMetrics.push({
      date: date ? new Date(date) : new Date(),
      weight,
      height,
      bodyFatMass,
      muscleMass,
    });

    await user.save();
    const added = user.bodyMetrics[user.bodyMetrics.length - 1];
    res.status(201).json(added);
  } catch (err) {
    res.status(500).json({ message: 'Server error adding metric', error: err.message });
  }
});

// Update a single body metric entry by its sub-document id.
router.put('/body-metrics/:userId/:metricId', async (req, res) => {
  try {
    const { date, weight, height, bodyFatMass, muscleMass } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const metric = user.bodyMetrics.id(req.params.metricId);
    if (!metric) return res.status(404).json({ message: 'Metric entry not found' });

    if (date !== undefined) metric.date = new Date(date);
    if (weight !== undefined) metric.weight = weight;
    if (height !== undefined) metric.height = height;
    if (bodyFatMass !== undefined) metric.bodyFatMass = bodyFatMass;
    if (muscleMass !== undefined) metric.muscleMass = muscleMass;

    await user.save();
    res.json(metric);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating metric', error: err.message });
  }
});

// Delete a body metric entry.
router.delete('/body-metrics/:userId/:metricId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const metric = user.bodyMetrics.id(req.params.metricId);
    if (!metric) return res.status(404).json({ message: 'Metric entry not found' });

    metric.deleteOne();
    await user.save();

    res.json({ message: 'Metric entry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting metric', error: err.message });
  }
});

module.exports = router;