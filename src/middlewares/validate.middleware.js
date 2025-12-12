const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res
      .status(400)
      .json({ message: 'Validation error', details: error.details.map((d) => d.message) });
  }
  req.body = value;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  // convert: true will attempt to coerce query strings to numbers/booleans/dates if schema expects them
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res
      .status(400)
      .json({ message: 'Validation error', details: error.details.map((d) => d.message) });
  }

  req.query = value;
  next();
};

module.exports = { validateBody, validateQuery };
