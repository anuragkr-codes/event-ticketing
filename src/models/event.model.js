const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: { type: String, trim: true, maxlength: 100 },
    venue: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date },
    capacity: { type: Number, required: true, min: 1 },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
      default: function () {
        return this.capacity;
      },
    },
    price: { type: Number, required: true, min: 0 },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// no pre-validate hook needed with default

module.exports = mongoose.model('Event', eventSchema);
