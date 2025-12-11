import express from 'express';
import { getMe, listUsers } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
const router = express.Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 */
router.get('/me', authenticate, getMe);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: list of users
 */
router.get('/', authenticate, authorize('admin'), listUsers);

export default router;
