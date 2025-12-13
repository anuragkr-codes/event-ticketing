// src/models/booking.model.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    qty: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    // paymentStatus: could be 'pending','confirmed','refunded','failed'
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'confirmed',
    },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// optionally prevent duplicate identical bookings by same user for same event at exact same time
// bookingSchema.index({ userId: 1, eventId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
