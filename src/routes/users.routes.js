import express from 'express';
import { getMe, listUsers, getUserById } from '../controllers/user.controller.js';
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

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user by id (admin or self)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: user object
 */
router.get('/:id', authenticate, getUserById);

export default router;
