const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');

// POST: Save a completed workout
router.post('/', async (req, res) => {
  try {
    const newWorkout = new Workout(req.body);
    const savedWorkout = await newWorkout.save();
    res.status(201).json(savedWorkout);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET: Fetch last 8 workouts for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.params.userId })
      .sort({ date: -1 })
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE: Remove a specific workout
router.delete('/:id', async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.json({ message: "Workout deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;