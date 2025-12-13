// src/controllers/booking.controller.js
const mongoose = require('mongoose');
const Event = require('../models/event.model');
const Booking = require('../models/booking.model');

/**
 * Create a booking for an event.
 * Business rules:
 * - Event must exist and be published.
 * - Enough availableSeats.
 * - Atomic seat decrement using findOneAndUpdate with $inc and condition.
 * - Compute price = event.price * qty
 * - Create booking document and return it.
 */
exports.createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const eventId = req.params.id;
    const { qty } = req.body;

    // Basic sanity
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    // Step 1: find event and ensure published
    const event = await Event.findById(eventId).lean();
    if (!event || event.isDeleted) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'published') {
      return res.status(403).json({ message: 'Event is not available for booking' });
    }

    if (event.availableSeats < qty) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Step 2: Atomic decrement availableSeats
    // Use findOneAndUpdate with condition availableSeats >= qty
    const updated = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gte: qty } },
      { $inc: { availableSeats: -qty } },
      { new: true }
    );

    if (!updated) {
      // someone else took seats concurrently
      return res.status(409).json({ message: 'Failed to reserve seats - not enough seats' });
    }

    // Step 3: Create booking (simple synchronous confirmation)
    const totalPrice = Number(event.price) * Number(qty);

    const booking = await Booking.create({
      userId,
      eventId,
      qty,
      totalPrice,
      status: 'confirmed', // stub: set as confirmed for now
    });

    //we could publish an event to a message broker here or send email

    return res.status(201).json({ booking });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};
