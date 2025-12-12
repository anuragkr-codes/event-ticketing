// src/models/event.model.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: { type: String, trim: true, maxlength: 100 }, // optional
    venue: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date },
    capacity: { type: Number, required: true, min: 1 }, // total seats
    availableSeats: { type: Number, required: true, min: 0 }, // initialize == capacity
    price: { type: Number, required: true, min: 0 },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft' },
    metadata: { type: mongoose.Schema.Types.Mixed }, // extensible
  },
  { timestamps: true }
);

// pre-save ensure availableSeats initialized
eventSchema.pre('validate', function (next) {
  if (this.isNew && (this.availableSeats === undefined || this.availableSeats === null)) {
    this.availableSeats = this.capacity;
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
