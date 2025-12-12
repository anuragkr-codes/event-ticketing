// src/validators/event.validator.js
const Joi = require('joi');

const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().allow('', null).max(2000),
  category: Joi.string().max(100).optional(),
  venue: Joi.string().required(),
  startAt: Joi.date().iso().greater('now').required(),
  endAt: Joi.date().iso().greater(Joi.ref('startAt')).optional(),
  capacity: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  status: Joi.string().valid('draft', 'published', 'cancelled').optional(),
  metadata: Joi.object().optional(),
});

const listEventsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  category: Joi.string().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  q: Joi.string().optional(), // simple text search
});

module.exports = {
  createEventSchema,
  listEventsSchema,
};
