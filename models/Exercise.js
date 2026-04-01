const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  muscle: { type: String, required: true },
  type: { type: String, enum: ['Strength', 'Warmup', 'Stretching'], required: true },
  resistance: { type: Number, default: 0 },
  execution: { type: String, enum: ['Single', 'Both'], default: 'Both' }
}, { timestamps: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);

