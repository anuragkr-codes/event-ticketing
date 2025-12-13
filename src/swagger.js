const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const router = express.Router();

const url =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:${process.env.PORT}/api/v1`
    : `${process.env.BASE_URL}/api/v1`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Event Ticketing API', version: '0.1.0' },
    servers: [{ url }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = { swaggerRouter: router, swaggerSpec };
