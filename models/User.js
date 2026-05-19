const mongoose = require('mongoose');

// --- BODY METRIC ENTRY ---
// One dated snapshot of the user's body stats. All metric fields are
// optional so the user can log just what they measured on a given day
// (e.g. only weight one day, full panel another day).
const BodyMetricSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    weight: { type: Number, min: 0 },           // kg
    height: { type: Number, min: 0 },           // cm
    bodyFatMass: { type: Number, min: 0 }, // kg
    muscleMass: { type: Number, min: 0 },  // kg
  },
  { _id: true, timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // --- STATIC PROFILE INFO ---
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dob: { type: Date },

    // --- TIME-SERIES BODY METRICS ---
    // Chronological log of body measurements. Use the most recent entry
    // for "current" values; iterate the array for trend charts.
    bodyMetrics: { type: [BodyMetricSchema], default: [] },
  },
  { timestamps: true },
);

// Index for fast lookup of latest metric per user when querying.
UserSchema.index({ 'bodyMetrics.date': -1 });

// Virtual: convenience accessor for the most recent metric entry.
UserSchema.virtual('latestMetric').get(function () {
  if (!this.bodyMetrics || this.bodyMetrics.length === 0) return null;
  return this.bodyMetrics
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);