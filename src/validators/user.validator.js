const Joi = require('joi');

const promoteUserSchema = Joi.object({
  role: Joi.string().valid('attendee', 'organizer', 'admin').required(),
});

module.exports = { promoteUserSchema };
