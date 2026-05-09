const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const cloudinary = require('../config/cloudinary'); // Centralized config

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

// GET: Fetch all workouts for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE: Remove a specific workout and its Cloudinary image
router.delete('/:id', async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // 1. If an image exists in Cloudinary, delete it
    if (workout.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(workout.imagePublicId);
      } catch (cloudErr) {
        console.error("Cloudinary Deletion Failed:", cloudErr);
        // We continue deleting the DB record even if Cloudinary fails
      }
    }

    // 2. Delete the record from MongoDB
    await Workout.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Workout and associated image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH: Update or Clear image of an existing workout
router.patch('/:id/update-image', async (req, res) => {
  try {
    // imageUrl and imagePublicId will be null if the user is "clearing" the image
    const { imageUrl, imagePublicId } = req.body;
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    // 1. If there is an existing image in Cloudinary, delete it
    // This runs if:
    // a) We are replacing the image (old ID != new ID)
    // b) We are clearing the image (new ID is null)
    if (workout.imagePublicId && workout.imagePublicId !== imagePublicId) {
      try {
        await cloudinary.uploader.destroy(workout.imagePublicId);
        console.log("Old Cloudinary image removed");
      } catch (cloudErr) {
        console.error("Cloudinary deletion failed:", cloudErr);
        // Continue anyway to update the database
      }
    }

    // 2. Update the DB fields (sets them to the new URL/ID or to null)
    workout.imageUrl = imageUrl || null;
    workout.imagePublicId = imagePublicId || null;
    
    const updatedWorkout = await workout.save();
    res.json(updatedWorkout);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;