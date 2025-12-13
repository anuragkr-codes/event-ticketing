// src/validators/booking.validator.js
const Joi = require('joi');

const createBookingSchema = Joi.object({
  qty: Joi.number().integer().min(1).required(),
  // Add payment method or other fields later
  // e.g. paymentMethod: Joi.string().valid('card','upi','mock').optional()
});

module.exports = {
  createBookingSchema,
};
