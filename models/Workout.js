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
    name: String,
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