const Event = require('../models/event.model');
const Booking = require('../models/booking.model');
const { User } = require('../models/user.model');

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

    // Aggregate tickets per user
    const userTicketsMap = {};
    for (const booking of bookings) {
      const userId = booking.userId.toString();
      if (!userTicketsMap[userId]) {
        userTicketsMap[userId] = 0;
      }
      userTicketsMap[userId] += booking.qty;
    }

    const userIds = Object.keys(userTicketsMap);
    const users = await User.find({ _id: { $in: userIds } })
      .select('-password')
      .lean();

    // Attach ticket count to each user
    const attendeesWithTickets = users.map((user) => ({
      ...user,
      ticketsPurchased: userTicketsMap[user._id.toString()],
    }));

    const totalTickets = Object.values(userTicketsMap).reduce((sum, qty) => sum + qty, 0);

    return res.json({
      attendees: attendeesWithTickets,
      totalAttendees: users.length,
      totalTickets,
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
