const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const Workout = require('../models/Workout');

// Fetch user-specific library
router.get('/:userId', async (req, res) => {
  try {
    const list = await Exercise.find({ userId: req.params.userId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Case-insensitive collation used for duplicate-name checks. `strength: 2`
// means accent-sensitive but case-insensitive, which matches the unique
// index defined on the Exercise schema.
const CI_COLLATION = { locale: 'en', strength: 2 };

// Add new custom workout to user library
router.post('/', async (req, res) => {
  try {
    const { userId, name, muscle, type } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : name;

    // Pre-check for a case-insensitive duplicate so we can return a clean
    // 409 instead of relying on the raw E11000 from the unique index.
    if (userId && trimmedName) {
      const existing = await Exercise.findOne({ userId, name: trimmedName })
        .collation(CI_COLLATION);
      if (existing) {
        return res.status(409).json({
          message: `An exercise named "${existing.name}" already exists in your library.`,
        });
      }
    }

    const newEx = new Exercise({ userId, name: trimmedName, muscle, type });
    await newEx.save();
    res.status(201).json(newEx);
  } catch (err) {
    // Defensive: in case of a race between the pre-check and the insert,
    // the unique index will still reject the write with code 11000.
    if (err && err.code === 11000) {
      return res.status(409).json({
        message: 'An exercise with that name already exists in your library.',
      });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, muscle, type } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : name;

    // We need the existing doc's userId to scope the duplicate check.
    const current = await Exercise.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    if (trimmedName) {
      const collision = await Exercise.findOne({
        userId: current.userId,
        name: trimmedName,
        _id: { $ne: current._id },
      }).collation(CI_COLLATION);
      if (collision) {
        return res.status(409).json({
          message: `An exercise named "${collision.name}" already exists in your library.`,
        });
      }
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      { name: trimmedName, muscle, type },
      { new: true, runValidators: true, context: 'query' }
    );

    res.json(updatedExercise);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        message: 'An exercise with that name already exists in your library.',
      });
    }
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
});

// 2. DELETE: Remove an exercise from the library
router.delete('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    // Block deletion if this exercise has ever been performed in a workout.
    // Hard-deleting would leave dangling `exerciseId` references on those
    // workouts and break display name resolution.
    const usageCount = await Workout.countDocuments({
      userId: exercise.userId,
      'details.exerciseId': exercise._id,
    });

    if (usageCount > 0) {
      return res.status(409).json({
        message:
          `"${exercise.name}" has been performed in ${usageCount} workout` +
          `${usageCount === 1 ? '' : 's'} and can't be deleted. ` +
          `Rename it instead if you no longer want to use this name.`,
        usageCount,
      });
    }

    await Exercise.findByIdAndDelete(req.params.id);
    res.json({ message: "Exercise deleted from library" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

module.exports = router;