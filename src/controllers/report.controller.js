const Event = require('../models/event.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');

/**
 * GET /events/:id/attendees
 * List all attendees of an event
 */
exports.getEventAttendees = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    // Check event exists
    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check for deleted event
    if (event.isDeleted) return res.status(404).json({ message: 'Event not found' });

    // Check access: organizer (owner) or admin
    const requester = req.user;
    const isOwner = requester.id === event.organizerId.toString();
    const isAdmin = requester.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    // Fetch all bookings + user details
    const bookings = await Booking.find({ eventId }).lean();

    const userIds = bookings.map((b) => b.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('-password')
      .lean();

    return res.json({
      attendees: users,
      totalAttendees: users.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /events/:id/sales
 * Return sales metrics for event
 */
exports.getEventSales = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    // Check event exists
    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check for deleted event
    if (event.isDeleted) return res.status(404).json({ message: 'Event not found' });

    const requester = req.user;
    const isOwner = requester.id === event.organizerId.toString();
    const isAdmin = requester.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    // Stats
    const bookings = await Booking.find({ eventId }).lean();

    const totalTickets = bookings.reduce((sum, b) => sum + b.qty, 0);
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

    return res.json({
      eventId,
      eventTitle: event.title,
      totalTicketsSold: totalTickets,
      totalRevenue,
      capacity: event.capacity,
      availableSeats: event.availableSeats,
      utilization: event.capacity > 0 ? totalTickets / event.capacity : 0,
    });
  } catch (err) {
    next(err);
  }
};
