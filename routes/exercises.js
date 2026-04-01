const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');

// Fetch user-specific library
router.get('/:userId', async (req, res) => {
  try {
    const list = await Exercise.find({ userId: req.params.userId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new custom workout to user library
router.post('/', async (req, res) => {
  try {
    const newEx = new Exercise(req.body);
    await newEx.save();
    res.status(201).json(newEx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, muscle, type, resistance, execution } = req.body;
    const updatedExercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      { name, muscle, type, resistance, execution },
      { new: true } // Returns the modified document rather than the original
    );

    if (!updatedExercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json(updatedExercise);
  } catch (err) {
    res.status(400).json({ message: "Update failed", error: err.message });
  }
});

// 2. DELETE: Remove an exercise from the library
router.delete('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json({ message: "Exercise deleted from library" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

module.exports = router;