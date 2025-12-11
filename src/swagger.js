import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const router = express.Router();

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Event Ticketing API', version: '0.1.0' },
    servers: [{ url: 'http://localhost:4000/api/v1' }],
  },
  // path to APIs (we'll use JSDoc in routes)
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { router as swaggerRouter, swaggerSpec };
