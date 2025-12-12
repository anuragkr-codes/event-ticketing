// src/controllers/event.controller.js
const Event = require('../models/event.model');

exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      startAt,
      endAt,
      capacity,
      price,
      status,
      metadata,
    } = req.body;

    // req.user.id should be set by authenticate middleware
    const organizerId = req.user && req.user.id;
    if (!organizerId) return res.status(401).json({ message: 'Unauthorized' });

    const event = await Event.create({
      title,
      description,
      category,
      venue,
      startAt,
      endAt,
      capacity,
      availableSeats: capacity,
      price,
      status: status || 'draft',
      metadata,
      organizerId,
    });

    return res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
};

exports.listEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, from, to, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { status: 'published' };

    if (category) filter.category = category;
    if (from || to) {
      filter.startAt = {};
      if (from) filter.startAt.$gte = new Date(from);
      if (to) filter.startAt.$lte = new Date(to);
    }
    if (q) filter.$text = { $search: q }; // optional: requires text index

    const [events, total] = await Promise.all([
      Event.find(filter).sort({ startAt: 1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ meta: { page: Number(page), limit: Number(limit), total }, data: events });
  } catch (err) {
    next(err);
  }
};

exports.getEvent = async (req, res, next) => {
  try {
    const id = req.params.id;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    // Return published event or allow organizer/admin to view drafts & cancelled
    if (event.status !== 'published') {
      // if unauthenticated or not organizer/admin, deny
      const user = req.user; // may be undefined
      const isOwner = user && user.id && event.organizerId.toString() === user.id;
      const isAdmin = user && user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Forbidden: event not published' });
      }
    }
    res.json({ event });
  } catch (err) {
    next(err);
  }
};
