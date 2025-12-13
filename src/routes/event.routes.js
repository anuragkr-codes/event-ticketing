// src/routes/events.routes.js
const express = require('express');
const router = express.Router();
const { createEvent, listEvents, getEvent } = require('../controllers/event.controller');
const { createBooking } = require('../controllers/booking.controller');
const { validateBody, validateQuery } = require('../middlewares/validate.middleware');
const { createEventSchema, listEventsSchema } = require('../validators/event.validator');
const { createBookingSchema } = require('../validators/booking.validator');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

/**
 * @openapi
 * components:
 *   schemas:
 *     EventInput:
 *       type: object
 *       required:
 *         - title
 *         - venue
 *         - startAt
 *         - capacity
 *         - price
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         venue:
 *           type: string
 *         startAt:
 *           type: string
 *           format: date-time
 *         endAt:
 *           type: string
 *           format: date-time
 *         capacity:
 *           type: integer
 *         price:
 *           type: number
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled]
 */

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create an event (organizer/admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       201:
 *         description: Event created
 */
router.post(
  '/',
  authenticate,
  authorize('organizer', 'admin'),
  validateBody(createEventSchema),
  createEvent
);

/**
 * @openapi
 * /events:
 *   get:
 *     summary: List published events (public)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: list of events
 */
router.get('/', validateQuery(listEventsSchema), listEvents);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get event details
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     security:
 *       - bearerAuth: []   # optional: if provided, will show more for organizer/admin
 *     responses:
 *       200:
 *         description: event details
 */
router.get('/:id', optionalAuthenticate, getEvent);
//general users can view event details too if it's a published event
//admin/organizer can view event details even if it's draft/cancelled

/**
 * @openapi
 * /events/{id}/book:
 *   post:
 *     summary: Book tickets for an event (authenticated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qty
 *             properties:
 *               qty:
 *                 type: integer
 *     responses:
 *       201:
 *         description: booking created
 */
router.post('/:id/book', authenticate, validateBody(createBookingSchema), createBooking);

module.exports = router;
