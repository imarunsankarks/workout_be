const mongoose = require('mongoose');

const WorkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  duration: { type: Number, required: true }, // Total minutes
  muscles: [String],
  
  // --- NEW FIELDS ---
  imageUrl: { type: String, default: null },
  imagePublicId: { type: String, default: null },
  notes: { type: String, default: '' },      // Optional "how it went" notes
  // ------------------

  details: [{
    // Canonical (and only) link to the library exercise. The display name is
    // always resolved through the library on the read side, so renames
    // propagate retroactively across all past workouts.
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    // `type` and `muscle` are denormalized snapshots kept on the workout for
    // fast UI branching (set shape, muscle volume aggregations). They are
    // treated as immutable for an exercise's lifetime.
    type: { type: String, enum: ['Strength', 'Warmup', 'Stretching'] },
    muscle: String,
    sets: [{
      weight: Number,
      reps: Number,
      time: Number 
    }],
    resistance: { type: Number, default: 0 },
    execution: { type: String, enum: ['Unilateral', 'Bilateral'], default: 'Bilateral' },
  }]
}, { timestamps: true });

module.exports = mongoose.model('Workout', WorkoutSchema);