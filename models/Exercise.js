const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  muscle: { type: String, required: true },
  type: { type: String, enum: ['Strength', 'Warmup', 'Stretching'], required: true },
  //resistance: { type: Number, default: 0 },
  //execution: { type: String, enum: ['Single', 'Both'], default: 'Both' }
}, { timestamps: true });

// Prevent duplicate exercise names within a single user's library. Workouts
// reference exercises by id, so two entries with the same name+user would
// be ambiguous and undermine the rename-propagation guarantee.
ExerciseSchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Exercise', ExerciseSchema);

